const { detectIntent } = require("../prompts/intents");
const { buildSystemPrompt } = require("../prompts/system.prompt");
const { fetchContext } = require("./data.service");
const { callOpenRouter } = require("../utils/ai");

async function processMessage({ userId, message, history = [] }) {
  // 1. detect intent
  const intent = detectIntent(message);

  // 2. fetch relevant DB context (no LLM → DB access)
  const contextData = await fetchContext(intent, userId);

  // 3. build prompt
  const systemPrompt = buildSystemPrompt(intent, contextData);

  // 4. assemble messages — keep last 3 turns only (6 messages)
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6),
    { role: "user", content: message },
  ];

  // 5. call LLM with fallback loop
  const result = await callOpenRouter(messages, { temperature: 0.3 });

  // 6. normalize and return
  return {
    intent,
    type: result.type || intent,
    summary: result.summary || null,
    metrics: Array.isArray(result.metrics) ? result.metrics : [],
    insights: Array.isArray(result.insights) ? result.insights : [],
    actions: Array.isArray(result.actions) ? result.actions : [],
    message: result.message || null,
  };
}

module.exports = { processMessage };