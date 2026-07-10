// 4종 영어 스피킹 시험의 구조·제한시간·점수 체계 정의
// 실제 시험 포맷을 재현하는 응시 엔진과 채점 환산의 기준이 된다.

export type ExamType = "ielts" | "toefl" | "toeic" | "opic";

export type SectionKind =
  | "interview" // IELTS Part1/3, 즉답형 짧은 질문
  | "cue-card" // IELTS Part2, 준비 후 장기 발화
  | "read-aloud" // TOEIC Q1-2, 지문 낭독
  | "describe-image" // TOEIC Q3-4, 사진 묘사
  | "respond" // TOEIC Q5-7, 질문 응답
  | "respond-info" // TOEIC Q8-10, 자료 기반 응답
  | "opinion" // TOEIC Q11 / TOEFL Task1, 의견 진술
  | "integrated" // TOEFL Task2-4, 읽기/듣기 통합
  | "opic-open"; // OPIc 자유 발화

export interface SectionSpec {
  key: string;
  label: string; // "Part 1", "Task 2", "Question 5-7"
  kind: SectionKind;
  instruction: string; // 응시자에게 보여줄 안내
  prepSec: number; // 준비 시간(초)
  answerSec: number; // 발화 시간(초)
  count: number; // 이 섹션에서 출제할 문항 수
  needsImage?: boolean;
  needsPassage?: boolean;
}

export interface ExamMeta {
  type: ExamType;
  name: string; // 짧은 이름
  fullName: string;
  tagline: string;
  accent: string; // tailwind color base (e.g. "indigo")
  durationLabel: string;
  scaleLabel: string;
  sections: SectionSpec[];
}

export const EXAMS: Record<ExamType, ExamMeta> = {
  ielts: {
    type: "ielts",
    name: "IELTS Speaking",
    fullName: "IELTS Academic/General Speaking",
    tagline: "면접관과의 실전 인터뷰 · 큐카드 장기 발화",
    accent: "rose",
    durationLabel: "약 11–14분",
    scaleLabel: "Band 0–9",
    sections: [
      {
        key: "part1",
        label: "Part 1",
        kind: "interview",
        instruction:
          "친숙한 일상 주제에 대한 짧은 질문에 답합니다. 준비 시간 없이 바로 답하세요. (각 20초 내외)",
        prepSec: 0,
        answerSec: 30,
        count: 3,
      },
      {
        key: "part2",
        label: "Part 2",
        kind: "cue-card",
        instruction:
          "큐카드 주제에 대해 말합니다. 1분 동안 준비하고 1–2분 동안 이어서 말하세요.",
        prepSec: 60,
        answerSec: 120,
        count: 1,
      },
      {
        key: "part3",
        label: "Part 3",
        kind: "interview",
        instruction:
          "Part 2 주제와 연결된 심화·추상 질문에 답합니다. 근거를 들어 논리적으로 답하세요.",
        prepSec: 0,
        answerSec: 45,
        count: 2,
      },
    ],
  },
  toefl: {
    type: "toefl",
    name: "TOEFL Speaking",
    fullName: "TOEFL iBT Speaking",
    tagline: "독립형 1문항 + 읽기/듣기 통합형 3문항",
    accent: "indigo",
    durationLabel: "약 17분",
    scaleLabel: "0–30점",
    sections: [
      {
        key: "task1",
        label: "Task 1 · Independent",
        kind: "opinion",
        instruction:
          "제시된 주제에 대한 자신의 선택과 이유를 말합니다. 준비 15초, 발화 45초.",
        prepSec: 15,
        answerSec: 45,
        count: 1,
      },
      {
        key: "task2",
        label: "Task 2 · Integrated",
        kind: "integrated",
        instruction:
          "짧은 지문을 읽고 관련 대화 내용을 종합하여 말합니다. 준비 30초, 발화 60초.",
        prepSec: 30,
        answerSec: 60,
        count: 1,
        needsPassage: true,
      },
      {
        key: "task3",
        label: "Task 3 · Integrated",
        kind: "integrated",
        instruction:
          "학술 지문과 강의 내용을 종합하여 개념을 설명합니다. 준비 30초, 발화 60초.",
        prepSec: 30,
        answerSec: 60,
        count: 1,
        needsPassage: true,
      },
      {
        key: "task4",
        label: "Task 4 · Integrated",
        kind: "integrated",
        instruction:
          "강의 내용을 요약하여 설명합니다. 준비 20초, 발화 60초.",
        prepSec: 20,
        answerSec: 60,
        count: 1,
        needsPassage: true,
      },
    ],
  },
  toeic: {
    type: "toeic",
    name: "TOEIC Speaking",
    fullName: "TOEIC Speaking Test",
    tagline: "낭독 · 사진묘사 · 질문응답 · 의견 제시",
    accent: "sky",
    durationLabel: "약 20분",
    scaleLabel: "0–200점 (Lv 1–8)",
    sections: [
      {
        key: "q1_2",
        label: "Q1–2 · Read Aloud",
        kind: "read-aloud",
        instruction:
          "화면의 지문을 소리 내어 읽습니다. 준비 45초, 발화 45초.",
        prepSec: 45,
        answerSec: 45,
        count: 2,
        needsPassage: true,
      },
      {
        key: "q3_4",
        label: "Q3–4 · Describe a Picture",
        kind: "describe-image",
        instruction: "사진을 최대한 자세히 묘사합니다. 준비 45초, 발화 30초.",
        prepSec: 45,
        answerSec: 30,
        count: 2,
        needsImage: true,
      },
      {
        key: "q5_7",
        label: "Q5–7 · Respond to Questions",
        kind: "respond",
        instruction:
          "주어진 상황의 질문에 즉답합니다. 준비 시간 없이 바로 답하세요. (15/15/30초)",
        prepSec: 3,
        answerSec: 30,
        count: 3,
      },
      {
        key: "q11",
        label: "Q11 · Express an Opinion",
        kind: "opinion",
        instruction:
          "제시된 주제에 대한 의견을 근거와 함께 말합니다. 준비 45초, 발화 60초.",
        prepSec: 45,
        answerSec: 60,
        count: 1,
      },
    ],
  },
  opic: {
    type: "opic",
    name: "OPIc",
    fullName: "Oral Proficiency Interview – computer",
    tagline: "자기소개 · 경험 묘사 · 롤플레이 자유 발화",
    accent: "emerald",
    durationLabel: "약 15–20분",
    scaleLabel: "NL–AL 등급",
    sections: [
      {
        key: "self",
        label: "자기소개",
        kind: "opic-open",
        instruction:
          "Ava가 자기소개를 요청합니다. 편하게 자신에 대해 이야기하세요. (약 60초)",
        prepSec: 0,
        answerSec: 75,
        count: 1,
      },
      {
        key: "description",
        label: "묘사/설명",
        kind: "opic-open",
        instruction:
          "설문에서 선택한 주제에 대해 구체적으로 묘사합니다. (약 75초)",
        prepSec: 0,
        answerSec: 90,
        count: 2,
      },
      {
        key: "experience",
        label: "경험 이야기",
        kind: "opic-open",
        instruction: "관련된 과거 경험을 시간 순서로 이야기합니다. (약 90초)",
        prepSec: 0,
        answerSec: 90,
        count: 1,
      },
      {
        key: "roleplay",
        label: "롤플레이",
        kind: "opic-open",
        instruction:
          "주어진 상황에서 필요한 질문을 하거나 문제를 해결하는 역할극을 합니다. (약 60초)",
        prepSec: 0,
        answerSec: 75,
        count: 1,
      },
    ],
  },
};

export const EXAM_TYPES = Object.keys(EXAMS) as ExamType[];

export function getExam(type: string): ExamMeta | null {
  return (EXAMS as Record<string, ExamMeta>)[type] ?? null;
}

// ---- 채점 영역 (사업계획서 5영역, 대시보드와 일치) ----
export const DIMENSIONS = [
  { key: "pronunciation", label: "발음", icon: "AudioLines" },
  { key: "fluency", label: "유창성", icon: "Activity" },
  { key: "vocabulary", label: "어휘", icon: "BookOpen" },
  { key: "grammar", label: "문법", icon: "PencilLine" },
  { key: "logic", label: "논리성", icon: "Network" },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]["key"];

// ---- 내부 0–100 점수 → 시험별 실제 점수 체계 환산 ----
export interface NativeScore {
  headline: string; // "7.0", "24 / 30", "150 / 200"
  level: string; // "Band 7 · Good", "Level 6", "IM2"
  band?: number;
}

export function toNativeScore(examType: ExamType, overall: number): NativeScore {
  const o = Math.max(0, Math.min(100, overall));
  switch (examType) {
    case "ielts": {
      const band = Math.round((o / 100) * 9 * 2) / 2;
      return { headline: band.toFixed(1), level: `Band ${band}`, band };
    }
    case "toefl": {
      const s = Math.round((o / 100) * 30);
      return { headline: `${s} / 30`, level: toeflLevel(s) };
    }
    case "toeic": {
      const s = Math.round((o / 100) * 200 / 10) * 10;
      return { headline: `${s} / 200`, level: `Level ${toeicLevel(s)}` };
    }
    case "opic": {
      return { headline: opicLevel(o), level: opicLevel(o) };
    }
  }
}

function toeflLevel(s: number): string {
  if (s >= 26) return "Advanced";
  if (s >= 18) return "High-Intermediate";
  if (s >= 10) return "Low-Intermediate";
  return "Basic";
}

function toeicLevel(s: number): number {
  if (s >= 190) return 8;
  if (s >= 160) return 7;
  if (s >= 130) return 6;
  if (s >= 110) return 5;
  if (s >= 80) return 4;
  if (s >= 60) return 3;
  if (s >= 40) return 2;
  return 1;
}

function opicLevel(o: number): string {
  if (o >= 88) return "AL";
  if (o >= 80) return "IH";
  if (o >= 70) return "IM";
  if (o >= 60) return "IL";
  if (o >= 50) return "NH";
  if (o >= 38) return "NM";
  return "NL";
}

// 0–100 점수의 질적 라벨/색상 (대시보드 카드용)
export function scoreLabel(v: number): { label: string; tone: "good" | "fair" | "weak" | "great" } {
  if (v >= 85) return { label: "Excellent", tone: "great" };
  if (v >= 70) return { label: "Good", tone: "good" };
  if (v >= 55) return { label: "Fair", tone: "fair" };
  return { label: "Needs Work", tone: "weak" };
}
