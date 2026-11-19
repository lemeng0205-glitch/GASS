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
