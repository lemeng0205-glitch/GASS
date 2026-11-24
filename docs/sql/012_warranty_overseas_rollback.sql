-- v0.1.0 | 2026-11-24 | 回復用：撤銷 012_warranty_overseas.sql 的所有變更
--
-- 【草稿，尚未執行】
-- 警告：這會刪除 warranty_claims、warranty_mail_log 兩張表的全部資料，
--       以及 warranty_registrations 新增欄位（user_id, country, serial_no, consent_at, source）裡的資料。
--       warranty_registrations 原有的欄位與資料不受影響。
-- 執行前請先確認這些表與欄位裡沒有需要保留的資料。可重複執行。

begin;

drop table if exists public.warranty_mail_log;
drop table if exists public.warranty_claims;

drop index if exists public.warranty_registrations_user_id_idx;

alter table public.warranty_registrations drop constraint if exists warranty_registrations_country_check;
alter table public.warranty_registrations drop constraint if exists warranty_registrations_serial_no_check;
alter table public.warranty_registrations drop constraint if exists warranty_registrations_source_check;

alter table public.warranty_registrations
  drop column if exists user_id,
  drop column if exists country,
  drop column if exists serial_no,
  drop column if exists consent_at,
  drop column if exists source;

commit;
