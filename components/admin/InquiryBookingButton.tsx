"use client";
// =====================================================================
// 문의 → 예약 블록 생성 버튼 (지시서 4-C 4번)
//   - 문의의 move_in(시작) + weeks*7 = 종료일(포함)로 예약 블록을 생성한다.
//   - inquiry_id 를 연결하고 memo 에 문의자명을 기입(서버 액션에서 처리).
//   - 이미 예약이 연결된 문의는 중복 생성 방지(버튼 비활성 + 표시).
//   - '계약진행'/'완료' 상태이면 버튼을 강조해 생성을 유도(자동 생성은 하지 않음).
//   - markBooked 체크 시 해당 매물을 예약완료(booked)로 전환(선택).
// =====================================================================
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBookingFromInquiry } from "@/lib/actions/bookings";
import type { InquiryStatus } from "@/lib/supabase/types";

export function InquiryBookingButton({
  inquiryId,
  propertyId,
  moveIn,
  weeks,
  name,
  status,
  alreadyBooked,
}: {
  inquiryId: string;
  propertyId: string | null;
  moveIn: string | null;
  weeks: number | null;
  name: string | null;
  status: InquiryStatus;
  alreadyBooked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [markBooked, setMarkBooked] = useState(false);

  if (alreadyBooked) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
        예약 연결됨
      </span>
    );
  }

  const missing = !propertyId || !moveIn || !weeks;
  if (missing) {
    return (
      <span
        className="text-xs text-zinc-400"
        title="예약 생성에는 연결 매물·희망 입주일·계약 주수가 필요합니다."
      >
        생성 불가
      </span>
    );
  }

  // '계약진행'/'완료' 단계면 강조
  const emphasize = status === "계약진행" || status === "완료";

  function onCreate() {
    setError("");
    startTransition(async () => {
      const res = await createBookingFromInquiry({
        inquiryId,
        propertyId: propertyId as string,
        moveIn,
        weeks,
        name,
        markBooked,
      });
      if (!res.ok) {
        setError(res.error ?? "예약 생성 실패");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onCreate}
        disabled={pending}
        className={
          emphasize
            ? "rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            : "rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        }
      >
        {pending ? "생성 중…" : "예약 블록 생성"}
      </button>
      <label className="flex items-center gap-1 text-[11px] text-zinc-500">
        <input
          type="checkbox"
          checked={markBooked}
          onChange={(e) => setMarkBooked(e.target.checked)}
          className="h-3 w-3"
        />
        매물 예약완료 처리
      </label>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}
