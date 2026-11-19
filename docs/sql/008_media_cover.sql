-- 008：檔案加「預覽圖」欄位 cover_path（電子模板卡片顯示 PDF 第一頁）
-- 預覽圖檔案放在同一個私有 bucket（warranty-media），路徑存在這個欄位；公開頁面用 1 小時有效的簽名連結顯示。
-- 只新增一個可為空的欄位，現有資料不受影響。可重複執行。

alter table public.warranty_media_files
  add column if not exists cover_path text;

-- 驗證：欄位存在（現有檔案 cover_path 都是空的，等 ERP 上傳或批次產生）
select count(*) as docs, count(cover_path) as with_cover from public.warranty_media_files;
