const { getTicketsByUser } = require("../services/jiraService");
const connection = require("../config/database");

const syncToChronos = (req, res) => {
  const username = req.user.username;
  const user_id = req.user.id;

  const tickets = getTicketsByUser(username);

  if (tickets.length === 0) {
    return res.json({ message: "No tickets to sync" });
  }

  let completed = 0;

  tickets.forEach(ticket => {
    const query = `INSERT INTO time_entries (user_id, client_id, hours_logged, date) VALUES (?, 1, 0.25, CURDATE())`;
    connection.query(query, [user_id], (err) => {
      if (err) console.error("Insert error:", err);
      completed++;
      if (completed === tickets.length) {
        res.json({ message: "Synced successfully", count: tickets.length });
      }
    });
  });
};

module.exports = { syncToChronos };