const fetch = require("node-fetch");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const connection = require("./config/database");
const { verifyToken } = require("./middleware/authMiddleware");
const { syncToChronos } = require("./controllers/chronosController");
const { getTicketsByUser, getSaasTickets, getOnPremTickets } = require("./services/jiraService");
const { smartSync } = require("./services/schedulerService");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "API Running" });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "SOCUSER" && password === "password123") {
    const token = jwt.sign(
      { id: 1, username: "SOCUSER", role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res.json({ token, role: "user" });
  }
  const query = "SELECT * FROM admins WHERE username = ? AND password = ?";
  connection.query(query, [username, password], (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const admin = result[0];
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token, role: "admin" });
  });
});

app.get("/api/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// Tous les tickets (SaaS + On-Prem)
app.get("/api/tickets", verifyToken, (req, res) => {
  const tickets = getTicketsByUser(req.user.username);
  res.json(tickets);
});

// Tickets SaaS uniquement
app.get("/api/tickets/saas", verifyToken, (req, res) => {
  const tickets = getSaasTickets(req.user.username);
  res.json(tickets);
});

// Tickets On-Prem uniquement
app.get("/api/tickets/onprem", verifyToken, (req, res) => {
  const tickets = getOnPremTickets(req.user.username);
  res.json(tickets);
});

app.post("/api/sync", verifyToken, syncToChronos);

// Smart Sync — Algorithme d'équilibrage intelligent (SaaS + On-Prem)
app.post("/api/smart-sync", verifyToken, async (req, res) => {
  try {
    const tickets = getTicketsByUser(req.user.username);
    connection.query("SELECT * FROM rules", async (err, rules) => {
      if (err) return res.status(500).json({ error: err.message });
      const result = await smartSync(req.user.id, tickets, rules);
      res.json(result);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Time entries — tous
app.get("/api/time-entries", verifyToken, (req, res) => {
  connection.query(
    "SELECT * FROM time_entries WHERE user_id = ?",
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

// Time entries SaaS uniquement
app.get("/api/time-entries/saas", verifyToken, (req, res) => {
  connection.query(
    "SELECT * FROM time_entries WHERE user_id = ? AND (ticket_type = 'SAAS' OR ticket_type IS NULL)",
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

// Time entries On-Prem uniquement
app.get("/api/time-entries/onprem", verifyToken, (req, res) => {
  connection.query(
    "SELECT * FROM time_entries WHERE user_id = ? AND ticket_type = 'ONPREM'",
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

// Stats par groupe On-Prem
app.get("/api/stats/onprem", verifyToken, (req, res) => {
  connection.query(
    `SELECT group_name, COUNT(*) as count, SUM(hours_logged) as total_hours 
     FROM time_entries 
     WHERE user_id = ? AND ticket_type = 'ONPREM' AND group_name IS NOT NULL
     GROUP BY group_name`,
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

// Stats SaaS vs On-Prem
app.get("/api/stats/comparison", verifyToken, (req, res) => {
  connection.query(
    `SELECT 
      ticket_type,
      COUNT(*) as count,
      SUM(hours_logged) as total_hours
     FROM time_entries 
     WHERE user_id = ?
     GROUP BY ticket_type`,
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.get("/api/rules", verifyToken, (req, res) => {
  connection.query("SELECT * FROM rules", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.put("/api/rules/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { max_hours } = req.body;
  connection.query(
    "UPDATE rules SET max_hours = ? WHERE id = ?",
    [max_hours, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Rule updated successfully" });
    }
  );
});

app.get("/api/admin/time-entries", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  connection.query("SELECT * FROM time_entries", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.get("/api/skipped-tickets", verifyToken, (req, res) => {
  connection.query("SELECT * FROM skipped_tickets", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// Chatbot IA — DeepSeek API (100% gratuit)
app.post("/api/chat", verifyToken, async (req, res) => {
  try {
    const { messages, context } = req.body;
    
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: context },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    const data = await response.json();
    console.log("DeepSeek response:", JSON.stringify(data));
    const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu répondre.";
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

cron.schedule("0 2 * * *", () => {
  console.log("Running daily sync job...");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port " + (process.env.PORT || 5000));
});