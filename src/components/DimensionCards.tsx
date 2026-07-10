import { AudioLines, Activity, BookOpen, PencilLine, Network } from "lucide-react";
import { DIMENSIONS, scoreLabel, type DimensionKey } from "@/lib/exams";

const ICONS: Record<DimensionKey, React.ComponentType<{ className?: string }>> = {
  pronunciation: AudioLines,
  fluency: Activity,
  vocabulary: BookOpen,
  grammar: PencilLine,
  logic: Network,
};

const TONE_STYLE: Record<string, { text: string; bg: string }> = {
  great: { text: "text-brand-600", bg: "bg-brand-50" },
  good: { text: "text-emerald-600", bg: "bg-emerald-50" },
  fair: { text: "text-amber-600", bg: "bg-amber-50" },
  weak: { text: "text-rose-600", bg: "bg-rose-50" },
};

export function DimensionCards({
  scores,
  size = "md",
}: {
  scores: Record<DimensionKey, number>;
  size?: "sm" | "md";
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {DIMENSIONS.map((d) => {
        const v = Math.round(scores[d.key] ?? 0);
        const Icon = ICONS[d.key];
        const { label, tone } = scoreLabel(v);
        const st = TONE_STYLE[tone];
        return (
          <div key={d.key} className={`card p-4 flex flex-col items-center text-center ${st.bg}`}>
            <Icon className={`h-5 w-5 ${st.text}`} />
            <span className="mt-2 text-sm font-medium text-slate-600">{d.label}</span>
            <span className="mt-1 text-2xl font-bold text-slate-900">{v}</span>
            <span className={`text-xs font-semibold ${st.text}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
