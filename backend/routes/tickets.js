const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getMyTickets, getMySaasTickets, getMyOnPremTickets, getUnsyncedTickets } = require("../controllers/ticketController");

router.get("/", verifyToken, getMyTickets);
router.get("/saas", verifyToken, getMySaasTickets);
router.get("/onprem", verifyToken, getMyOnPremTickets);
router.get("/unsynced", verifyToken, getUnsyncedTickets);

module.exports = router;