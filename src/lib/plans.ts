export interface Plan {
  id: string;
  name: string;
  price: number; // KRW
  period: string;
  kind: "free" | "credit" | "subscription";
  credits: number; // 지급 이용권 (subscription은 무제한 표시)
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "무료 체험",
    price: 0,
    period: "가입 시",
    kind: "free",
    credits: 1,
    features: ["모의고사 1세트 무료 응시", "5개 영역 채점", "기본 피드백", "대시보드 이용"],
  },
  {
    id: "credit10",
    name: "이용권 10회",
    price: 9900,
    period: "1회 결제",
    kind: "credit",
    credits: 10,
    features: ["모의고사 10회 응시권", "AI 정밀 채점", "문항별 첨삭·모범답안", "유효기간 없음"],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro 무제한",
    price: 19900,
    period: "월 구독",
    kind: "subscription",
    credits: 9999,
    features: ["모의고사 무제한 응시", "AI 정밀 채점", "심화 학습 리포트", "우선 지원"],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
