const { QueryTypes } = require("sequelize");
const { User } = require("../models");

// Toutes les entrées de temps (admin)
const getAllTimeEntries = async (req, res) => {
  try {
    const sequelize = require("../config/database");
    const { client_id, user_id, ticket_type, date_from, date_to } = req.query;

    let query = `
      SELECT te.*, 
        u.full_name as user_name, u.username,
        c.name as client_name,
        t.jira_key, t.summary
      FROM time_entries te
      LEFT JOIN users u ON te.user_id = u.id
      LEFT JOIN clients c ON te.client_id = c.id
      LEFT JOIN tickets t ON te.ticket_id = t.id
      WHERE 1=1
    `;
    const replacements = {};
    if (client_id) { query += ` AND te.client_id = :client_id`; replacements.client_id = client_id; }
    if (user_id) { query += ` AND te.user_id = :user_id`; replacements.user_id = user_id; }
    if (ticket_type) { query += ` AND te.ticket_type = :ticket_type`; replacements.ticket_type = ticket_type; }
    if (date_from && date_to) { query += ` AND te.date BETWEEN :date_from AND :date_to`; replacements.date_from = date_from; replacements.date_to = date_to; }
    query += ` ORDER BY te.date DESC, te.slot_start ASC`;

    const entries = await sequelize.query(query, { type: QueryTypes.SELECT, replacements });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Tous les tickets (admin)
const getAllTickets = async (req, res) => {
  try {
    const sequelize = require("../config/database");
    const { client_id, user_id, ticket_type } = req.query;

    let query = `
      SELECT t.*,
        u.full_name as assignee_name, u.username,
        c.name as client_name
      FROM tickets t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE 1=1
    `;
    const replacements = {};
    if (client_id) { query += ` AND t.client_id = :client_id`; replacements.client_id = client_id; }
    if (user_id) { query += ` AND t.assignee_id = :user_id`; replacements.user_id = user_id; }
    if (ticket_type) { query += ` AND t.ticket_type = :ticket_type`; replacements.ticket_type = ticket_type; }
    query += ` ORDER BY t.outage_start DESC`;

    const tickets = await sequelize.query(query, { type: QueryTypes.SELECT, replacements });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Tous les users (admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "full_name", "role"]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Stats heures par client et par user (admin)
const getHoursStats = async (req, res) => {
  try {
    const sequelize = require("../config/database");

    const byClient = await sequelize.query(`
      SELECT c.name, c.max_hours_per_week, te.ticket_type,
        COUNT(te.id) as total_tickets,
        SUM(te.hours_logged) as total_hours
      FROM time_entries te
      JOIN clients c ON te.client_id = c.id
      GROUP BY te.client_id, te.ticket_type, c.name, c.max_hours_per_week
    `, { type: QueryTypes.SELECT });

    const byUser = await sequelize.query(`
      SELECT u.username, u.full_name,
        COUNT(te.id) as total_tickets,
        SUM(te.hours_logged) as total_hours
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      GROUP BY te.user_id, u.username, u.full_name
    `, { type: QueryTypes.SELECT });

    const exceedingClients = byClient.filter(s =>
      s.max_hours_per_week > 0 && parseFloat(s.total_hours) > parseFloat(s.max_hours_per_week)
    );

    res.json({ byClient, byUser, exceedingClients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Tous les clients (admin)
const getAllClients = async (req, res) => {
  try {
    const sequelize = require("../config/database");
    const clients = await sequelize.query(
      "SELECT * FROM clients ORDER BY name",
      { type: QueryTypes.SELECT }
    );
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllTimeEntries, getAllTickets, getAllUsers, getHoursStats, getAllClients };