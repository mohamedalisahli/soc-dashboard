const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Client = sequelize.define("Client", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  max_hours_per_week: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  ticket_type: { type: DataTypes.ENUM("SAAS", "ONPREM"), defaultValue: "SAAS" },
}, {
  tableName: "clients",
  timestamps: false,
});

module.exports = Client;