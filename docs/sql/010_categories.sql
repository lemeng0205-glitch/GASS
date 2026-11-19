-- 010 | 2026-11-19 | 說明書類別清單（專員在 ERP「類別管理」自己新增／改名／排序／刪除，含中英文名稱）
-- 在保固網站的 Supabase SQL Editor 貼上執行。可重複執行。需要先執行過 009。
-- 先放入原本就有的兩個類別（觸控筆、鍵盤保護殼），所以執行後網站不會有任何變化。
-- 若這張表讀不到，網站會自動使用內建的這兩個類別（不會壞掉）。

create table if not exists public.warranty_categories (
  key        text primary key check (key ~ '^[a-z0-9-]{2,32}$'),
  name_zh    text not null check (char_length(name_zh) between 1 and 30),
  name_en    text not null check (char_length(name_en) between 1 and 60),
  sort       integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.warranty_categories enable row level security;
revoke all on public.warranty_categories from anon, authenticated;

insert into public.warranty_categories (key, name_zh, name_en, sort) values
  ('stylus',   '觸控筆',     'Styluses',       10),
  ('keyboard', '鍵盤保護殼', 'Keyboard cases', 20)
on conflict (key) do nothing;

-- 驗證：應看到 2 列
select key, name_zh, name_en, sort from public.warranty_categories order by sort;
