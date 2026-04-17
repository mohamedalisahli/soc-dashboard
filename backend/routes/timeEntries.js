const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getMyTimeEntries, getMySaasEntries, getMyOnPremEntries, getMyHoursByClient } = require("../controllers/timeEntryController");

router.get("/", verifyToken, getMyTimeEntries);
router.get("/saas", verifyToken, getMySaasEntries);
router.get("/onprem", verifyToken, getMyOnPremEntries);
router.get("/stats", verifyToken, getMyHoursByClient);

module.exports = router;