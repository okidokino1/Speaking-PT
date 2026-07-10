import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listAttempts } from "@/lib/store";
import { DIMENSIONS, EXAMS, type DimensionKey } from "@/lib/exams";
import { RadarScore } from "@/components/RadarScore";
import { TrendChart, type TrendPoint } from "@/components/TrendChart";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const user = (await getSessionUser())!;
  const attempts = await listAttempts(user.id);

  if (!attempts.length) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-500">리포트를 생성할 데이터가 없습니다.</p>
        <Link href="/test" className="btn-primary mt-4">
          모의고사 응시하기
        </Link>
      </div>
    );
  }

  // 영역별 평균
  const avgDims = DIMENSIONS.map((d) => ({
    dim: d.label,
    score: Math.round(
      attempts.reduce((s, a) => s + (a.dimensions[d.key as DimensionKey] ?? 0), 0) / attempts.length
    ),
  }));

  const trend: TrendPoint[] = [...attempts]
    .slice(0, 6)
    .reverse()
    .map((a, i) => ({
      label: `${i + 1}회차`,
      발음: a.dimensions.pronunciation ?? 0,
      유창성: a.dimensions.fluency ?? 0,
      어휘: a.dimensions.vocabulary ?? 0,
      문법: a.dimensions.grammar ?? 0,
      논리성: a.dimensions.logic ?? 0,
    }));

  const strongest = [...avgDims].sort((a, b) => b.score - a.score)[0];
  const weakest = [...avgDims].sort((a, b) => a.score - b.score)[0];

  // 시험별 응시 횟수
  const byExam = Object.entries(
    attempts.reduce<Record<string, number>>((acc, a) => {
      acc[a.examType] = (acc[a.examType] || 0) + 1;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">학습 리포트</h1>
        <p className="mt-1 text-slate-500">전체 응시 데이터를 종합한 강·약점 분석입니다.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold text-slate-900">영역별 평균 (전체 회차)</h2>
          <RadarScore data={avgDims} />
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-slate-900">영역별 점수 추이</h2>
          <div className="mt-2">
            <TrendChart data={trend} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card border border-emerald-200 bg-emerald-50/50 p-6">
          <p className="text-sm font-semibold text-emerald-700">가장 강한 영역</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {strongest.dim} <span className="text-lg text-emerald-600">{strongest.score}점</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            이 강점을 유지하면서 다른 영역을 끌어올리면 종합 점수가 빠르게 오릅니다.
          </p>
        </div>
        <div className="card border border-amber-200 bg-amber-50/50 p-6">
          <p className="text-sm font-semibold text-amber-700">가장 개선이 필요한 영역</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {weakest.dim} <span className="text-lg text-amber-600">{weakest.score}점</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            다음 학습은 '{weakest.dim}' 집중 훈련을 우선하는 것을 추천합니다.
          </p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-slate-900">시험별 응시 현황</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {byExam.map(([type, count]) => (
            <div key={type} className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">{EXAMS[type as keyof typeof EXAMS].name}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{count}회</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
