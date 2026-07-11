import crypto from "crypto";
import { env, features } from "./env";

export function generateCode(): string {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

export function normalizePhone(p: string): string {
  return (p || "").replace(/[^0-9]/g, "");
}

export function isValidKoreanMobile(p: string): boolean {
  const d = normalizePhone(p);
  return /^01[0-9]{8,9}$/.test(d);
}

// Solapi(쿨SMS) 발송. 미설정 시 false(테스트 모드).
export async function sendSms(to: string, text: string): Promise<boolean> {
  if (!features.sms) return false;
  try {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(24).toString("hex");
    const signature = crypto
      .createHmac("sha256", env.solapiApiSecret)
      .update(date + salt)
      .digest("hex");
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${env.solapiApiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: { to: normalizePhone(to), from: normalizePhone(env.solapiSender), text },
      }),
    });
    if (!res.ok) console.error("[sms] Solapi 오류:", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("[sms] 발송 실패:", e);
    return false;
  }
}
