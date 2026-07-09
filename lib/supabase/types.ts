// Supabase DB 타입 정의 (supabase/schema.sql 스키마와 1:1 대응)
// 실제 프로젝트 연동 후 `supabase gen types`로 자동 생성해 교체할 수 있으나,
// MVP 단계에서는 수동 정의로 타입 안정성을 확보한다.

// 공용 JSON 타입
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// 매물 옵션(가구/가전 등) 구조
export interface PropertyOptions {
  wifi?: boolean;
  washer?: boolean;
  aircon?: boolean;
  fridge?: boolean;
  desk?: boolean;
  induction?: boolean;
  tv?: boolean;
  bed?: boolean;
  [key: string]: boolean | undefined;
}

// 매물 상태 / 리드 단계 / 문의 상태
export type PropertyStatus = "active" | "hidden" | "booked";
// 매물 채널: direct=BOOIN 직영, partner=파트너 중개사 등록
export type PropertyChannel = "direct" | "partner";
// 파트너(공인중개사) 승인 상태
export type PartnerStatus = "pending" | "approved" | "rejected";
export type LeadStage =
  | "발굴"
  | "제안발송"
  | "협의중"
  | "동의완료"
  | "등록완료"
  | "거절";
export type InquiryStatus = "신규" | "연락완료" | "계약진행" | "완료" | "취소";

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          created_at: string;
          title: string | null;
          address: string | null;
          address_detail: string | null; // 계약 확정 전 비공개
          lat: number | null;
          lng: number | null;
          building_type: string | null; // 원룸/오피스텔/아파트/기타
          weekly_rent: number | null; // 주간 요금(원)
          deposit: number;
          mgmt_fee: number | null; // 주간 관리비
          min_weeks: number;
          options: PropertyOptions | null;
          photos: string[] | null; // storage URLs
          verified: boolean; // 등기부 확인 완료
          market_monthly_rent: number | null; // 주변 월세 시세(수동입력)
          status: PropertyStatus;
          lead_id: string | null;
          // 003: 파트너 채널 컬럼
          partner_id: string | null; // 파트너 매물이면 dangi_partners.id
          channel: PropertyChannel; // 'direct' | 'partner'
          owner_consent: boolean; // 임대인 동의 여부(파트너 매물 필수)
          owner_consent_note: string | null; // 동의 방식 메모(내부 전용)
        };
        Insert: {
          id?: string;
          created_at?: string;
          title?: string | null;
          address?: string | null;
          address_detail?: string | null;
          lat?: number | null;
          lng?: number | null;
          building_type?: string | null;
          weekly_rent?: number | null;
          deposit?: number;
          mgmt_fee?: number | null;
          min_weeks?: number;
          options?: PropertyOptions | null;
          photos?: string[] | null;
          verified?: boolean;
          market_monthly_rent?: number | null;
          status?: PropertyStatus;
          lead_id?: string | null;
          partner_id?: string | null;
          channel?: PropertyChannel;
          owner_consent?: boolean;
          owner_consent_note?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string | null;
          address?: string | null;
          address_detail?: string | null;
          lat?: number | null;
          lng?: number | null;
          building_type?: string | null;
          weekly_rent?: number | null;
          deposit?: number;
          mgmt_fee?: number | null;
          min_weeks?: number;
          options?: PropertyOptions | null;
          photos?: string[] | null;
          verified?: boolean;
          market_monthly_rent?: number | null;
          status?: PropertyStatus;
          lead_id?: string | null;
          partner_id?: string | null;
          channel?: PropertyChannel;
          owner_consent?: boolean;
          owner_consent_note?: string | null;
        };
        Relationships: [];
      };
      dangi_partners: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          email: string;
          office_name: string;
          registration_no: string; // 중개사무소 등록번호
          business_no: string | null; // 사업자등록번호
          phone: string | null;
          settle_bank: string | null; // 리워드 정산 은행
          settle_account: string | null; // 리워드 정산 계좌
          status: PartnerStatus; // pending | approved | rejected
          admin_memo: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          email: string;
          office_name: string;
          registration_no: string;
          business_no?: string | null;
          phone?: string | null;
          settle_bank?: string | null;
          settle_account?: string | null;
          status?: PartnerStatus;
          admin_memo?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          email?: string;
          office_name?: string;
          registration_no?: string;
          business_no?: string | null;
          phone?: string | null;
          settle_bank?: string | null;
          settle_account?: string | null;
          status?: PartnerStatus;
          admin_memo?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          created_at: string;
          address: string | null;
          owner_name: string | null;
          owner_contact: string | null;
          source_memo: string | null; // 출처/경위 메모(내부 전용, 공개 금지)
          stage: LeadStage;
          proposed_at: string | null;
          agreed_at: string | null;
          agree_memo: string | null;
          assignee: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          address?: string | null;
          owner_name?: string | null;
          owner_contact?: string | null;
          source_memo?: string | null;
          stage?: LeadStage;
          proposed_at?: string | null;
          agreed_at?: string | null;
          agree_memo?: string | null;
          assignee?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          address?: string | null;
          owner_name?: string | null;
          owner_contact?: string | null;
          source_memo?: string | null;
          stage?: LeadStage;
          proposed_at?: string | null;
          agreed_at?: string | null;
          agree_memo?: string | null;
          assignee?: string | null;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          created_at: string;
          property_id: string | null;
          name: string | null;
          phone: string | null;
          move_in: string | null;
          weeks: number | null;
          message: string | null;
          status: InquiryStatus;
          admin_memo: string | null; // 관리자 내부 메모(내부 전용, 공개 비노출)
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id?: string | null;
          name?: string | null;
          phone?: string | null;
          move_in?: string | null;
          weeks?: number | null;
          message?: string | null;
          status?: InquiryStatus;
          admin_memo?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          property_id?: string | null;
          name?: string | null;
          phone?: string | null;
          move_in?: string | null;
          weeks?: number | null;
          message?: string | null;
          status?: InquiryStatus;
          admin_memo?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          property_id: string | null;
          start_date: string | null;
          end_date: string | null;
          inquiry_id: string | null;
          memo: string | null;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          inquiry_id?: string | null;
          memo?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          inquiry_id?: string | null;
          memo?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      // 공개 예약 구간 뷰: anon 도 조회 가능(민감 컬럼 memo/inquiry_id 제외)
      public_bookings: {
        Row: {
          property_id: string | null;
          start_date: string | null;
          end_date: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// 편의 타입 별칭
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];
export type InquiryInsert = Database["public"]["Tables"]["inquiries"]["Insert"];
export type InquiryUpdate = Database["public"]["Tables"]["inquiries"]["Update"];

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export type DangiPartner = Database["public"]["Tables"]["dangi_partners"]["Row"];
export type DangiPartnerInsert =
  Database["public"]["Tables"]["dangi_partners"]["Insert"];
export type DangiPartnerUpdate =
  Database["public"]["Tables"]["dangi_partners"]["Update"];
