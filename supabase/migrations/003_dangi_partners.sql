-- =====================================================================
-- 003: 파트너(공인중개사) 매물 등록 시스템
--   모델: 중개사가 파트너로 승인받아 매물을 등록하고,
--         계약 성사 시 이용요금의 7%를 리워드로 지급받는다 (BOOIN 순 ~5%).
--   properties.channel:
--     'direct'  = BOOIN(온시아) 직영 매물 — 수수료 전액 BOOIN
--     'partner' = 파트너 중개사 등록 매물 — 성사 시 7% 리워드
--   ⚠️ 중개사가 남의 집을 올리므로 owner_consent(임대인 동의) 확인 필수.
-- 재실행 안전(idempotent).
-- =====================================================================

create table if not exists public.dangi_partners (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  user_id          uuid unique not null,
  email            text not null,
  office_name      text not null,
  registration_no  text not null,
  business_no      text,
  phone            text,
  settle_bank      text,
  settle_account   text,
  status           text not null default 'pending',
  admin_memo       text
);

create index if not exists idx_dangi_partners_user on public.dangi_partners (user_id);
create index if not exists idx_dangi_partners_status on public.dangi_partners (status);

alter table public.dangi_partners enable row level security;

alter table public.properties add column if not exists partner_id uuid references public.dangi_partners(id) on delete set null;
alter table public.properties add column if not exists channel text not null default 'direct';
alter table public.properties add column if not exists owner_consent boolean not null default false;
alter table public.properties add column if not exists owner_consent_note text;

create index if not exists idx_properties_partner on public.properties (partner_id);

create or replace function public.is_dangi_partner()
returns boolean
language sql
stable
as $fn$
  select exists (
    select 1 from public.dangi_partners p
    where p.user_id = auth.uid() and p.status = 'approved'
  );
$fn$;

create or replace function public.dangi_partner_id()
returns uuid
language sql
stable
as $fn$
  select p.id from public.dangi_partners p
  where p.user_id = auth.uid() and p.status = 'approved'
  limit 1;
$fn$;

drop policy if exists "partners_insert_self" on public.dangi_partners;
create policy "partners_insert_self" on public.dangi_partners
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "partners_select_own_or_admin" on public.dangi_partners;
create policy "partners_select_own_or_admin" on public.dangi_partners
  for select to authenticated
  using (user_id = auth.uid() or public.is_dangi_admin());

drop policy if exists "partners_admin_update" on public.dangi_partners;
create policy "partners_admin_update" on public.dangi_partners
  for update to authenticated
  using (public.is_dangi_admin()) with check (public.is_dangi_admin());

drop policy if exists "partners_admin_delete" on public.dangi_partners;
create policy "partners_admin_delete" on public.dangi_partners
  for delete to authenticated
  using (public.is_dangi_admin());

drop policy if exists "properties_partner_select_own" on public.properties;
create policy "properties_partner_select_own" on public.properties
  for select to authenticated
  using (partner_id is not null and partner_id = public.dangi_partner_id());

drop policy if exists "properties_partner_insert" on public.properties;
create policy "properties_partner_insert" on public.properties
  for insert to authenticated
  with check (
    channel = 'partner'
    and partner_id = public.dangi_partner_id()
    and owner_consent = true
    and status = 'hidden'
  );

drop policy if exists "properties_partner_update" on public.properties;
create policy "properties_partner_update" on public.properties
  for update to authenticated
  using (partner_id is not null and partner_id = public.dangi_partner_id())
  with check (partner_id = public.dangi_partner_id() and channel = 'partner');

drop policy if exists "properties_partner_delete" on public.properties;
create policy "properties_partner_delete" on public.properties
  for delete to authenticated
  using (partner_id is not null and partner_id = public.dangi_partner_id());

drop policy if exists "property_photos_partner_insert" on storage.objects;
create policy "property_photos_partner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-photos' and public.is_dangi_partner());

select 'dangi partners migration applied' as result;
