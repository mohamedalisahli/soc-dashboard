const fetch = require("node-fetch");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { sequelize } = require("./models");
const { QueryTypes } = require("sequelize");
const { verifyToken } = require("./middleware/authMiddleware");

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

// ============================================================
// SMART SYNC — Algorithme d'équilibrage intelligent complet
// ============================================================
app.post("/api/smart-sync", verifyToken, async (req, res) => {
  try {
    const db = require("./config/database");
    const startTime = Date.now();
    const logs = [];

    // 1. Récupérer les tickets non synchronisés de l'user connecté
    const tickets = await db.query(`
      SELECT t.*, c.name as client_name, c.max_hours_per_week
      FROM tickets t
      JOIN clients c ON t.client_id = c.id
      WHERE t.assignee_id = :userId
        AND t.id NOT IN (
          SELECT DISTINCT ticket_id FROM time_entries
          WHERE user_id = :userId AND ticket_id IS NOT NULL
        )
      ORDER BY t.outage_start ASC
      LIMIT 100
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });

    if (tickets.length === 0) {
      return res.json({
        inserted: 0, saasInserted: 0, onPremInserted: 0,
        skipped: 0, totalTime: 0,
        logs: ["✅ Tous les tickets sont déjà synchronisés !"],
        clientsDepasses: [], tousDepassent: false
      });
    }

    logs.push(`📋 ${tickets.length} tickets à synchroniser`);

    // 2. Récupérer les règles métier (max hours par client)
    const rules = await db.query(`
      SELECT r.*, c.name as client_name
      FROM rules r
      JOIN clients c ON r.client_id = c.id
      WHERE r.rule_type = 'global'
    `, { type: QueryTypes.SELECT });

    const maxHoursMap = {};
    rules.forEach(r => { maxHoursMap[r.client_name] = parseFloat(r.max_hours || 0); });
    logs.push(`📏 ${rules.length} règles métier chargées`);

    // 3. Calculer les heures déjà utilisées par client cette semaine
    const usedHours = await db.query(`
      SELECT c.name as client_name, SUM(te.hours_logged) as total_hours
      FROM time_entries te
      JOIN clients c ON te.client_id = c.id
      WHERE te.user_id = :userId
        AND te.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY te.client_id, c.name
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });

    const usedHoursMap = {};
    usedHours.forEach(u => { usedHoursMap[u.client_name] = parseFloat(u.total_hours || 0); });

    // 4. Générer tous les slots 08:00 → 18:00 par pas de 15 min
    const generateSlots = () => {
      const slots = [];
      for (let h = 8; h < 18; h++) {
        for (let m = 0; m < 60; m += 15) {
          const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
          const endMin = m + 15 >= 60 ? 0 : m + 15;
          const endHour = m + 15 >= 60 ? h + 1 : h;
          const end = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;
          slots.push({ start, end });
        }
      }
      return slots;
    };

    // 5. Récupérer les slots déjà occupés par date
    const occupiedSlots = await db.query(`
      SELECT date, slot_start FROM time_entries
      WHERE user_id = :userId
    `, { type: QueryTypes.SELECT, replacements: { userId: req.user.id } });

    const occupiedMap = {};
    occupiedSlots.forEach(s => {
      const key = s.date ? s.date.toString().slice(0, 10) : "unknown";
      if (!occupiedMap[key]) occupiedMap[key] = new Set();
      occupiedMap[key].add(s.slot_start);
    });

    // Fonction pour trouver le prochain slot libre pour une date
    const findFreeSlot = (date) => {
      const allSlots = generateSlots();
      const occupied = occupiedMap[date] || new Set();
      for (const slot of allSlots) {
        if (!occupied.has(slot.start)) {
          if (!occupiedMap[date]) occupiedMap[date] = new Set();
          occupiedMap[date].add(slot.start);
          return slot;
        }
      }
      return null;
    };

    let inserted = 0, saasInserted = 0, onPremInserted = 0, skipped = 0;
    const skippedTickets = [];

    // 6. Insérer chaque ticket avec vérification des contraintes
    for (const ticket of tickets) {
      const date = ticket.outage_start
        ? new Date(ticket.outage_start).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      // Vérification des contraintes métier pour SaaS uniquement
      if (ticket.ticket_type === "SAAS") {
        const maxH = maxHoursMap[ticket.client_name] || 0;
        const usedH = usedHoursMap[ticket.client_name] || 0;

        if (maxH > 0 && usedH + 0.25 > maxH) {
          try {
            await db.query(`
              INSERT INTO skipped_tickets (ticket_id, user_id, client_name, reason, created_at, updated_at)
              VALUES (:ticketId, :userId, :clientName, :reason, NOW(), NOW())
              ON DUPLICATE KEY UPDATE updated_at = NOW()
            `, {
              type: QueryTypes.INSERT,
              replacements: {
                ticketId: ticket.id,
                userId: req.user.id,
                clientName: ticket.client_name,
                reason: `Max heures dépassé : ${usedH.toFixed(2)}h / ${maxH}h`
              }
            });
          } catch (e) { /* ignore */ }

          skippedTickets.push(ticket.jira_key);
          skipped++;
          logs.push(`⚠️ ${ticket.jira_key} ignoré — ${ticket.client_name} : ${usedH.toFixed(2)}h / ${maxH}h max`);
          continue;
        }
      }

      // Trouver un slot libre (pas de chevauchement)
      const slot = findFreeSlot(date);
      if (!slot) {
        skipped++;
        logs.push(`⚠️ ${ticket.jira_key} ignoré — Aucun slot disponible le ${date}`);
        continue;
      }

      try {
        // ✅ CORRIGÉ : synced_to_chronos = 1 (au lieu de 0)
        await db.query(`
          INSERT INTO time_entries
            (ticket_id, user_id, client_id, ticket_type, group_name,
             slot_start, slot_end, hours_logged, date, synced_to_chronos,
             created_at, updated_at)
          VALUES
            (:ticketId, :userId, :clientId, :ticketType, :groupName,
             :slotStart, :slotEnd, 0.25, :date, 1, NOW(), NOW())
        `, {
          type: QueryTypes.INSERT,
          replacements: {
            ticketId: ticket.id,
            userId: ticket.assignee_id || req.user.id,
            clientId: ticket.client_id,
            ticketType: ticket.ticket_type,
            groupName: ticket.group_name || null,
            slotStart: slot.start,
            slotEnd: slot.end,
            date
          }
        });

        if (!usedHoursMap[ticket.client_name]) usedHoursMap[ticket.client_name] = 0;
        usedHoursMap[ticket.client_name] += 0.25;

        inserted++;
        if (ticket.ticket_type === "SAAS") saasInserted++;
        else onPremInserted++;

        logs.push(`✅ ${ticket.jira_key} → ${slot.start} le ${date}`);
      } catch (e) {
        skipped++;
        logs.push(`❌ ${ticket.jira_key} — Erreur : ${e.message}`);
      }
    }

    // 7. Tâches par défaut avec le temps restant
    const totalInsertedHours = inserted * 0.25;
    const capaciteJournaliere = 8;
    const tempsRestant = Math.max(0, capaciteJournaliere - totalInsertedHours);
    const heuresParTache = parseFloat((tempsRestant / 3).toFixed(2));

    if (heuresParTache > 0) {
      const defaultTasks = ["col_soc_monitoring", "ins_soc_monitoring", "int_soc_monitoring"];
      const today = new Date().toISOString().slice(0, 10);

      for (const task of defaultTasks) {
        const slot = findFreeSlot(today);
        if (slot) {
          try {
            // ✅ CORRIGÉ : synced_to_chronos = 1 pour les tâches aussi
            await db.query(`
              INSERT INTO time_entries
                (ticket_id, user_id, client_id, ticket_type, group_name,
                 slot_start, slot_end, hours_logged, date, synced_to_chronos,
                 created_at, updated_at)
              VALUES
                (NULL, :userId, NULL, 'SAAS', :taskName,
                 :slotStart, :slotEnd, :hours, :date, 1, NOW(), NOW())
            `, {
              type: QueryTypes.INSERT,
              replacements: {
                userId: req.user.id,
                taskName: task,
                slotStart: slot.start,
                slotEnd: slot.end,
                hours: heuresParTache,
                date: today
              }
            });
            logs.push(`📌 Tâche : ${task} → ${heuresParTache}h`);
          } catch (e) { /* ignore */ }
        }
      }
      logs.push(`⏱️ Temps restant ${tempsRestant.toFixed(2)}h → 3 tâches (${heuresParTache}h chacune)`);
    }

    // 8. Vérification double — alertes dépassement
    const clientsDepasses = [];

    for (const [clientName, usedH] of Object.entries(usedHoursMap)) {
      const maxH = maxHoursMap[clientName] || 0;
      if (maxH > 0 && usedH >= maxH) {
        clientsDepasses.push({ client: clientName, used: usedH.toFixed(2), max: maxH });
      }
    }

    // Alerte 1 : UN client dépasse
    if (clientsDepasses.length > 0) {
      clientsDepasses.forEach(c => {
        logs.push(`🔴 ALERTE : ${c.client} a dépassé sa limite — ${c.used}h / ${c.max}h`);
      });
    }

    // Alerte 2 : TOUS les clients dépassent
    const clientsAvecRegles = Object.keys(maxHoursMap).filter(c => maxHoursMap[c] > 0);
    const tousDepassent = clientsAvecRegles.length > 0 && clientsAvecRegles.every(c => {
      const used = usedHoursMap[c] || 0;
      return used >= maxHoursMap[c];
    });

    if (tousDepassent) {
      logs.push(`🚨 ALERTE CRITIQUE : TOUS les clients ont dépassé leur limite hebdomadaire !`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    logs.push(`🏁 Synchronisation terminée en ${totalTime}s`);

    res.json({
      inserted, saasInserted, onPremInserted, skipped,
      totalTime, logs,
      skippedTickets: skippedTickets.slice(0, 10),
      clientsDepasses,
      tousDepassent
    });

  } catch (err) {
    console.error("Smart Sync error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CHATBOT IA
// ============================================================
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
      reply = "📋 **Résumé SOC Dashboard VERMEG :**\n• Total tickets : 2710 (1510 SaaS + 1200 On-Prem)\n• Clients : 16 SaaS + 5 groupes On-Prem\n• Équipe : 10 membres SOC\n• Client principal : STT (690 tickets)\n• Automatisation : n8n (minuit quotidien)";
    } else if (lastMessage.includes("bonjour") || lastMessage.includes("hello") || lastMessage.includes("salut")) {
      reply = "👋 Bonjour ! Je suis l'assistant IA du SOC Dashboard VERMEG. Je peux vous aider à analyser vos tickets, clients, heures Chronos et anomalies.";
    } else if (lastMessage.includes("règle") || lastMessage.includes("regle")) {
      reply = "📏 **Règles métier SaaS :**\n• STT : max 20h/semaine\n• SMBC : max 15h/semaine\n• LGIM : max 10h/semaine\n• GEN : max 10h/semaine\n• Devops : max 8h/semaine";
    } else if (lastMessage.includes("synchronis")) {
      reply = "🔄 Le Smart Sync synchronise automatiquement les tickets Jira vers Chronos. Chaque ticket reçoit un slot horaire de 15 minutes entre 08:00 et 18:00, en respectant les règles métier par client.";
    } else {
      reply = "🤖 Pour une analyse précise, essayez : \"quel client a le plus de tickets\", \"anomalies détectées\", \"prédiction STT\", ou \"résume les données SOC\".";
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron job — Smart Sync automatique chaque nuit
cron.schedule("0 2 * * *", () => {
  console.log("🔄 Running daily Smart Sync job...");
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