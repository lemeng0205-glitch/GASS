-- 007：媒體庫檔案加「用途」欄位 scope（全球服務中心 / 一般檔案）
-- global  = 全球服務中心（說明書、電子模板、對外給消費者的圖片）：會依「顯示國家」出現在保固網站
-- general = 一般媒體庫（例如雷雕系統圖片）：永遠不會出現在保固網站清單；/m/<編號> 的連結與 QR 照常可用
-- 現有檔案全部預設 global，上線後網站不會有任何變化。可重複執行。

alter table public.warranty_media_files
  add column if not exists scope text not null default 'global';

alter table public.warranty_media_files drop constraint if exists warranty_media_files_scope_check;
alter table public.warranty_media_files
  add constraint warranty_media_files_scope_check check (scope in ('global', 'general'));

-- 驗證：現有檔案應全部是 global
select scope, count(*) as docs from public.warranty_media_files group by scope;
