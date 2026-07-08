"use client";
// =====================================================================
// 매물 예약 블록 관리 (매물 편집 화면에 통합) — 지시서 4-C
//   - 해당 매물의 예약 목록(기간·메모·문의 연결) 표시 + 삭제
//   - 새 예약 블록 추가 폼(시작일/종료일/메모)
//   - end_date 는 "마지막 예약일 포함" 규칙(코드베이스 전역과 통일). 서버에서 겹침 검증.
// =====================================================================
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBooking, deleteBooking } from "@/lib/actions/bookings";
import type { Booking } from "@/lib/supabase/types";

export function BookingManager({
  propertyId,
  bookings,
}: {
  propertyId: string;
  bookings: Booking[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [memo, setMemo] = useState("");

  function onAdd() {
    setError("");
    if (!start || !end) {
      setError("시작일과 종료일을 입력하세요.");
      return;
    }
    startTransition(async () => {
      const res = await createBooking({
        property_id: propertyId,
        start_date: start,
        end_date: end,
        memo: memo || null,
      });
      if (!res.ok) {
        setError(res.error ?? "예약 생성 실패");
        return;
      }
      setStart("");
      setEnd("");
      setMemo("");
      router.refresh();
    });
  }

  function onDelete(id: string) {
    setError("");
    if (!window.confirm("이 예약 블록을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const res = await deleteBooking(id, propertyId);
      if (!res.ok) {
        setError(res.error ?? "삭제 실패");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">예약 블록(캘린더)</h2>
        <span className="text-xs text-zinc-400">{bookings.length}건</span>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        계약 확정 기간을 등록하면 공개 매물 상세의 입주 캘린더에 &lsquo;예약중&rsquo;으로
        표시됩니다. 종료일은 마지막 예약일(체크아웃일 포함)입니다.
      </p>

      {/* 예약 목록 */}
      {bookings.length === 0 ? (
        <div className="mb-4 rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
          등록된 예약 블록이 없습니다.
        </div>
      ) : (
        <ul className="mb-4 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {b.start_date} ~ {b.end_date}
                  {b.inquiry_id && (
                    <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      문의 연결
                    </span>
                  )}
                </p>
                {b.memo && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {b.memo}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDelete(b.id)}
                disabled={pending}
                className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 추가 폼 */}
      <div className="rounded-lg bg-zinc-50 p-4">
        <p className="mb-3 text-sm font-semibold text-zinc-800">예약 블록 추가</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-zinc-600">
            시작일
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="text-xs text-zinc-600">
            종료일(포함)
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs text-zinc-600">
          메모(선택)
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 홍길동 4주 계약"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-emerald-500 focus:outline-none"
          />
        </label>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={onAdd}
          disabled={pending}
          className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "처리 중…" : "예약 추가"}
        </button>
      </div>
    </section>
  );
}
