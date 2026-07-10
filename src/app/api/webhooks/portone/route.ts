import { NextResponse } from "next/server";
import { env, features } from "@/lib/env";
import { getOrder, markOrderPaid } from "@/lib/payments";

// PortOne 결제 완료 웹훅. 실서비스에서는 서명 검증 후 주문을 확정 처리한다.
export async function POST(req: Request) {
  const body = await req.text();
  let payload: { paymentId?: string; data?: { paymentId?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentId = payload?.paymentId || payload?.data?.paymentId;
  if (!paymentId) return NextResponse.json({ ok: false }, { status: 400 });

  if (features.portone) {
    try {
      const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `PortOne ${env.portoneApiSecret}` },
      });
      const payment = await res.json();
      // paymentId === orderId (prepare 단계에서 orderId를 paymentId로 사용)
      const order = getOrder(paymentId);
      if (order && payment?.status === "PAID" && payment?.amount?.total === order.amount) {
        markOrderPaid(order.orderId);
      }
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
