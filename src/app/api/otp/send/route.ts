import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { features } from "@/lib/env";
import { generateCode, isValidKoreanMobile, normalizePhone, sendSms } from "@/lib/sms";

export const runtime = "nodejs";

const OTP_COOKIE = "sp_otp";

// 휴대폰 인증번호 발송
export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!isValidKoreanMobile(phone)) {
    return NextResponse.json({ error: "올바른 휴대폰 번호를 입력해 주세요." }, { status: 400 });
  }
  const p = normalizePhone(phone);
  const code = generateCode();
  const exp = Date.now() + 3 * 60 * 1000; // 3분

  const store = await cookies();
  store.set(OTP_COOKIE, Buffer.from(JSON.stringify({ p, code, exp })).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 200,
  });

  const text = `[Speaking PT] 인증번호 [${code}]를 입력해 주세요.`;
  const sent = await sendSms(p, text);

  // 실제 SMS 발송 시엔 코드를 반환하지 않음. 테스트 모드(미설정)에서만 화면 표시용으로 반환.
  return NextResponse.json({
    ok: true,
    mode: sent ? "sms" : "test",
    devCode: sent || features.sms ? undefined : code,
  });
}
