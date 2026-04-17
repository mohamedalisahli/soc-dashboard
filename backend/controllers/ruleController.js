const { Rule, Client, User } = require("../models");

// Toutes les règles globales
const getRules = async (req, res) => {
  try {
    const rules = await Rule.findAll({
      include: [
        { model: Client, as: "client" },
        { model: User, as: "user", attributes: ["id", "username", "full_name"] }
      ]
    });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Règles par client
const getRulesByClient = async (req, res) => {
  try {
    const rules = await Rule.findAll({
      where: { client_id: req.params.clientId },
      include: [
        { model: Client, as: "client" },
        { model: User, as: "user", attributes: ["id", "username", "full_name"] }
      ]
    });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une règle (admin only)
const updateRule = async (req, res) => {
  try {
    const { max_hours } = req.body;
    const rule = await Rule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    await rule.update({ max_hours });
    res.json({ message: "Rule updated", rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Créer une règle par user (admin only)
const createUserRule = async (req, res) => {
  try {
    const { client_id, user_id, max_hours } = req.body;
    const rule = await Rule.create({
      client_id, user_id, max_hours, rule_type: "per_user"
    });
    res.json({ message: "Rule created", rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRules, getRulesByClient, updateRule, createUserRule };