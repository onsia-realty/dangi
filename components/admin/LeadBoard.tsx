"use client";
// =====================================================================
// 리드 칸반 보드 (client)
//   - 컬럼 = LEAD_STAGES (발굴/제안발송/협의중/동의완료/등록완료/거절)
//   - stage 이동: 카드의 select 드롭다운으로 변경(updateLeadStage)
//   - '동의완료' 리드에만 "매물로 전환" 버튼 노출 → convertLeadToProperty
//   - source_memo 는 내부 전용이므로 카드에 요약만(전체는 수정 화면)
// =====================================================================
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  convertLeadToProperty,
  deleteLead,
  updateLeadStage,
} from "@/lib/actions/leads";
import { LEAD_STAGES, LEAD_CONVERTIBLE_STAGE } from "@/lib/constants";
import type { Lead, LeadStage } from "@/lib/supabase/types";

export function LeadBoard({ leads }: { leads: Lead[] }) {
  const grouped = LEAD_STAGES.map((stage) => ({
    stage,
    items: leads.filter((l) => l.stage === stage),
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {grouped.map(({ stage, items }) => (
        <div
          key={stage}
          className="flex w-64 shrink-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
            <span className="text-sm font-semibold text-zinc-700">{stage}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-500">
              {items.length}
            </span>
          </div>
          <div className="flex flex-col gap-2 p-2">
            {items.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-zinc-400">
                리드 없음
              </p>
            ) : (
              items.map((lead) => <LeadCard key={lead.id} lead={lead} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onChangeStage(next: LeadStage) {
    if (next === lead.stage) return;
    setError("");
    startTransition(async () => {
      const res = await updateLeadStage(lead.id, next);
      if (!res.ok) setError(res.error ?? "실패");
      else router.refresh();
    });
  }

  function onConvert() {
    setError("");
    if (
      !window.confirm(
        "이 리드를 매물로 전환합니다. 매물(비공개)이 생성되고 리드는 '등록완료'로 변경됩니다. 계속하시겠습니까?",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await convertLeadToProperty(lead.id);
      if (!res.ok || !res.id) {
        setError(res.error ?? "전환 실패");
        return;
      }
      // 생성된 매물 편집 화면으로 이동(나머지 요금·사진 입력)
      router.push(`/admin/properties/${res.id}`);
    });
  }

  function onDelete() {
    setError("");
    if (!window.confirm("이 리드를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const res = await deleteLead(lead.id);
      if (!res.ok) setError(res.error ?? "실패");
      else router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-zinc-900">
        {lead.address ?? "주소 미입력"}
      </p>
      <div className="mt-1 space-y-0.5 text-xs text-zinc-500">
        {lead.owner_name && <p>소유자: {lead.owner_name}</p>}
        {lead.owner_contact && <p>연락처: {lead.owner_contact}</p>}
        {lead.assignee && <p>담당: {lead.assignee}</p>}
        {lead.proposed_at && <p>제안일: {lead.proposed_at}</p>}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        <select
          value={lead.stage}
          onChange={(e) => onChangeStage(e.target.value as LeadStage)}
          disabled={pending}
          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        >
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {lead.stage === LEAD_CONVERTIBLE_STAGE && (
          <button
            type="button"
            onClick={onConvert}
            disabled={pending}
            className="w-full rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            매물로 전환
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/leads/${lead.id}`}
            className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            수정
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
