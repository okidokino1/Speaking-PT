import { cookies } from "next/headers";
import { features } from "./env";
import { getSupabaseServer } from "./supabase/server";
import type { Profile } from "./types";

const DEMO_COOKIE = "sp_demo_user";

// 현재 로그인 사용자(Profile) 반환. 없으면 null.
export async function getSessionUser(): Promise<Profile | null> {
  if (features.supabase) {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return {
      id: user.id,
      email: user.email || "",
      name: profile?.name || user.email?.split("@")[0] || "학습자",
      plan: profile?.plan || "free",
      credits: profile?.credits ?? 3,
      targetScore: profile?.target_score || undefined,
    };
  }
  // 데모 모드: 쿠키 기반
  const store = await cookies();
  const raw = store.get(DEMO_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      plan: parsed.plan || "free",
      credits: parsed.credits ?? 3,
      targetScore: parsed.targetScore,
    };
  } catch {
    return null;
  }
}

// 데모 로그인 쿠키 생성용 인코딩
export function encodeDemoUser(p: Profile): string {
  return Buffer.from(JSON.stringify(p), "utf8").toString("base64");
}

export const DEMO_COOKIE_NAME = DEMO_COOKIE;
