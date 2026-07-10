"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  Square,
  Clock,
  Loader2,
  ChevronRight,
  AlertCircle,
  Volume2,
} from "lucide-react";
import type { ExamType } from "@/lib/exams";
import type { Question } from "@/lib/types";

type Phase = "ready" | "prep" | "answer" | "processing" | "submitting";

interface CollectedAnswer {
  questionId: string;
  transcript: string;
  durationSec: number;
  words?: { word: string; start: number; end: number }[];
}

export function ExamSession({
  examType,
  examName,
  questions,
  whisperAvailable,
}: {
  examType: ExamType;
  examName: string;
  questions: Question[];
  whisperAvailable: boolean;
}) {
  const router = useRouter();
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [micDenied, setMicDenied] = useState(false);
  const [reading, setReading] = useState(false); // 시험관이 문제를 음성으로 읽는 중

  const answersRef = useRef<CollectedAnswer[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const finishingRef = useRef(false);

  const q = questions[qIndex];

  // ---- 시험관 음성 출제 (TTS) ----
  const speak = useCallback((text: string, onEnd?: () => void) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onEnd?.();
    };
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) {
      finish();
      return;
    }
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.96;
      const voices = synth.getVoices();
      const en =
        voices.find((v) => /en[-_]US/i.test(v.lang) && /female|Samantha|Google US|Jenny|Aria|Zira/i.test(v.name)) ||
        voices.find((v) => /en[-_]US/i.test(v.lang)) ||
        voices.find((v) => /^en/i.test(v.lang));
      if (en) u.voice = en;
      u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
      // 워치독: onend가 발생하지 않는 브라우저에서도 반드시 진행되도록
      const est = Math.min(20000, Math.max(4000, text.split(/\s+/).length * 450 + 2500));
      setTimeout(finish, est);
    } catch {
      finish();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  }, []);

  // ---- 타이머 (문제 낭독 중에는 멈춤) ----
  useEffect(() => {
    if (phase !== "prep" && phase !== "answer") return;
    if (reading || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft, reading]);

  useEffect(() => {
    if (reading || secondsLeft > 0) return;
    if (phase === "prep") beginAnswer();
    else if (phase === "answer") finishAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, reading]);

  // 언마운트 시 음성 정리
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, []);

  // ---- 녹음 ----
  const startRecording = useCallback(async () => {
    setTranscript("");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      startTimeRef.current = Date.now();

      // Web Speech API 실시간 전사 (지원 브라우저에서)
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = "en-US";
        rec.continuous = true;
        rec.interimResults = true;
        let finalText = "";
        rec.onresult = (ev: any) => {
          let interim = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const t = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) finalText += t + " ";
            else interim += t;
          }
          setTranscript((finalText + interim).trim());
        };
        rec.onerror = () => {};
        try {
          rec.start();
        } catch {}
        recognitionRef.current = rec;
      }
    } catch {
      setMicDenied(true);
      setError("마이크 접근이 거부되었습니다. 브라우저 주소창의 마이크 권한을 허용해 주세요.");
    }
  }, []);

  const stopStreams = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const getAudioBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state === "inactive") {
        resolve(chunksRef.current.length ? new Blob(chunksRef.current) : null);
        return;
      }
      mr.onstop = () =>
        resolve(chunksRef.current.length ? new Blob(chunksRef.current, { type: "audio/webm" }) : null);
      mr.stop();
    });
  }, []);

  // ---- 단계 전환 ----
  function startQuestion(i: number) {
    finishingRef.current = false;
    setQIndex(i);
    setTranscript("");
    const question = questions[i];
    // 시험관이 문제를 음성으로 읽어준다. 읽는 동안 타이머는 멈춘다.
    setReading(true);
    if (question.prepSec > 0) {
      setPhase("prep");
      setSecondsLeft(question.prepSec);
      speak(question.prompt, () => setReading(false));
    } else {
      setPhase("answer");
      setSecondsLeft(question.answerSec);
      // 준비 시간이 없는 문항: 낭독이 끝난 뒤 녹음 시작
      speak(question.prompt, () => {
        setReading(false);
        startRecording();
      });
    }
  }

  function beginAnswer() {
    stopSpeaking();
    setReading(false);
    setPhase("answer");
    setSecondsLeft(q.answerSec);
    startRecording();
  }

  async function finishAnswer() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    stopSpeaking();
    setPhase("processing");

    const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const blob = await getAudioBlob();
    stopStreams();

    let finalTranscript = transcript.trim();
    let words: CollectedAnswer["words"] | undefined;

    if (whisperAvailable && blob) {
      try {
        const fd = new FormData();
        fd.append("audio", blob, "answer.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = await res.json();
        if (data.transcript) {
          finalTranscript = data.transcript;
          words = data.words;
        }
      } catch {}
    }

    answersRef.current.push({
      questionId: q.id,
      transcript: finalTranscript,
      durationSec,
      words,
    });

    if (qIndex + 1 < questions.length) {
      startQuestion(qIndex + 1);
    } else {
      submitAll();
    }
  }

  async function submitAll() {
    setPhase("submitting");
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, questions, answers: answersRef.current }),
      });
      if (res.status === 402) {
        router.push("/pricing");
        return;
      }
      if (!res.ok) throw new Error("채점 요청 실패");
      const data = await res.json();
      // 서버리스 폴백: 결과 기록을 클라이언트에 보관 (결과 페이지가 이를 사용)
      try {
        if (data.record) {
          sessionStorage.setItem(`sp:attempt:${data.attemptId}`, JSON.stringify(data.record));
        }
      } catch {}
      router.push(`/result/${data.attemptId}`);
    } catch {
      setError("채점 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setPhase("ready");
    }
  }

  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const progress = ((qIndex + (phase === "answer" || phase === "processing" ? 1 : 0)) / questions.length) * 100;

  // ---- 렌더 ----
  if (phase === "ready") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
            <Mic className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{examName} 모의고사</h1>
          <p className="mt-2 text-slate-500">
            총 {questions.length}문항 · 실제 시험과 동일한 준비/발화 시간으로 진행됩니다.
          </p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-slate-600">
            <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-brand-600" /> 각 문항은 준비 시간 후 자동으로 녹음이 시작됩니다.</li>
            <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-brand-600" /> 발화 시간이 끝나면 자동으로 다음 문항으로 넘어갑니다.</li>
            <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-brand-600" /> 조용한 환경에서 마이크 권한을 허용해 주세요.</li>
          </ul>
          {error && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
          <button onClick={() => startQuestion(0)} className="btn-primary mt-7 px-8 py-3 text-base">
            시험 시작하기
          </button>
        </div>
      </div>
    );
  }

  if (phase === "submitting" || phase === "processing") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        <p className="mt-4 text-lg font-semibold text-slate-800">
          {phase === "submitting" ? "AI가 채점 중입니다..." : "답변을 처리하고 있습니다..."}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          발음·유창성·어휘·문법·논리성을 분석하고 있어요. 잠시만 기다려 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* progress */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">
          문항 {qIndex + 1} / {questions.length}
        </span>
        <span className="chip bg-slate-100 text-slate-600">{q.sectionLabel}</span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="card p-6">
        {/* timer */}
        <div className="flex items-center justify-between">
          <span
            className={`chip ${
              reading
                ? "bg-brand-100 text-brand-700"
                : phase === "prep"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {reading ? (
              <span className="flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5 animate-pulse" /> 시험관이 문제를 읽는 중…
              </span>
            ) : phase === "prep" ? (
              "준비 시간"
            ) : (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> 녹음 중
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-2xl font-bold tabular-nums text-slate-900">
            <Clock className="h-5 w-5 text-slate-400" />
            {mm(secondsLeft)}
          </span>
        </div>

        {/* question */}
        <div className="mt-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold leading-relaxed text-slate-900">{q.prompt}</p>
            <button
              type="button"
              onClick={() => speak(q.prompt)}
              title="문제 다시 듣기"
              className="btn-outline shrink-0 px-3 py-2"
            >
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">다시 듣기</span>
            </button>
          </div>
          {q.promptKo && <p className="mt-1 text-sm text-slate-500">{q.promptKo}</p>}

          {q.passage && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {q.passage}
            </div>
          )}
          {q.imageUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.imageUrl} alt="문항 이미지" className="w-full object-cover" />
            </div>
          )}
        </div>

        {/* answer area */}
        {phase === "answer" && (
          <div className="mt-5">
            <label className="label">실시간 전사 {whisperAvailable ? "(제출 시 Whisper로 정밀 재전사)" : ""}</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="말하기 시작하면 여기에 전사됩니다. (미지원 브라우저는 직접 입력 가능)"
              className="input min-h-28 resize-none"
            />
          </div>
        )}

        {micDenied && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4" /> 마이크 권한이 필요합니다. 텍스트로 입력해도 채점됩니다.
          </p>
        )}

        {/* controls */}
        <div className="mt-6 flex justify-end gap-2">
          {phase === "prep" && (
            <button onClick={beginAnswer} className="btn-primary">
              <Mic className="h-4 w-4" /> 바로 답변 시작
            </button>
          )}
          {phase === "answer" && (
            <button onClick={finishAnswer} className="btn-primary bg-rose-600 hover:bg-rose-700">
              <Square className="h-4 w-4" /> 답변 완료
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        {examName} · 실전과 동일한 흐름으로 진행됩니다. 중간에 새로고침하지 마세요.
      </p>
    </div>
  );
}
