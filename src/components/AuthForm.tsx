"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Loader2 } from "lucide-react";
import { publicFeatures } from "@/lib/env";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSupabase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const name = String(fd.get("name") || "");
    const supabase = getSupabaseBrowser();
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email,
            name: name || email.split("@")[0],
            plan: "free",
            credits: 3,
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white">
          <Mic className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {isSignup ? "회원가입" : "다시 오신 걸 환영합니다"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          AI Speaking PT · 영어 스피킹 자동채점 플랫폼
        </p>
      </div>

      <div className="card p-6">
        {!publicFeatures.supabase && (
          <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            데모 모드입니다. 이메일만 입력하면 바로 체험할 수 있어요. (Supabase 키를 연결하면 실제 계정으로 동작)
          </div>
        )}

        {publicFeatures.supabase ? (
          <form onSubmit={handleSupabase} className="space-y-4">
            {isSignup && (
              <div>
                <label className="label">이름</label>
                <input name="name" className="input" placeholder="홍길동" />
              </div>
            )}
            <div>
              <label className="label">이메일</label>
              <input name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">비밀번호</label>
              <input name="password" type="password" required minLength={6} className="input" placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "가입하기" : "로그인"}
            </button>
          </form>
        ) : (
          <form action="/api/auth/demo" method="post" className="space-y-4">
            {isSignup && (
              <div>
                <label className="label">이름</label>
                <input name="name" className="input" placeholder="홍길동" />
              </div>
            )}
            <div>
              <label className="label">이메일</label>
              <input name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>
            <button type="submit" className="btn-primary w-full">
              {isSignup ? "체험 시작하기" : "데모 로그인"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-slate-500">
          {isSignup ? (
            <>
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-semibold text-brand-600">
                로그인
              </Link>
            </>
          ) : (
            <>
              계정이 없으신가요?{" "}
              <Link href="/signup" className="font-semibold text-brand-600">
                회원가입
              </Link>
            </>
          )}
        </p>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          ← 홈으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
