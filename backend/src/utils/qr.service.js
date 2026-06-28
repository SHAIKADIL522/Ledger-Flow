

const QRCode = require("qrcode");

/**
 * @param {object} opts
 * @param {string} opts.upiId       - e.g. "ledgerflow@upi"
 * @param {string} opts.payeeName   - e.g. "LedgerFlow Technologies"
 * @param {number} opts.amount      - invoice total
 * @param {string} opts.invoiceRef  - invoice number for transaction note
 * @returns {Promise<string>} base64 data URL (data:image/png;base64,...)
 */
async function generateUpiQr({ upiId, payeeName, amount, invoiceRef }) {
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(invoiceRef)}`;

  const dataUrl = await QRCode.toDataURL(upiString, {
    width: 200,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return dataUrl;
}

module.exports = { generateUpiQr };