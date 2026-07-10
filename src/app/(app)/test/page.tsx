import Link from "next/link";
import { ArrowRight, Clock, ListChecks } from "lucide-react";
import { EXAMS, EXAM_TYPES } from "@/lib/exams";

const ACCENT: Record<string, string> = {
  rose: "border-rose-200 bg-rose-50",
  indigo: "border-indigo-200 bg-indigo-50",
  sky: "border-sky-200 bg-sky-50",
  emerald: "border-emerald-200 bg-emerald-50",
};

export default function TestSelectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">모의 테스트</h1>
        <p className="mt-1 text-slate-500">
          응시할 시험을 선택하세요. 실제 시험과 동일한 파트 구성·제한시간으로 진행됩니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EXAM_TYPES.map((t) => {
          const e = EXAMS[t];
          const totalQ = e.sections.reduce((s, sec) => s + sec.count, 0);
          return (
            <Link
              key={t}
              href={`/test/${t}`}
              className={`card border ${ACCENT[e.accent]} p-6 transition-shadow hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{e.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{e.tagline}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {e.durationLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="h-4 w-4" /> {totalQ}문항
                </span>
                <span className="chip bg-white/70 text-slate-600">{e.scaleLabel}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {e.sections.map((s) => (
                  <span key={s.key} className="chip bg-white text-xs text-slate-500">
                    {s.label}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
