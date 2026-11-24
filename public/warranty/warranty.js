/* ===== 設定區：上線前要改的東西都在這裡 ===== */
const CONFIG = {
  // 接收網址：貼上 Google Apps Script 的「網頁應用程式網址」（…/exec）。留空 = 預覽模式（不存、不送）。
  // 後端要回 { "ok": true, "registration_id": "EWxxxxxxxx" }；程式在 google-sheet/Code.gs
  endpoint: "https://script.google.com/macros/s/AKfycbw5o7OZqxaWftbHhJ3xM-mK6X652t88ca6P2v4XwlovVOZfI1XZMBYd9CzuztWGHoaq/exec",
  // 隱私政策頁（模板，內容待負責人或法務確認）
  privacyUrl: "privacy.html",
  // 產品清單來自同資料夾的 products.csv（用 Excel 編輯）。on_sale 欄填 Y 的才會出現在選單。
  productsFile: "products.csv",
  // 海外通路清單（2026-11-17 業務提供）
  channels: ["Amazon", "eBay", "Newegg", "eiP Official Store", "Others"],
};
// 這支程式所在的資料夾；products.csv、privacy.html 都以它為準，頁面搬到別的路徑也找得到
const BASE = new URL(".", document.currentScript.src);
// 網址加上 ?demo 可以看效果而不寫入試算表（例如 index.html?demo）
const DEMO = !CONFIG.endpoint || new URLSearchParams(location.search).has("demo");

// 目前有販售的國家（2026-11-17 業務提供）
const COUNTRIES = ["Australia","Belgium","Canada","France","Germany","Japan","Mexico","Poland","Singapore","Spain","Sweden","United Kingdom","United States"];

const $ = (id) => document.getElementById(id);
const fill = (sel, items) => items.forEach((t) => { const o = document.createElement("option"); o.textContent = t; o.value = t; sel.appendChild(o); });
fill($("country"), COUNTRIES);
fill($("channel"), CONFIG.channels);

// 讀 products.csv：第一列是標題（product_name,on_sale,category），之後每列一個產品
function splitCsvLine(line) {
  const cells = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { cells.push(cur); cur = ""; }
    else cur += c;
  }
  cells.push(cur);
  return cells.map((s) => s.trim());
}
function parseProducts(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const out = [];
  lines.slice(1).forEach((line) => {
    const [name, onSale = "Y", category = ""] = splitCsvLine(line);
    if (name && onSale.toUpperCase() !== "N" && !out.some((p) => p.name === name)) out.push({ name, category });
  });
  return out;
}
// 有填 category 的產品會在選單裡依類別分組
function fillProducts(sel, items) {
  const groups = new Map();
  items.forEach((p) => {
    let parent = sel;
    if (p.category) {
      if (!groups.has(p.category)) { const g = document.createElement("optgroup"); g.label = p.category; sel.appendChild(g); groups.set(p.category, g); }
      parent = groups.get(p.category);
    }
    const o = document.createElement("option"); o.textContent = p.name; o.value = p.name; parent.appendChild(o);
  });
}
fetch(new URL(CONFIG.productsFile, BASE), { cache: "no-store" })
  .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
  .then((t) => {
    const items = parseProducts(t);
    if (!items.length) throw new Error("empty product list");
    fillProducts($("product"), items);
  })
  .catch(() => {
    $("formError").textContent = "The product list could not be loaded. Please refresh the page.";
    $("formError").hidden = false;
  });

const localToday = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
$("purchase_date").max = localToday();
if (DEMO) $("demoBanner").hidden = false;
if (CONFIG.privacyUrl) $("privacyLink").href = new URL(CONFIG.privacyUrl, BASE).href;
else $("privacyLink").addEventListener("click", (e) => e.preventDefault());

const form = $("form");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 欄位依序浮現：替每個欄位編號（用程式設定而不寫在 HTML 的 style 屬性裡，嚴格 CSP 下才不會被擋）
document.querySelectorAll("[data-i]").forEach((el) => el.style.setProperty("--i", el.dataset.i));
form.querySelectorAll(".field, #submit").forEach((el, i) => { el.classList.add("rise"); el.style.setProperty("--i", i + 4); });
// 卡片上跟著游標的柔光
document.querySelectorAll(".glass").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", (e.clientX - r.left) + "px");
    card.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
});

const checks = {
  name: (v) => v.trim().length >= 1,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  country: (v) => v !== "",
  product: (v) => v !== "",
  channel: (v) => v !== "",
  order_no: (v) => v.trim().length >= 1,
  purchase_date: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= localToday() && v >= "2000-01-01",
  consent: () => $("consent").checked,
};
const names = Object.keys(checks);
const wrap = (name) => form.querySelector(`[data-field="${name}"]`);
function validateField(name) {
  const ok = checks[name]($(name).value);
  wrap(name).classList.toggle("invalid", !ok);
  $(name).setAttribute("aria-invalid", String(!ok));
  return ok;
}
function updateProgress() {
  const done = names.filter((n) => checks[n]($(n).value)).length;
  $("bar").style.width = (done / names.length * 100) + "%";
}
names.forEach((name) => {
  $(name).addEventListener("change", () => { validateField(name); updateProgress(); });
  $(name).addEventListener("input", updateProgress);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("formError").hidden = true;
  const bad = names.filter((n) => !validateField(n));
  if (bad.length) { $(bad[0]).focus(); return; }
  if ($("website").value) return; // 機器人填了隱藏欄位

  const data = {
    name: $("name").value.trim(),
    email: $("email").value.trim().toLowerCase(),
    country: $("country").value,
    product: $("product").value,
    channel: $("channel").value,
    order_no: $("order_no").value.trim(),
    purchase_date: $("purchase_date").value,
    serial_no: $("serial_no").value.trim() || null,
    consent: true,
  };

  const btn = $("submit");
  btn.disabled = true; btn.textContent = "Submitting…";
  try {
    let regId, emailSent = false;
    if (DEMO) {
      await new Promise((r) => setTimeout(r, 900));
      regId = "EWDEMO2345";
    } else {
      // 用 text/plain 送出：Google Apps Script 不支援瀏覽器對 application/json 的預先檢查
      const res = await fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
        redirect: "follow",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const out = await res.json();
      if (!out.ok || !out.registration_id) throw new Error(out.error || "No registration id returned");
      regId = out.registration_id;
      emailSent = out.email_sent === true;
    }
    showDone(data, regId, emailSent);
  } catch (err) {
    $("formError").textContent = "Sorry, we could not save your registration. Please check your connection and try again.";
    $("formError").hidden = false;
    $("formError").scrollIntoView({ block: "center" });
  } finally {
    btn.disabled = false; btn.textContent = "Register warranty";
  }
});

function showDone(data, regId, emailSent) {
  form.hidden = true;
  $("doneText").textContent = DEMO
    ? "Preview only – this is a sample number and nothing was saved."
    : "Please keep your registration number. You will need it when you contact support."
      + (emailSent ? " We have also sent a confirmation email to " + data.email + "." : "");
  const box = $("regno");
  box.setAttribute("aria-label", "Registration number " + regId);
  [...regId].forEach((ch, i) => { const s = document.createElement("span"); s.textContent = ch; s.style.setProperty("--i", i); s.setAttribute("aria-hidden", "true"); box.appendChild(s); });
  box.hidden = false;
  const rows = [["Name", data.name], ["Email", data.email], ["Country / Region", data.country], ["Product", data.product],
    ["Purchased from", data.channel], ["Order number", data.order_no], ["Purchase date", data.purchase_date]];
  if (data.serial_no) rows.push(["Serial number", data.serial_no]);
  const dl = $("summary");
  rows.forEach(([k, v]) => {
    const d = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = k; dd.textContent = v; d.append(dt, dd); dl.appendChild(d);
  });
  $("done").hidden = false; $("done").classList.add("rise"); $("done").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  if (!reduceMotion) setTimeout(confetti, 650);
}

// 彩紙：用網站色系，約 2.5 秒後自動結束
function confetti() {
  const cv = $("confetti"), ctx = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.hidden = false; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const colors = ["#8c7f68", "#45423e", "#dccfb6", "#ead6d0", "#d3dccf", "#b9b4ac", "#4f6b55"];
  const ox = innerWidth / 2, oy = Math.min(innerHeight * 0.3, 220);
  const bits = Array.from({ length: 110 }, () => {
    const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: 5 + Math.random() * 6, h: 3 + Math.random() * 5,
      r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[Math.floor(Math.random() * colors.length)] };
  });
  const start = performance.now();
  (function frame(now) {
    const t = (now - start) / 2600;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (t >= 1) { cv.hidden = true; return; }
    bits.forEach((b) => {
      b.vy += 0.22; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t * t); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
    });
    requestAnimationFrame(frame);
  })(start);
}
