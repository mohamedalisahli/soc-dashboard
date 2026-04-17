const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Ticket = sequelize.define("Ticket", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  jira_key: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  summary: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE },
  outage_start: { type: DataTypes.DATE },
  assignee_id: { type: DataTypes.INTEGER },
  client_id: { type: DataTypes.INTEGER },
  ticket_type: { type: DataTypes.ENUM("SAAS", "ONPREM"), defaultValue: "SAAS" },
  group_name: { type: DataTypes.STRING(50) },
}, {
  tableName: "rules",
  timestamps: false,
});

module.exports = Ticket;