"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, SearchX } from "lucide-react";
import { ResultView } from "@/components/ResultView";
import type { AttemptRecord } from "@/lib/types";

// 서버 저장소(무DB 서버리스)에서 기록을 못 찾을 때, 클라이언트 세션 저장소에서 복구한다.
export function ResultFallback({ attemptId }: { attemptId: string }) {
  const [record, setRecord] = useState<AttemptRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`sp:attempt:${attemptId}`);
      if (raw) setRecord(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-slate-500">결과를 불러오는 중...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="card p-12 text-center">
        <SearchX className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-slate-600">이 결과를 찾을 수 없습니다.</p>
        <p className="mt-1 text-sm text-slate-400">
          기록을 영구 저장하려면 Supabase를 연결하세요. 지금은 새 모의고사를 응시해 주세요.
        </p>
        <Link href="/test" className="btn-primary mt-5">
          모의고사 응시하기
        </Link>
      </div>
    );
  }

  return <ResultView record={record} />;
}
