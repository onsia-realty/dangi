"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { InquiryInsert } from "@/lib/supabase/types";
import { calcTotal, formatKRW } from "@/lib/pricing";

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url.startsWith("http") &&
      !url.includes("your-supabase-url") &&
      !key.includes("your-anon-key"),
  );
}

// 전화번호 최소 검증: 010-xxxx-xxxx / 01012345678 등 허용
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

type Status = "idle" | "submitting" | "success" | "error";

export function InquiryForm({
  propertyId,
  weeklyRent,
  deposit,
  minWeeks,
}: {
  propertyId: string;
  weeklyRent: number;
  deposit: number;
  minWeeks: number;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [weeks, setWeeks] = useState<number>(minWeeks);
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function validate(): string | null {
    if (!name.trim()) return "이름을 입력해 주세요.";
    if (!phone.trim()) return "연락처를 입력해 주세요.";
    if (!PHONE_RE.test(phone.trim()))
      return "연락처 형식을 확인해 주세요. (예: 010-1234-5678)";
    if (!moveIn) return "희망 입주일을 선택해 주세요.";
    if (!weeks || weeks < minWeeks)
      return `계약 기간은 최소 ${minWeeks}주 이상이어야 합니다.`;
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setStatus("error");
      setErrorMsg(err);
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    const payload: InquiryInsert = {
      property_id: propertyId,
      name: name.trim(),
      phone: phone.trim(),
      move_in: moveIn,
      weeks,
      message: message.trim() || null,
    };

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.from("inquiries").insert([payload]);
        if (error) throw error;
      } else {
        // 목데이터 모드: 실제 INSERT 대신 데모 성공 처리
        console.log("[dev] 문의 데모 제출(목데이터 모드):", payload);
      }
      setStatus("success");
    } catch (e) {
      console.error("문의 제출 실패:", e);
      setStatus("error");
      setErrorMsg("문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  const estimate = calcTotal(weeklyRent, weeks || minWeeks, deposit);
  const fieldClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-emerald-600" aria-hidden="true">
            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-base font-semibold text-emerald-800">문의가 접수되었습니다</p>
        <p className="mt-1 text-sm text-emerald-700">
          온시아에서 곧 연락드립니다. 감사합니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">이름 *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className={fieldClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">연락처 *</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className={fieldClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">희망 입주일 *</span>
          <input
            type="date"
            value={moveIn}
            onChange={(e) => setMoveIn(e.target.value)}
            className={fieldClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">
            계약 기간(주) * · 최소 {minWeeks}주
          </span>
          <input
            type="number"
            min={minWeeks}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className={fieldClass}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">메시지 (선택)</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="문의 사항을 자유롭게 남겨 주세요."
          className={fieldClass}
        />
      </label>

      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
        <span className="text-zinc-600">{weeks || minWeeks}주 예약 예상액(보증금 포함)</span>
        <span className="font-semibold text-zinc-900">{formatKRW(estimate)}</span>
      </div>

      {status === "error" && errorMsg && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>
      )}

      <Button type="submit" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "접수 중..." : "계약 문의하기"}
      </Button>
      <p className="text-center text-xs text-zinc-400">
        온라인 결제 없이 접수됩니다. 접수 후 온시아가 상담을 진행합니다.
      </p>
    </form>
  );
}
