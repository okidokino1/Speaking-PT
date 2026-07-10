import type { DimensionKey, ExamType } from "./exams";

// 응시 세션에서 만들어지는 개별 문항
export interface Question {
  id: string;
  examType: ExamType;
  sectionKey: string;
  sectionLabel: string;
  kind: string;
  index: number; // 세션 내 순번 (0-based)
  prompt: string; // 질문/지시문 (영문)
  promptKo?: string; // 한국어 보조 설명
  passage?: string; // 낭독/통합형 지문
  imageUrl?: string; // 사진 묘사용
  prepSec: number;
  answerSec: number;
}

export interface AnswerInput {
  questionId: string;
  transcript: string;
  durationSec: number;
  // 타임스탬프 기반 객관 지표 (있으면 채점 정확도↑)
  metrics?: SpeechMetrics;
}

export interface SpeechMetrics {
  wordCount: number;
  wpm: number; // 분당 단어 수
  fillerCount: number; // um, uh, like ...
  fillerRatio: number;
  pauseCount: number;
  longestPauseSec: number;
  speakingRatio: number; // 발화 시간 / 전체 시간
}

// 채점 결과 (Claude/mock 공통 스키마)
export interface DimensionScore {
  key: DimensionKey;
  score: number; // 0–100
  comment: string; // 영역별 한줄평 (한국어)
}

export interface ErrorItem {
  type: string; // "문법" | "발음" | "어휘" | "논리" ...
  quote: string; // 학습자 답변 중 문제 부분
  issue: string; // 무엇이 문제인지
  correction: string; // 어떻게 고칠지
}

export interface QuestionFeedback {
  questionId: string;
  index: number;
  transcript: string;
  dimensions: DimensionScore[];
  overall: number; // 0–100
  errors: ErrorItem[];
  correctionGuide: string; // 만점을 위한 첨삭 (마크다운)
  modelAnswer: string; // 모범 답변
  strengths: string[];
  improvements: string[];
}

export interface ScoreResult {
  examType: ExamType;
  overall: number; // 0–100
  dimensions: DimensionScore[]; // 전체 평균
  perQuestion: QuestionFeedback[];
  summary: string; // 종합 피드백 (한국어)
  nextSteps: string[]; // 추천 학습 전략
  engine: "claude" | "demo"; // 채점에 사용된 엔진
}

export interface AttemptRecord {
  id: string;
  userId: string;
  examType: ExamType;
  createdAt: string;
  overall: number;
  dimensions: Record<DimensionKey, number>;
  nativeHeadline: string;
  nativeLevel: string;
  result: ScoreResult;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  credits: number;
  targetScore?: string;
  isAdmin?: boolean;
}
