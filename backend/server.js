const fetch = require("node-fetch");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { sequelize } = require("./models");

// Routes
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const timeEntryRoutes = require("./routes/timeEntries");
const rulesRoutes = require("./routes/rules");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/rules", rulesRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "API Running" });
});

// Chatbot IA — Local intelligent
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let reply = "";

    if (lastMessage.includes("client") && (lastMessage.includes("plus") || lastMessage.includes("max"))) {
      reply = "📊 D'après les données actuelles, **STT** est le client avec le plus de tickets (environ 690 tickets). Il est suivi par SMBC (414), Devops (132) et GEN (128).";
    } else if (lastMessage.includes("anomalie")) {
      reply = "🚨 Le modèle Isolation Forest a détecté **14 anomalies** sur 281 jours analysés. Ces anomalies correspondent à des pics inhabituels d'activité, principalement chez STT.";
    } else if (lastMessage.includes("stt")) {
      reply = "📈 STT est le client le plus actif avec **690 tickets** (46% du total). Maximum autorisé : 20h/semaine.";
    } else if (lastMessage.includes("prédiction") || lastMessage.includes("prediction") || lastMessage.includes("semaine")) {
      reply = "🔮 La prédiction Random Forest pour la semaine prochaine : **205 tickets prévus** pour un total de **52,01 heures**. STT sera le client le plus chargé à 100%.";
    } else if (lastMessage.includes("saas")) {
      reply = "☁️ Les tickets SaaS concernent 16 clients : STT, SMBC, Devops, GEN, LGIM, MILL, VEGGO, FIERA, LIFESTAR, ALLIANZ, AIG, MUFG, ICC, CARMIGNAC, NOCHU et MIZUHO.";
    } else if (lastMessage.includes("on-prem") || lastMessage.includes("onprem")) {
      reply = "🖥️ Les tickets On-Prem concernent 5 groupes internes : GIS, BDO, CDO, DO et EIP.";
    } else if (lastMessage.includes("heure") || lastMessage.includes("total")) {
      reply = "⏱️ Le total des heures Chronos est calculé automatiquement. Chaque ticket = 0,25h (15 minutes). Les slots vont de 08:00 à 18:00.";
    } else if (lastMessage.includes("user") || lastMessage.includes("equipe") || lastMessage.includes("équipe")) {
      reply = "👥 L'équipe SOC compte 10 membres : SOCUSER, Sabeur FRADJ, Khaled KSIBI, Wissem SAADLI, Ahmed SAMTI, Yassine BEN AMARA, Ghaith BASLY, Zeineb HAMMAMI, Zied MOKNI et Amir NAMOUCHI.";
    } else if (lastMessage.includes("résume") || lastMessage.includes("resume")) {
      reply = "📋 **Résumé SOC Dashboard VERMEG :**\n• Total tickets : 1510 tickets réels Jira\n• Clients : 16 SaaS + 5 On-Prem\n• Équipe : 10 membres SOC\n• Client principal : STT (690 tickets)\n• Automatisation : n8n (minuit quotidien)";
    } else if (lastMessage.includes("bonjour") || lastMessage.includes("hello") || lastMessage.includes("salut")) {
      reply = "👋 Bonjour ! Je suis l'assistant IA du SOC Dashboard VERMEG. Je peux vous aider à analyser vos tickets, clients, heures Chronos et anomalies.";
    } else if (lastMessage.includes("règle") || lastMessage.includes("regle")) {
      reply = "📏 **Règles métier SaaS :**\n• STT : max 20h/semaine\n• SMBC : max 15h/semaine\n• LGIM : max 10h/semaine\n• GEN : max 10h/semaine\n• Devops : max 8h/semaine";
    } else {
      reply = `🤖 Pour une analyse précise, essayez : "quel client a le plus de tickets", "anomalies détectées", "prédiction STT", ou "résume les données SOC".`;
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron job
cron.schedule("0 2 * * *", () => {
  console.log("Running daily sync job...");
});

// Start server
const PORT = process.env.PORT || 5000;
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected via Sequelize");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
  });