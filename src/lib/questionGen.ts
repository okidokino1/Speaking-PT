import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { env, features } from "./env";
import { EXAMS, type ExamType } from "./exams";
import { buildSession } from "./questions";
import type { Question } from "./types";

// 매 회차 주제를 다양화하기 위한 힌트 풀
const TOPICS = [
  "일상과 취미", "교육과 학습", "기술과 미디어", "여행과 문화", "직업과 일",
  "환경과 사회", "건강과 음식", "인간관계", "도시와 생활", "예술과 여가",
  "쇼핑과 소비", "스포츠", "미래 계획", "어린 시절 추억", "돈과 경제",
];

// AI로 시험 형식에 맞는 새 문항을 생성. 실패/키 없음 시 시드 문항으로 폴백.
export async function generateSession(examType: ExamType): Promise<Question[]> {
  if (!features.claude) return buildSession(examType);

  try {
    const exam = EXAMS[examType];
    const client = new Anthropic({ apiKey: env.anthropicKey });
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const nonce = randomUUID().slice(0, 8);

    const sectionSpec = exam.sections.map((s) => ({
      key: s.key,
      label: s.label,
      kind: s.kind,
      count: s.count,
      needsPassage: !!s.needsPassage,
      needsImage: !!s.needsImage,
    }));

    const system = `당신은 ${exam.fullName} 공식 출제위원입니다. 실제 시험과 동일한 형식·난이도의 문항을 생성합니다.
섹션 kind별 형식:
- interview: 친숙한 주제의 짧은 질문
- cue-card: 큐카드 장기 발화 주제 ("Describe ... You should say: ...")
- read-aloud: 낭독용 영문 지문(passage 필수) + 지시문
- describe-image: 사진 묘사 지시문
- respond: 특정 상황에서의 즉답형 질문
- integrated: 짧은 읽기 지문(passage 필수) + 그것을 요약/설명하는 지시
- opinion: 찬반/선택 의견 주제
- opic-open: OPIc식 자유 발화 질문
규칙: prompt는 영어, promptKo는 한국어 한 줄 설명. read-aloud/integrated는 passage(영문) 필수.
매번 완전히 새롭고 다양한 주제로 생성하세요(이전 회차와 반복 금지). 반드시 submit_questions 도구를 호출하세요.`;

    const user = `아래 섹션 구조대로 각 섹션의 count만큼 문항을 생성하세요. 참고 주제 힌트: ${topic} (생성 시드: ${nonce})\n\n${JSON.stringify(
      sectionSpec,
      null,
      2
    )}`;

    const resp = await client.messages.create({
      model: env.claudeModel,
      max_tokens: 3500,
      system,
      tools: [{ name: "submit_questions", description: "생성한 문항 제출", input_schema: GEN_SCHEMA }],
      tool_choice: { type: "tool", name: "submit_questions" },
      messages: [{ role: "user", content: user }],
    });

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!tu) throw new Error("no tool_use");
    const out = tu.input as {
      sections: { key: string; questions: { prompt: string; promptKo?: string; passage?: string }[] }[];
    };

    const questions: Question[] = [];
    let index = 0;
    for (const section of exam.sections) {
      const gen = out.sections?.find((s) => s.key === section.key);
      const qs = (gen?.questions || []).filter((x) => x?.prompt?.trim());
      for (let i = 0; i < section.count; i++) {
        const g = qs[i % Math.max(1, qs.length)];
        if (!g?.prompt?.trim()) throw new Error(`섹션 ${section.key} 문항 부족`);
        questions.push({
          id: randomUUID(),
          examType,
          sectionKey: section.key,
          sectionLabel: section.label,
          kind: section.kind,
          index: index++,
          prompt: g.prompt.trim(),
          promptKo: g.promptKo?.trim(),
          passage: section.needsPassage ? g.passage?.trim() : undefined,
          imageUrl: section.needsImage
            ? `https://picsum.photos/seed/${randomUUID().slice(0, 6)}/900/560`
            : undefined,
          prepSec: section.prepSec,
          answerSec: section.answerSec,
        });
      }
    }
    return questions;
  } catch (e) {
    console.error("[questionGen] AI 출제 실패, 시드 문항 사용:", e);
    return buildSession(examType);
  }
}

const GEN_SCHEMA = {
  type: "object" as const,
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                promptKo: { type: "string" },
                passage: { type: "string" },
              },
              required: ["prompt", "promptKo"],
            },
          },
        },
        required: ["key", "questions"],
      },
    },
  },
  required: ["sections"],
};
