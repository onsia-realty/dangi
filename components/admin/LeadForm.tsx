"use client";
// =====================================================================
// 리드 등록/수정 폼 (client)
//   - 필드: address, owner_name, owner_contact, source_memo(내부 전용),
//           stage, proposed_at, agreed_at, agree_memo, assignee
//   - source_memo 는 내부 전용 — admin 화면에서만 편집/표시된다.
// =====================================================================
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  createLead,
  updateLead,
  type LeadFormValues,
} from "@/lib/actions/leads";
import { LEAD_STAGES } from "@/lib/constants";
import type { Lead, LeadStage } from "@/lib/supabase/types";

export function LeadForm({
  mode,
  lead,
}: {
  mode: "create" | "edit";
  lead?: Lead;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState("");

  const [address, setAddress] = useState(lead?.address ?? "");
  const [ownerName, setOwnerName] = useState(lead?.owner_name ?? "");
  const [ownerContact, setOwnerContact] = useState(lead?.owner_contact ?? "");
  const [sourceMemo, setSourceMemo] = useState(lead?.source_memo ?? "");
  const [stage, setStage] = useState<LeadStage>(lead?.stage ?? "발굴");
  const [proposedAt, setProposedAt] = useState(lead?.proposed_at ?? "");
  const [agreedAt, setAgreedAt] = useState(lead?.agreed_at ?? "");
  const [agreeMemo, setAgreeMemo] = useState(lead?.agree_memo ?? "");
  const [assignee, setAssignee] = useState(lead?.assignee ?? "");

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "text-sm font-medium text-zinc-700";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!address.trim()) {
      setError("매물 주소를 입력해 주세요.");
      return;
    }

    const values: LeadFormValues = {
      address,
      owner_name: ownerName,
      owner_contact: ownerContact,
      source_memo: sourceMemo,
      stage,
      proposed_at: proposedAt || null,
      agreed_at: agreedAt || null,
      agree_memo: agreeMemo,
      assignee,
    };

    startSaving(async () => {
      const res =
        mode === "edit" && lead
          ? await updateLead(lead.id, values)
          : await createLead(values);
      if (!res.ok) {
        setError(res.error ?? "저장에 실패했습니다.");
        return;
      }
      router.push("/admin/leads");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-4">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>매물 주소 *</span>
          <input
            className={fieldClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예: 서울 강남구 역삼동 000"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>소유자/담당 중개사</span>
            <input
              className={fieldClass}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="예: 홍길동 / △△공인"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>연락처</span>
            <input
              className={fieldClass}
              value={ownerContact}
              onChange={(e) => setOwnerContact(e.target.value)}
              placeholder="010-0000-0000"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            출처/경위 메모 (내부 전용 · 공개 안 됨)
          </span>
          <textarea
            className={fieldClass}
            rows={3}
            value={sourceMemo}
            onChange={(e) => setSourceMemo(e.target.value)}
            placeholder="공실 발굴 경위, 채널, 참고사항 등"
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>단계(stage)</span>
            <select
              className={fieldClass}
              value={stage}
              onChange={(e) => setStage(e.target.value as LeadStage)}
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>제안일</span>
            <input
              type="date"
              className={fieldClass}
              value={proposedAt}
              onChange={(e) => setProposedAt(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>동의일</span>
            <input
              type="date"
              className={fieldClass}
              value={agreedAt}
              onChange={(e) => setAgreedAt(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>담당자</span>
            <input
              className={fieldClass}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="온시아 담당자명"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>동의 방식 메모</span>
            <input
              className={fieldClass}
              value={agreeMemo}
              onChange={(e) => setAgreeMemo(e.target.value)}
              placeholder="예: 전화 구두 동의, 문자 확인 등"
            />
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "저장 중..." : mode === "edit" ? "수정 저장" : "리드 등록"}
        </Button>
        <button
          type="button"
          onClick={() => router.push("/admin/leads")}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          취소
        </button>
      </div>
    </form>
  );
}
