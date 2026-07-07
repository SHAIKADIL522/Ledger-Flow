const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// meta-llama/llama-4-scout:free and google/gemma-3-12b-it:free were removed —
// OpenRouter sunset their free tiers (confirmed via repeated 404 "This model
// is unavailable for free" responses). Keep this list to models actually
// reachable on the free tier; check https://openrouter.ai/models?max_price=0
// periodically since OpenRouter's free lineup changes without notice.
const FALLBACK_MODELS = [
  "openai/gpt-oss-20b:free",
  "deepseek/deepseek-r1:free",
];

async function callOpenRouter(messages, { temperature = 0.2 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes("REPLACE_WITH")) {
    const err = new Error("OpenRouter API key not configured");
    err.status = 503;
    err.publicMessage =
      "AI features are not configured yet. Add OPENROUTER_API_KEY to enable them.";
    throw err;
  }

  const primaryModel = process.env.OPENROUTER_MODEL || FALLBACK_MODELS[0];
  const modelsToTry = [
    primaryModel,
    ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:3000",
          "X-Title": "LedgerFlow",
        },
        body: JSON.stringify({ model, temperature, messages }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[AI] Model ${model} failed (${response.status}): ${text}`);
        lastError = text;
        continue;
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      console.info(`[AI] Success with model: ${model}`);

      try {
        return JSON.parse(raw);
      } catch {
        const cleaned = raw.replace(/```json\s*|```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch (fetchErr) {
      console.warn(`[AI] Fetch error for model ${model}:`, fetchErr.message);
      lastError = fetchErr.message;
      continue;
    }
  }

  const err = new Error(
    `All OpenRouter models failed. Last error: ${lastError}`
  );
  err.status = 502;
  err.publicMessage =
    "The AI assistant is temporarily unavailable. Please try again later.";
  throw err;
}

async function generateInvoiceItems({ prompt, currency }) {
  const messages = [
    {
      role: "system",
      content: `You are LedgerFlow's invoice assistant. Convert the user's plain-English request into structured invoice line items.
Rules:
- Respond ONLY with valid JSON. No prose, no markdown fences, no explanation.
- JSON shape: { "items": [ { "description": string, "quantity": number, "unitPrice": number } ], "suggestedClientName": string|null, "notes": string|null }
- If user gives one total with no breakdown, create 2-4 sensible line items summing to that total.
- Currency is ${currency || "INR"}. Do not include currency symbols in numbers.
- Keep descriptions short and professional (max 6 words).
- Start your response with { and end with }`,
    },
    { role: "user", content: prompt },
  ];

  const result = await callOpenRouter(messages);
  return {
    items: Array.isArray(result.items) ? result.items : [],
    suggestedClientName: result.suggestedClientName || null,
    notes: result.notes || null,
  };
}

async function generateInsights(snapshot) {
  const messages = [
    {
      role: "system",
      content: `You are LedgerFlow's financial insights assistant. Given a JSON snapshot of a business's revenue, expenses, clients and invoices, return 2-3 short, specific, actionable insights.
Rules:
- Respond ONLY with valid JSON. No prose, no markdown fences.
- JSON shape: { "insights": [ { "title": string, "type": "positive"|"warning"|"neutral" } ] }
- Each title must be one short sentence (max 18 words) using the actual numbers given.
- Do not invent numbers not derivable from the snapshot.
- Start your response with { and end with }`,
    },
    { role: "user", content: JSON.stringify(snapshot) },
  ];

  const result = await callOpenRouter(messages, { temperature: 0.4 });
  return Array.isArray(result.insights) ? result.insights : [];
}

module.exports = { callOpenRouter, generateInvoiceItems, generateInsights };