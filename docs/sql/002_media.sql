-- v0.1.0 | 2026-11-18 | 媒體庫（說明書等文件）搬到本網站的資料庫專案
--
-- 隔離原則（與 001 相同）
--   1. 只建立 warranty_ 開頭的資料表／函式，以及新的私有 bucket `warranty-media`；
--      不 ALTER / DROP 此專案任何既有物件（此專案同時有 iPad 選機網站）。
--   2. 資料表開啟 RLS 且不建立任何政策、並收回 anon / authenticated 權限 → 公開訪客一律不能讀寫。
--   3. bucket 為私有、沒有任何 storage 政策 → 只有伺服器端（Secret key）能存取；
--      瀏覽器只會拿到「一次性簽名上傳 token」或「5 分鐘簽名下載連結」。
-- 結構與 ERP 的 media_files / media_versions 相同，之後由腳本把資料搬過來。
-- 可重複執行（if not exists / on conflict）。

create table if not exists public.warranty_media_files (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null check (slug ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  lang               text not null default 'zh-TW' check (char_length(lang) between 2 and 12),
  title              text not null check (char_length(title) between 1 and 200),
  kind               text not null default 'manual' check (kind in ('manual', 'image', 'document', 'other')),
  sku                text,
  is_published       boolean not null default true,
  current_version_id uuid,
  view_count         integer not null default 0,
  created_by         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (slug, lang)
);

create table if not exists public.warranty_media_versions (
  id          uuid primary key default gen_random_uuid(),
  media_id    uuid not null references public.warranty_media_files(id) on delete cascade,
  version_no  integer not null,
  file_path   text not null unique,                 -- 同一個檔案只能登記一次（也擋掉重送的請求）
  file_name   text not null,
  mime_type   text not null,
  size_bytes  bigint not null default 0 check (size_bytes >= 0),
  uploaded_by text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (media_id, version_no)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'warranty_media_files_current_version_fkey') then
    alter table public.warranty_media_files
      add constraint warranty_media_files_current_version_fkey
      foreign key (current_version_id) references public.warranty_media_versions(id) on delete set null;
  end if;
end $$;

create index if not exists idx_warranty_media_versions_media
  on public.warranty_media_versions (media_id, version_no desc);

alter table public.warranty_media_files    enable row level security;
alter table public.warranty_media_versions enable row level security;
revoke all on public.warranty_media_files    from anon, authenticated;
revoke all on public.warranty_media_versions from anon, authenticated;

-- 開啟次數 +1（原子更新）。只有 service_role 能呼叫。
create or replace function public.warranty_media_inc_view(p_id uuid)
returns void
language sql
set search_path = public
as $$
  update public.warranty_media_files set view_count = view_count + 1 where id = p_id;
$$;
revoke all on function public.warranty_media_inc_view(uuid) from public, anon, authenticated;
grant execute on function public.warranty_media_inc_view(uuid) to service_role;

-- 私有 bucket：單檔 50MB（Supabase 免費方案全域上限）；允許類型與 ERP 媒體庫相同（13 種）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'warranty-media', 'warranty-media', false, 52428800,
  array[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/html'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 驗證（應看到 2 張表、1 個 bucket 且 public=false、RLS 皆為 true）
select 'table' as kind, tablename || ' rls=' || rowsecurity::text as name
from pg_tables where schemaname = 'public' and tablename like 'warranty_media_%'
union all
select 'bucket', id || ' public=' || public::text || ' limit=' || file_size_limit::text
from storage.buckets where id = 'warranty-media';
