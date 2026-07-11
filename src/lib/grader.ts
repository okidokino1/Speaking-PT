import Anthropic from "@anthropic-ai/sdk";
import { env, features } from "./env";
import { DIMENSIONS, getExam, type ExamType } from "./exams";
import { metricsSummary } from "./metrics";
import type {
  AnswerInput,
  DimensionScore,
  QuestionFeedback,
  ScoreResult,
} from "./types";
import type { Question } from "./types";

interface GradeArgs {
  examType: ExamType;
  questions: Question[];
  answers: AnswerInput[];
}

// 시험별 채점 강조점 (실제 루브릭 반영)
const RUBRIC_FOCUS: Record<ExamType, string> = {
  ielts:
    "IELTS Band descriptors: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation. 유창성과 담화 연결, 다양한 어휘·구문, 발음 명료성을 균형 있게 평가.",
  toefl:
    "TOEFL iBT Speaking rubric: Delivery(발음·유창성), Language Use(문법·어휘), Topic Development(내용 전개·논리). 통합형은 자료 내용을 정확히 반영했는지 중요.",
  toeic:
    "TOEIC Speaking: 발음·억양·강세, 문법, 어휘, 과제 완수도. 낭독은 정확성, 사진묘사는 구체성, 의견형은 근거의 논리성 강조.",
  opic:
    "OPIc ACTFL 기준: 과제 수행, 담화의 길이·구성, 정확성, 어휘 폭. 자연스러운 스토리텔링과 상황 대처 능력 강조.",
};

// ---------------------------------------------------------------------------
// 공개 진입점
// ---------------------------------------------------------------------------
export async function gradeAttempt(args: GradeArgs): Promise<ScoreResult> {
  if (features.claude) {
    try {
      return await gradeWithClaude(args);
    } catch (e) {
      console.error("[grader] Claude 채점 실패, 데모 채점으로 대체:", e);
    }
  }
  return gradeWithDemo(args);
}

// ---------------------------------------------------------------------------
// Claude 채점
// ---------------------------------------------------------------------------
async function gradeWithClaude(args: GradeArgs): Promise<ScoreResult> {
  const { examType, questions, answers } = args;
  const exam = getExam(examType)!;
  const client = new Anthropic({ apiKey: env.anthropicKey });

  // 문항별 병렬 채점 → 전체 대기시간을 "가장 느린 1문항" 수준으로 단축
  const perQuestion = await Promise.all(
    questions.map((q, i) =>
      gradeOneQuestion(
        client,
        exam.fullName,
        examType,
        q,
        answers.find((a) => a.questionId === q.id),
        i
      )
    )
  );

  const dimAvg: DimensionScore[] = DIMENSIONS.map((d) => ({
    key: d.key,
    score: Math.round(
      perQuestion.reduce((s, qf) => s + (qf.dimensions.find((x) => x.key === d.key)?.score ?? 0), 0) /
        Math.max(1, perQuestion.length)
    ),
    comment: "",
  }));
  const overall = Math.round(
    perQuestion.reduce((s, qf) => s + qf.overall, 0) / Math.max(1, perQuestion.length)
  );

  return {
    examType,
    overall,
    dimensions: dimAvg,
    perQuestion,
    summary: buildSummary(dimAvg),
    nextSteps: buildNextSteps(dimAvg),
    engine: "claude",
  };
}

// 문항 1개를 Claude로 채점 (작은 출력 → 빠름). 실패/무응답 시 데모 채점으로 대체.
async function gradeOneQuestion(
  client: Anthropic,
  examName: string,
  examType: ExamType,
  q: Question,
  a: AnswerInput | undefined,
  index: number
): Promise<QuestionFeedback> {
  const transcript = a?.transcript?.trim() || "";
  if (!transcript) return demoQuestionFeedback(q, a, index);

  try {
    const system = `당신은 ${examName} 공식 채점관이자 20년 경력의 영어 스피킹 코치입니다.
채점 기준: ${RUBRIC_FOCUS[examType]}
이 문항 하나를 발음·유창성·어휘·문법·논리성 5개 영역으로 0~100점 채점합니다.
코멘트·가이드는 한국어, 모범답변(modelAnswer)만 영어로 작성합니다.
반드시 submit_question 도구를 호출하세요.`;
    const m = a?.metrics ? `\n객관지표: ${metricsSummary(a.metrics)}` : "";
    const user = `시험: ${examName}\n질문: ${q.prompt}${
      q.passage ? `\n지문: ${q.passage}` : ""
    }\n학습자 답변(전사): ${transcript}${m}`;

    const resp = await client.messages.create({
      model: env.claudeModel,
      max_tokens: 1500,
      system,
      tools: [{ name: "submit_question", description: "문항 채점 결과 제출", input_schema: QUESTION_SCHEMA }],
      tool_choice: { type: "tool", name: "submit_question" },
      messages: [{ role: "user", content: user }],
    });
    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!tu) throw new Error("no tool_use");
    const p = tu.input as Record<string, unknown>;
    const dims = normalizeDims((p.dimensions as DimensionScore[]) || []);
    const overall =
      typeof p.overall === "number"
        ? clamp(p.overall)
        : Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
    return {
      questionId: q.id,
      index,
      transcript,
      dimensions: dims,
      overall,
      errors: (p.errors as QuestionFeedback["errors"]) || [],
      correctionGuide: (p.correctionGuide as string) || "",
      modelAnswer: (p.modelAnswer as string) || "",
      strengths: (p.strengths as string[]) || [],
      improvements: (p.improvements as string[]) || [],
    };
  } catch (e) {
    console.error(`[grader] 문항 ${index + 1} 채점 실패, 데모 대체:`, e);
    return demoQuestionFeedback(q, a, index);
  }
}

// 단일 문항 tool input_schema
const QUESTION_SCHEMA = {
  type: "object" as const,
  properties: {
    dimensions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string", enum: ["pronunciation", "fluency", "vocabulary", "grammar", "logic"] },
          score: { type: "number" },
          comment: { type: "string" },
        },
        required: ["key", "score", "comment"],
      },
    },
    overall: { type: "number" },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          quote: { type: "string" },
          issue: { type: "string" },
          correction: { type: "string" },
        },
        required: ["type", "quote", "issue", "correction"],
      },
    },
    correctionGuide: { type: "string" },
    modelAnswer: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
  },
  required: ["dimensions", "overall", "errors", "correctionGuide", "modelAnswer", "strengths", "improvements"],
};

// 단일 문항 데모 채점 (Claude 실패/무응답 폴백)
function demoQuestionFeedback(
  q: Question,
  a: AnswerInput | undefined,
  index: number
): QuestionFeedback {
  const transcript = a?.transcript?.trim() || "";
  const dims = demoDimensions(transcript, a);
  const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  return {
    questionId: q.id,
    index,
    transcript,
    dimensions: dims,
    overall,
    errors: demoErrors(transcript),
    correctionGuide: demoGuide(dims, transcript),
    modelAnswer: `(예시 모범 답변) A strong response to "${shorten(
      q.prompt
    )}" would give a clear main idea, two supporting reasons, and a concrete example, delivered smoothly with varied linking words.`,
    strengths: transcript ? ["질문에 관련된 내용을 전달함"] : [],
    improvements: [
      dims.find((d) => d.key === "fluency")!.score < 70
        ? "불필요한 멈춤과 필러워드를 줄여 더 매끄럽게 말하기"
        : "고급 어휘와 복문을 활용해 답변의 깊이 더하기",
    ],
  };
}

// 종합 요약/추천 (점수 기반 로컬 생성 — 빠름, 추가 API 호출 없음)
function buildSummary(dims: DimensionScore[]): string {
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0];
  const strongest = [...dims].sort((a, b) => b.score - a.score)[0];
  return `강점은 ${dimLabel(strongest.key)}(${strongest.score}점), 가장 개선이 필요한 영역은 ${dimLabel(
    weakest.key
  )}(${weakest.score}점)입니다. ${dimLabel(
    weakest.key
  )}을(를) 집중적으로 연습하면 다음 단계 점수로 올라갈 수 있습니다.`;
}
function buildNextSteps(dims: DimensionScore[]): string[] {
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0].key;
  const tips: Record<string, string> = {
    pronunciation: "강세·연음을 살려 또렷하게 발음하는 쉐도잉 연습",
    fluency: "3초 이상 멈추지 않고 60초 무정지 발화 연습",
    vocabulary: "주제별 고급 어휘·컬로케이션을 익혀 답변에 적용",
    grammar: "시제·수일치·관사를 점검하며 단문·복문 섞어 말하기",
    logic: "주장→이유→예시→결론 구조로 답변 구성 훈련",
  };
  return [tips[weakest], "매일 큐카드 1개로 실전 타이머 연습", "답변을 녹음해 다시 듣고 스스로 교정"];
}

function normalizeDims(dims: DimensionScore[]): DimensionScore[] {
  return DIMENSIONS.map((d) => {
    const found = dims.find((x) => x.key === d.key);
    return {
      key: d.key,
      score: found ? clamp(found.score) : 60,
      comment: found?.comment || "",
    };
  });
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

// ---------------------------------------------------------------------------
// 데모 채점 (키 없이도 현실적인 결과 제공 — 전사·지표 기반 휴리스틱)
// ---------------------------------------------------------------------------
function gradeWithDemo(args: GradeArgs): ScoreResult {
  const { examType, questions, answers } = args;

  const perQuestion: QuestionFeedback[] = questions.map((q, i) => {
    const a = answers.find((x) => x.questionId === q.id);
    const transcript = a?.transcript?.trim() || "";
    const dims = demoDimensions(transcript, a);
    const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
    return {
      questionId: q.id,
      index: i,
      transcript,
      dimensions: dims,
      overall,
      errors: demoErrors(transcript),
      correctionGuide: demoGuide(dims, transcript),
      modelAnswer: `(예시 모범 답변) A strong response would directly address "${shorten(
        q.prompt
      )}" with a clear topic sentence, two supporting reasons, a concrete personal example, and a concise conclusion — spoken smoothly with varied linking words.`,
      strengths: transcript ? ["질문에 관련된 내용을 전달함"] : [],
      improvements: [
        dims.find((d) => d.key === "fluency")!.score < 70
          ? "불필요한 멈춤과 필러워드를 줄여 더 매끄럽게 말하기"
          : "고급 어휘와 복문을 활용해 답변의 깊이 더하기",
      ],
    };
  });

  const dimAvg: DimensionScore[] = DIMENSIONS.map((d) => ({
    key: d.key,
    score: Math.round(
      perQuestion.reduce(
        (s, q) => s + (q.dimensions.find((x) => x.key === d.key)?.score ?? 0),
        0
      ) / Math.max(1, perQuestion.length)
    ),
    comment: "",
  }));
  const overall = Math.round(
    perQuestion.reduce((s, q) => s + q.overall, 0) / Math.max(1, perQuestion.length)
  );

  return {
    examType,
    overall,
    dimensions: dimAvg,
    perQuestion,
    summary:
      "전반적으로 질문 의도를 이해하고 답변을 구성했습니다. 유창성(멈춤·필러워드)과 어휘 다양성을 개선하면 다음 단계 점수로 올라갈 수 있습니다. (데모 채점 결과이며, API 키를 연결하면 Claude 기반 정밀 채점이 제공됩니다.)",
    nextSteps: [
      "매일 큐카드 1개로 60초 무정지 발화 연습",
      "답변에 because, for instance, as a result 등 연결어 넣기",
      "필러워드 대신 짧은 침묵으로 생각 정리하는 습관 들이기",
    ],
    engine: "demo",
  };
}

function demoDimensions(transcript: string, a?: AnswerInput): DimensionScore[] {
  const m = a?.metrics;
  const words = transcript ? transcript.split(/\s+/) : [];
  const wc = words.length;
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))).size;
  const lexDiversity = wc ? unique / wc : 0;
  const wpm = m?.wpm ?? 0;
  const fillerRatio = m?.fillerRatio ?? 0;

  // 발음: 지표가 없으므로 유창성·길이 기반 근사
  const pron = seeded(transcript, 62, 82) - fillerRatio * 40;
  // 유창성: WPM 이상범위(110~150)와 필러워드 기반
  const wpmScore = wpm ? 100 - Math.min(40, Math.abs(130 - wpm) * 0.8) : 60;
  const fluency = clamp(wpmScore - fillerRatio * 60);
  // 어휘: 다양성
  const vocab = clamp(45 + lexDiversity * 90);
  // 문법: 문장 수/길이 기반 근사
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const grammar = clamp(58 + Math.min(20, sentences * 4) + seeded(transcript, -6, 6));
  // 논리: 연결어·길이
  const connectors = (transcript.toLowerCase().match(/\b(because|however|for example|for instance|therefore|first|second|finally|as a result|in addition)\b/g) || []).length;
  const logic = clamp(52 + connectors * 7 + Math.min(15, wc / 8));

  const dims: DimensionScore[] = [
    { key: "pronunciation", score: clamp(pron), comment: pronComment(clamp(pron)) },
    { key: "fluency", score: fluency, comment: fluencyComment(fluency, m) },
    { key: "vocabulary", score: vocab, comment: vocabComment(vocab) },
    { key: "grammar", score: grammar, comment: grammarComment(grammar) },
    { key: "logic", score: logic, comment: logicComment(logic, connectors) },
  ];
  if (wc === 0) return dims.map((d) => ({ ...d, score: 0, comment: "답변이 감지되지 않았습니다." }));
  return dims;
}

function demoErrors(transcript: string): QuestionFeedback["errors"] {
  const errs: QuestionFeedback["errors"] = [];
  const lower = transcript.toLowerCase();
  if (/\bi (is|are)\b/.test(lower))
    errs.push({ type: "문법", quote: "I is/are", issue: "주어-동사 수일치 오류", correction: "I am" });
  if (/\b(a) (apple|hour|idea|umbrella)\b/.test(lower))
    errs.push({ type: "문법", quote: "a apple", issue: "관사 오류", correction: "an apple" });
  const fillers = (lower.match(/\b(um|uh|like)\b/g) || []).length;
  if (fillers >= 2)
    errs.push({
      type: "유창성",
      quote: `필러워드 ${fillers}회`,
      issue: "um/uh/like 반복이 유창성을 낮춤",
      correction: "짧게 멈추고 생각을 정리한 뒤 이어 말하기",
    });
  return errs;
}

function demoGuide(dims: DimensionScore[], transcript: string): string {
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0];
  const map: Record<string, string> = {
    pronunciation: "강세와 연음을 살려 또렷하게 발음하고, 문장 끝 자음을 흘리지 마세요.",
    fluency: "3초 이상 멈추지 말고, 막힐 때는 필러워드 대신 짧은 침묵으로 생각을 정리하세요.",
    vocabulary: "같은 단어 반복을 피하고 동의어·구동사·컬로케이션을 한두 개씩 넣어보세요.",
    grammar: "시제 일관성과 주어-동사 일치를 점검하고, 단문과 복문을 섞어 쓰세요.",
    logic: "주장 → 이유 → 예시 → 결론 순서로 구성하고 연결어로 흐름을 만드세요.",
  };
  return `가장 개선이 필요한 영역은 '${dimLabel(weakest.key)}'입니다. ${map[weakest.key]} ${
    transcript ? "" : "이번 답변은 음성이 감지되지 않아, 마이크 권한과 녹음 상태를 확인해 주세요."
  }`.trim();
}

// --- 코멘트 헬퍼 ---
function pronComment(s: number) {
  return s >= 75 ? "전반적으로 명료합니다." : "일부 단어의 강세·연음을 더 자연스럽게 연습해보세요.";
}
function fluencyComment(s: number, m?: AnswerInput["metrics"]) {
  if (!m) return s >= 75 ? "매끄럽게 이어집니다." : "멈춤을 줄이면 더 좋아집니다.";
  return `${m.wpm} WPM · 필러워드 ${m.fillerCount}회. ${
    s >= 75 ? "리듬이 안정적입니다." : "속도와 멈춤을 다듬어보세요."
  }`;
}
function vocabComment(s: number) {
  return s >= 75 ? "다양한 표현을 사용했습니다." : "고급 어휘와 표현을 더해 점수를 올릴 수 있습니다.";
}
function grammarComment(s: number) {
  return s >= 75 ? "문장 구조가 안정적입니다." : "시제·수일치·관사를 점검해보세요.";
}
function logicComment(s: number, connectors: number) {
  return s >= 75
    ? "주장과 근거가 잘 연결됩니다."
    : `연결어(${connectors}개)를 더 활용해 논리 흐름을 강화하세요.`;
}

function dimLabel(key: string) {
  return DIMENSIONS.find((d) => d.key === key)?.label ?? key;
}
function shorten(s: string, n = 60) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
// 전사 문자열 기반 결정적 유사난수 (같은 답변→같은 점수)
function seeded(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  const r = (h % 1000) / 1000;
  return min + r * (max - min);
}
