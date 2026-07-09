"use client";
// =====================================================================
// 매물 등록/수정 폼 (client)
//   - properties 전 필드 편집 + 사진 다중 업로드(Supabase Storage: property-photos)
//   - 저장은 서버 액션(createProperty/updateProperty) 사용(authenticated RLS 일치).
//   - env/버킷 미설정 시 업로드 비활성 + 안내. 저장도 액션에서 안전 처리.
// =====================================================================
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  BUILDING_TYPES,
  DEFAULT_DEPOSIT,
  OPTION_ITEMS,
  PROPERTY_STATUSES,
} from "@/lib/constants";
import {
  createProperty,
  updateProperty,
  type PropertyFormValues,
} from "@/lib/actions/properties";
import type { Property, PropertyStatus } from "@/lib/supabase/types";
import { BuildingLedgerLookup } from "@/components/admin/BuildingLedgerLookup";

const STORAGE_BUCKET = "property-photos";

const STATUS_LABEL: Record<PropertyStatus, string> = {
  active: "공개(active)",
  hidden: "숨김(hidden)",
  booked: "예약(booked)",
};

function numOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function PropertyForm({
  mode,
  property,
  variant = "admin",
  partnerId,
}: {
  mode: "create" | "edit";
  property?: Property;
  // 'admin' = 온시아 직영(channel=direct, 기존 동작)
  // 'partner' = 파트너 중개사 등록(channel=partner, status=hidden 고정, 임대인 동의 필수)
  variant?: "admin" | "partner";
  // partner variant 에서 본인 파트너 id (insert 시 partner_id 로 사용)
  partnerId?: string;
}) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const isPartner = variant === "partner";
  const listHref = isPartner ? "/partner-console/properties" : "/admin/properties";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, startSaving] = useTransition();

  // ---- 필드 상태 (문자열 입력은 string, 저장 시 변환) ----
  const [title, setTitle] = useState(property?.title ?? "");
  const [address, setAddress] = useState(property?.address ?? "");
  const [addressDetail, setAddressDetail] = useState(
    property?.address_detail ?? "",
  );
  const [lat, setLat] = useState(
    property?.lat != null ? String(property.lat) : "",
  );
  const [lng, setLng] = useState(
    property?.lng != null ? String(property.lng) : "",
  );
  const [buildingType, setBuildingType] = useState<string>(
    property?.building_type ?? BUILDING_TYPES[0],
  );
  const [weeklyRent, setWeeklyRent] = useState(
    property?.weekly_rent != null ? String(property.weekly_rent) : "",
  );
  const [deposit, setDeposit] = useState(
    property?.deposit != null ? String(property.deposit) : String(DEFAULT_DEPOSIT),
  );
  const [mgmtFee, setMgmtFee] = useState(
    property?.mgmt_fee != null ? String(property.mgmt_fee) : "",
  );
  const [minWeeks, setMinWeeks] = useState(
    property?.min_weeks != null ? String(property.min_weeks) : "1",
  );
  const [marketMonthly, setMarketMonthly] = useState(
    property?.market_monthly_rent != null
      ? String(property.market_monthly_rent)
      : "",
  );
  const [verified, setVerified] = useState(property?.verified ?? false);
  const [status, setStatus] = useState<PropertyStatus>(
    // 파트너 매물은 등록 직후 무조건 hidden(관리자 검수 후 공개)
    isPartner ? "hidden" : property?.status ?? "active",
  );
  // 파트너 전용: 임대인 동의(필수) + 동의 방식 메모
  const [ownerConsent, setOwnerConsent] = useState(
    property?.owner_consent ?? false,
  );
  const [ownerConsentNote, setOwnerConsentNote] = useState(
    property?.owner_consent_note ?? "",
  );
  const [options, setOptions] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const o of OPTION_ITEMS) {
      init[o.key] = Boolean(property?.options?.[o.key]);
    }
    return init;
  });
  const [photos, setPhotos] = useState<string[]>(property?.photos ?? []);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "text-sm font-medium text-zinc-700";

  // ---- 사진 업로드 ----
  async function onSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!configured) {
      setUploadError("Supabase 미설정: 사진 업로드를 사용할 수 없습니다.");
      return;
    }
    setUploadError("");
    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.includes(".")
          ? file.name.split(".").pop()
          : "jpg";
        const path = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          setUploadError(
            `업로드 실패: ${error.message} (버킷 '${STORAGE_BUCKET}' 존재/권한 확인)`,
          );
          continue;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        uploaded.push(publicUrl);
      }
      if (uploaded.length > 0) {
        setPhotos((prev) => [...prev, ...uploaded]);
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  // ---- 건축물대장 자동 채움 ----
  // PropertyForm 에는 층수/사용승인일/구조/주차 전용 필드가 없어,
  // 매핑 가능한 건물유형만 채우고 나머지는 요약을 상세주소(내부전용)에 삽입한다.
  function applyLedger(payload: {
    guessedBuildingType: string | null;
    summary: string;
    applySummaryToDetail: boolean;
  }) {
    if (
      payload.guessedBuildingType &&
      (BUILDING_TYPES as readonly string[]).includes(payload.guessedBuildingType)
    ) {
      setBuildingType(payload.guessedBuildingType);
    }
    if (payload.applySummaryToDetail && payload.summary) {
      setAddressDetail((prev) => {
        const cleaned = prev.replace(/\[건축물대장\][^\n]*/g, "").trim();
        return cleaned ? `${cleaned}\n${payload.summary}` : payload.summary;
      });
    }
  }

  // ---- 저장 ----
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");

    if (!title.trim()) {
      setSaveError("제목을 입력해 주세요.");
      return;
    }

    // 파트너 매물: 임대인 동의 필수(RLS 도 owner_consent=true 를 요구)
    if (isPartner && !ownerConsent) {
      setSaveError("임대인 동의를 확인해 주세요(필수).");
      return;
    }

    const values: PropertyFormValues = {
      title: title,
      address: address,
      address_detail: addressDetail,
      lat: numOrNull(lat),
      lng: numOrNull(lng),
      building_type: buildingType,
      weekly_rent: numOrNull(weeklyRent),
      deposit: numOrNull(deposit) ?? DEFAULT_DEPOSIT,
      mgmt_fee: numOrNull(mgmtFee),
      min_weeks: numOrNull(minWeeks) ?? 1,
      options,
      photos,
      market_monthly_rent: numOrNull(marketMonthly),
      // 검증(등기부)은 관리자 전용 — 파트너는 항상 false 로 등록
      verified: isPartner ? false : verified,
      // 파트너는 hidden 고정
      status: isPartner ? "hidden" : status,
      lead_id: property?.lead_id ?? null,
      // 003: 채널 필드
      channel: isPartner ? "partner" : "direct",
      partner_id: isPartner ? partnerId ?? null : null,
      owner_consent: isPartner ? ownerConsent : false,
      owner_consent_note: isPartner ? ownerConsentNote.trim() || null : null,
    };

    startSaving(async () => {
      const res =
        mode === "edit" && property
          ? await updateProperty(property.id, values)
          : await createProperty(values);
      if (!res.ok) {
        setSaveError(res.error ?? "저장에 실패했습니다.");
        return;
      }
      router.push(listHref);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {!configured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          Supabase 미설정: 사진 업로드·저장이 비활성화됩니다. 환경변수를 설정하세요.
        </div>
      )}

      {/* 기본 정보 */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">기본 정보</h2>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>제목 *</span>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 강남역 도보 5분 깔끔한 원룸"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>지역/주소(공개)</span>
            <input
              className={fieldClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 서울 강남구 역삼동"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              상세주소(내부 전용 · 비공개)
            </span>
            <input
              className={fieldClass}
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="예: 역삼동 스타빌 302호"
            />
          </label>
        </div>

        <BuildingLedgerLookup address={address} onApply={applyLedger} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>건물유형</span>
            <select
              className={fieldClass}
              value={buildingType}
              onChange={(e) => setBuildingType(e.target.value)}
            >
              {BUILDING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>위도(lat)</span>
            <input
              className={fieldClass}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="37.4979"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>경도(lng)</span>
            <input
              className={fieldClass}
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="127.0276"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>최소 계약(주)</span>
            <input
              className={fieldClass}
              type="number"
              min={1}
              value={minWeeks}
              onChange={(e) => setMinWeeks(e.target.value)}
            />
          </label>
        </div>
        <p className="text-xs text-zinc-400">
          위도/경도는 수동 입력합니다(지도 검색으로 좌표 확인 후 입력).
        </p>
      </section>

      {/* 요금 */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">요금</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>주간요금(원)</span>
            <input
              className={fieldClass}
              type="number"
              value={weeklyRent}
              onChange={(e) => setWeeklyRent(e.target.value)}
              placeholder="250000"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>보증금(원)</span>
            <input
              className={fieldClass}
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder={String(DEFAULT_DEPOSIT)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>주간 관리비(원)</span>
            <input
              className={fieldClass}
              type="number"
              value={mgmtFee}
              onChange={(e) => setMgmtFee(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>주변 월세 시세(원)</span>
            <input
              className={fieldClass}
              type="number"
              value={marketMonthly}
              onChange={(e) => setMarketMonthly(e.target.value)}
              placeholder="950000"
            />
          </label>
        </div>
        <p className="text-xs text-zinc-400">
          주변 월세 시세는 시세 비교 배지 계산에 사용됩니다(미입력 시 배지 미노출).
        </p>
      </section>

      {/* 옵션 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">옵션(가구/가전)</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OPTION_ITEMS.map((o) => (
            <label
              key={o.key}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
            >
              <input
                type="checkbox"
                checked={options[o.key] ?? false}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, [o.key]: e.target.checked }))
                }
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              {o.label}
            </label>
          ))}
        </div>
      </section>

      {/* 사진 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          사진 (다중 업로드)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onSelectFiles}
            disabled={!configured || uploading}
            className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700 disabled:opacity-50"
          />
          {uploading && (
            <span className="text-xs text-zinc-500">업로드 중...</span>
          )}
        </div>
        {uploadError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {uploadError}
          </p>
        )}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((url) => (
              <div
                key={url}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
              >
                {/* 외부/스토리지 URL 미리보기 (next/image unoptimized 로 도메인 제약 회피) */}
                <Image
                  src={url}
                  alt="매물 사진"
                  fill
                  unoptimized
                  sizes="200px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-zinc-400">
          Supabase Storage의 공개 버킷 &lsquo;{STORAGE_BUCKET}&rsquo;에 업로드됩니다.
        </p>
      </section>

      {/* 파트너 전용: 임대인 동의 */}
      {isPartner && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-700">
            임대인 동의 <span className="text-red-500">*</span>
          </h2>
          <label className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
            <input
              type="checkbox"
              checked={ownerConsent}
              onChange={(e) => setOwnerConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-zinc-800">
              해당 매물의 임대인으로부터 단기임대 등록·노출에 대한 동의를
              받았음을 확인합니다.
              <span className="mt-1 block text-xs text-zinc-500">
                동의 없이 등록된 매물은 반려되며, 책임은 등록 중개사에게
                있습니다.
              </span>
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>동의 방식 메모(내부 전용)</span>
            <input
              className={fieldClass}
              value={ownerConsentNote}
              onChange={(e) => setOwnerConsentNote(e.target.value)}
              placeholder="예: 2026-07-08 임대인 홍길동 유선 동의 / 위임장 보관"
            />
          </label>
        </section>
      )}

      {/* 상태/검증 (관리자 전용) */}
      {!isPartner && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-700">노출/검증</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>노출 상태</span>
              <select
                className={fieldClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
              >
                {PROPERTY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className={labelClass}>
                공인중개사 검증 완료(등기부 확인)
              </span>
            </label>
          </div>
        </section>
      )}

      {/* 파트너: 검수 안내 */}
      {isPartner && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          등록하신 매물은 <span className="font-semibold">관리자 검수 후 공개</span>
          됩니다(등록 직후에는 노출되지 않습니다). 계약 성사 시 이용요금의 7%가
          리워드로 지급됩니다.
        </div>
      )}

      {saveError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {saveError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !configured}>
          {saving ? "저장 중..." : mode === "edit" ? "수정 저장" : "매물 등록"}
        </Button>
        <button
          type="button"
          onClick={() => router.push(listHref)}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          취소
        </button>
      </div>
    </form>
  );
}
