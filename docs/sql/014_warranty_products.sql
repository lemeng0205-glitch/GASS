-- v0.1.0 | 2026-11-26 | 全球保固頁（海外）產品清單：業務在 ERP「全球服務中心 ▸ 海外保固產品」自己維護
--
-- 執行位置：Supabase 專案 pzvthhadlaoslebbmvlw 的 SQL Editor。須先執行過 012、013。
-- 可重複執行（if not exists；種子資料遇到同名就跳過）。只新增 warranty_products 一張表，不動其他表。
-- 回復：drop table if exists public.warranty_products;（網站會自動退回程式內建的 10 項清單）
--
-- 欄位：
--   name      顯示在表單選單的英文產品名稱（與海外通路商品頁寫法一致；登錄與申請存的就是這個文字）
--   category  選單分組（例：Stylus、Keyboard）
--   on_sale   false = 停售，表單選單不顯示（舊登錄資料不受影響）
--   sort      排序，小的在前

begin;

create table if not exists public.warranty_products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 120 and name = btrim(name)),
  category    text not null check (char_length(category) between 1 and 40 and category = btrim(category)),
  on_sale     boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 權限：比照其他 warranty_ 表 —— RLS 開啟、不建 policy、只有伺服器端（service_role）能存取
alter table public.warranty_products enable row level security;
revoke all on public.warranty_products from anon, authenticated;

-- 種子資料：業務 2026-11-23 提供的 10 項（《全球保固頁_規格》5.3）
insert into public.warranty_products (name, category, sort) values
  ('eiP Pencil 2',                         'Stylus',   10),
  ('eiP Pencil X',                         'Stylus',   20),
  ('eiP Pencil X Classic',                 'Stylus',   30),
  ('eiP USI 2.0 Ultra',                    'Stylus',   40),
  ('Penoval USI 2.0',                      'Stylus',   50),
  ('Penoval USI 2.0 Lite',                 'Stylus',   60),
  ('eiP HyperKeys Keyboard',               'Keyboard', 70),
  ('eiP Magnetix Keyboard (iPad)',         'Keyboard', 80),
  ('eiP Magnetix Keyboard (Pixel Tablet)', 'Keyboard', 90),
  ('eiP Magnetix Keyboard Lite',           'Keyboard', 100)
on conflict (name) do nothing;

commit;

-- 執行後確認（唯讀）。預期：10 筆；rls = true；acl 只有 postgres 與 service_role。
-- select count(*) from public.warranty_products;
-- select relname, relrowsecurity as rls, relacl::text as acl from pg_class
-- where relnamespace = 'public'::regnamespace and relname = 'warranty_products';
