import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, encodeDemoUser, DEMO_COOKIE_NAME } from "@/lib/auth";
import { env, features } from "@/lib/env";
import { getPlan } from "@/lib/plans";
import { getOrder, markOrderPaid, applyBenefits } from "@/lib/payments";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { orderId, paymentId, demo } = await req.json();
  const order = getOrder(orderId);
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "유효하지 않은 주문입니다." }, { status: 400 });
  }
  const plan = getPlan(order.planId)!;

  // 실 결제: PortOne 서버 검증
  if (features.portone && !demo) {
    try {
      const verify = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `PortOne ${env.portoneApiSecret}` },
      });
      const payment = await verify.json();
      const paidAmount = payment?.amount?.total;
      const status = payment?.status;
      if (status !== "PAID" || paidAmount !== order.amount) {
        return NextResponse.json({ error: "결제 검증에 실패했습니다." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "결제 검증 중 오류가 발생했습니다." }, { status: 500 });
    }
  }

  markOrderPaid(orderId);
  const updated = applyBenefits(user, plan);

  // 혜택 반영
  if (features.supabase) {
    const supabase = await getSupabaseServer();
    await supabase
      .from("profiles")
      .update({ plan: updated.plan, credits: updated.credits })
      .eq("id", user.id);
    await supabase.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      amount: order.amount,
      status: "paid",
      provider: features.portone && !demo ? "portone" : "demo",
    });
  } else {
    const store = await cookies();
    store.set(DEMO_COOKIE_NAME, encodeDemoUser(updated), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return NextResponse.json({ ok: true, plan: updated.plan, credits: updated.credits });
}
