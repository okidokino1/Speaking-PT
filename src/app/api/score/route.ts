import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, encodeDemoUser, DEMO_COOKIE_NAME } from "@/lib/auth";
import { features } from "@/lib/env";
import { gradeAttempt } from "@/lib/grader";
import { saveAttempt } from "@/lib/store";
import { computeMetrics } from "@/lib/metrics";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { ExamType } from "@/lib/exams";
import type { AnswerInput, Question } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

interface Body {
  examType: ExamType;
  questions: Question[];
  answers: Array<{
    questionId: string;
    transcript: string;
    durationSec: number;
    words?: { word: string; start: number; end: number }[];
  }>;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  // 이용권 게이팅 (Pro는 무제한)
  if (user.plan !== "pro" && (user.credits ?? 0) <= 0) {
    return NextResponse.json(
      { error: "이용권이 모두 소진되었습니다.", needsPayment: true },
      { status: 402 }
    );
  }

  const body = (await req.json()) as Body;
  if (!body?.examType || !body?.questions?.length) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 객관 지표 계산 (Whisper 타임스탬프 있으면 정밀, 없으면 근사)
  const answers: AnswerInput[] = body.answers.map((a) => ({
    questionId: a.questionId,
    transcript: a.transcript || "",
    durationSec: a.durationSec || 0,
    metrics: computeMetrics(a.transcript || "", a.durationSec || 0, a.words),
  }));

  const result = await gradeAttempt({
    examType: body.examType,
    questions: body.questions,
    answers,
  });

  const record = await saveAttempt(user.id, body.examType, result);

  // 이용권 1회 차감 (Pro 제외)
  if (user.plan !== "pro") {
    const nextCredits = Math.max(0, (user.credits ?? 0) - 1);
    if (features.supabase) {
      const supabase = await getSupabaseServer();
      await supabase.from("profiles").update({ credits: nextCredits }).eq("id", user.id);
    } else {
      const store = await cookies();
      store.set(DEMO_COOKIE_NAME, encodeDemoUser({ ...user, credits: nextCredits }), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  // 서버리스(무DB 데모) 환경에서는 인메모리 저장이 인스턴스 간 공유되지 않으므로,
  // 전체 기록을 함께 반환하여 클라이언트가 결과 페이지에서 폴백 렌더링할 수 있게 한다.
  return NextResponse.json({ attemptId: record.id, record });
}
