const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TimeEntry = sequelize.define("TimeEntry", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: DataTypes.INTEGER },
  user_id: { type: DataTypes.INTEGER },
  client_id: { type: DataTypes.INTEGER },
  chronos_entry_id: { type: DataTypes.STRING(100) },
  ticket_type: { type: DataTypes.ENUM("SAAS", "ONPREM"), defaultValue: "SAAS" },
  group_name: { type: DataTypes.STRING(50) },
  slot_start: { type: DataTypes.TIME, allowNull: false },
  slot_end: { type: DataTypes.TIME, allowNull: false },
  hours_logged: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.25 },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  synced_to_chronos: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "rules",
  timestamps: false,
});

module.exports = TimeEntry;