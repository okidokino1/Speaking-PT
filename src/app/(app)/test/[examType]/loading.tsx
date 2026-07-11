import { Loader2, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center">
      <span className="relative">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-amber-400" />
      </span>
      <p className="mt-4 text-lg font-semibold text-slate-800">새로운 문제를 출제하고 있습니다…</p>
      <p className="mt-1 text-sm text-slate-500">
        AI가 이번 회차에 맞는 새 문항을 생성 중입니다. 매번 다른 문제가 출제됩니다.
      </p>
    </div>
  );
}
