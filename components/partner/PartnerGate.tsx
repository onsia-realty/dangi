// =====================================================================
// 파트너 접근 게이트 (서버 컴포넌트)
//   - 파트너 콘솔의 각 페이지(dashboard/properties/new)에서 감싸는 용도.
//   - 상태별로 안내를 렌더하고, 승인(approved)일 때만 children 을 렌더한다.
//       · env 미설정  → 안내
//       · 미로그인     → 로그인 안내(+로그인 링크)
//       · 신청 전      → 신청 안내(+신청 링크)
//       · 심사 중      → "심사 중" 안내
//       · 반려         → 반려 안내
//   - 003 마이그레이션 미적용 시 getMyPartner 가 null → "신청 전"으로 처리되며
//     신청 시도 시 applyPartner 가 안내 문구를 반환한다(크래시 없음).
//   - render props 로 승인된 파트너 정보를 children 에 전달한다.
// =====================================================================
import type { ReactNode } from "react";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getMyPartner } from "@/lib/actions/partners";
import type { DangiPartner } from "@/lib/supabase/types";

function Notice({
  title,
  desc,
  actionHref,
  actionLabel,
}: {
  title: string;
  desc: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
      <p className="text-base font-semibold text-zinc-900">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{desc}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export async function PartnerGate({
  children,
}: {
  // 승인된 파트너 정보를 받아 실제 콘텐츠를 렌더하는 함수
  children: (partner: DangiPartner) => ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <Notice
        title="Supabase 연결 필요"
        desc="환경변수(.env.local)를 설정하면 파트너 콘솔을 사용할 수 있습니다."
      />
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Notice
        title="로그인이 필요합니다"
        desc="파트너 콘솔을 사용하려면 먼저 로그인해 주세요."
        actionHref="/partner-console/login"
        actionLabel="로그인"
      />
    );
  }

  const partner = await getMyPartner();

  // 신청 전(파트너 row 없음 or 테이블 미적용)
  if (!partner) {
    return (
      <Notice
        title="파트너 신청이 필요합니다"
        desc="공인중개사 파트너로 신청하면 심사 후 직접 매물을 등록할 수 있습니다. 계약 성사 시 이용요금의 7%를 리워드로 받습니다."
        actionHref="/partner-console/apply"
        actionLabel="파트너 신청하기"
      />
    );
  }

  if (partner.status === "pending") {
    return (
      <Notice
        title="심사 중입니다"
        desc={`'${partner.office_name}' 파트너 신청이 접수되어 관리자 심사를 기다리고 있습니다. 승인되면 매물 등록이 가능합니다.`}
      />
    );
  }

  if (partner.status === "rejected") {
    return (
      <Notice
        title="신청이 반려되었습니다"
        desc="파트너 신청이 반려되었습니다. 자세한 내용은 온시아 관리자에게 문의해 주세요."
      />
    );
  }

  // approved
  return <>{children(partner)}</>;
}
