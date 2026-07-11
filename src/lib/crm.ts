import { env, features } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import type { Profile, Role } from "./types";

const hasAdmin = () => features.supabase && !!env.supabaseServiceKey;

// ---- 타입 ----
export interface OrgRow {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  memo: string | null;
  createdAt: string | null;
  memberCount?: number;
}

export interface MemberRow {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  credits: number;
  role: Role;
  status: string;
  tags: string[];
  memo: string | null;
  targetScore: string | null;
  orgId: string | null;
  orgName: string | null;
  createdAt: string | null;
  attemptCount: number;
  avgScore: number;
  totalSpend: number;
  lastActive: string | null;
}

export interface PaymentRow {
  userId: string;
  userName: string;
  amount: number;
  provider: string | null;
  paidAt: string | null;
}

export interface Kpis {
  totalMembers: number;
  paidMembers: number;
  conversionRate: number; // %
  totalRevenue: number;
  totalAttempts: number;
  avgScore: number;
  newMembers7d: number;
  revenue7d: number;
  trend: { date: string; signups: number; revenue: number }[]; // 최근 14일
}

// ---- 내부: 뷰어 범위로 데이터 로드 ----
type Viewer = Pick<Profile, "role" | "orgId" | "isAdmin">;

async function loadScoped(viewer: Viewer) {
  const sb = getSupabaseAdmin();
  const orgScope = viewer.role === "org_admin" ? viewer.orgId : null;

  let pq = sb
    .from("profiles")
    .select("id,email,name,plan,credits,target_score,created_at,org_id,role,memo,tags,status")
    .order("created_at", { ascending: false });
  if (orgScope) pq = pq.eq("org_id", orgScope);
  const { data: profiles } = await pq;
  const profs = profiles || [];
  const ids = profs.map((p: Record<string, unknown>) => p.id as string);
  const inIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];

  const { data: attempts } = await sb
    .from("attempts")
    .select("user_id,created_at,scores(overall)")
    .in("user_id", inIds);
  const { data: payments } = await sb
    .from("payments")
    .select("user_id,amount,status,provider,paid_at")
    .eq("status", "paid")
    .in("user_id", inIds);
  const { data: orgs } = await sb.from("organizations").select("id,name");

  return {
    profs,
    attempts: attempts || [],
    payments: payments || [],
    orgMap: new Map((orgs || []).map((o: Record<string, unknown>) => [o.id as string, o.name as string])),
  };
}

// ---- KPI ----
export async function getKpis(viewer: Viewer): Promise<Kpis> {
  const empty: Kpis = {
    totalMembers: 0, paidMembers: 0, conversionRate: 0, totalRevenue: 0,
    totalAttempts: 0, avgScore: 0, newMembers7d: 0, revenue7d: 0, trend: [],
  };
  if (!hasAdmin()) return empty;
  const { profs, attempts, payments } = await loadScoped(viewer);

  const totalMembers = profs.length;
  const paidUserIds = new Set(payments.map((p: Record<string, unknown>) => p.user_id as string));
  const paidMembers = paidUserIds.size;
  const totalRevenue = payments.reduce((s: number, p: Record<string, unknown>) => s + ((p.amount as number) || 0), 0);
  const totalAttempts = attempts.length;
  const overalls = attempts
    .map((a: Record<string, unknown>) => {
      const sc = Array.isArray(a.scores) ? a.scores[0] : a.scores;
      return (sc as Record<string, unknown>)?.overall as number;
    })
    .filter((v): v is number => typeof v === "number");
  const avgScore = overalls.length ? Math.round(overalls.reduce((s, v) => s + v, 0) / overalls.length) : 0;

  const now = Date.now();
  const day = 86400000;
  const newMembers7d = profs.filter((p: Record<string, unknown>) => now - +new Date(p.created_at as string) < 7 * day).length;
  const revenue7d = payments
    .filter((p: Record<string, unknown>) => p.paid_at && now - +new Date(p.paid_at as string) < 7 * day)
    .reduce((s: number, p: Record<string, unknown>) => s + ((p.amount as number) || 0), 0);

  // 최근 14일 추이
  const trend: Kpis["trend"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * day);
    const key = d.toISOString().slice(0, 10);
    const signups = profs.filter((p: Record<string, unknown>) => (p.created_at as string)?.slice(0, 10) === key).length;
    const revenue = payments
      .filter((p: Record<string, unknown>) => (p.paid_at as string)?.slice(0, 10) === key)
      .reduce((s: number, p: Record<string, unknown>) => s + ((p.amount as number) || 0), 0);
    trend.push({ date: key.slice(5), signups, revenue });
  }

  return {
    totalMembers,
    paidMembers,
    conversionRate: totalMembers ? Math.round((paidMembers / totalMembers) * 100) : 0,
    totalRevenue,
    totalAttempts,
    avgScore,
    newMembers7d,
    revenue7d,
    trend,
  };
}

// ---- 회원 목록 (enriched) ----
export async function listMembers(viewer: Viewer): Promise<MemberRow[]> {
  if (!hasAdmin()) return [];
  const { profs, attempts, payments, orgMap } = await loadScoped(viewer);

  const byUser = <T,>(rows: Record<string, unknown>[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) {
      const k = r.user_id as string;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r as T);
    }
    return m;
  };
  const attByUser = byUser<Record<string, unknown>>(attempts);
  const payByUser = byUser<Record<string, unknown>>(payments);

  return profs.map((p: Record<string, unknown>) => {
    const uid = p.id as string;
    const atts = attByUser.get(uid) || [];
    const pays = payByUser.get(uid) || [];
    const overalls = atts
      .map((a) => {
        const sc = Array.isArray(a.scores) ? a.scores[0] : a.scores;
        return (sc as Record<string, unknown>)?.overall as number;
      })
      .filter((v): v is number => typeof v === "number");
    const lastActive = atts
      .map((a) => a.created_at as string)
      .sort()
      .slice(-1)[0] || null;
    return {
      id: uid,
      email: (p.email as string) || "",
      name: (p.name as string) || "",
      plan: ((p.plan as string) || "free") as "free" | "pro",
      credits: (p.credits as number) ?? 0,
      role: ((p.role as string) || "member") as Role,
      status: (p.status as string) || "active",
      tags: (p.tags as string[]) || [],
      memo: (p.memo as string) || null,
      targetScore: (p.target_score as string) || null,
      orgId: (p.org_id as string) || null,
      orgName: p.org_id ? orgMap.get(p.org_id as string) || null : null,
      createdAt: (p.created_at as string) || null,
      attemptCount: atts.length,
      avgScore: overalls.length ? Math.round(overalls.reduce((s, v) => s + v, 0) / overalls.length) : 0,
      totalSpend: pays.reduce((s, x) => s + ((x.amount as number) || 0), 0),
      lastActive,
    };
  });
}

// ---- 회원 상세 (응시·결제 이력 포함) ----
export interface MemberDetail extends MemberRow {
  attempts: { id: string; examType: string; overall: number; createdAt: string }[];
  payments: { amount: number; provider: string | null; paidAt: string | null }[];
}

export async function getMember(viewer: Viewer, id: string): Promise<MemberDetail | null> {
  if (!hasAdmin()) return null;
  const members = await listMembers(viewer);
  const base = members.find((m) => m.id === id);
  if (!base) return null; // 범위 밖이면 접근 불가

  const sb = getSupabaseAdmin();
  const { data: atts } = await sb
    .from("attempts")
    .select("id,exam_type,created_at,scores(overall)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  const { data: pays } = await sb
    .from("payments")
    .select("amount,provider,paid_at,status")
    .eq("user_id", id)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  return {
    ...base,
    attempts: (atts || []).map((a: Record<string, unknown>) => {
      const sc = Array.isArray(a.scores) ? a.scores[0] : a.scores;
      return {
        id: a.id as string,
        examType: a.exam_type as string,
        overall: ((sc as Record<string, unknown>)?.overall as number) ?? 0,
        createdAt: a.created_at as string,
      };
    }),
    payments: (pays || []).map((p: Record<string, unknown>) => ({
      amount: (p.amount as number) || 0,
      provider: (p.provider as string) || null,
      paidAt: (p.paid_at as string) || null,
    })),
  };
}

// ---- 회원 수정 ----
export interface MemberPatch {
  name?: string;
  plan?: "free" | "pro";
  credits?: number;
  status?: string;
  memo?: string;
  tags?: string[];
  orgId?: string | null;
  role?: Role;
}

export async function updateMember(viewer: Viewer, id: string, patch: MemberPatch): Promise<boolean> {
  if (!hasAdmin()) return false;
  // 범위 검사: 기관 관리자는 자기 조직 회원만
  const members = await listMembers(viewer);
  if (!members.find((m) => m.id === id)) return false;
  // 기관 관리자는 role/org 변경 불가 (플랫폼 관리자만)
  const isPlatform = viewer.isAdmin || viewer.role === "admin";

  const sb = getSupabaseAdmin();
  const u: Record<string, unknown> = {};
  if (patch.name !== undefined) u.name = patch.name;
  if (patch.plan !== undefined) u.plan = patch.plan;
  if (patch.credits !== undefined) u.credits = patch.credits;
  if (patch.status !== undefined) u.status = patch.status;
  if (patch.memo !== undefined) u.memo = patch.memo;
  if (patch.tags !== undefined) u.tags = patch.tags;
  if (isPlatform && patch.orgId !== undefined) u.org_id = patch.orgId;
  if (isPlatform && patch.role !== undefined) u.role = patch.role;
  const { error } = await sb.from("profiles").update(u).eq("id", id);
  return !error;
}

// ---- 기관 ----
export async function listOrganizations(viewer: Viewer): Promise<OrgRow[]> {
  if (!hasAdmin()) return [];
  const sb = getSupabaseAdmin();
  let q = sb.from("organizations").select("id,name,contact_email,contact_phone,memo,created_at").order("created_at", { ascending: false });
  if (viewer.role === "org_admin" && viewer.orgId) q = q.eq("id", viewer.orgId);
  const { data } = await q;
  const orgs = data || [];
  // 회원 수
  const { data: profs } = await sb.from("profiles").select("org_id");
  const counts = new Map<string, number>();
  for (const p of profs || []) {
    const oid = (p as Record<string, unknown>).org_id as string;
    if (oid) counts.set(oid, (counts.get(oid) || 0) + 1);
  }
  return orgs.map((o: Record<string, unknown>) => ({
    id: o.id as string,
    name: o.name as string,
    contactEmail: (o.contact_email as string) || null,
    contactPhone: (o.contact_phone as string) || null,
    memo: (o.memo as string) || null,
    createdAt: (o.created_at as string) || null,
    memberCount: counts.get(o.id as string) || 0,
  }));
}

export async function createOrganization(
  viewer: Viewer,
  data: { name: string; contactEmail?: string; contactPhone?: string; memo?: string }
): Promise<string | null> {
  if (!hasAdmin() || !(viewer.isAdmin || viewer.role === "admin")) return null; // 플랫폼 관리자만
  const sb = getSupabaseAdmin();
  const { data: row, error } = await sb
    .from("organizations")
    .insert({
      name: data.name,
      contact_email: data.contactEmail || null,
      contact_phone: data.contactPhone || null,
      memo: data.memo || null,
    })
    .select("id")
    .single();
  if (error || !row) return null;
  return row.id as string;
}

export async function updateOrganization(
  viewer: Viewer,
  id: string,
  patch: { name?: string; contactEmail?: string; contactPhone?: string; memo?: string }
): Promise<boolean> {
  if (!hasAdmin()) return false;
  if (viewer.role === "org_admin" && viewer.orgId !== id) return false;
  const sb = getSupabaseAdmin();
  const u: Record<string, unknown> = {};
  if (patch.name !== undefined) u.name = patch.name;
  if (patch.contactEmail !== undefined) u.contact_email = patch.contactEmail;
  if (patch.contactPhone !== undefined) u.contact_phone = patch.contactPhone;
  if (patch.memo !== undefined) u.memo = patch.memo;
  const { error } = await sb.from("organizations").update(u).eq("id", id);
  return !error;
}

// 회원을 기관 관리자로 지정 (플랫폼 관리자만)
export async function setOrgAdmin(viewer: Viewer, userId: string, orgId: string | null): Promise<boolean> {
  if (!hasAdmin() || !(viewer.isAdmin || viewer.role === "admin")) return false;
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("profiles")
    .update({ role: orgId ? "org_admin" : "member", org_id: orgId })
    .eq("id", userId);
  return !error;
}

// ---- 매출/결제 ----
export async function listPayments(viewer: Viewer): Promise<PaymentRow[]> {
  if (!hasAdmin()) return [];
  const { profs, payments } = await loadScoped(viewer);
  const nameMap = new Map(profs.map((p: Record<string, unknown>) => [p.id as string, (p.name as string) || (p.email as string)]));
  return payments
    .map((p: Record<string, unknown>) => ({
      userId: p.user_id as string,
      userName: nameMap.get(p.user_id as string) || "(알 수 없음)",
      amount: (p.amount as number) || 0,
      provider: (p.provider as string) || null,
      paidAt: (p.paid_at as string) || null,
    }))
    .sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""));
}
