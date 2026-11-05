<!-- v0.1.0 | 2026-11-04 | 初版：獨立公開網站（與 ERP 完全分開） -->

# 樂萌全球保固與售後服務網站

消費者看的公開網站：全球地圖、台灣／北美海外服務中心、產品說明書入口、一鍵複製訂單資訊、保固登錄連結。

## 與 ERP 的關係（重要）

- **獨立專案**：自己的程式庫、自己的部署，不含 ERP 程式、資料庫連線或任何金鑰。
- **沒有資料庫**：目前是純展示頁。`lib/portalConfig.ts` 以外沒有 `process.env`。
- 說明書連到 ERP 媒體庫的**公開連結** `https://lemeng-erp.vercel.app/m/<編號>`（`MEDIA_BASE`），只是一般網址，不是資料連線。
- 一鍵複製：只在瀏覽器組字串，不送出任何資料。

## 開發

```
npm install
npm run dev      # http://localhost:3000
npm run build
```

⚠ 專案在 Google Drive 上，`node_modules` 請在 Drive 以外的資料夾安裝與建置（複製一份出去 build）。

## 要改的地方

| 想改 | 檔案 |
|---|---|
| 保固登錄連結（WordPress 關站前要換） | `lib/portalConfig.ts` → `WARRANTY_TW`、`WARRANTY_GLOBAL` |
| 產品、說明書編號 | `lib/portalConfig.ts` → `PRODUCTS` |
| 社群、模板、FAQ 連結 | `lib/portalConfig.ts` → `TW_LINKS`、`US_LINKS` |
| 說明書網域 | `lib/portalConfig.ts` → `MEDIA_BASE` |
| 安全標頭 | `next.config.mjs` |

## 待辦

- 保固承諾條款（正式文案）與保固期限規則，等提供後再加。
- 建立 GitHub／Vercel 專案、綁網域（WordPress 預計 2027/1 底關閉，網域 eipstore.online 2027/3/28 到期）。
- 日後自建保固登錄／查詢時，另開獨立資料庫（規劃見 ERP 專案 `docs/全球保固與售後服務網站_規劃報告_v1.0.pdf`）。
