/**
 * pdf.js  (backend/src/utils/pdf.js)
 * LedgerFlow invoice — navy/teal theme, SVG logo, single page, QR always shown.
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
  DRAFT:    { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  SENT:     { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  PAID:     { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  OVERDUE:  { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  CANCELLED:{ bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
};

// LedgerFlow SVG logo — matches actual brand (document icon + teal chart arrow)
const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="8" fill="url(#lg)"/>
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
  </defs>
  <!-- document outline -->
  <path d="M10 6h11l7 7v17a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
  <path d="M21 6v7h7" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- teal chart line with arrow -->
  <polyline points="10,24 14,20 17,22 21,16 25,12" fill="none" stroke="url(#teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="25,12 22,13.5 23.5,16" fill="#22d3ee"/>
  <defs>
    <linearGradient id="teal" x1="10" y1="24" x2="25" y2="12" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
</svg>`;

// ─── HTML template ────────────────────────────────────────────────────────────

async function buildHtml({ invoice, user, client, calc, qrDataUrl }) {
  const status = invoice.status || "DRAFT";
  const sc = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;

  const biz = {
    name:    user?.businessName || "LedgerFlow Technologies",
    address: user?.address      || "5th Floor, Cyber Towers, HITEC City, Madhapur, Hyderabad, Telangana - 500081, India",
    email:   user?.email        || "support@ledgerflow.app",
    phone:   user?.phone        || "+91 98765 43210",
    gstin:   user?.gstNumber    || "36ABCDE1234F1Z5",
  };

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
      <td class="tr" style="color:#ef4444;font-weight:600">- ${fmt(calc.discountAmount, invoice.currency)}</td>
    </tr>` : "";

  const taxRows = calc.sameState && calc.cgst > 0 ? `
    <tr class="cr"><td>Taxable Amount</td><td class="tr">${fmt(calc.taxableAmount, invoice.currency)}</td></tr>
    <tr class="cr"><td>CGST (${calc.taxPercent / 2}%)</td><td class="tr">${fmt(calc.cgst, invoice.currency)}</td></tr>
    <tr class="cr"><td>SGST (${calc.taxPercent / 2}%)</td><td class="tr">${fmt(calc.sgst, invoice.currency)}</td></tr>`
  : calc.igst > 0 ? `
    <tr class="cr"><td>Taxable Amount</td><td class="tr">${fmt(calc.taxableAmount, invoice.currency)}</td></tr>
    <tr class="cr"><td>IGST (${calc.taxPercent}%)</td><td class="tr">${fmt(calc.igst, invoice.currency)}</td></tr>`
  : "";

  // QR — always show for INR, show placeholder card for other currencies
  const qrSection = qrDataUrl
    ? `<div class="card qr-card">
        <div class="ct">SCAN &amp; PAY</div>
        <img src="${qrDataUrl}" class="qr-img" alt="UPI QR"/>
        <div class="upi-lbl">UPI ID: ledgerflow@upi</div>
       </div>`
    : `<div class="card qr-card">
        <div class="ct">SCAN &amp; PAY</div>
        <div class="qr-na">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none"><rect width="60" height="60" rx="6" fill="#1e293b"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#0ea5e9" font-size="9" font-family="Arial">UPI QR</text><text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="7" font-family="Arial">INR only</text></svg>
        </div>
        <div class="upi-lbl">ledgerflow@upi</div>
       </div>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* ── RESET ── */
*{box-sizing:border-box;margin:0;padding:0}
html,body{
  width:210mm;
  font-family:'Inter',Arial,sans-serif;
  font-size:10.5px;
  color:#e2e8f0;
  background:#0f172a;
  line-height:1.45;
}
body{padding:20px 26px 14px}

/* ── HEADER ── */
.hdr{
  display:flex;justify-content:space-between;align-items:flex-start;
  margin-bottom:12px;padding-bottom:10px;
  border-bottom:1px solid #1e3a5f;
}
.logo-wrap{display:flex;align-items:center;gap:8px}
.l-text{line-height:1}
.l-name{font-size:17px;font-weight:900;color:#f1f5f9;letter-spacing:-.3px}
.l-name span{color:#0ea5e9}
.l-sub{font-size:8.5px;color:#475569;margin-top:2px}
.inv-block{text-align:right}
.inv-word{font-size:30px;font-weight:900;color:#f1f5f9;letter-spacing:-1px;line-height:1}
.mt{margin-top:6px;border-collapse:collapse}
.mt td{padding:1px 0;font-size:9.5px}
.ml{color:#64748b;padding-right:5px;text-align:left;white-space:nowrap}
.ms{color:#334155;padding:0 3px}
.mv{font-weight:600;color:#cbd5e1}
.badge{
  display:inline-block;padding:2px 8px;border-radius:20px;
  font-size:9px;font-weight:700;letter-spacing:.5px;
  background:${sc.bg};color:${sc.color};border:1px solid ${sc.border};
}

/* ── BIZ ROW ── */
.biz-row{margin-bottom:9px}
.biz-name{font-size:11.5px;font-weight:700;color:#f1f5f9}
.biz-row p{font-size:9px;color:#64748b;margin-top:1px}
.gstin{font-size:9.5px;font-weight:700;color:#94a3b8;margin-top:3px}

/* ── 3-CARD ROW ── */
.cards{display:grid;grid-template-columns:1fr 140px 1fr;gap:8px;margin-bottom:9px}
.card{
  border:1px solid #1e3a5f;border-radius:8px;
  padding:9px 11px;background:#0d1f38;
}
.ct{
  font-size:8.5px;font-weight:700;color:#0ea5e9;
  letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px;
}
.bn{font-size:11.5px;font-weight:700;color:#f1f5f9;margin-bottom:2px}
.bi{font-size:9px;color:#94a3b8;margin-bottom:1px}
.bg{font-size:9px;font-weight:600;color:#cbd5e1;margin-top:3px}

/* QR card */
.qr-card{text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 8px}
.qr-img{width:96px;height:96px;border-radius:5px;border:2px solid #1e3a5f;margin:2px 0}
.qr-na{margin:6px 0}
.upi-lbl{font-size:8.5px;color:#64748b;margin-top:2px}

/* Bank info table */
.it{width:100%;border-collapse:collapse}
.it td{padding:1.8px 0;font-size:9px;vertical-align:top;color:#94a3b8}
.it .lbl{color:#475569;white-space:nowrap;padding-right:3px;min-width:90px}
.it td:nth-child(2){color:#334155;padding:0 3px}
.it td:nth-child(3){color:#cbd5e1;font-weight:500}

/* ── ITEMS TABLE ── */
.items-tbl{
  width:100%;border-collapse:collapse;margin-bottom:9px;
  border:1px solid #1e3a5f;border-radius:8px;overflow:hidden;
}
.items-tbl thead tr{background:#0ea5e9}
.items-tbl thead th{
  padding:7px 9px;font-size:9px;font-weight:700;
  color:#0f172a;letter-spacing:.3px;text-align:left;
}
.items-tbl thead th.tr{text-align:right}
.tc{text-align:center;width:28px}
.tr{text-align:right}
.fw{font-weight:700;color:#f1f5f9}
.desc{color:#e2e8f0}
.re{background:#0f1e33}.ro{background:#0d1a2e}
.items-tbl tbody td{
  padding:6px 9px;font-size:10px;
  border-top:1px solid #1e2d47;color:#94a3b8;
}
.items-tbl tbody tr:hover td{background:#132035}

/* ── TOTALS ── */
.tot-wrap{display:flex;justify-content:flex-end;margin-bottom:7px}
.tot-tbl{width:270px;border-collapse:collapse;border:1px solid #1e3a5f;border-radius:8px;overflow:hidden}
.cr td{padding:3.5px 9px;font-size:10px;border-bottom:1px solid #1a2e47}
.cr td:first-child{color:#64748b}
.cr td:last-child{text-align:right;font-weight:500;color:#cbd5e1}
.total-row{background:#0ea5e9}
.total-row td{padding:7px 9px;font-size:12.5px;font-weight:900;color:#0f172a}
.total-row td:last-child{text-align:right;color:#0f172a}

/* ── AMOUNT IN WORDS ── */
.words{
  border:1px solid #1e3a5f;border-radius:6px;
  padding:6px 11px;background:#0d1f38;margin-bottom:7px;
  display:flex;align-items:center;gap:8px;
}
.wl{font-size:8.5px;font-weight:700;color:#0ea5e9;white-space:nowrap;text-transform:uppercase;letter-spacing:.5px}
.wt{font-size:10.5px;font-weight:600;color:#e2e8f0}

/* ── BOTTOM ROW ── */
.bot{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px}
.note-card{border:1px solid #1e3a5f;border-radius:8px;padding:9px 11px;background:#0d1f38}
.nt{font-size:8.5px;font-weight:700;color:#0ea5e9;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px}
.nl{padding-left:12px}
.nl li{font-size:9px;color:#64748b;margin-bottom:2.5px}
.pay-card{border:1px solid #1e3a5f;border-radius:8px;padding:9px 11px;background:#0d1f38}
.pt{font-size:9.5px;font-weight:700;color:#f1f5f9;margin-bottom:2px}
.ps{font-size:8.5px;color:#64748b;margin-bottom:5px}
.plb{
  display:flex;align-items:center;gap:4px;
  border:1px solid #0ea5e9;border-radius:5px;
  padding:5px 7px;background:#0a1628;margin-bottom:5px;
}
.pl{font-size:9px;color:#0ea5e9;font-weight:600;word-break:break-all}
.pp{display:flex;align-items:center;gap:5px;font-size:8.5px;color:#475569}
.rp{font-weight:700;color:#3395FF}
.sp{font-weight:700;color:#635BFF}

/* ── FOOTER ── */
.footer{
  border-top:1px solid #1e3a5f;padding-top:7px;
  display:flex;justify-content:space-between;align-items:center;
  font-size:8.5px;color:#334155;
}
.footer a{color:#0ea5e9;text-decoration:none}
.fg{color:#475569}
.fg span{color:#0ea5e9;font-weight:600}
</style></head>
<body>

<!-- ═══ HEADER ═══ -->
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
      <tr><td class="ml">Invoice Number</td><td class="ms">:</td><td class="mv">${invoice.invoiceNumber}</td></tr>
      <tr><td class="ml">Issue Date</td><td class="ms">:</td><td class="mv">${fmtDate(invoice.issueDate)}</td></tr>
      <tr><td class="ml">Due Date</td><td class="ms">:</td><td class="mv">${fmtDate(invoice.dueDate)}</td></tr>
      <tr><td class="ml">Place of Supply</td><td class="ms">:</td><td class="mv">Telangana (36)</td></tr>
      <tr><td class="ml">Status</td><td class="ms">:</td><td class="mv"><span class="badge">${status}</span></td></tr>
    </table>
  </div>
</div>

<!-- ═══ BIZ ADDRESS ═══ -->
<div class="biz-row">
  <div class="biz-name">${biz.name}</div>
  <p>${biz.address}</p>
  ${biz.email ? `<p>✉ ${biz.email}${biz.phone ? "  &nbsp;&nbsp; 📞 " + biz.phone : ""}</p>` : ""}
  ${biz.gstin ? `<p class="gstin">GSTIN: ${biz.gstin}</p>` : ""}
</div>

<!-- ═══ 3 CARDS: Bill To | QR | Bank ═══ -->
<div class="cards">
  <div class="card">
    <div class="ct">Bill To</div>
    <div class="bn">${client.companyName}</div>
    ${client.contactName ? `<div class="bi">${client.contactName}</div>` : ""}
    ${client.email ? `<div class="bi">✉ ${client.email}</div>` : ""}
    ${client.phone ? `<div class="bi">📞 ${client.phone}</div>` : ""}
    ${client.notes ? `<div class="bg">GSTIN: ${client.notes}</div>` : ""}
    <div class="bg">Place of Supply: Telangana (36)</div>
  </div>
  ${qrSection}
  <div class="card">
    <div class="ct">Bank Details</div>
    <table class="it">
      <tr><td class="lbl">Bank Name</td><td>:</td><td>State Bank of India</td></tr>
      <tr><td class="lbl">Account Holder</td><td>:</td><td>${biz.name}</td></tr>
      <tr><td class="lbl">Account Number</td><td>:</td><td>1234567890</td></tr>
      <tr><td class="lbl">IFSC Code</td><td>:</td><td>SBIN0000123</td></tr>
      <tr><td class="lbl">UPI ID</td><td>:</td><td>ledgerflow@upi</td></tr>
    </table>
  </div>
</div>

<!-- ═══ ITEMS TABLE ═══ -->
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

<!-- ═══ TOTALS ═══ -->
<div class="tot-wrap">
  <table class="tot-tbl">
    <tr class="cr"><td>Subtotal</td><td class="tr">${fmt(calc.subtotal, invoice.currency)}</td></tr>
    ${discountRow}
    ${taxRows}
    <tr class="total-row"><td>TOTAL</td><td>${fmt(calc.total, invoice.currency)}</td></tr>
  </table>
</div>

<!-- ═══ AMOUNT IN WORDS ═══ -->
<div class="words">
  <span class="wl">Amount in Words</span>
  <span class="wt">${amountToWords(calc.total, invoice.currency)}</span>
</div>

<!-- ═══ NOTES + PAY ONLINE ═══ -->
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
    <div class="plb">
      <span style="color:#0ea5e9">🌐</span>
      <span class="pl">https://ledgerflow.app/pay/${invoice.invoiceNumber}</span>
    </div>
    <div class="pp">
      <span>Powered by</span>
      <span class="rp">⚡ Razorpay</span>
      <span class="sp">stripe</span>
    </div>
  </div>
</div>

<!-- ═══ FOOTER ═══ -->
<div class="footer">
  <a href="https://www.ledgerflow.app">🌐 www.ledgerflow.app</a>
  <div class="fg">Generated with <span>LedgerFlow</span></div>
  <div>Smart Invoicing for Modern Businesses</div>
</div>

</body></html>`;
}

// ─── PDF stream ───────────────────────────────────────────────────────────────

async function streamInvoicePdf(res, { invoice, user, client }) {
  const calc = calculateInvoice({
    items:           invoice.items,
    discountPercent: Number(invoice.discountPercent) || 0,
    taxPercent:      Number(invoice.taxPercent)      || 0,
    currency:        invoice.currency,
  });

  // QR for INR only — non-INR gets placeholder card
  let qrDataUrl = null;
  if (invoice.currency === "INR") {
    try {
      qrDataUrl = await generateUpiQr({
        upiId:      user?.upiId        || "ledgerflow@upi",
        payeeName:  user?.businessName || "LedgerFlow Technologies",
        amount:     calc.total,
        invoiceRef: invoice.invoiceNumber,
      });
    } catch (e) {
      console.error("[PDF] QR failed:", e.message);
    }
  }

  const html = await buildHtml({ invoice, user, client, calc, qrDataUrl });

  try {
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Auto-scale if content overflows A4
    const bodyH = await page.evaluate(() => document.body.scrollHeight);
    const A4_H  = 1123;
    const scale = bodyH > A4_H
      ? Math.max(0.55, Number((A4_H / bodyH).toFixed(3)))
      : 1;

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      scale,
      margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
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