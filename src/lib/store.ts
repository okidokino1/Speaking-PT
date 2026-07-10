import { randomUUID } from "crypto";
import { features } from "./env";
import { DIMENSIONS, toNativeScore, type DimensionKey, type ExamType } from "./exams";
import { getSupabaseServer } from "./supabase/server";
import type { AttemptRecord, ScoreResult } from "./types";

// ---------------------------------------------------------------------------
// 데모 인메모리 저장소 (dev 서버 수명 동안 유지). Supabase 미설정 시 사용.
// ---------------------------------------------------------------------------
const g = globalThis as unknown as { __demoStore?: Map<string, AttemptRecord[]> };
if (!g.__demoStore) g.__demoStore = new Map();
const demoStore = g.__demoStore;

function seedDemo(userId: string): AttemptRecord[] {
  const base = [
    { d: 12, o: 60, dims: [72, 55, 62, 55, 58] },
    { d: 9, o: 63, dims: [73, 58, 66, 60, 62] },
    { d: 6, o: 66, dims: [74, 62, 68, 63, 66] },
    { d: 3, o: 71, dims: [77, 66, 72, 66, 71] },
    { d: 1, o: 74, dims: [79, 69, 74, 69, 74] },
  ];
  const records: AttemptRecord[] = base.map((b, i) => {
    const created = new Date();
    created.setDate(created.getDate() - b.d);
    const dims = Object.fromEntries(
      DIMENSIONS.map((dim, idx) => [dim.key, b.dims[idx]])
    ) as Record<DimensionKey, number>;
    const native = toNativeScore("ielts", b.o);
    const result: ScoreResult = {
      examType: "ielts",
      overall: b.o,
      dimensions: DIMENSIONS.map((dim, idx) => ({ key: dim.key, score: b.dims[idx], comment: "" })),
      perQuestion: [],
      summary: "이전 회차 요약 (데모 데이터).",
      nextSteps: [],
      engine: "demo",
    };
    return {
      id: `seed-${i}`,
      userId,
      examType: "ielts",
      createdAt: created.toISOString(),
      overall: b.o,
      dimensions: dims,
      nativeHeadline: native.headline,
      nativeLevel: native.level,
      result,
    };
  });
  return records;
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------
export async function listAttempts(userId: string): Promise<AttemptRecord[]> {
  if (features.supabase) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from("attempts")
      .select("id, user_id, exam_type, created_at, scores(overall, dimensions, native_headline, native_level, result)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data || []).map(mapRow);
  }
  if (!demoStore.has(userId)) demoStore.set(userId, seedDemo(userId));
  return [...demoStore.get(userId)!].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

export async function getAttempt(
  userId: string,
  id: string
): Promise<AttemptRecord | null> {
  const all = await listAttempts(userId);
  return all.find((a) => a.id === id) || null;
}

export async function saveAttempt(
  userId: string,
  examType: ExamType,
  result: ScoreResult
): Promise<AttemptRecord> {
  const dims = Object.fromEntries(
    result.dimensions.map((d) => [d.key, d.score])
  ) as Record<DimensionKey, number>;
  const native = toNativeScore(examType, result.overall);
  const record: AttemptRecord = {
    id: cryptoId(),
    userId,
    examType,
    createdAt: new Date().toISOString(),
    overall: result.overall,
    dimensions: dims,
    nativeHeadline: native.headline,
    nativeLevel: native.level,
    result,
  };

  if (features.supabase) {
    const supabase = await getSupabaseServer();
    const { data: att } = await supabase
      .from("attempts")
      .insert({ user_id: userId, exam_type: examType })
      .select("id, created_at")
      .single();
    if (att) {
      record.id = att.id;
      record.createdAt = att.created_at;
      await supabase.from("scores").insert({
        attempt_id: att.id,
        pronunciation: dims.pronunciation,
        fluency: dims.fluency,
        vocabulary: dims.vocabulary,
        grammar: dims.grammar,
        logic: dims.logic,
        overall: result.overall,
        native_headline: native.headline,
        native_level: native.level,
        dimensions: dims,
        result,
      });
    }
    return record;
  }

  if (!demoStore.has(userId)) demoStore.set(userId, seedDemo(userId));
  demoStore.get(userId)!.push(record);
  return record;
}

// Supabase row → AttemptRecord
function mapRow(row: Record<string, unknown>): AttemptRecord {
  const scoreRow = Array.isArray(row.scores) ? (row.scores[0] as Record<string, unknown>) : (row.scores as Record<string, unknown>);
  const result = (scoreRow?.result as ScoreResult) || ({} as ScoreResult);
  return {
    id: row.id as string,
    userId: row.user_id as string,
    examType: row.exam_type as ExamType,
    createdAt: row.created_at as string,
    overall: (scoreRow?.overall as number) ?? result.overall ?? 0,
    dimensions: (scoreRow?.dimensions as Record<DimensionKey, number>) || ({} as Record<DimensionKey, number>),
    nativeHeadline: (scoreRow?.native_headline as string) || "",
    nativeLevel: (scoreRow?.native_level as string) || "",
    result,
  };
}

function cryptoId(): string {
  return randomUUID();
}
