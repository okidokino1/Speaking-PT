"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Quote,
  Sparkles,
} from "lucide-react";
import { EXAMS, DIMENSIONS } from "@/lib/exams";
import { ScoreRing } from "@/components/ScoreRing";
import { DimensionCards } from "@/components/DimensionCards";
import { formatDate } from "@/lib/utils";
import type { AttemptRecord } from "@/lib/types";

export function ResultView({ record }: { record: AttemptRecord }) {
  const exam = EXAMS[record.examType];
  const r = record.result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> 대시보드
        </Link>
        <Link href="/test" className="btn-outline">
          <ClipboardCheck className="h-4 w-4" /> 다시 응시
        </Link>
      </div>

      {/* headline */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.name} 채점 결과</h1>
            <p className="mt-1 text-sm text-slate-500">{formatDate(record.createdAt)}</p>
          </div>
          <span
            className={`chip ${
              r.engine === "claude" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {r.engine === "claude" ? "Claude 정밀 채점" : "데모 채점 (키 연결 시 정밀 채점)"}
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center gap-8 md:flex-row">
          <div className="flex flex-col items-center">
            <ScoreRing value={record.overall} headline={record.nativeHeadline} sub={exam.name} />
            <span className="mt-2 chip bg-brand-50 text-brand-700">{record.nativeLevel}</span>
            <span className="mt-1 text-xs text-slate-400">{exam.scaleLabel}</span>
          </div>
          <div className="flex-1">
            <DimensionCards scores={record.dimensions} />
            {r.summary && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {r.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* next steps */}
      {r.nextSteps?.length > 0 && (
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Lightbulb className="h-5 w-5 text-amber-500" /> 추천 학습 전략
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {r.nextSteps.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                <span className="chip bg-brand-600 text-white">STEP {i + 1}</span>
                <p className="mt-2">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* per-question feedback */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">문항별 상세 피드백 & 첨삭</h2>
        {r.perQuestion.map((qf) => (
          <div key={qf.questionId} className="card p-6">
            <div className="flex items-center justify-between">
              <span className="chip bg-slate-100 text-slate-600">문항 {qf.index + 1}</span>
              <span className="text-lg font-bold text-slate-900">{qf.overall}점</span>
            </div>

            <div className="mt-4">
              <p className="label">내 답변 (전사)</p>
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {qf.transcript || <span className="text-slate-400">음성이 감지되지 않았습니다.</span>}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
              {DIMENSIONS.map((d) => {
                const ds = qf.dimensions.find((x) => x.key === d.key);
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{d.label}</span>
                      <span className="font-semibold text-slate-700">{ds?.score ?? 0}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${ds?.score ?? 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {qf.errors?.length > 0 && (
              <div className="mt-5">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> 오류 교정
                </p>
                <ul className="mt-2 space-y-2">
                  {qf.errors.map((e, i) => (
                    <li key={i} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm">
                      <span className="chip bg-amber-100 text-amber-700">{e.type}</span>
                      <p className="mt-1.5 text-slate-700">
                        <span className="text-rose-500 line-through">{e.quote}</span> →{" "}
                        <span className="font-semibold text-emerald-700">{e.correction}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{e.issue}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {qf.correctionGuide && (
              <div className="mt-5 rounded-xl bg-brand-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                  <Lightbulb className="h-4 w-4" /> 만점을 위한 첨삭
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{qf.correctionGuide}</p>
              </div>
            )}

            {qf.modelAnswer && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                  <Quote className="h-4 w-4" /> 모범 답변
                </p>
                <p className="mt-1.5 text-sm italic leading-relaxed text-slate-700">{qf.modelAnswer}</p>
              </div>
            )}

            {(qf.strengths?.length > 0 || qf.improvements?.length > 0) && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {qf.strengths?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">강점</p>
                    <ul className="mt-1 space-y-1">
                      {qf.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {qf.improvements?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-amber-700">개선점</p>
                    <ul className="mt-1 space-y-1">
                      {qf.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {!r.perQuestion.length && (
          <div className="card p-8 text-center text-slate-400">
            이 회차는 요약 데이터만 있습니다. 새 모의고사를 응시하면 문항별 상세 첨삭을 받을 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
