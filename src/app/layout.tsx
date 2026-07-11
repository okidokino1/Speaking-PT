import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speaking PT · 영어 스피킹 자동채점 플랫폼",
  description:
    "IELTS · TOEFL · TOEIC · OPIc 스피킹을 AI가 출제·채점·첨삭·피드백까지. 실전과 동일한 시간으로 응시하고 즉시 결과를 받으세요.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
