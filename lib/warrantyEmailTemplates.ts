// v0.3.0 | 2026-11-25 | 放進專案（lib/）；內容沿用業務 v0.2.0 草稿，esc() 多跳脫單引號
// v0.2.0 | 2026-11-25 | 新增給客服的通知信 buildClaimStaffNotifyEmail；申請已收到信的 regNo 改為選填
// v0.1.0 | 2026-11-24 | 全球保固頁信件樣板（英文、eiP 樣式）：登錄確認／保固申請已收到／保固申請有更新
//
// 【草稿】在沒有 Node 的電腦上寫成，尚未經過編譯或實際寄送測試。放進專案後請先跑型別檢查。
// 結構比照 eiP 專案的 lib/emailTemplates.ts：每種信一個函式，回傳 { subject, html, text }。
//
// 規則：
// - 「寄給顧客」的信不放顧客自己輸入的文字（姓名、產品、問題描述都不放），避免表單被拿來對第三人寄垃圾內容。
//   唯一的自由文字是 buildClaimUpdateEmail 的 customerReply，那是客服寫的，且會經過 esc()。
// - 「寄給客服」的通知信（buildClaimStaffNotifyEmail）才會放顧客輸入的內容，收件人只能是客服信箱。
// - 絕不放內部欄位（warranty_claims.staff_note）。
// - 只用信件軟體普遍支援的寫法：表格排版、行內樣式、不放圖片。
// - 客服信箱由呼叫端傳入（來自環境變數），這個檔案不寫死。

const BRAND_NAME = "eiP";
const INSTAGRAM_URL = "https://www.instagram.com/eip__official/";
const INSTAGRAM_HANDLE = "@eip__official";

const FONT = "font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
const INK = "#45423e";
const SOFT = "#7a756e";
const RULE = "#e2ded7";
const BG = "#f3f2ef";
const ACCENT = "#8c7f68";
const LIGHT = "#fbf8f2";

export type BuiltEmail = { subject: string; html: string; text: string };

export type ClaimStatus =
  | "received"
  | "in_review"
  | "awaiting_customer"
  | "approved"
  | "rejected"
  | "closed";

const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  received: "Received",
  in_review: "In review",
  awaiting_customer: "Waiting for your reply",
  approved: "Approved",
  rejected: "Declined",
  closed: "Closed",
};

// ── 共用元件 ──────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(eyebrow: string, body: string, supportEmail: string, senderName: string): string {
  const mail = esc(supportEmail);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;">
<div style="margin:0;padding:28px 12px;background:${BG};${FONT}color:${INK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
<tr><td style="padding:0 6px 16px;${FONT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="font-size:30px;line-height:1;font-weight:700;letter-spacing:-0.5px;color:${INK};${FONT}">${BRAND_NAME}</td>
    <td align="right" style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${SOFT};${FONT}">${esc(eyebrow)}</td>
  </tr></table>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${RULE};border-radius:16px;padding:32px 28px;${FONT}">
  <div style="width:44px;height:4px;background:${ACCENT};border-radius:2px;margin:0 0 22px;font-size:0;line-height:0;">&nbsp;</div>
  ${body}
  <p style="margin:24px 0 18px;font-size:16px;line-height:1.6;color:${INK};">If you have any questions, you are welcome to contact us anytime by email.</p>
  <a href="mailto:${mail}" style="display:inline-block;border:1px solid ${INK};border-radius:10px;padding:11px 20px;font-size:15px;font-weight:600;color:${INK};text-decoration:none;">${mail}</a>
</td></tr>
<tr><td style="padding:14px 0 0;${FONT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="background:${INK};border-radius:16px;padding:20px 28px;${FONT}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-size:15px;line-height:1.5;color:${LIGHT};${FONT}"><strong style="font-size:16px;">Stay in touch with ${BRAND_NAME}</strong><br>
      <span style="color:#d9d4cb;">New products, tips and updates on Instagram.</span></td>
      <td align="right" style="white-space:nowrap;padding-left:12px;"><a href="${INSTAGRAM_URL}" style="display:inline-block;background:${LIGHT};border-radius:10px;padding:10px 16px;font-size:14px;font-weight:600;color:${INK};text-decoration:none;${FONT}">${INSTAGRAM_HANDLE}</a></td>
    </tr></table>
  </td></tr></table>
</td></tr>
<tr><td style="padding:18px 6px 0;font-size:12px;line-height:1.6;color:${SOFT};${FONT}">
  ${esc(senderName)}<br>
  You are receiving this email because this address was used for a product warranty with us.
  If this was not you, please let us know at <a href="mailto:${mail}" style="color:#6b5f4b;">${mail}</a>.
</td></tr>
</table></div>
</body></html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:23px;line-height:1.3;font-weight:600;color:${INK};">${esc(text)}</h1>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${INK};">${esc(text)}</p>`;
}

function codeBox(label: string, code: string): string {
  return `<p style="margin:0 0 8px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${SOFT};">${esc(label)}</p>
  <div style="display:inline-block;background:${INK};color:${LIGHT};font-family:Consolas,Menlo,'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:4px;padding:12px 18px;border-radius:10px;">${esc(code)}</div>`;
}

function noteBox(title: string, bodyHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;"><tr>
  <td style="background:${BG};border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.6;color:${INK};${FONT}">
  <strong style="display:block;margin-bottom:2px;">${esc(title)}</strong>${bodyHtml}</td></tr></table>`;
}

function footerText(supportEmail: string, senderName: string): string {
  return [
    "",
    `If you have any questions, you are welcome to contact us anytime by email at ${supportEmail}.`,
    "",
    "Best regards,",
    senderName,
    "",
    `Follow us on Instagram: ${INSTAGRAM_URL}`,
    "",
    "---",
    "You are receiving this email because this address was used for a product warranty with us. " +
      `If this was not you, please let us know at ${supportEmail}.`,
  ].join("\n");
}

type Common = { supportEmail: string; senderName: string };

// ── 1. 登錄確認信（顧客完成保固登錄後）── kind: registration_confirm ──

export function buildRegistrationConfirmEmail(data: Common & { regNo: string }): BuiltEmail {
  const body = `
  ${heading("Thank you for registering")}
  ${para("Thank you for your purchase and for registering your warranty.")}
  ${codeBox("Your registration number", data.regNo)}
  ${noteBox("One-year functional warranty", "Your product is covered by a one-year functional warranty.")}`;

  return {
    subject: `Your warranty registration is confirmed (${data.regNo})`,
    html: shell("Warranty Registration", body, data.supportEmail, data.senderName),
    text: [
      "Hello,",
      "",
      "Thank you for your purchase and for registering your warranty.",
      "",
      `Your registration number: ${data.regNo}`,
      "",
      "Your product is covered by a one-year functional warranty.",
      footerText(data.supportEmail, data.senderName),
    ].join("\n"),
  };
}

// ── 2. 保固申請已收到（顧客送出保固申請後）── kind: claim_received ──

export function buildClaimReceivedEmail(
  data: Common & { claimNo: string; regNo?: string | null },
): BuiltEmail {
  // 沒登錄過保固的顧客也能提出申請，所以 regNo 可能沒有
  const regNo = (data.regNo ?? "").trim();
  const body = `
  ${heading("We have received your warranty request")}
  ${para("Thank you for contacting us. Our support team will review your request and reply to you by email.")}
  ${codeBox("Your request number", data.claimNo)}
  ${regNo ? noteBox("Related warranty registration", esc(regNo)) : ""}`;

  return {
    subject: `We have received your warranty request (${data.claimNo})`,
    html: shell("Warranty Request", body, data.supportEmail, data.senderName),
    text: [
      "Hello,",
      "",
      "Thank you for contacting us. Our support team will review your request and reply to you by email.",
      "",
      `Your request number: ${data.claimNo}`,
      regNo ? `Related warranty registration: ${regNo}` : "",
      footerText(data.supportEmail, data.senderName),
    ].join("\n"),
  };
}

// ── 2b. 給客服的通知信（顧客送出保固申請後，寄到客服信箱）── kind: claim_staff_notify ──
//
// 這封信的收件人是客服，不是顧客，所以可以（也必須）放顧客輸入的內容；全部經過 esc()。
// 寄送時 Reply-To 要設成顧客的 Email：客服按「回覆」就直接寫給顧客。
// 客服回覆時會引用這封信，所以標籤用英文、版面保持簡單，也不放任何內部欄位。

export type ClaimStaffNotifyData = {
  claimNo: string;
  regNo?: string | null;
  contactName: string;
  contactEmail: string;
  country?: string | null;
  product: string;
  serialNo?: string | null;
  phone?: string | null;
  description: string;
};

export function buildClaimStaffNotifyEmail(data: ClaimStaffNotifyData): BuiltEmail {
  const rows: [string, string][] = [
    ["Request number", data.claimNo],
    ["Warranty registration", (data.regNo ?? "").trim() || "Not registered"],
    ["Name", data.contactName],
    ["Email", data.contactEmail],
    ["Country", (data.country ?? "").trim().toUpperCase() || "-"],
    ["Product", data.product],
    ["Serial number", (data.serialNo ?? "").trim() || "-"],
    ["Phone", (data.phone ?? "").trim() || "-"],
  ];
  const trs = rows
    .map(
      ([k, v]) => `<tr>
      <td style="padding:6px 12px 6px 0;color:${SOFT};font-size:14px;white-space:nowrap;vertical-align:top;${FONT}">${esc(k)}</td>
      <td style="padding:6px 0;color:${INK};font-size:14px;${FONT}">${esc(v)}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px 12px;background:#ffffff;${FONT}color:${INK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
<tr><td style="padding:0 0 14px;font-size:18px;font-weight:700;color:${INK};${FONT}">${BRAND_NAME} warranty request ${esc(data.claimNo)}</td></tr>
<tr><td style="padding:0 0 16px;font-size:13px;line-height:1.5;color:${SOFT};${FONT}">Reply to this email to answer the customer directly.</td></tr>
<tr><td style="border-top:1px solid ${RULE};padding:12px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">${trs}</table>
</td></tr>
<tr><td style="border-top:1px solid ${RULE};padding:14px 0 6px;font-size:13px;color:${SOFT};${FONT}">Message from the customer</td></tr>
<tr><td style="background:${BG};border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.6;color:${INK};white-space:pre-wrap;${FONT}">${esc(data.description)}</td></tr>
</table>
</body></html>`;

  return {
    subject: `[${BRAND_NAME} Warranty] ${data.claimNo} - ${data.product}`.slice(0, 160),
    html,
    text: [
      `${BRAND_NAME} warranty request ${data.claimNo}`,
      "Reply to this email to answer the customer directly.",
      "",
      ...rows.map(([k, v]) => `${k}: ${v}`),
      "",
      "Message from the customer:",
      data.description,
    ].join("\n"),
  };
}

// ── 3. 保固申請有更新（客服在後台更新狀態或回覆後）── kind: claim_update ──

export function buildClaimUpdateEmail(
  data: Common & { claimNo: string; status: ClaimStatus; customerReply?: string | null },
): BuiltEmail {
  const statusLabel = CLAIM_STATUS_LABEL[data.status] ?? data.status;
  const reply = (data.customerReply ?? "").trim();
  const replyBox = reply
    ? noteBox("Message from our support team", `<span style="white-space:pre-wrap;">${esc(reply)}</span>`)
    : "";

  const body = `
  ${heading("Your warranty request has been updated")}
  ${para("There is an update on your warranty request. Please see the details below.")}
  ${codeBox("Your request number", data.claimNo)}
  ${noteBox("Current status", esc(statusLabel))}
  ${replyBox}`;

  return {
    subject: `Update on your warranty request (${data.claimNo})`,
    html: shell("Warranty Request", body, data.supportEmail, data.senderName),
    text: [
      "Hello,",
      "",
      "There is an update on your warranty request.",
      "",
      `Your request number: ${data.claimNo}`,
      `Current status: ${statusLabel}`,
      reply ? `\nMessage from our support team:\n${reply}` : "",
      footerText(data.supportEmail, data.senderName),
    ].join("\n"),
  };
}
