const { TimeEntry, Client, User, Ticket } = require("../models");

// Toutes les entrées de temps de l'user connecté
const getMyTimeEntries = async (req, res) => {
  try {
    const entries = await TimeEntry.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Client, as: "client" },
        { model: Ticket, as: "ticket" }
      ],
      order: [["date", "DESC"], ["slot_start", "ASC"]]
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Entrées SaaS de l'user
const getMySaasEntries = async (req, res) => {
  try {
    const entries = await TimeEntry.findAll({
      where: { user_id: req.user.id, ticket_type: "SAAS" },
      include: [{ model: Client, as: "client" }],
      order: [["date", "DESC"]]
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Entrées OnPrem de l'user
const getMyOnPremEntries = async (req, res) => {
  try {
    const entries = await TimeEntry.findAll({
      where: { user_id: req.user.id, ticket_type: "ONPREM" },
      include: [{ model: Client, as: "client" }],
      order: [["date", "DESC"]]
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Stats heures par client pour l'user connecté
const getMyHoursByClient = async (req, res) => {
  try {
    const { sequelize } = require("../models");
    const stats = await TimeEntry.findAll({
      where: { user_id: req.user.id },
      attributes: [
        "client_id",
        "ticket_type",
        [sequelize.fn("SUM", sequelize.col("hours_logged")), "total_hours"],
        [sequelize.fn("COUNT", sequelize.col("TimeEntry.id")), "total_tickets"]
      ],
      include: [{ model: Client, as: "client", attributes: ["name", "max_hours_per_week"] }],
      group: ["client_id", "ticket_type", "client.id"]
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyTimeEntries, getMySaasEntries, getMyOnPremEntries, getMyHoursByClient };