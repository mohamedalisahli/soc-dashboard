const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getMyTickets, getMySaasTickets, getMyOnPremTickets, getAllOnPremTickets, getUnsyncedTickets } = require("../controllers/ticketController");

router.get("/", verifyToken, getMyTickets);
router.get("/saas", verifyToken, getMySaasTickets);
router.get("/onprem", verifyToken, getMyOnPremTickets);
router.get("/onprem/all", verifyToken, getAllOnPremTickets);
router.get("/unsynced", verifyToken, getUnsyncedTickets);

module.exports = router;