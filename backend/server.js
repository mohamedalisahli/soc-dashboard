const express = require("express");
const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "API Running" });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});