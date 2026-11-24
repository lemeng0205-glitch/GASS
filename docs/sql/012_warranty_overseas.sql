-- v0.1.0 | 2026-11-24 | 全球保固頁：擴充 warranty_registrations、新增 warranty_claims 與 warranty_mail_log
--
-- 【草稿，尚未執行】需經使用者與資料庫負責人確認。
-- 執行位置：Supabase 專案 pzvthhadlaoslebbmvlw 的 SQL Editor。
-- 可重複執行（全部使用 if not exists / drop ... if exists）。回復用 SQL 在 012_warranty_overseas_rollback.sql。
-- 只動 warranty_ 開頭的物件；不改既有欄位，只新增。
-- 檔名編號 012 是依《整合指南》「目前到 011」推定，請專案負責人依實際情況調整。
--
-- 依據 2026-11-24 唯讀檢查的現況：
--   warranty_registrations 0 筆；欄位 id, reg_no, region(預設 'tw'), name, email, product, channel,
--   order_no, purchase_date, status, verified_at, warranty_until, created_at。
--   所有 warranty_ 表：RLS 開啟、0 條 policy、只有 postgres 與 service_role 有權限。
--   public schema 的預設權限會把新表自動開放給 anon / authenticated，所以新表必須明確收回。

begin;

-- ─────────────────────────────────────────────────────────────
-- 1. 擴充 warranty_registrations（全部是可為空或有預設值的新欄位，現有台灣版寫入不受影響）
-- ─────────────────────────────────────────────────────────────
alter table public.warranty_registrations
  add column if not exists user_id    uuid references auth.users (id) on delete set null,
  add column if not exists country    text,
  add column if not exists serial_no  text,
  add column if not exists consent_at timestamptz,
  add column if not exists source     text not null default 'web';

-- country：兩碼小寫國家代碼（與 warranty_countries.code 同格式）。
-- 刻意不設外鍵：warranty_countries 同時是首頁世界地圖的資料，販售國家不一定都在地圖上。
alter table public.warranty_registrations drop constraint if exists warranty_registrations_country_check;
alter table public.warranty_registrations
  add constraint warranty_registrations_country_check
  check (country is null or country ~ '^[a-z]{2}$');

alter table public.warranty_registrations drop constraint if exists warranty_registrations_serial_no_check;
alter table public.warranty_registrations
  add constraint warranty_registrations_serial_no_check
  check (serial_no is null or char_length(serial_no) between 1 and 60);

alter table public.warranty_registrations drop constraint if exists warranty_registrations_source_check;
alter table public.warranty_registrations
  add constraint warranty_registrations_source_check
  check (char_length(source) between 1 and 40);

create index if not exists warranty_registrations_user_id_idx
  on public.warranty_registrations (user_id) where user_id is not null;

-- ─────────────────────────────────────────────────────────────
-- 2. 新表：warranty_claims（保固申請）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.warranty_claims (
  id              uuid primary key default gen_random_uuid(),
  claim_no        text not null unique
                    default ('EC' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  registration_id uuid not null references public.warranty_registrations (id) on delete restrict,
  user_id         uuid references auth.users (id) on delete set null,
  contact_name    text not null check (char_length(contact_name) between 1 and 80),
  contact_email   text not null check (char_length(contact_email) between 3 and 254),
  country         text check (country is null or country ~ '^[a-z]{2}$'),
  description     text not null check (char_length(description) between 1 and 4000),
  status          text not null default 'received'
                    check (status in ('received', 'in_review', 'awaiting_customer', 'approved', 'rejected', 'closed')),
  staff_note      text check (staff_note is null or char_length(staff_note) <= 4000),   -- 內部備註，不可寄給客人
  customer_reply  text check (customer_reply is null or char_length(customer_reply) <= 4000), -- 給客人看的回覆
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists warranty_claims_registration_idx on public.warranty_claims (registration_id);
create index if not exists warranty_claims_user_id_idx      on public.warranty_claims (user_id) where user_id is not null;
create index if not exists warranty_claims_status_idx       on public.warranty_claims (status, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 3. 新表：warranty_mail_log（寄信紀錄；比照 anomaly_mail_log，不存收件地址）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.warranty_mail_log (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid references public.warranty_registrations (id) on delete set null,
  claim_id        uuid references public.warranty_claims (id) on delete set null,
  kind            text not null
                    check (kind in ('registration_confirm', 'claim_received', 'claim_update')),
  ok              boolean not null,
  error           text check (error is null or char_length(error) <= 500),
  message_id      text,
  created_at      timestamptz not null default now()
);

create index if not exists warranty_mail_log_registration_idx on public.warranty_mail_log (registration_id);
create index if not exists warranty_mail_log_claim_idx        on public.warranty_mail_log (claim_id);

-- ─────────────────────────────────────────────────────────────
-- 4. 權限：比照現有 warranty_ 表 —— RLS 開啟、不建 policy、只有伺服器端（service_role）能存取
-- ─────────────────────────────────────────────────────────────
alter table public.warranty_claims   enable row level security;
alter table public.warranty_mail_log enable row level security;

revoke all on public.warranty_claims   from anon, authenticated;
revoke all on public.warranty_mail_log from anon, authenticated;

commit;

-- ─────────────────────────────────────────────────────────────
-- 5. 執行後請跑這段確認（唯讀）。預期：
--    - 三張表的 acl 都只有 postgres 與 service_role，沒有 anon / authenticated
--    - rls 都是 true
-- ─────────────────────────────────────────────────────────────
-- select relname, relrowsecurity as rls, relacl::text as acl
-- from pg_class
-- where relnamespace = 'public'::regnamespace
--   and relname in ('warranty_registrations', 'warranty_claims', 'warranty_mail_log');
