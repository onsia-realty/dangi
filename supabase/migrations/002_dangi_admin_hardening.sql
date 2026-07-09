-- =====================================================================
-- 002: dangi(단기임대) 관리자 접근 강화
--   배경: dangi 앱이 BOOIN(onsia-job) Supabase 프로젝트의 DB를 공유한다.
--         BOOIN 에는 일반 회원(구직자 등)이 Supabase Auth 로 가입돼 있어
--         "authenticated = 관리자" 가정이 깨진다. 따라서 관리 정책을
--         이메일 화이트리스트(is_dangi_admin())로 잠근다.
--   앱 코드 게이트: lib/admin-emails.ts + middleware.ts (DANGI_ADMIN_EMAILS)
--         → DB(RLS)와 동일한 화이트리스트로 심층 방어.
--   ⚠️ 화이트리스트를 바꿀 때는 아래 함수와 .env 의 DANGI_ADMIN_EMAILS 를
--      함께 수정할 것.
-- 재실행 안전(idempotent): create or replace + drop policy if exists.
-- =====================================================================

-- 관리자 판정 함수: JWT 이메일이 화이트리스트에 포함되는지.
create or replace function public.is_dangi_admin()
returns boolean
language sql
stable
as $fn$
  select coalesce(auth.jwt() ->> 'email', '') in (
    'realtors77@gmail.com',
    'dangi-admin@onsia.kr'
  );
$fn$;

-- ---------------------------------------------------------------------
-- properties: 관리자 정책을 화이트리스트로 교체
--   (anon 의 status='active' 조회 정책 properties_public_select_active 는 유지)
-- ---------------------------------------------------------------------
drop policy if exists "properties_admin_select_all" on public.properties;
create policy "properties_admin_select_all" on public.properties
  for select to authenticated using (public.is_dangi_admin());

drop policy if exists "properties_admin_insert" on public.properties;
create policy "properties_admin_insert" on public.properties
  for insert to authenticated with check (public.is_dangi_admin());

drop policy if exists "properties_admin_update" on public.properties;
create policy "properties_admin_update" on public.properties
  for update to authenticated using (public.is_dangi_admin()) with check (public.is_dangi_admin());

drop policy if exists "properties_admin_delete" on public.properties;
create policy "properties_admin_delete" on public.properties
  for delete to authenticated using (public.is_dangi_admin());

-- ---------------------------------------------------------------------
-- inquiries: 관리자 정책을 화이트리스트로 교체
--   (anon 의 INSERT 정책 inquiries_public_insert 는 유지)
-- ---------------------------------------------------------------------
drop policy if exists "inquiries_admin_select" on public.inquiries;
create policy "inquiries_admin_select" on public.inquiries
  for select to authenticated using (public.is_dangi_admin());

drop policy if exists "inquiries_admin_update" on public.inquiries;
create policy "inquiries_admin_update" on public.inquiries
  for update to authenticated using (public.is_dangi_admin()) with check (public.is_dangi_admin());

drop policy if exists "inquiries_admin_delete" on public.inquiries;
create policy "inquiries_admin_delete" on public.inquiries
  for delete to authenticated using (public.is_dangi_admin());

-- ---------------------------------------------------------------------
-- leads / bookings: 전부 관리자 전용 → 화이트리스트로 교체
-- ---------------------------------------------------------------------
drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all" on public.leads
  for all to authenticated using (public.is_dangi_admin()) with check (public.is_dangi_admin());

drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all" on public.bookings
  for all to authenticated using (public.is_dangi_admin()) with check (public.is_dangi_admin());

-- ---------------------------------------------------------------------
-- storage: property-photos 버킷 — 공개 읽기, 관리자만 쓰기
--   버킷은 대시보드/REST 로 미리 생성(public=true).
-- ---------------------------------------------------------------------
drop policy if exists "property_photos_public_read" on storage.objects;
create policy "property_photos_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-photos');

drop policy if exists "property_photos_admin_insert" on storage.objects;
create policy "property_photos_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'property-photos' and public.is_dangi_admin());

drop policy if exists "property_photos_admin_update" on storage.objects;
create policy "property_photos_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'property-photos' and public.is_dangi_admin());

drop policy if exists "property_photos_admin_delete" on storage.objects;
create policy "property_photos_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'property-photos' and public.is_dangi_admin());
