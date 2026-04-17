const sequelize = require("../config/database");
const User = require("./User");
const Client = require("./Client");
const Ticket = require("./Ticket");
const TimeEntry = require("./TimeEntry");
const Rule = require("./Rule");
const SkippedTicket = require("./SkippedTicket");

// Associations
User.hasMany(Ticket, { foreignKey: "assignee_id", as: "tickets" });
Ticket.belongsTo(User, { foreignKey: "assignee_id", as: "assignee" });

Client.hasMany(Ticket, { foreignKey: "client_id", as: "tickets" });
Ticket.belongsTo(Client, { foreignKey: "client_id", as: "client" });

User.hasMany(TimeEntry, { foreignKey: "user_id", as: "timeEntries" });
TimeEntry.belongsTo(User, { foreignKey: "user_id", as: "user" });

Client.hasMany(TimeEntry, { foreignKey: "client_id", as: "timeEntries" });
TimeEntry.belongsTo(Client, { foreignKey: "client_id", as: "client" });

Ticket.hasOne(TimeEntry, { foreignKey: "ticket_id", as: "timeEntry" });
TimeEntry.belongsTo(Ticket, { foreignKey: "ticket_id", as: "ticket" });

Client.hasMany(Rule, { foreignKey: "client_id", as: "rules" });
Rule.belongsTo(Client, { foreignKey: "client_id", as: "client" });

User.hasMany(Rule, { foreignKey: "user_id", as: "rules" });
Rule.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = { sequelize, User, Client, Ticket, TimeEntry, Rule, SkippedTicket };