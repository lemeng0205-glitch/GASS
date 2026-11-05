-- v0.1.0 | 2026-11-05 | 保固登錄資料表（只新增，不改動此專案任何既有物件）
--
-- 隔離原則
--   1. 只建立 warranty_ 開頭的物件；不 ALTER / DROP 任何既有資料表、函式、政策。
--   2. 開啟 RLS 且不建立任何政策 → anon / authenticated 無法讀寫。
--   3. 只有伺服器端用 Secret key（service role）寫入。
-- 可重複執行（if not exists）。

create table if not exists public.warranty_registrations (
  id             uuid primary key default gen_random_uuid(),
  reg_no         text not null unique
                 default ('EW' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  region         text not null default 'tw',
  name           text not null check (char_length(name) between 1 and 80),
  email          text not null check (char_length(email) between 3 and 254),
  product        text not null check (char_length(product) between 1 and 120),
  channel        text not null check (char_length(channel) between 1 and 60),
  order_no       text not null check (char_length(order_no) between 1 and 64),
  purchase_date  date not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'verified', 'rejected')),
  verified_at    timestamptz,
  warranty_until date,
  created_at     timestamptz not null default now()
);

create index if not exists warranty_registrations_email_idx
  on public.warranty_registrations (lower(email));
create index if not exists warranty_registrations_order_no_idx
  on public.warranty_registrations (order_no);

alter table public.warranty_registrations enable row level security;
revoke all on public.warranty_registrations from anon, authenticated;
