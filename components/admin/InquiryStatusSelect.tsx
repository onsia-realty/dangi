"use client";
// 문의 상태 즉시 변경 드롭다운 (신규/연락완료/계약진행/완료/취소)
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setInquiryStatus } from "@/lib/actions/inquiries";
import { INQUIRY_STATUSES } from "@/lib/constants";
import type { InquiryStatus } from "@/lib/supabase/types";

export function InquiryStatusSelect({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onChange(next: InquiryStatus) {
    if (next === status) return;
    setError("");
    startTransition(async () => {
      const res = await setInquiryStatus(id, next);
      if (!res.ok) setError(res.error ?? "실패");
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as InquiryStatus)}
        disabled={pending}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
      >
        {INQUIRY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
