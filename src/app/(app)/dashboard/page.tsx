import Link from "next/link";
import {
  ArrowRight,
  Trophy,
  ClipboardCheck,
  TrendingUp,
  Clock,
  Target,
  AudioLines,
  Activity,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listAttempts } from "@/lib/store";
import { EXAMS, DIMENSIONS, toNativeScore } from "@/lib/exams";
import { ScoreRing } from "@/components/ScoreRing";
import { DimensionCards } from "@/components/DimensionCards";
import { TrendChart, type TrendPoint } from "@/components/TrendChart";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const attempts = await listAttempts(user.id);
  const latest = attempts[0];
  const exam = latest ? EXAMS[latest.examType] : EXAMS.ielts;

  const trend: TrendPoint[] = [...attempts]
    .slice(0, 5)
    .reverse()
    .map((a, i) => ({
      label: `${i + 1}회차`,
      발음: a.dimensions.pronunciation ?? 0,
      유창성: a.dimensions.fluency ?? 0,
      어휘: a.dimensions.vocabulary ?? 0,
      문법: a.dimensions.grammar ?? 0,
      논리성: a.dimensions.logic ?? 0,
    }));

  const avg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.overall, 0) / attempts.length)
    : 0;

  // 다음 목표: 현재 밴드 + 0.5 (IELTS 기준 예시)
  const nextTargetNative = latest
    ? toNativeScore(latest.examType, Math.min(100, latest.overall + 6))
    : null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            안녕하세요, {user.name}님! 👋
          </h1>
          <p className="mt-1 text-slate-500">오늘도 꾸준히 연습하고 실력을 향상시켜 보세요.</p>
        </div>
        <Link href="/test" className="btn-primary">
          <ClipboardCheck className="h-4 w-4" /> 새 모의고사 응시
        </Link>
      </div>

      {/* Summary + Next goal */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">최근 테스트 요약</h2>
            {latest && (
              <span className="text-sm text-slate-400">{formatDate(latest.createdAt)}</span>
            )}
          </div>
          {latest ? (
            <div className="mt-4 flex flex-col items-center gap-6 md:flex-row">
              <div className="flex flex-col items-center">
                <ScoreRing
                  value={latest.overall}
                  headline={latest.nativeHeadline}
                  sub={exam.name}
                />
                <span className="mt-2 chip bg-brand-50 text-brand-700">{latest.nativeLevel}</span>
              </div>
              <div className="flex-1">
                <DimensionCards scores={latest.dimensions} />
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-900">다음 목표</h2>
          {latest && nextTargetNative ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{exam.name}</span>
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <p className="mt-2 text-sm text-slate-500">목표 점수</p>
              <p className="text-3xl font-bold text-slate-900">
                {nextTargetNative.headline}
                <span className="ml-1 text-sm font-medium text-slate-400">달성하기</span>
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${latest.overall}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                현재 {latest.nativeHeadline} · 목표까지 꾸준히 연습해보세요!
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              첫 테스트를 응시하면 목표가 설정됩니다.
            </p>
          )}
        </div>
      </div>

      {/* Trend + AI feedback + recommended */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-bold text-slate-900">영역별 점수 추이</h2>
          <div className="mt-2">
            <TrendChart data={trend} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <Sparkles className="h-4 w-4 text-brand-600" /> AI 피드백 요약
            </h2>
            {latest?.result.summary ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {latest.result.summary}
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-400">테스트 후 요약이 표시됩니다.</p>
            )}
            {latest && (
              <Link
                href={`/result/${latest.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
              >
                전체 피드백 보기 <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-slate-900">추천 학습 콘텐츠</h2>
            <ul className="mt-3 space-y-3">
              {[
                { icon: Activity, t: "유창성 향상 훈련", d: "끊김 없는 말하기 연습", m: "15분" },
                { icon: BookOpen, t: "고급 어휘 확장", d: "시험 고득점 표현", m: "20분" },
                { icon: AudioLines, t: "발음 교정", d: "강세·연음 집중 연습", m: "18분" },
              ].map((c) => (
                <li key={c.t} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <c.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{c.t}</p>
                    <p className="text-xs text-slate-500">{c.d}</p>
                  </div>
                  <span className="text-xs text-slate-400">{c.m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Records + stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold text-slate-900">최근 테스트 기록</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="pb-2 font-medium">시험 유형</th>
                  <th className="pb-2 font-medium">점수</th>
                  <th className="pb-2 font-medium">일시</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 5).map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="py-2.5 font-medium text-slate-700">{EXAMS[a.examType].name}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{a.nativeHeadline}</td>
                    <td className="py-2.5 text-slate-500">{formatDate(a.createdAt)}</td>
                    <td className="py-2.5 text-right">
                      <Link href={`/result/${a.id}`} className="text-xs font-semibold text-brand-600">
                        상세 보기
                      </Link>
                    </td>
                  </tr>
                ))}
                {!attempts.length && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      아직 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-900">나의 학습 현황</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={ClipboardCheck} label="총 테스트" value={`${attempts.length}회`} tone="brand" />
            <Stat icon={TrendingUp} label="평균 점수" value={`${avg}점`} tone="emerald" />
            <Stat icon={Clock} label="누적 학습" value={`${attempts.length * 15}분`} tone="amber" />
            <Stat
              icon={Target}
              label="목표 달성률"
              value={`${Math.min(100, Math.round((avg / 80) * 100))}%`}
              tone="violet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "brand" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <span className={`mx-auto grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl bg-slate-50 py-10 text-center">
      <p className="text-slate-600">아직 응시 기록이 없습니다.</p>
      <Link href="/test" className="btn-primary mt-4">
        첫 모의고사 응시하기 <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
