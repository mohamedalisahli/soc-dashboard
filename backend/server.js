const express = require("express");
const cors = require("cors");
const connection = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "API Running" });
});

app.get("/api/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.error("MySQL error:", err);
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});