const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");
const { getAllTimeEntries, getAllTickets, getAllUsers, getHoursStats, getAllClients } = require("../controllers/adminController");

router.get("/time-entries", verifyToken, requireAdmin, getAllTimeEntries);
router.get("/tickets", verifyToken, requireAdmin, getAllTickets);
router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.get("/stats", verifyToken, requireAdmin, getHoursStats);
router.get("/clients", verifyToken, requireAdmin, getAllClients);

module.exports = router;