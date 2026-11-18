-- v0.1.0 | 2026-11-18 | 說明書加「顯示國家」（countries）：專員上傳時選要顯示在哪些國家
--
-- 只動本網站自己的 warranty_media_files：新增一個欄位並補值，不動其他物件。可重複執行。
-- 值：國家代碼（tw、jp、kr、sg、au、us、ca、gb、de、fr）或 'intl'（全部海外，預設）。
--     合法代碼由程式（lib/countries.ts）檢查；這裡只限制格式與數量。
-- 補值：現有文件依語言自動設定 → 繁中 = {tw}、其他 = {intl}，所以上線後客人看到的與現在相同。

alter table public.warranty_media_files
  add column if not exists countries text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'warranty_media_files_countries_check') then
    alter table public.warranty_media_files
      add constraint warranty_media_files_countries_check
      check (cardinality(countries) <= 20 and array_to_string(countries, ',') ~ '^([a-z]{2,8}(,[a-z]{2,8})*)?$');
  end if;
end $$;

update public.warranty_media_files
set countries = case when lang = 'zh-TW' then array['tw'] else array['intl'] end
where cardinality(countries) = 0;

-- 驗證：應看到每種「語言 → 國家」的組合與筆數（預期：zh-TW → {tw} 12 筆、en → {intl} 9 筆）
select lang, countries, count(*) as docs
from public.warranty_media_files
group by lang, countries
order by lang;
