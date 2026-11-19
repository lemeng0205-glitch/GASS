-- 004 + 005 + 006 合併版：一次貼上執行即可（全部可重複執行；最後一個查詢會顯示結果）

-- v0.1.0 | 2026-11-19 | 說明書加「顯示在保固網站」（listed）
--
-- 只動本網站自己的 warranty_media_files：新增一個欄位，預設 true。可重複執行。
-- listed = true  → 出現在保固網站的產品清單（依顯示國家）
-- listed = false → 不出現在產品清單，但 QR／連結 /m/<編號> 照常可用（例：只隨貨附 QR 的說明書）
-- 現有文件全部預設為 true，上線後網站不會有任何變化。

alter table public.warranty_media_files
  add column if not exists listed boolean not null default true;

-- 驗證：應看到 listed = true、21 筆（或目前的總筆數）
select listed, count(*) as docs from public.warranty_media_files group by listed;


-- v0.1.0 | 2026-11-19 | 國家清單改存資料庫（專員在 ERP 的「國家管理」自己新增、停用）
--
-- 只新增 warranty_countries 一張表（RLS、公開訪客無權限）。可重複執行。
-- 台灣（tw）與「全部海外」（intl）是內建的，不在這張表裡。
-- 先放入目前地圖上已有的 9 個海外國家，所以上線後網站不會有任何變化。
-- 若這張表讀不到，網站會自動使用內建的這 9 個國家（不會壞掉）。

create table if not exists public.warranty_countries (
  code        text primary key check (code ~ '^[a-z]{2}$'),
  name_zh     text not null check (char_length(name_zh) between 1 and 40),
  name_en     text not null check (char_length(name_en) between 1 and 60),
  lon         numeric not null check (lon between -180 and 180),
  lat         numeric not null check (lat between -90 and 90),
  langs       text[] not null default array['en'] check (cardinality(langs) between 1 and 6),
  enabled     boolean not null default true,
  label_side  text not null default 'top' check (label_side in ('top', 'bottom', 'left', 'right')),
  hover_label boolean not null default true,   -- 地圖上標籤只在滑過時顯示（點多時避免文字互相蓋住）
  mobile_hide boolean not null default true,   -- 手機地圖太小：這個釘點只在電腦版顯示（下方按鈕不受影響）
  sort        integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.warranty_countries enable row level security;
revoke all on public.warranty_countries from anon, authenticated;

insert into public.warranty_countries (code, name_zh, name_en, lon, lat, langs, label_side, hover_label, mobile_hide, sort) values
  ('jp', '日本',   'Japan',          139,   36,   array['ja','en'], 'right',  false, false, 10),
  ('kr', '韓國',   'South Korea',    127.5, 37,   array['ko','en'], 'top',    true,  true,  20),
  ('sg', '新加坡', 'Singapore',      104,   1.3,  array['en'],      'bottom', false, false, 30),
  ('au', '澳洲',   'Australia',      134,   -25,  array['en'],      'bottom', false, false, 40),
  ('us', '美國',   'United States',  -98,   39,   array['en'],      'bottom', false, false, 50),
  ('ca', '加拿大', 'Canada',         -106,  56,   array['en','fr'], 'top',    false, true,  60),
  ('gb', '英國',   'United Kingdom', -2,    54,   array['en'],      'top',    false, false, 70),
  ('de', '德國',   'Germany',        10.5,  51,   array['de','en'], 'right',  true,  true,  80),
  ('fr', '法國',   'France',         2.5,   46.5, array['fr','en'], 'bottom', true,  true,  90)
on conflict (code) do nothing;

-- 驗證：應看到 9 列（jp、kr、sg、au、us、ca、gb、de、fr）
select code, name_zh, langs, enabled from public.warranty_countries order by sort;


-- 006：媒體庫新增「電子模板」類型（GoodNotes／Notability／ZIP）
-- 只擴充：類型多一個 template、bucket 多允許 zip 與 octet-stream。不動任何既有資料。
-- 可重複執行。

-- 1) 類型多一個 template（舊限制名稱為預設的 *_kind_check）
alter table public.warranty_media_files drop constraint if exists warranty_media_files_kind_check;
alter table public.warranty_media_files
  add constraint warranty_media_files_kind_check
  check (kind in ('manual', 'image', 'document', 'other', 'template'));

-- 2) bucket 多允許 zip 與 octet-stream（GoodNotes／Notability 檔案瀏覽器不認得，一律以 octet-stream 上傳；
--    程式端另外限制副檔名只能是 .goodnotes／.nbn／.note／.zip）
update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct x)
  from unnest(allowed_mime_types || array['application/zip', 'application/octet-stream']) as x
)
where id = 'warranty-media';

-- 檢查：應看到 kind 限制含 template、bucket 類型共 15 種
select 'constraint' as item, pg_get_constraintdef(oid) as value
from pg_constraint where conname = 'warranty_media_files_kind_check'
union all
select 'bucket mime count', array_length(allowed_mime_types, 1)::text
from storage.buckets where id = 'warranty-media';
