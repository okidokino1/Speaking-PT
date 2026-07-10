import { notFound, redirect } from "next/navigation";
import { getExam, type ExamType } from "@/lib/exams";
import { buildSession } from "@/lib/questions";
import { features } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { ExamSession } from "@/components/ExamSession";

export const dynamic = "force-dynamic";

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

  const questions = buildSession(examType as ExamType);

  return (
    <ExamSession
      examType={examType as ExamType}
      examName={exam.name}
      questions={questions}
      whisperAvailable={features.whisper}
    />
  );
}
