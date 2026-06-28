const SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "AED ", CAD: "CA$" };

export function formatCurrency(amount, currency = "INR") {
  const symbol = SYMBOLS[currency] || `${currency} `;
  const value = Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol}${value}`;
}

export function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "CAD"];

export const STATUS_STYLES = {
  DRAFT: "bg-slate-700/40 text-slate-300 border-slate-600/40",
  SENT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  PAID: "bg-primary/10 text-primary border-primary/30",
  OVERDUE: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};
