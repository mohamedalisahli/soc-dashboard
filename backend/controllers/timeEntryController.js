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

const getMyHoursByUser = async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT u.id as user_id, u.full_name, u.username,
        COUNT(te.id) as total_tickets,
        SUM(te.hours_logged) as total_hours,
        SUM(CASE WHEN te.ticket_type = 'SAAS' THEN te.hours_logged ELSE 0 END) as saas_hours,
        SUM(CASE WHEN te.ticket_type = 'ONPREM' THEN te.hours_logged ELSE 0 END) as onprem_hours,
        COALESCE(
          (SELECT SUM(r.max_hours) FROM rules r 
           WHERE r.user_id = u.id AND r.rule_type = 'per_user'),
          40
        ) as max_hours_per_week
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      WHERE te.user_id = :userId
      GROUP BY te.user_id, u.full_name, u.username
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTimeEntry = async (req, res) => {
  try {
    const { hours_logged, slot_start, slot_end, date } = req.body;
    await sequelize.query(`
      UPDATE time_entries 
      SET hours_logged = :hours_logged,
          slot_start = :slot_start,
          slot_end = :slot_end,
          date = :date
      WHERE id = :id AND user_id = :userId
    `, {
      type: QueryTypes.UPDATE,
      replacements: {
        hours_logged, slot_start, slot_end, date,
        id: req.params.id,
        userId: req.user.id
      }
    });
    res.json({ message: "Entrée mise à jour avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTimeEntry = async (req, res) => {
  try {
    await sequelize.query(`
      DELETE FROM time_entries 
      WHERE id = :id AND user_id = :userId
    `, {
      type: QueryTypes.DELETE,
      replacements: { id: req.params.id, userId: req.user.id }
    });
    res.json({ message: "Entrée supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyTimeEntries, getMySaasEntries, getMyOnPremEntries, getMyHoursByClient, getMyHoursByUser, updateTimeEntry, deleteTimeEntry };