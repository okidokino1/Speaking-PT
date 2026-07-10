import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { features } from "@/lib/env";
import { listMembers } from "@/lib/admin";
import { AdminMembers } from "@/components/AdminMembers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = (await getSessionUser())!;
  if (!user.isAdmin) redirect("/dashboard");

  const members = await listMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">회원 관리</h1>
        <p className="mt-1 text-slate-500">
          회원의 이름·요금제·이용권·목표 점수를 조회하고 수정할 수 있습니다. (관리자 전용)
        </p>
      </div>

      <AdminMembers initialMembers={members} supabaseEnabled={features.supabase} />
    </div>
  );
}
