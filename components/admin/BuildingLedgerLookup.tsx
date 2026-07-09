"use client";
// =====================================================================
// 건축물대장 자동 채움 위젯 (client)
//   - 지번 주소(시/도 포함)를 받아 GET /api/building-ledger 호출
//   - 로딩/에러 상태 표시, 성공 시 요약 카드 렌더
//   - "폼에 적용" → onApply(ledger) 콜백으로 부모 폼 필드 채움
// PropertyForm 에는 층수/사용승인일/구조/주차 전용 필드가 없으므로,
// 매핑되는 값(building_type)만 채우고 나머지는 요약 텍스트로
// address_detail(상세주소·내부전용)에 삽입하는 옵션을 제공한다.
// =====================================================================
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { BuildingLedgerRow } from "@/lib/building-ledger/buildingLedger";

// ---- 유틸: 대장 값 포맷 ----

/** YYYYMMDD → YYYY-MM-DD (비정상 값은 원본 반환) */
export function formatUseAprDay(raw: string | null): string {
  if (!raw) return "-";
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return raw;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/** 주차 4종 합산 (실내기계·실외기계·실내자주·실외자주) */
export function totalParking(l: BuildingLedgerRow): number {
  return (
    (l.indr_mech_utcnt ?? 0) +
    (l.oudr_mech_utcnt ?? 0) +
    (l.indr_auto_utcnt ?? 0) +
    (l.oudr_auto_utcnt ?? 0)
  );
}

/** 주용도/기타용도 문자열에서 매물 건물유형(원룸/오피스텔/아파트/기타) 추론 */
export function guessBuildingType(l: BuildingLedgerRow): string | null {
  const hay = `${l.main_purps_cd_nm ?? ""} ${l.etc_purps ?? ""}`;
  if (/아파트/.test(hay)) return "아파트";
  if (/오피스텔/.test(hay)) return "오피스텔";
  if (/(다세대|연립|다가구|원룸|도시형생활주택)/.test(hay)) return "원룸";
  return null;
}

const numFmt = (n: number | null, suffix = "") =>
  n == null ? "-" : `${n.toLocaleString("ko-KR")}${suffix}`;

/** 폼 상세주소 등에 넣을 대장 요약 텍스트 생성 */
export function buildLedgerSummary(l: BuildingLedgerRow): string {
  const parts: string[] = [];
  if (l.bld_nm) parts.push(`건물명: ${l.bld_nm}`);
  if (l.main_purps_cd_nm) parts.push(`주용도: ${l.main_purps_cd_nm}`);
  if (l.strct_cd_nm) parts.push(`구조: ${l.strct_cd_nm}`);
  if (l.use_apr_day) parts.push(`사용승인: ${formatUseAprDay(l.use_apr_day)}`);
  if (l.grnd_flr_cnt != null || l.ugrnd_flr_cnt != null) {
    parts.push(`층수: 지상 ${l.grnd_flr_cnt ?? 0} / 지하 ${l.ugrnd_flr_cnt ?? 0}`);
  }
  if (l.tot_area != null) parts.push(`연면적: ${numFmt(l.tot_area, "㎡")}`);
  if (l.bc_rat != null || l.vl_rat != null) {
    parts.push(`건폐율 ${numFmt(l.bc_rat, "%")} / 용적률 ${numFmt(l.vl_rat, "%")}`);
  }
  if (l.ride_elvt_cnt != null) parts.push(`승강기: ${l.ride_elvt_cnt}대`);
  const pk = totalParking(l);
  if (pk > 0) parts.push(`주차: ${pk}대`);
  return `[건축물대장] ${parts.join(" · ")}`;
}

// ---- 에러 코드 → 사용자 안내 ----
function errorMessage(status: number, code?: string): string {
  if (code === "ADDRESS_REQUIRED" || status === 400) {
    return "주소를 입력해 주세요. 시/도부터 시작하는 지번 주소 전체가 필요합니다 (예: 서울시 강남구 논현동 201-2).";
  }
  if (code === "PNU_NOT_FOUND") {
    return "주소로 지번(PNU)을 찾지 못했습니다. 시/도·시군구·법정동·번지를 정확히 입력해 주세요 (예: 서울시 강남구 논현동 201-2).";
  }
  if (code === "LEDGER_NOT_FOUND") {
    return "해당 지번의 건축물대장 표제부를 찾지 못했습니다. 번지(본번-부번)를 확인해 주세요.";
  }
  return `조회에 실패했습니다 (${code ?? status}). 시/도부터 정확한 지번 주소를 입력했는지 확인해 주세요.`;
}

export interface LedgerLookupResponse {
  pnu: string;
  pnuSource: string;
  cached: boolean;
  ledger: BuildingLedgerRow;
}

export function BuildingLedgerLookup({
  address,
  onApply,
}: {
  /** 조회에 사용할 지번 주소 전체 (부모 폼 주소 필드값) */
  address: string;
  /** "폼에 적용" 클릭 시 대장 데이터 + 요약을 부모에 전달 */
  onApply: (payload: {
    ledger: BuildingLedgerRow;
    guessedBuildingType: string | null;
    summary: string;
    applySummaryToDetail: boolean;
  }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LedgerLookupResponse | null>(null);
  const [applySummary, setApplySummary] = useState(true);
  const [applied, setApplied] = useState(false);

  async function onLookup() {
    const q = address.trim();
    setError("");
    setResult(null);
    setApplied(false);
    if (!q) {
      setError(
        "주소가 비어 있습니다. 위 '지역/주소' 칸에 시/도부터 시작하는 지번 주소 전체를 입력해 주세요 (예: 서울시 강남구 논현동 201-2).",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/building-ledger?address=${encodeURIComponent(q)}`,
      );
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : undefined;
        setError(errorMessage(res.status, code));
        return;
      }
      setResult(data as LedgerLookupResponse);
    } catch {
      setError(
        "네트워크 오류로 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  function onApplyClick() {
    if (!result) return;
    const l = result.ledger;
    onApply({
      ledger: l,
      guessedBuildingType: guessBuildingType(l),
      summary: buildLedgerSummary(l),
      applySummaryToDetail: applySummary,
    });
    setApplied(true);
  }

  const l = result?.ledger;

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-700">
          건축물대장 자동 채움
        </h2>
        <Button
          type="button"
          variant="secondary"
          onClick={onLookup}
          disabled={loading}
        >
          {loading ? "조회 중..." : "건축물대장 조회"}
        </Button>
      </div>
      <p className="text-xs text-zinc-500">
        위 &lsquo;지역/주소&rsquo; 칸의 값으로 조회합니다. 반드시 시/도부터
        시작하는 지번 주소 전체를 입력하세요 (예: 서울시 강남구 논현동 201-2).
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"
        >
          {error}
        </p>
      )}

      {l && (
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-800">
                {l.bld_nm || "(건물명 없음)"}
              </span>
              <span className="text-[11px] text-zinc-400">
                {result?.cached ? "캐시" : "실시간"} · PNU {result?.pnu}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
              <LedgerItem label="주용도" value={l.main_purps_cd_nm} />
              <LedgerItem label="구조" value={l.strct_cd_nm} />
              <LedgerItem
                label="사용승인일"
                value={formatUseAprDay(l.use_apr_day)}
              />
              <LedgerItem
                label="층수(지상/지하)"
                value={`${l.grnd_flr_cnt ?? "-"} / ${l.ugrnd_flr_cnt ?? "-"}`}
              />
              <LedgerItem label="연면적" value={numFmt(l.tot_area, "㎡")} />
              <LedgerItem
                label="건폐율/용적률"
                value={`${numFmt(l.bc_rat, "%")} / ${numFmt(l.vl_rat, "%")}`}
              />
              <LedgerItem label="승강기" value={numFmt(l.ride_elvt_cnt, "대")} />
              <LedgerItem
                label="총 주차대수"
                value={`${totalParking(l).toLocaleString("ko-KR")}대`}
              />
              <LedgerItem
                label="추론 건물유형"
                value={guessBuildingType(l) ?? "(자동추론 불가)"}
              />
            </dl>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={applySummary}
              onChange={(e) => setApplySummary(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            대장 요약을 상세주소(내부 전용) 칸에 함께 채우기
          </label>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={onApplyClick}>
              폼에 적용
            </Button>
            {applied && (
              <span className="text-xs font-medium text-emerald-600">
                폼에 적용되었습니다.
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function LedgerItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] text-zinc-400">{label}</dt>
      <dd className="font-medium text-zinc-800">{value || "-"}</dd>
    </div>
  );
}
