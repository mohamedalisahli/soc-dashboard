const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  full_name: { type: DataTypes.STRING(200), allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM("admin", "user"), defaultValue: "user" },
}, {
  tableName: "users",
  timestamps: false,
});

module.exports = User;