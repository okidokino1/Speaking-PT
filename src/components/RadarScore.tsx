"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export function RadarScore({ data }: { data: { dim: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: "#475569" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} />
        <Radar dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
