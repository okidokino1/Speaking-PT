import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listMembers, updateMember, type MemberPatch } from "@/lib/admin";

export const runtime = "nodejs";

// 관리자 전용: 회원 목록 조회
export async function GET() {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const members = await listMembers();
  return NextResponse.json({ members });
}

// 관리자 전용: 회원 정보 수정
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = (await req.json()) as { id?: string } & MemberPatch;
  if (!body?.id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }
  const ok = await updateMember(body.id, {
    name: body.name,
    plan: body.plan,
    credits: body.credits,
    targetScore: body.targetScore,
  });
  if (!ok) {
    return NextResponse.json(
      { error: "수정에 실패했습니다. (Supabase 연결이 필요합니다)" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
