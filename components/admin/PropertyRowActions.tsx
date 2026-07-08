"use client";
// 매물 목록 행 액션: 공개↔숨김 토글, 삭제(확인 요구)
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteProperty,
  setPropertyStatus,
} from "@/lib/actions/properties";
import type { PropertyStatus } from "@/lib/supabase/types";

export function PropertyRowActions({
  id,
  status,
}: {
  id: string;
  status: PropertyStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onToggle() {
    setError("");
    // active → hidden, 그 외(hidden/booked) → active
    const next: PropertyStatus = status === "active" ? "hidden" : "active";
    startTransition(async () => {
      const res = await setPropertyStatus(id, next);
      if (!res.ok) setError(res.error ?? "실패");
      else router.refresh();
    });
  }

  function onDelete() {
    setError("");
    if (
      !window.confirm(
        "이 매물을 삭제하시겠습니까? 삭제 대신 '숨김'을 권장합니다. 계속하시겠습니까?",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteProperty(id);
      if (!res.ok) setError(res.error ?? "실패");
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/properties/${id}`}
        className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
      >
        {status === "active" ? "숨기기" : "공개로"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        삭제
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
