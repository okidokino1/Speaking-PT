import { scoreLabel } from "@/lib/exams";

const TONE: Record<string, string> = {
  great: "#4f46e5",
  good: "#10b981",
  fair: "#f59e0b",
  weak: "#ef4444",
};

export function ScoreRing({
  value,
  headline,
  sub,
  size = 176,
}: {
  value: number; // 0-100
  headline?: string; // 중앙 큰 글씨 (기본: 0-100)
  sub?: string;
  size?: number;
}) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const { label, tone } = scoreLabel(value);
  const color = TONE[tone];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={12} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium text-slate-400">{sub || "Overall"}</span>
        <span className="text-3xl font-bold text-slate-900">{headline ?? value}</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
