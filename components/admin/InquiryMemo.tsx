"use client";
// =====================================================================
// 문의 내부 메모(admin_memo) 인라인 편집 (지시서 4-B)
//   - 내부 전용 메모. 공개 조회(anon)에는 노출되지 않는다(RLS + 공개 컬럼 미포함).
//   - 값이 바뀐 경우에만 저장 버튼을 활성화한다.
// =====================================================================
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setInquiryMemo } from "@/lib/actions/inquiries";

export function InquiryMemo({
  id,
  memo,
}: {
  id: string;
  memo: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(memo ?? "");
  const [error, setError] = useState("");
  const dirty = value !== (memo ?? "");

  function onSave() {
    setError("");
    startTransition(async () => {
      const res = await setInquiryMemo(id, value);
      if (!res.ok) {
        setError(res.error ?? "저장 실패");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex w-[180px] flex-col gap-1">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        placeholder="내부 메모"
        className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 focus:border-emerald-500 focus:outline-none"
      />
      {dirty && (
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="self-start rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      )}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}
