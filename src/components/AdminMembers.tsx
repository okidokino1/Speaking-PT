"use client";

import { useState } from "react";
import { Loader2, Save, Check, ShieldAlert } from "lucide-react";
import type { MemberRow } from "@/lib/admin";

export function AdminMembers({
  initialMembers,
  supabaseEnabled,
}: {
  initialMembers: MemberRow[];
  supabaseEnabled: boolean;
}) {
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  function patchLocal(id: string, patch: Partial<MemberRow>) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function save(m: MemberRow) {
    setSavingId(m.id);
    setSavedId(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: m.id,
          name: m.name,
          plan: m.plan,
          credits: m.credits,
          targetScore: m.targetScore ?? "",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "수정 실패");
      }
      setSavedId(m.id);
      setTimeout(() => setSavedId(null), 1800);
    } catch (e) {
      alert(e instanceof Error ? e.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  if (!supabaseEnabled) {
    return (
      <div className="card p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />
        <p className="mt-3 font-semibold text-slate-800">회원 관리는 Supabase 연결 후 활성화됩니다.</p>
        <p className="mt-1 text-sm text-slate-500">
          현재는 데모 모드라 전체 회원 목록이 없습니다. Supabase 키를 등록하면
          <br />
          가입한 모든 회원의 요금제·이용권·정보를 여기서 조회·수정할 수 있습니다.
        </p>
      </div>
    );
  }

  const filtered = members.filter(
    (m) =>
      !query ||
      m.email.toLowerCase().includes(query.toLowerCase()) ||
      (m.name || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        className="input max-w-sm"
        placeholder="이메일 또는 이름으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">요금제</th>
              <th className="px-4 py-3 font-medium">이용권</th>
              <th className="px-4 py-3 font-medium">목표</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 align-middle">
                <td className="px-4 py-2.5 text-slate-700">{m.email}</td>
                <td className="px-4 py-2.5">
                  <input
                    className="input py-1.5"
                    value={m.name}
                    onChange={(e) => patchLocal(m.id, { name: e.target.value })}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <select
                    className="input py-1.5"
                    value={m.plan}
                    onChange={(e) => patchLocal(m.id, { plan: e.target.value as "free" | "pro" })}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    className="input w-24 py-1.5"
                    value={m.credits}
                    onChange={(e) => patchLocal(m.id, { credits: Number(e.target.value) })}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    className="input w-24 py-1.5"
                    value={m.targetScore ?? ""}
                    placeholder="예: 7.0"
                    onChange={(e) => patchLocal(m.id, { targetScore: e.target.value })}
                  />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => save(m)}
                    disabled={savingId === m.id}
                    className="btn-primary px-3 py-1.5"
                  >
                    {savingId === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : savedId === m.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    저장
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
