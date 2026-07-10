/**
 * pdf.js  (backend/src/utils/pdf.js)
 * LedgerFlow invoice PDF generator.
 *
 * Structure deliberately kept simple: <body> IS the page (no wrapper div,
 * no absolute-positioned footer, no @page CSS, no preferCSSPageSize).
 * That combination was the source of every page-size/footer bug in earlier
 * versions of this file — this version returns to the simpler model that
 * reliably produces a correctly-sized single page, and layers the newer
 * features (light theme, page sizes, real data, payment confirmation) on
 * top of it without reintroducing that complexity.
 */

const { calculateInvoice } = require("./invoiceCalculator");
const { amountToWords }    = require("./amountToWords");
const { generateUpiQr }    = require("./qr.service");

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(amount, currency = "INR") {
  const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", CAD: "CA$" };
  const sym = symbols[currency] || currency + " ";
  return `${sym}${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_COLORS = {
  DRAFT:    { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" },
  SENT:     { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
  PAID:     { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  OVERDUE:  { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
  CANCELLED:{ bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
};

// Supported paper sizes. Puppeteer accepts these strings directly as
// page.pdf({ format }). widthMm drives the HTML's own width so content is
// laid out for the actual target size, not always A4.
const PAGE_SIZES = {
  A4:     { widthMm: 210,   heightPx: 1123, puppeteerFormat: "A4" },
  A5:     { widthMm: 148,   heightPx: 794,  puppeteerFormat: "A5" },
  A6:     { widthMm: 105,   heightPx: 559,  puppeteerFormat: "A6" },
  LETTER: { widthMm: 215.9, heightPx: 1056, puppeteerFormat: "Letter" },
  LEGAL:  { widthMm: 215.9, heightPx: 1344, puppeteerFormat: "Legal" },
};

function resolvePageSize(size) {
  const key = String(size || "A4").toUpperCase();
  return PAGE_SIZES[key] || PAGE_SIZES.A4;
}

function dueDateColor(invoice) {
  if (invoice.status === "PAID") return { color: "#16a34a", label: "Paid" };
  if (!invoice.dueDate) return { color: "#475569", label: null };
  const due = new Date(invoice.dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (due < today) return { color: "#dc2626", label: "Overdue" };
  if (due.getTime() === today.getTime()) return { color: "#ea580c", label: "Due today" };
  return { color: "#475569", label: null };
}

// Deterministic barcode bars from a string — static server-rendered SVG.
function buildBarcodeSvg(value, { width = 220, height = 54 } = {}) {
  const hashCode = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return h;
  };
  const seed = hashCode(String(value));
  const rand = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  const barCount = 46;
  const spacing = 1.6;
  const bars = Array.from({ length: barCount }).map((_, i) => ({ w: rand(seed + i) > 0.7 ? 2.4 : 1.3 }));
  const totalW = bars.reduce((acc, b) => acc + b.w + spacing, 0) - spacing;
  let x = (width - totalW) / 2;
  const rects = bars.map((b) => {
    const rect = `<rect x="${x.toFixed(2)}" y="4" width="${b.w}" height="${height - 16}" fill="#334155"/>`;
    x += b.w + spacing;
    return rect;
  }).join("");
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

// LedgerFlow SVG logo — matches the official brand mark (kept unchanged).
const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="8" fill="url(#lg)"/>
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
  </defs>
  <path d="M10 6h11l7 7v17a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
  <path d="M21 6v7h7" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="round"/>
  <polyline points="10,24 14,20 17,22 21,16 25,12" fill="none" stroke="url(#teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="25,12 22,13.5 23.5,16" fill="#22d3ee"/>
  <defs>
    <linearGradient id="teal" x1="10" y1="24" x2="25" y2="12" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
</svg>`;

const CHECK_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

// ─── HTML template ────────────────────────────────────────────────────────────

async function buildHtml({ invoice, user, client, calc, qrDataUrl, size }) {
  const status = invoice.status || "DRAFT";
  const sc = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
  const due = dueDateColor(invoice);
  const page = resolvePageSize(size);
  const small = page.widthMm < 150;

  // No fabricated fallbacks — real data only, or an honest placeholder.
  const biz = {
    name:    user?.businessName || "Your Business Name",
    address: user?.address      || null,
    email:   user?.email        || null,
    phone:   user?.phone        || null,
    gstin:   user?.gstNumber    || null,
  };
  const bizIsIncomplete = !user?.businessName || !user?.address || !user?.gstNumber;

  const itemRows = invoice.items.map((item, i) => `
    <tr class="${i % 2 === 0 ? "re" : "ro"}">
      <td class="tc">${i + 1}</td>
      <td class="desc">${item.description}</td>
      <td class="tr">${Number(item.quantity)}</td>
      <td class="tr">${fmt(item.unitPrice, invoice.currency)}</td>
      <td class="tr fw">${fmt(item.amount, invoice.currency)}</td>
    </tr>`).join("");

  const discountRow = calc.discountAmount > 0 ? `
    <tr class="cr">
      <td>Discount (${Number(invoice.discountPercent)}%)</td>
      <td class="tr" style="color:#dc2626;font-weight:600">- ${fmt(calc.discountAmount, invoice.currency)}</td>
    </tr>` : "";

  const taxRows = calc.sameState && calc.cgst > 0 ? `
    <tr class="cr"><td>Taxable Amount</td><td class="tr">${fmt(calc.taxableAmount, invoice.currency)}</td></tr>
    <tr class="cr"><td>CGST (${calc.taxPercent / 2}%)</td><td class="tr">${fmt(calc.cgst, invoice.currency)}</td></tr>
    <tr class="cr"><td>SGST (${calc.taxPercent / 2}%)</td><td class="tr">${fmt(calc.sgst, invoice.currency)}</td></tr>`
  : calc.igst > 0 ? `
    <tr class="cr"><td>Taxable Amount</td><td class="tr">${fmt(calc.taxableAmount, invoice.currency)}</td></tr>
    <tr class="cr"><td>IGST (${calc.taxPercent}%)</td><td class="tr">${fmt(calc.igst, invoice.currency)}</td></tr>`
  : "";

  const qrSection = qrDataUrl
    ? `<div class="card qr-card">
        <div class="ct">SCAN &amp; PAY</div>
        <img src="${qrDataUrl}" class="qr-img" alt="UPI QR"/>
        <div class="upi-lbl">${user?.upiId || "UPI"}</div>
       </div>`
    : `<div class="card qr-card">
        <div class="ct">PAYMENT</div>
        <div class="qr-na">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none"><rect width="60" height="60" rx="6" fill="#f1f5f9"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#0891b2" font-size="8.5" font-family="Arial">No QR</text></svg>
        </div>
        <div class="upi-lbl">Set up UPI in Settings</div>
       </div>`;

  const hasBank = user?.bankName || user?.bankAccountNumber;
  const bankCard = `
    <div class="card">
      <div class="ct">Payment Details</div>
      ${user?.upiId ? `<div class="bi"><b>UPI:</b> ${user.upiId}</div>` : ""}
      ${hasBank ? `
        <table class="it" style="margin-top:${user?.upiId ? "4px" : "0"}">
          ${user.bankName ? `<tr><td class="lbl">Bank</td><td>:</td><td>${user.bankName}</td></tr>` : ""}
          ${user.bankAccountHolder ? `<tr><td class="lbl">A/C Holder</td><td>:</td><td>${user.bankAccountHolder}</td></tr>` : ""}
          ${user.bankAccountNumber ? `<tr><td class="lbl">A/C Number</td><td>:</td><td>${user.bankAccountNumber}</td></tr>` : ""}
          ${user.bankIfsc ? `<tr><td class="lbl">IFSC</td><td>:</td><td>${user.bankIfsc}</td></tr>` : ""}
        </table>` : ""}
      ${!user?.upiId && !hasBank ? `<div class="bi muted">Bank &amp; UPI details not yet added.<br/>Update in Settings → Payments.</div>` : ""}
    </div>`;

  const txnRef = `TXN-${String(invoice.invoiceNumber || invoice.id || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
  const gateway = user?.paymentGateway || "Razorpay";
  // Real invoice detail page (has the Pay Now button), not a fake external
  // domain — CLIENT_URL is the same var used elsewhere for redirects.
  const payUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard/invoices/${invoice.id}`;
  const paidCard = status === "PAID" ? `
    <div class="paid-card">
      <div class="paid-check">${CHECK_SVG}</div>
      <div class="paid-title">Payment Received</div>
      <div class="paid-sub">Thank you for your business!</div>
      <div class="paid-dash"></div>
      <div class="paid-grid">
        <div><div class="paid-lbl">Paid On</div><div class="paid-val">${fmtDate(invoice.paidAt || invoice.dueDate)}</div></div>
        <div class="paid-r"><div class="paid-lbl">Amount</div><div class="paid-val paid-amt">${fmt(calc.total, invoice.currency)}</div></div>
      </div>
      <div class="paid-gw">
        <span class="paid-gw-dot"></span>
        <div><div class="paid-gw-name">${gateway}</div><div class="paid-gw-ref">Ref: ${txnRef}</div></div>
      </div>
      <div class="paid-dash"></div>
      <div class="paid-barcode">${buildBarcodeSvg(invoice.invoiceNumber)}</div>
      <div class="paid-barcode-val">${invoice.invoiceNumber}</div>
    </div>` : "";

  const watermarkText = { DRAFT: "DRAFT", PAID: "PAID", CANCELLED: "CANCELLED", OVERDUE: "OVERDUE" }[status] || "";
  const watermark = watermarkText
    ? `<div style="position:fixed;top:40%;left:0;right:0;text-align:center;font-size:${small ? 60 : 105}px;font-weight:900;color:#0f172a;opacity:0.045;transform:rotate(-32deg);letter-spacing:6px;pointer-events:none;z-index:0;">${watermarkText}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<style>
/* No external font import — a Google Fonts @import here previously made
   PDF layout depend on a live network fetch inside Puppeteer, which was
   slow/flaky and silently changed text wrapping between renders. System
   fonts render identically every time. */
*{box-sizing:border-box;margin:0;padding:0}
html,body{
  width:${page.widthMm}mm;
  font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
  font-size:${small ? 8 : 10.5}px;
  color:#1e293b;
  background:#f8fafc;
  line-height:1.45;
}
body{padding:${small ? "10px 14px 8px" : "20px 26px 14px"};position:relative}

.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #e2e8f0}
.logo-wrap{display:flex;align-items:center;gap:8px}
.l-text{line-height:1}
.l-name{font-size:17px;font-weight:900;color:#0f172a;letter-spacing:-.3px}
.l-name span{color:#0891b2}
.l-sub{font-size:8.5px;color:#94a3b8;margin-top:2px}
.inv-block{text-align:right}
.inv-word{font-size:30px;font-weight:900;color:#0f172a;letter-spacing:-1px;line-height:1}
.mt{margin-top:6px;border-collapse:collapse}
.mt td{padding:1px 0;font-size:9.5px}
.ml{color:#94a3b8;padding-right:5px;text-align:left;white-space:nowrap}
.ms{color:#cbd5e1;padding:0 3px}
.mv{font-weight:600;color:#334155}
.mv.inv-num{font-weight:900;color:#0f172a;font-size:10.5px}
.due-pill{font-weight:700;color:var(--due-color)}
.due-tag{font-size:7.5px;font-weight:700;margin-left:5px;padding:1px 5px;border-radius:8px;background:rgba(15,23,42,.06);color:var(--due-color);vertical-align:middle}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:.5px;background:${sc.bg};color:${sc.color};border:1px solid ${sc.border}}

.biz-row{margin-bottom:9px}
.biz-name{font-size:11.5px;font-weight:700;color:#0f172a}
.biz-row p{font-size:9px;color:#64748b;margin-top:1px}
.gstin{font-size:9.5px;font-weight:700;color:#475569;margin-top:3px}
.biz-hint{font-size:8.5px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:5px;padding:3px 8px;display:inline-block;margin-top:4px}

.cards{display:grid;grid-template-columns:1fr 140px 1fr;gap:8px;margin-bottom:9px}
.card{border:1px solid #e2e8f0;border-radius:8px;padding:9px 11px;background:#ffffff}
.ct{font-size:8.5px;font-weight:700;color:#0891b2;letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px}
.bn{font-size:11.5px;font-weight:700;color:#0f172a;margin-bottom:2px}
.bi{font-size:9px;color:#475569;margin-bottom:1px}
.bi.muted{color:#94a3b8;font-style:italic;line-height:1.5}
.bg{font-size:9px;font-weight:600;color:#334155;margin-top:3px}
.it{width:100%;border-collapse:collapse}
.it td{padding:1.6px 0;font-size:8.5px;vertical-align:top;color:#334155}
.it .lbl{color:#94a3b8;white-space:nowrap;padding-right:3px;min-width:60px}
.it td:nth-child(2){color:#cbd5e1;padding:0 3px}

.qr-card{text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 8px}
.qr-img{width:112px;height:112px;border-radius:5px;border:2px solid #e2e8f0;margin:2px 0}
.qr-na{margin:6px 0}
.upi-lbl{font-size:8.5px;color:#94a3b8;margin-top:2px}

.items-tbl{width:100%;border-collapse:collapse;margin-bottom:9px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.items-tbl thead tr{background:#0891b2}
.items-tbl thead th{padding:7px 9px;font-size:9px;font-weight:700;color:#ffffff;letter-spacing:.3px;text-align:left}
.items-tbl thead th.tr{text-align:right}
.tc{text-align:center;width:28px}
.tr{text-align:right}
.fw{font-weight:700;color:#0f172a}
.desc{color:#334155}
.re{background:#ffffff}.ro{background:#f8fafc}
.items-tbl tbody td{padding:6px 9px;font-size:10px;border-top:1px solid #eef2f6;color:#64748b}

.tot-wrap{display:flex;justify-content:flex-end;margin-bottom:7px}
.tot-tbl{width:270px;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.cr td{padding:3.5px 9px;font-size:10px;border-bottom:1px solid #f1f5f9;background:#ffffff}
.cr td:first-child{color:#94a3b8}
.cr td:last-child{text-align:right;font-weight:500;color:#334155}
.total-row{background:#0891b2}
.total-row td{padding:7px 9px;font-size:12.5px;font-weight:900;color:#ffffff}
.total-row td:last-child{text-align:right;color:#ffffff}

.words{border:1px solid #e2e8f0;border-radius:6px;padding:6px 11px;background:#ffffff;margin-bottom:7px;display:flex;align-items:center;gap:8px}
.wl{font-size:8.5px;font-weight:700;color:#0891b2;white-space:nowrap;text-transform:uppercase;letter-spacing:.5px}
.wt{font-size:10.5px;font-weight:600;color:#1e293b}

.paid-card{border:1px solid #bbf7d0;border-radius:10px;background:linear-gradient(180deg,#f0fdf4,#ffffff 60%);padding:14px 18px 12px;margin-bottom:9px;text-align:center}
.paid-check{width:34px;height:34px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;margin:0 auto 6px}
.paid-title{font-size:13.5px;font-weight:800;color:#0f172a}
.paid-sub{font-size:9px;color:#16a34a;margin-top:2px;margin-bottom:9px}
.paid-dash{border-top:1.5px dashed #bbf7d0;margin:8px 0}
.paid-grid{display:flex;justify-content:space-between;text-align:left;padding:0 4px}
.paid-r{text-align:right}
.paid-lbl{font-size:7.5px;color:#65a380;text-transform:uppercase;letter-spacing:.5px}
.paid-val{font-size:10.5px;font-weight:700;color:#1e293b;margin-top:1px}
.paid-amt{color:#16a34a;font-size:12px}
.paid-gw{display:flex;align-items:center;gap:8px;justify-content:center;padding:6px 0 2px}
.paid-gw-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0}
.paid-gw-name{font-size:9.5px;font-weight:700;color:#1e293b;text-align:left}
.paid-gw-ref{font-size:8px;color:#65a380;text-align:left;font-family:monospace}
.paid-barcode{display:flex;justify-content:center;margin-top:4px}
.paid-barcode-val{font-size:8px;color:#65a380;letter-spacing:2px;margin-top:2px;font-family:monospace}

.bot{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px}
.note-card{border:1px solid #e2e8f0;border-radius:8px;padding:9px 11px;background:#ffffff}
.nt{font-size:8.5px;font-weight:700;color:#0891b2;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px}
.nl{padding-left:12px}
.nl li{font-size:9px;color:#64748b;margin-bottom:2.5px}
.pay-card{border:1px solid #e2e8f0;border-radius:8px;padding:9px 11px;background:#ffffff}
.pt{font-size:9.5px;font-weight:700;color:#0f172a;margin-bottom:2px}
.ps{font-size:8.5px;color:#94a3b8;margin-bottom:5px}
.pay-btn{display:block;text-align:center;text-decoration:none;background:#0891b2;color:#ffffff;font-weight:800;font-size:10px;border-radius:6px;padding:7px 0;margin-bottom:4px;letter-spacing:.3px}
.pl{font-size:7.5px;color:#94a3b8;word-break:break-all;text-align:center;display:block;margin-bottom:5px}
.pp{display:flex;align-items:center;gap:5px;font-size:8.5px;color:#94a3b8;justify-content:center}
.rp{font-weight:700;color:#3395FF}

.sig{display:flex;justify-content:flex-end;margin-bottom:10px;margin-top:16px}
.sig-box{text-align:center;width:170px}
.sig-line{border-top:1px solid #cbd5e1;margin-top:26px;padding-top:4px}
.sig-label{font-size:8.5px;font-weight:700;color:#1e293b}
.sig-co{font-size:8px;color:#94a3b8;margin-top:1px}

.footer{border-top:1px solid #e2e8f0;padding-top:7px;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;color:#94a3b8}
.footer a{color:#0891b2;text-decoration:none}
.fg{color:#94a3b8}
.fg span{color:#0891b2;font-weight:600}

.content{position:relative;z-index:1}
</style></head>
<body>
${watermark}
<div class="content">

<div class="hdr">
  <div class="logo-wrap">
    ${LOGO_SVG}
    <div class="l-text">
      <div class="l-name">Ledger<span>Flow</span></div>
      <div class="l-sub">Smart Invoicing for Modern Businesses</div>
    </div>
  </div>
  <div class="inv-block">
    <div class="inv-word">INVOICE</div>
    <table class="mt">
      <tr><td class="ml">Invoice Number</td><td class="ms">:</td><td class="mv inv-num">${invoice.invoiceNumber}</td></tr>
      <tr><td class="ml">Issue Date</td><td class="ms">:</td><td class="mv">${fmtDate(invoice.issueDate)}</td></tr>
      <tr><td class="ml">Due Date</td><td class="ms">:</td><td class="mv"><span class="due-pill" style="--due-color:${due.color}">${fmtDate(invoice.dueDate)}</span>${due.label ? `<span class="due-tag" style="--due-color:${due.color}">${due.label}</span>` : ""}</td></tr>
      <tr><td class="ml">Place of Supply</td><td class="ms">:</td><td class="mv">${user?.state || "—"}</td></tr>
      <tr><td class="ml">Status</td><td class="ms">:</td><td class="mv"><span class="badge">${status}</span></td></tr>
    </table>
  </div>
</div>

<div class="biz-row">
  <div class="biz-name">${biz.name}</div>
  ${biz.address ? `<p>${biz.address}</p>` : ""}
  ${biz.email ? `<p>✉ ${biz.email}${biz.phone ? "  &nbsp;&nbsp; 📞 " + biz.phone : ""}</p>` : ""}
  ${biz.gstin ? `<p class="gstin">GSTIN: ${biz.gstin}</p>` : ""}
  ${bizIsIncomplete ? `<div class="biz-hint">⚠ Business profile incomplete — add your address, GSTIN and logo in Settings → Business for a complete invoice.</div>` : ""}
</div>

<div class="cards">
  <div class="card">
    <div class="ct">Bill To</div>
    <div class="bn">${client.companyName}</div>
    ${client.contactName ? `<div class="bi">${client.contactName}</div>` : ""}
    ${client.email ? `<div class="bi">✉ ${client.email}</div>` : ""}
    ${client.phone ? `<div class="bi">📞 ${client.phone}</div>` : ""}
    ${client.notes ? `<div class="bg">GSTIN: ${client.notes}</div>` : ""}
  </div>
  ${qrSection}
  ${bankCard}
</div>

<table class="items-tbl">
  <thead>
    <tr>
      <th class="tc">#</th>
      <th>Description</th>
      <th class="tr">Qty</th>
      <th class="tr">Unit Price (${invoice.currency})</th>
      <th class="tr">Amount (${invoice.currency})</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="tot-wrap">
  <table class="tot-tbl">
    <tr class="cr"><td>Subtotal</td><td class="tr">${fmt(calc.subtotal, invoice.currency)}</td></tr>
    ${discountRow}
    ${taxRows}
    <tr class="total-row"><td>TOTAL</td><td>${fmt(calc.total, invoice.currency)}</td></tr>
  </table>
</div>

<div class="words">
  <span class="wl">Amount in Words</span>
  <span class="wt">${amountToWords(calc.total, invoice.currency)}</span>
</div>

${paidCard}

<div class="bot">
  <div class="note-card">
    <div class="nt">📋 Notes</div>
    <ul class="nl">
      <li>Payment due within 15 days from the invoice date.</li>
      <li>Late payment interest: 2% per month on overdue amounts.</li>
      <li>All payments to be made in ${invoice.currency}.</li>
      <li>All goods and services subject to applicable Indian tax laws.</li>
      <li>Thank you for your business!</li>
    </ul>
  </div>
  <div class="pay-card">
    <div class="pt">🌐 Pay Online</div>
    <p class="ps">Pay securely using the link below:</p>
    <a class="pay-btn" href="${payUrl}">Pay Now →</a>
    <span class="pl">${payUrl}</span>
    <div class="pp"><span>Powered by</span><span class="rp">⚡ ${gateway}</span></div>
  </div>
</div>

<div class="sig">
  <div class="sig-box">
    <div class="sig-line">
      <div class="sig-label">Authorized Signature</div>
      <div class="sig-co">${biz.name}</div>
    </div>
  </div>
</div>

<div class="footer">
  <a href="https://www.ledgerflow.app">🌐 www.ledgerflow.app</a>
  <div class="fg">Generated with <span>LedgerFlow</span></div>
  <div>Smart Invoicing for Modern Businesses</div>
</div>

</div>
</body></html>`;
}

// ─── PDF stream ───────────────────────────────────────────────────────────────

async function streamInvoicePdf(res, { invoice, user, client }, size = "A4") {
  const pageSize = resolvePageSize(size);
  const calc = calculateInvoice({
    items:           invoice.items,
    discountPercent: Number(invoice.discountPercent) || 0,
    taxPercent:      Number(invoice.taxPercent)      || 0,
    currency:        invoice.currency,
  });

  let qrDataUrl = null;
  if (invoice.currency === "INR" && user?.upiId) {
    try {
      qrDataUrl = await generateUpiQr({
        upiId:      user.upiId,
        payeeName:  user?.businessName || user?.name || "LedgerFlow User",
        amount:     calc.total,
        invoiceRef: invoice.invoiceNumber,
      });
    } catch (e) {
      console.error("[PDF] QR failed:", e.message);
    }
  }

  const html = await buildHtml({ invoice, user, client, calc, qrDataUrl, size });

  try {
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    // width mirrors the same 96dpi mm->px conversion used for html/body width
    const widthPx = Math.round((pageSize.widthMm / 25.4) * 96);
    await page.setViewport({ width: widthPx, height: pageSize.heightPx, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Shrink-to-fit only if content is taller than one page. No forced
    // fill of short pages — this mirrors the original, reliable behavior.
    const bodyH = await page.evaluate(() => document.body.scrollHeight);
    const targetH = pageSize.heightPx;
    const scale = bodyH > targetH
      ? Math.max(0.55, Number((targetH / bodyH).toFixed(3)))
      : 1;

    const pdfBuffer = await page.pdf({
      format: pageSize.puppeteerFormat,
      printBackground: true,
      scale,
      margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}-${String(size).toUpperCase()}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    console.warn("[PDF] puppeteer unavailable, HTML fallback:", err.message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.html"`);
    return res.send(html);
  }
}

module.exports = { streamInvoicePdf };