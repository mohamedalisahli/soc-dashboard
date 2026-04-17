const { Ticket, Client, User, TimeEntry } = require("../models");
const { Op } = require("sequelize");

// Tous les tickets de l'user connecté
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { assignee_id: req.user.id },
      include: [
        { model: Client, as: "client" },
        { model: User, as: "assignee", attributes: ["id", "username", "full_name"] }
      ],
      order: [["outage_start", "DESC"]]
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tickets SaaS de l'user connecté
const getMySaasTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { assignee_id: req.user.id, ticket_type: "SAAS" },
      include: [{ model: Client, as: "client" }],
      order: [["outage_start", "DESC"]]
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tickets OnPrem de l'user connecté
const getMyOnPremTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { assignee_id: req.user.id, ticket_type: "ONPREM" },
      include: [{ model: Client, as: "client" }],
      order: [["outage_start", "DESC"]]
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tickets non synchronisés
const getUnsyncedTickets = async (req, res) => {
  try {
    const syncedTicketIds = await TimeEntry.findAll({
      where: { user_id: req.user.id, synced_to_chronos: true },
      attributes: ["ticket_id"]
    });
    const syncedIds = syncedTicketIds.map(e => e.ticket_id);

    const tickets = await Ticket.findAll({
      where: {
        assignee_id: req.user.id,
        id: { [Op.notIn]: syncedIds.length > 0 ? syncedIds : [0] }
      },
      include: [{ model: Client, as: "client" }],
      order: [["outage_start", "DESC"]]
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyTickets, getMySaasTickets, getMyOnPremTickets, getUnsyncedTickets };