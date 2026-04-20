const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getMyTimeEntries, getMySaasEntries, getMyOnPremEntries, getMyHoursByClient, getMyHoursByUser } = require("../controllers/timeEntryController");

router.get("/", verifyToken, getMyTimeEntries);
router.get("/saas", verifyToken, getMySaasEntries);
router.get("/onprem", verifyToken, getMyOnPremEntries);
router.get("/stats", verifyToken, getMyHoursByClient);
router.get("/stats/user", verifyToken, getMyHoursByUser);

module.exports = router;