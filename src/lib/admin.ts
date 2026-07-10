import { features } from "./env";
import { getSupabaseAdmin } from "./supabase/server";

export interface MemberRow {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  credits: number;
  targetScore: string | null;
  createdAt: string | null;
}

// 전체 회원 목록 (관리자용). Supabase 미설정 시 빈 배열.
export async function listMembers(): Promise<MemberRow[]> {
  if (!features.supabase) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, plan, credits, target_score, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    email: (r.email as string) || "",
    name: (r.name as string) || "",
    plan: ((r.plan as string) || "free") as "free" | "pro",
    credits: (r.credits as number) ?? 0,
    targetScore: (r.target_score as string) || null,
    createdAt: (r.created_at as string) || null,
  }));
}

export interface MemberPatch {
  name?: string;
  plan?: "free" | "pro";
  credits?: number;
  targetScore?: string;
}

export async function updateMember(id: string, patch: MemberPatch): Promise<boolean> {
  if (!features.supabase) return false;
  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.plan !== undefined) update.plan = patch.plan;
  if (patch.credits !== undefined) update.credits = patch.credits;
  if (patch.targetScore !== undefined) update.target_score = patch.targetScore;
  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  return !error;
}
