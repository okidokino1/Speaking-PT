import { notFound } from "next/navigation";
import { getExam, type ExamType } from "@/lib/exams";
import { buildSession } from "@/lib/questions";
import { features } from "@/lib/env";
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
