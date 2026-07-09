// =====================================================================
// GET /api/building-ledger?address=<지번주소 전체>
//   1) 지번주소 → PNU 19자리 변환 (NCP 네이버 우선 → VWorld fallback,
//      실패 시 404 PNU_NOT_FOUND)
//   2) Supabase 설정 시: building_ledgers 캐시 조회 → 있으면 반환(cached:true)
//      없으면 국토부 API 호출 후 service_role 로 upsert(onConflict:pnu) 후 반환
//   3) Supabase 미설정 시: 국토부 API 결과만 반환 (cached:false)
//   4) 국토부 API 빈 결과 → 404 LEDGER_NOT_FOUND
//   응답: { pnu, pnuSource, ledger: BuildingLedgerRow, cached }
// 서버 전용 라우트 핸들러 (API 키는 서버에서만 사용).
// =====================================================================
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminSupabase } from "@/lib/supabase/server";
import { pnuFromAddressWithSource } from "@/lib/building-ledger/geocode";
import {
  fetchBuildingTitle,
  type BuildingLedgerRow,
} from "@/lib/building-ledger/buildingLedger";

// 항상 최신 조회 (Next 정적 캐시 방지). 내부 fetch 는 개별 revalidate 로 캐싱.
export const dynamic = "force-dynamic";

// building_ledgers 테이블은 생성된 Database 타입에 아직 없으므로,
// 최소한의 체이닝 시그니처만 갖는 untyped 클라이언트로 다룬다.
type SupabaseUntyped = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => { maybeSingle: () => Promise<{ data: unknown }> };
    };
    upsert: (
      row: unknown,
      opts: { onConflict: string },
    ) => Promise<{ error: unknown }>;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();

  if (!address) {
    return NextResponse.json(
      { error: "ADDRESS_REQUIRED" },
      { status: 400 },
    );
  }

  // 1) 주소 → PNU (네이버 우선 → VWorld fallback)
  const pnuResult = await pnuFromAddressWithSource(address);
  if (!pnuResult) {
    return NextResponse.json({ error: "PNU_NOT_FOUND" }, { status: 404 });
  }
  const { pnu, source: pnuSource } = pnuResult;

  const supabaseReady = isSupabaseConfigured();

  // 2) 캐시 조회 (Supabase 설정 시)
  if (supabaseReady) {
    try {
      // building_ledgers 는 아직 생성된 Database 타입에 없어 any 캐스팅으로 접근한다.
      const admin = createAdminSupabase() as unknown as SupabaseUntyped;
      const { data: cached } = await admin
        .from("building_ledgers")
        .select("*")
        .eq("pnu", pnu)
        .maybeSingle();

      if (cached) {
        return NextResponse.json({
          pnu,
          pnuSource,
          ledger: cached as unknown as BuildingLedgerRow,
          cached: true,
        });
      }
    } catch (e) {
      // service_role 키 미설정 등 → 캐시 건너뛰고 API 직접 호출로 폴백
      console.warn("[building-ledger] 캐시 조회 실패, API 직접 호출:", e);
    }
  }

  // 3) 국토부 API 호출
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "DATA_GO_KR_API_KEY_MISSING" },
      { status: 500 },
    );
  }

  let ledger: BuildingLedgerRow | null;
  try {
    ledger = await fetchBuildingTitle(pnu, serviceKey);
  } catch (e) {
    console.error("[building-ledger] 국토부 API 오류:", e);
    return NextResponse.json(
      { error: "LEDGER_API_ERROR", detail: String(e) },
      { status: 502 },
    );
  }

  if (!ledger) {
    return NextResponse.json({ error: "LEDGER_NOT_FOUND" }, { status: 404 });
  }

  // 4) 캐시 upsert (Supabase 설정 시, 실패해도 응답은 반환)
  if (supabaseReady) {
    try {
      const admin = createAdminSupabase() as unknown as SupabaseUntyped;
      await admin
        .from("building_ledgers")
        .upsert(ledger, { onConflict: "pnu" });
    } catch (e) {
      console.warn("[building-ledger] 캐시 upsert 실패(무시):", e);
    }
  }

  return NextResponse.json({ pnu, pnuSource, ledger, cached: false });
}
