import { notFound, redirect } from "next/navigation";
import { getExam, type ExamType } from "@/lib/exams";
import { generateSession } from "@/lib/questionGen";
import { features } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { ExamSession } from "@/components/ExamSession";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function TakeExamPage({
  params,
}: {
  params: Promise<{ examType: string }>;
}) {
  const { examType } = await params;
  const exam = getExam(examType);
  if (!exam) notFound();

  // 무료 이용권 소진 시 응시 시작 전에 결제 페이지로 안내 (관리자/Pro 제외)
  const user = (await getSessionUser())!;
  if (!user.isAdmin && user.plan !== "pro" && (user.credits ?? 0) <= 0) {
    redirect("/pricing?reason=out-of-credits");
  }

  // 매 회차 AI가 새 문항을 출제 (반복 방지). 실패 시 시드 문항 폴백.
  const questions = await generateSession(examType as ExamType);

  return (
    <ExamSession
      examType={examType as ExamType}
      examName={exam.name}
      questions={questions}
      whisperAvailable={features.whisper}
    />
  );
}
