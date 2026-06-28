
const { calculateInvoice } = require("./invoiceCalculator");

const FALLBACK_RATES_TO_INR = {
  INR: 1,
  USD: 83.2,
  EUR: 90.1,
  GBP: 105.4,
  AED: 22.65,
  CAD: 61.3,
};

function getRateToINR(currency) {
  return FALLBACK_RATES_TO_INR[currency] || 1;
}

function convertToINR(amount, currency) {
  return Number(amount) * getRateToINR(currency);
}

async function generateInvoiceNumber(prisma, userId) {
  const count = await prisma.invoice.count({ where: { userId } });
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

function calcInvoiceTotals(items, taxPercent = 0, discountPercent = 0) {
  const result = calculateInvoice({ items, taxPercent, discountPercent });
  return {
    subtotal: result.subtotal,
    total: result.total,
  };
}

module.exports = {
  getRateToINR,
  convertToINR,
  generateInvoiceNumber,
  calcInvoiceTotals,
  FALLBACK_RATES_TO_INR,
};