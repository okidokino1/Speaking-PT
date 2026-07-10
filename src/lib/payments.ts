import { randomUUID } from "crypto";
import type { Plan } from "./plans";
import type { Profile } from "./types";

export interface Order {
  orderId: string;
  userId: string;
  planId: string;
  amount: number;
  status: "ready" | "paid" | "failed";
  createdAt: number;
}

const g = globalThis as unknown as { __orders?: Map<string, Order> };
if (!g.__orders) g.__orders = new Map();
const orders = g.__orders;

export function createOrder(userId: string, plan: Plan): Order {
  const order: Order = {
    orderId: "order_" + randomUUID(),
    userId,
    planId: plan.id,
    amount: plan.price,
    status: "ready",
    createdAt: Date.now(),
  };
  orders.set(order.orderId, order);
  return order;
}

export function getOrder(orderId: string): Order | undefined {
  return orders.get(orderId);
}

export function markOrderPaid(orderId: string) {
  const o = orders.get(orderId);
  if (o) o.status = "paid";
}

// 결제 성공 시 사용자 혜택 적용 (Profile 갱신값 반환)
export function applyBenefits(user: Profile, plan: Plan): Profile {
  if (plan.kind === "subscription") {
    return { ...user, plan: "pro" };
  }
  if (plan.kind === "credit") {
    return { ...user, credits: (user.credits ?? 0) + plan.credits };
  }
  return user;
}
