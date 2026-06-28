const INTENTS = {
  dashboard_summary: [
    "summarize", "overview", "summary", "how am i doing", "this month",
    "business summary", "revenue", "profit", "total", "snapshot", "doing",
  ],
  client_intel: [
    "tell me about", "client info", "client detail", "about client",
    "about company", "client summary",
  ],
  overdue_invoices: [
    "overdue", "unpaid", "pending invoice", "who hasn't paid",
    "outstanding", "not paid", "late invoice",
  ],
  invoice_list: [
    "show invoice", "list invoice", "my invoices", "recent invoice",
    "all invoices",
  ],
  expense_analysis: [
    "expense", "spending", "where am i spending", "cost breakdown",
    "where money going", "spent", "costs",
  ],
  revenue_compare: [
    "compare", "last month", "month vs", "growth", "trend",
    "versus", "this vs last",
  ],
  project_summary: [
    "project", "summarize project", "project status", "active project",
    "project progress",
  ],
  create_invoice: [
    "create invoice", "make invoice", "new invoice for",
    "generate invoice", "raise invoice",
  ],
  search: [
    "find invoice", "search invoice", "find client",
    "look up", "search for",
  ],
  general: [],
};

function detectIntent(message) {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (intent === "general") continue;
    if (keywords.some((kw) => lower.includes(kw))) return intent;
  }
  return "general";
}

module.exports = { INTENTS, detectIntent };