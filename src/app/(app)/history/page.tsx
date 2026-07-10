import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listAttempts } from "@/lib/store";
import { EXAMS } from "@/lib/exams";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = (await getSessionUser())!;
  const attempts = await listAttempts(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">학습 이력</h1>
        <p className="mt-1 text-slate-500">지금까지 응시한 모든 모의고사 기록입니다.</p>
      </div>

      <div className="card overflow-hidden">
        {attempts.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">시험</th>
                <th className="px-5 py-3 font-medium">종합 점수</th>
                <th className="px-5 py-3 font-medium">등급</th>
                <th className="px-5 py-3 font-medium">일시</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{EXAMS[a.examType].name}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{a.nativeHeadline}</td>
                  <td className="px-5 py-3.5">
                    <span className="chip bg-brand-50 text-brand-700">{a.nativeLevel}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(a.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/result/${a.id}`} className="text-xs font-semibold text-brand-600">
                      상세 보기 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">아직 응시 기록이 없습니다.</p>
            <Link href="/test" className="btn-primary mt-4">
              첫 모의고사 응시하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
