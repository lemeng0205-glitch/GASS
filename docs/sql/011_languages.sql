-- 011 | 2026-11-19 | 語言清單改存資料庫（專員在 ERP「語言管理」自己新增海外語言、改顯示名稱、刪除）
-- 在保固網站的 Supabase SQL Editor 貼上執行。可重複執行。
-- 先放入目前內建的 19 種語言，所以執行後網站不會有任何變化。
-- 若這張表讀不到，網站會自動使用內建的這 19 種語言（不會壞掉）。

create table if not exists public.warranty_languages (
  code       text primary key check (code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$'),
  label      text not null check (char_length(label) between 1 and 40),   -- 該語言自己的名稱（例：Français），顯示在說明書的語言標籤上
  sort       integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.warranty_languages enable row level security;
revoke all on public.warranty_languages from anon, authenticated;

insert into public.warranty_languages (code, label, sort) values
  ('zh-TW', '繁體中文', 10), ('en', 'English', 20), ('ja', '日本語', 30), ('ko', '한국어', 40),
  ('de', 'Deutsch', 50), ('fr', 'Français', 60), ('es', 'Español', 70), ('it', 'Italiano', 80),
  ('pt', 'Português', 90), ('nl', 'Nederlands', 100), ('pl', 'Polski', 110), ('th', 'ไทย', 120),
  ('vi', 'Tiếng Việt', 130), ('id', 'Bahasa Indonesia', 140), ('ms', 'Bahasa Melayu', 150),
  ('tr', 'Türkçe', 160), ('ar', 'العربية', 170), ('ru', 'Русский', 180), ('zh-CN', '简体中文', 190)
on conflict (code) do nothing;

-- 驗證：應看到 19 列
select count(*) from public.warranty_languages;
