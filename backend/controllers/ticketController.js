const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");

const getMyTickets = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name, c.ticket_type as client_type, t.group_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      ${isAdmin ? "" : "WHERE t.assignee_id = :userId"}
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMySaasTickets = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.ticket_type = 'SAAS'
      ${isAdmin ? "" : "AND t.assignee_id = :userId"}
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyOnPremTickets = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.ticket_type = 'ONPREM'
      ${isAdmin ? "" : "AND t.assignee_id = :userId"}
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tickets On-Prem — filtrés par user (admin voit tout)
const getAllOnPremTickets = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const tickets = await sequelize.query(`
      SELECT t.*, u.full_name as assignee_name, t.group_name
      FROM tickets t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.ticket_type = 'ONPREM'
      ${isAdmin ? "" : "AND t.assignee_id = :userId"}
      ORDER BY t.outage_start DESC
    `, {
      type: QueryTypes.SELECT,
      replacements: { userId: req.user.id }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUnsyncedTickets = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id NOT IN (
          SELECT DISTINCT ticket_id FROM time_entries
          WHERE synced_to_chronos = 1 AND ticket_id IS NOT NULL
          ${isAdmin ? "" : "AND user_id = :userId"}
        )
      ${isAdmin ? "" : "AND t.assignee_id = :userId"}
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyTickets, getMySaasTickets, getMyOnPremTickets, getAllOnPremTickets, getUnsyncedTickets };