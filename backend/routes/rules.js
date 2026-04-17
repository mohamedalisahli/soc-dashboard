const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");
const { getRules, getRulesByClient, updateRule, createUserRule } = require("../controllers/ruleController");

router.get("/", verifyToken, getRules);
router.get("/client/:clientId", verifyToken, getRulesByClient);
router.put("/:id", verifyToken, requireAdmin, updateRule);
router.post("/", verifyToken, requireAdmin, createUserRule);

module.exports = router;