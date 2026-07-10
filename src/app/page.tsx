import Link from "next/link";
import {
  Mic,
  AudioLines,
  Activity,
  BookOpen,
  PencilLine,
  Network,
  ArrowRight,
  CheckCircle2,
  Timer,
  Bot,
  LineChart,
} from "lucide-react";
import { EXAMS, EXAM_TYPES } from "@/lib/exams";

const STEPS = [
  { n: "M1", t: "음성 수집·전처리", d: "녹음 → 노이즈 제거 → STT 전사 (Whisper)" },
  { n: "M2", t: "발음·유창성 평가", d: "속도·멈춤·필러워드·발음 분석" },
  { n: "M3", t: "문법·어휘·논리", d: "문법 오류·어휘 수준·구성력 평가" },
  { n: "M4", t: "시험별 종합 채점", d: "시험 기준 가중치로 점수·등급 산출" },
  { n: "M5", t: "맞춤 피드백", d: "첨삭·모범답변·학습 전략 (Claude)" },
];

const DIMS = [
  { icon: AudioLines, t: "발음" },
  { icon: Activity, t: "유창성" },
  { icon: BookOpen, t: "어휘" },
  { icon: PencilLine, t: "문법" },
  { icon: Network, t: "논리성" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Mic className="h-5 w-5" />
            </span>
            <span className="font-bold text-slate-900">AI Speaking PT</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/pricing" className="btn-ghost hidden sm:inline-flex">
              요금제
            </Link>
            <Link href="/login" className="btn-ghost">
              로그인
            </Link>
            <Link href="/signup" className="btn-primary">
              무료로 시작하기
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <span className="chip bg-brand-100 text-brand-700">
            <Bot className="h-3.5 w-3.5" /> AI 자동 채점 · 실시간 피드백
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            영어 스피킹 시험,
            <br />
            <span className="text-brand-600">AI가 출제하고 채점합니다</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            IELTS · TOEFL · TOEIC · OPIc 스피킹을 실전과 동일한 시간으로 응시하고,
            발음·유창성·어휘·문법·논리성 5개 영역을 즉시 채점받으세요. 만점을 위한 첨삭과
            모범답안까지 제공합니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">
              무료로 응시해보기 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="btn-outline px-6 py-3 text-base">
              요금제 보기
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 무료 체험 3회
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer className="h-4 w-4 text-emerald-500" /> 실전 동일 타이머
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LineChart className="h-4 w-4 text-emerald-500" /> 성장 대시보드
            </span>
          </div>
        </div>
      </section>

      {/* Exams */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">지원 시험</h2>
        <p className="mt-2 text-center text-slate-500">
          각 시험의 실제 파트 구성과 제한시간을 그대로 재현합니다.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXAM_TYPES.map((t) => {
            const e = EXAMS[t];
            return (
              <div key={t} className="card p-5">
                <h3 className="text-lg font-bold text-slate-900">{e.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{e.tagline}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="chip bg-slate-100 text-slate-600">{e.durationLabel}</span>
                  <span className="chip bg-slate-100 text-slate-600">{e.scaleLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dimensions */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">5개 영역 정밀 채점</h2>
          <p className="mt-2 text-center text-slate-500">
            사업계획서의 M2·M3 평가 기준을 그대로 반영했습니다.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {DIMS.map((d) => (
              <div key={d.t} className="card flex flex-col items-center p-6 text-center">
                <d.icon className="h-7 w-7 text-brand-600" />
                <span className="mt-3 font-semibold text-slate-800">{d.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">AI 채점 파이프라인</h2>
        <p className="mt-2 text-center text-slate-500">
          M1 → M5, 음성 입력부터 맞춤 피드백까지 자동화
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <span className="chip bg-brand-600 text-white">{s.n}</span>
              <h3 className="mt-3 font-bold text-slate-900">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold">오늘 첫 모의고사를 응시해보세요</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            회원가입 즉시 무료로 3회 응시할 수 있습니다. 신용카드가 필요 없습니다.
          </p>
          <Link
            href="/signup"
            className="btn mt-7 bg-white px-7 py-3 text-base font-bold text-brand-700 hover:bg-brand-50"
          >
            무료로 시작하기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-400 sm:px-6">
          © 2026 AI Speaking PT · (주)비지리츠 · 영어 스피킹 자동채점 학습 플랫폼
        </div>
      </footer>
    </div>
  );
}
