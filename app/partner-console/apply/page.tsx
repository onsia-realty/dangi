"use client";
// 파트너 신청 페이지
//   - 로그인된 사용자가 중개사무소 정보를 입력해 파트너 신청(pending)한다.
//   - applyPartner 서버 액션 호출(authenticated RLS: partners_insert_self).
//   - 신청 성공 시 콘솔(/partner-console)로 이동 → 레이아웃이 "심사 중" 표시.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { applyPartner } from "@/lib/actions/partners";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function PartnerApplyPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [pending, startTransition] = useTransition();

  const [officeName, setOfficeName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [businessNo, setBusinessNo] = useState("");
  const [phone, setPhone] = useState("");
  const [settleBank, setSettleBank] = useState("");
  const [settleAccount, setSettleAccount] = useState("");
  const [error, setError] = useState("");

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-zinc-100";
  const labelClass = "text-sm font-medium text-zinc-700";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!officeName.trim()) {
      setError("중개사무소 상호를 입력해 주세요.");
      return;
    }
    if (!registrationNo.trim()) {
      setError("중개사무소 등록번호를 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      const res = await applyPartner({
        office_name: officeName,
        registration_no: registrationNo,
        business_no: businessNo,
        phone,
        settle_bank: settleBank,
        settle_account: settleAccount,
      });
      if (!res.ok) {
        setError(res.error ?? "신청에 실패했습니다.");
        return;
      }
      // 신청/기존신청 모두 콘솔로 이동(레이아웃이 상태별 안내)
      router.replace("/partner-console");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">파트너 신청</h1>
        <p className="mt-1 text-sm text-zinc-500">
          공인중개사 정보를 등록하면 관리자 심사 후 파트너로 승인됩니다. 승인
          후에는 직접 매물을 등록하고 계약 성사 시 이용요금의 7%를 리워드로
          받습니다.
        </p>

        {!configured && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            Supabase 미설정: 환경변수를 설정하면 신청할 수 있습니다.
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              중개사무소 상호 <span className="text-red-500">*</span>
            </span>
            <input
              className={fieldClass}
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              placeholder="예: 온시아공인중개사사무소"
              disabled={!configured || pending}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>
                중개사무소 등록번호 <span className="text-red-500">*</span>
              </span>
              <input
                className={fieldClass}
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="예: 11680-2024-00123"
                disabled={!configured || pending}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>사업자등록번호</span>
              <input
                className={fieldClass}
                value={businessNo}
                onChange={(e) => setBusinessNo(e.target.value)}
                placeholder="예: 123-45-67890"
                disabled={!configured || pending}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>연락처</span>
            <input
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: 010-1234-5678"
              disabled={!configured || pending}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>정산 은행(선택)</span>
              <input
                className={fieldClass}
                value={settleBank}
                onChange={(e) => setSettleBank(e.target.value)}
                placeholder="예: 국민은행"
                disabled={!configured || pending}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>정산 계좌(선택)</span>
              <input
                className={fieldClass}
                value={settleAccount}
                onChange={(e) => setSettleAccount(e.target.value)}
                placeholder="예: 123456-01-234567"
                disabled={!configured || pending}
              />
            </label>
          </div>
          <p className="text-xs text-zinc-400">
            정산 정보는 나중에 콘솔에서 추가·수정할 수 있습니다.
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={!configured || pending}>
            {pending ? "신청 중..." : "파트너 신청하기"}
          </Button>
        </form>
      </div>
    </div>
  );
}
