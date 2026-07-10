import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { createOrder } from "@/lib/payments";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { planId } = await req.json();
  const plan = getPlan(planId);
  if (!plan || plan.kind === "free") {
    return NextResponse.json({ error: "잘못된 요금제입니다." }, { status: 400 });
  }

  const order = createOrder(user.id, plan);
  return NextResponse.json({ orderId: order.orderId, amount: order.amount });
}
