const { processMessage } = require("../services/ai.service");

async function handleChat(req, res) {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const result = await processMessage({
    userId: req.userId,
    message: message.trim(),
    history,
  });

  res.json(result);
}

module.exports = { handleChat };