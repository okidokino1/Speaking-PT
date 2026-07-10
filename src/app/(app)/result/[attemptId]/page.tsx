import { getSessionUser } from "@/lib/auth";
import { getAttempt } from "@/lib/store";
import { ResultView } from "@/components/ResultView";
import { ResultFallback } from "@/components/ResultFallback";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const user = (await getSessionUser())!;
  const attempt = await getAttempt(user.id, attemptId);

  // 서버 저장소에 있으면 서버 렌더(Supabase 등), 없으면 클라이언트 세션 저장소 폴백
  if (attempt) return <ResultView record={attempt} />;
  return <ResultFallback attemptId={attemptId} />;
}
