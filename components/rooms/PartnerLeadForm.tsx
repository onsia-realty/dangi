"use client";
// =====================================================================
// 파트너(임대인/중개사) 매물 자가 접수 폼 (client)
//   - 필드: 주소 / 소유자·담당자명 / 연락처 / 간단 메모
//   - 제출 → 서버액션 submitPartnerLead (service_role 로 leads INSERT)
//   - 입력 정보는 내부 검토용이며 공개 화면에 노출되지 않는다.
// =====================================================================
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { submitPartnerLead } from "@/lib/actions/partner";

// 연락처: 휴대폰(010) + 유선(02/031 등) 모두 허용
const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

type Status = "idle" | "success" | "error";

export function PartnerLeadForm() {
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contact, setContact] = useState("");
  const [memo, setMemo] = useState("");

  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function validate(): string | null {
    if (!address.trim()) return "매물 주소를 입력해 주세요.";
    if (!contact.trim()) return "연락처를 입력해 주세요.";
    if (!PHONE_RE.test(contact.trim()))
      return "연락처 형식을 확인해 주세요. (예: 010-1234-5678)";
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setStatus("error");
      setErrorMsg(err);
      return;
    }
    setStatus("idle");
    setErrorMsg("");

    startTransition(async () => {
      const res = await submitPartnerLead({
        address,
        owner_name: ownerName,
        owner_contact: contact,
        memo,
      });
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(res.error ?? "접수 중 문제가 발생했습니다.");
        return;
      }
      setStatus("success");
    });
  }

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "text-sm font-medium text-zinc-700";

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-6 w-6 text-emerald-600"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-emerald-800">
          접수가 완료되었습니다
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          온시아 담당자가 검토 후 연락드립니다. 감사합니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="flex flex-col gap-1">
        <span className={labelClass}>매물 주소 *</span>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="예: 서울 강남구 역삼동 000"
          className={fieldClass}
          required
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>소유자/담당자명</span>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="예: 홍길동 / △△공인"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>연락처 *</span>
          <input
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="010-1234-5678"
            className={fieldClass}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>간단 메모 (선택)</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="공실 현황, 희망 시점, 참고사항 등을 자유롭게 남겨 주세요."
          className={fieldClass}
        />
      </label>

      {status === "error" && errorMsg && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMsg}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "접수 중..." : "매물 접수하기"}
      </Button>

      <p className="text-center text-xs text-zinc-400">
        입력하신 정보(주소·연락처 등)는 내부 검토용으로만 사용되며, 공개 화면에
        노출되지 않습니다.
      </p>
    </form>
  );
}
