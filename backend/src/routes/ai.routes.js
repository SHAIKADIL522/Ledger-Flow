const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { handleChat } = require("../controllers/ai.controller");

const router = express.Router();
router.use(requireAuth);

// POST /api/ai/chat
router.post("/chat", asyncHandler(handleChat));

module.exports = router;