-- 009 | 2026-11-19 | 說明書類別：每份文件可指定類別（觸控筆／鍵盤保護殼／自訂），國家頁依類別分組
-- 在保固網站的 Supabase SQL Editor 貼上執行。只新增欄位，不影響既有資料。
-- 值：'stylus'（觸控筆）、'keyboard'（鍵盤保護殼）、或自訂類別的名稱文字；空值 = 沿用產品設定檔的分類，沒有就歸「其他」。
alter table public.warranty_media_files add column if not exists category text;
