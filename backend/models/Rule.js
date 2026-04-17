const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Rule = sequelize.define("Rule", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  max_hours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  rule_type: { type: DataTypes.ENUM("global", "per_user"), defaultValue: "global" },
}, {
  tableName: "rules",
  timestamps: false,
});

module.exports = Rule;