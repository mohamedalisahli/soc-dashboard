const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");

const getMyTickets = async (req, res) => {
  try {
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name, c.ticket_type as client_type, t.group_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.assignee_id = :userId
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMySaasTickets = async (req, res) => {
  try {
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.assignee_id = :userId AND t.ticket_type = 'SAAS'
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyOnPremTickets = async (req, res) => {
  try {
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.assignee_id = :userId AND t.ticket_type = 'ONPREM'
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUnsyncedTickets = async (req, res) => {
  try {
    const tickets = await sequelize.query(`
      SELECT t.*, c.name as client_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.assignee_id = :userId
        AND t.id NOT IN (
          SELECT DISTINCT ticket_id FROM time_entries
          WHERE user_id = :userId AND synced_to_chronos = 1
        )
      ORDER BY t.outage_start DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyTickets, getMySaasTickets, getMyOnPremTickets, getUnsyncedTickets };