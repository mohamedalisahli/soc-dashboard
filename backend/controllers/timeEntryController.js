const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");

const getMyTimeEntries = async (req, res) => {
  try {
    const entries = await sequelize.query(`
      SELECT te.*, c.name as client_name, t.jira_key, t.summary
      FROM time_entries te
      LEFT JOIN clients c ON te.client_id = c.id
      LEFT JOIN tickets t ON te.ticket_id = t.id
      WHERE te.user_id = :userId
      ORDER BY te.date DESC, te.slot_start ASC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMySaasEntries = async (req, res) => {
  try {
    const entries = await sequelize.query(`
      SELECT te.*, c.name as client_name
      FROM time_entries te
      LEFT JOIN clients c ON te.client_id = c.id
      WHERE te.user_id = :userId AND te.ticket_type = 'SAAS'
      ORDER BY te.date DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyOnPremEntries = async (req, res) => {
  try {
    const entries = await sequelize.query(`
      SELECT te.*, c.name as client_name
      FROM time_entries te
      LEFT JOIN clients c ON te.client_id = c.id
      WHERE te.user_id = :userId AND te.ticket_type = 'ONPREM'
      ORDER BY te.date DESC
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyHoursByClient = async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT c.name, c.max_hours_per_week, te.ticket_type,
        COUNT(te.id) as total_tickets,
        SUM(te.hours_logged) as total_hours
      FROM time_entries te
      JOIN clients c ON te.client_id = c.id
      WHERE te.user_id = :userId
      GROUP BY te.client_id, te.ticket_type, c.name, c.max_hours_per_week
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyTimeEntries, getMySaasEntries, getMyOnPremEntries, getMyHoursByClient };