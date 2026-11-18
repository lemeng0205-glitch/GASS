// v0.1.0 | 2026-11-18 | 媒體庫 HTML 檔的安全顯示：補齊文件骨架 + 隔離標頭（由 ERP lib/mediaHtml.ts 搬來，行為一致）
// 為什麼補骨架：很多匯出的單頁 HTML 沒有 <!doctype> 與 viewport，直接開在手機上會縮成桌面寬度。
// 為什麼要 storage 墊片：sandbox（無 allow-same-origin）下讀 localStorage 會丟例外，墊片只在讀取失敗時改用記憶體版本。
// 安全：CSP sandbox 讓頁面成為無身分的隔離來源，腳本照跑，但拿不到本站的 cookie、也讀不到本站 API。
//       不加 allow-same-origin，這一點不能改。
export const HTML_SANDBOX_HEADERS: Record<string, string> = {
  'Content-Type':            'text/html; charset=utf-8',
  'Content-Security-Policy': 'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads',
  'X-Content-Type-Options':  'nosniff',
  'Referrer-Policy':         'no-referrer',
  'Cache-Control':           'no-store',
}

const STORAGE_SHIM =
  '<script>(function(){function m(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},' +
  'setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},' +
  'key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}' +
  "['localStorage','sessionStorage'].forEach(function(n){try{window[n].getItem('_')}catch(e){" +
  'try{Object.defineProperty(window,n,{value:m(),configurable:true})}catch(_){}}})})();</script>'

/** 補上 doctype、charset、viewport 與 storage 墊片；已經有的不重複加 */
export function prepareHtml(raw: string): string {
  let html = raw.replace(/^﻿/, '')   // 去掉檔案開頭的 BOM

  let inject = ''
  if (!/<meta[^>]+charset/i.test(html)) inject += '<meta charset="utf-8">'
  if (!/<meta[^>]+name\s*=\s*["']?viewport/i.test(html)) {
    inject += '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  }
  inject += STORAGE_SHIM

  const doctype = html.match(/^\s*<!doctype[^>]*>/i)
  if (doctype) html = html.slice(doctype[0].length)

  const head = html.match(/<head(\s[^>]*)?>/i)
  const root = html.match(/<html(\s[^>]*)?>/i)
  const anchor = head ?? root
  if (anchor && anchor.index !== undefined) {
    const at = anchor.index + anchor[0].length
    html = html.slice(0, at) + inject + html.slice(at)
  } else {
    html = inject + html
  }

  return (doctype ? doctype[0].trim() : '<!doctype html>') + '\n' + html
}
