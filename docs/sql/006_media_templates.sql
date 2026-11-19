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
