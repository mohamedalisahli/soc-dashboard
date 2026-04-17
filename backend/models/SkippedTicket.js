const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SkippedTicket = sequelize.define("SkippedTicket", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: DataTypes.INTEGER },
  user_id: { type: DataTypes.INTEGER },
  client_name: { type: DataTypes.STRING(100) },
  reason: { type: DataTypes.TEXT },
}, {
  tableName: "rules",
  timestamps: false,
});

module.exports = SkippedTicket;