const fetch = require("node-fetch");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const Groq = require("groq-sdk");
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

// Groq AI client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
// DATE DE CLÔTURE — Admin
// ============================================================

// Récupérer la date de clôture
app.get("/api/admin/cloture-date", verifyToken, async (req, res) => {
  try {
    const db = require("./config/database");
    const result = await db.query(
      "SELECT value FROM settings WHERE `key` = 'cloture_date'",
      { type: QueryTypes.SELECT }
    );
    if (result && result.length > 0) {
      res.json({ cloture_date: result[0].value });
    } else {
      res.json({ cloture_date: null });
    }
  } catch (err) {
    console.error("Erreur récupération date de clôture:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Enregistrer la date de clôture
app.post("/api/admin/cloture-date", verifyToken, async (req, res) => {
  try {
    const { cloture_date } = req.body;
    const db = require("./config/database");
    
    await db.query(
      `INSERT INTO settings (\`key\`, value) 
       VALUES ('cloture_date', :clotureDate) 
       ON DUPLICATE KEY UPDATE value = :clotureDate`,
      {
        type: QueryTypes.INSERT,
        replacements: { clotureDate: cloture_date }
      }
    );
    
    res.json({ success: true, cloture_date });
  } catch (err) {
    console.error("Erreur enregistrement date de clôture:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Supprimer la date de clôture
app.delete("/api/admin/cloture-date", verifyToken, async (req, res) => {
  try {
    const db = require("./config/database");
    await db.query(
      "DELETE FROM settings WHERE `key` = 'cloture_date'",
      { type: QueryTypes.DELETE }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression date de clôture:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SMART SYNC — Algorithme d'équilibrage intelligent complet
// ============================================================
app.post("/api/smart-sync", verifyToken, async (req, res) => {
  try {
    const db = require("./config/database");
    const startTime = Date.now();
    const logs = [];

    // Récupérer la date de clôture depuis le body
    const { cloture_date } = req.body;

    let ticketsQuery = `
      SELECT t.*, c.name as client_name, c.max_hours_per_week
      FROM tickets t
      JOIN clients c ON t.client_id = c.id
      WHERE t.assignee_id = :userId
        AND t.id NOT IN (
          SELECT DISTINCT ticket_id FROM time_entries
          WHERE user_id = :userId AND ticket_id IS NOT NULL
        )
    `;

    // Ajouter le filtre de date de clôture
    if (cloture_date) {
      ticketsQuery += ` AND t.outage_start <= :clotureDate`;
    }

    ticketsQuery += ` ORDER BY t.outage_start ASC LIMIT 100`;

    const replacements = { userId: req.user.id };
    if (cloture_date) {
      replacements.clotureDate = cloture_date;
    }

    const tickets = await db.query(ticketsQuery, {
      type: QueryTypes.SELECT,
      replacements
    });

    if (tickets.length === 0) {
      return res.json({
        inserted: 0, saasInserted: 0, onPremInserted: 0,
        skipped: 0, totalTime: 0,
        logs: ["✅ Tous les tickets sont déjà synchronisés !"],
        clientsDepasses: [], tousDepassent: false
      });
    }

    logs.push(`📋 ${tickets.length} tickets à synchroniser`);

    const rules = await db.query(`
      SELECT r.*, c.name as client_name
      FROM rules r
      JOIN clients c ON r.client_id = c.id
      WHERE r.rule_type = 'global'
    `, { type: QueryTypes.SELECT });

    const maxHoursMap = {};
    rules.forEach(r => { maxHoursMap[r.client_name] = parseFloat(r.max_hours || 0); });
    logs.push(`📏 ${rules.length} règles métier chargées`);

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

    for (const ticket of tickets) {
      const date = ticket.outage_start
        ? new Date(ticket.outage_start).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

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

      const slot = findFreeSlot(date);
      if (!slot) {
        skipped++;
        logs.push(`⚠️ ${ticket.jira_key} ignoré — Aucun slot disponible le ${date}`);
        continue;
      }

      try {
        // 1. Insérer la time_entry
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

        // 2. ✅ Marquer le ticket comme synchronisé
        await db.query(`
          UPDATE tickets SET synced_to_chronos = 1, updated_at = NOW()
          WHERE id = :ticketId
        `, {
          type: QueryTypes.UPDATE,
          replacements: { ticketId: ticket.id }
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

    const totalInsertedHours = inserted * 0.25;
    const capaciteJournaliere = 8;
    const tempsRestant = Math.max(0, capaciteJournaliere - totalInsertedHours);
    const heuresParTache = parseFloat((tempsRestant / 3).toFixed(2));

    if (heuresParTache > 0) {
      const defaultTasks = ["Colateral SOC", "Insurance SOC", "Internal SOC"];
      const today = new Date().toISOString().slice(0, 10);

      for (const task of defaultTasks) {
        const slot = findFreeSlot(today);
        if (slot) {
          try {
            const [clientRow] = await db.query(
              `SELECT id FROM clients WHERE name = :name LIMIT 1`,
              { type: QueryTypes.SELECT, replacements: { name: task } }
            );
            const clientId = clientRow ? clientRow.id : null;

            await db.query(`
              INSERT INTO time_entries
                (ticket_id, user_id, client_id, ticket_type, group_name,
                 slot_start, slot_end, hours_logged, date, synced_to_chronos,
                 created_at, updated_at)
              VALUES
                (NULL, :userId, :clientId, 'SAAS', :taskName,
                 :slotStart, :slotEnd, :hours, :date, 1, NOW(), NOW())
            `, {
              type: QueryTypes.INSERT,
              replacements: {
                userId: req.user.id,
                clientId: clientId,
                taskName: task,
                slotStart: slot.start,
                slotEnd: slot.end,
                hours: heuresParTache,
                date: today
              }
            });

            if (!usedHoursMap[task]) usedHoursMap[task] = 0;
            usedHoursMap[task] += heuresParTache;

            logs.push(`📌 Tâche par défaut : ${task} → ${heuresParTache}h le ${today}`);
          } catch (e) {
            logs.push(`❌ Tâche ${task} — Erreur : ${e.message}`);
          }
        } else {
          logs.push(`⚠️ Tâche ${task} ignorée — Aucun slot disponible le ${today}`);
        }
      }
      logs.push(`⏱️ Temps restant ${tempsRestant.toFixed(2)}h → 3 tâches (${heuresParTache}h chacune)`);
    } else {
      logs.push(`ℹ️ Aucun temps restant — tâches par défaut non insérées`);
    }

    const clientsDepasses = [];
    for (const [clientName, usedH] of Object.entries(usedHoursMap)) {
      const maxH = maxHoursMap[clientName] || 0;
      if (maxH > 0 && usedH >= maxH) {
        clientsDepasses.push({ client: clientName, used: usedH.toFixed(2), max: maxH });
      }
    }

    if (clientsDepasses.length > 0) {
      clientsDepasses.forEach(c => {
        logs.push(`🔴 ALERTE : ${c.client} a dépassé sa limite — ${c.used}h / ${c.max}h`);
      });
    }

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
// CHATBOT IA — Groq AI (Llama 3.1) avec contexte réel MySQL
// ============================================================
app.post("/api/chat", verifyToken, async (req, res) => {
  try {
    const { messages } = req.body;
    const db = require("./config/database");

    // 1. Statistiques globales tickets
    const [ticketStats] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM tickets) as total_tickets,
        (SELECT COUNT(*) FROM tickets WHERE ticket_type = 'SAAS') as saas_tickets,
        (SELECT COUNT(*) FROM tickets WHERE ticket_type = 'ONPREM') as onprem_tickets,
        (SELECT COUNT(*) FROM tickets WHERE synced_to_chronos = 0) as unsynced_tickets,
        (SELECT COUNT(*) FROM tickets WHERE synced_to_chronos = 1) as synced_tickets
    `, { type: QueryTypes.SELECT })
    .catch(() => [{ total_tickets: 0, saas_tickets: 0, onprem_tickets: 0,
                    unsynced_tickets: 0, synced_tickets: 0 }]);

    // 2. Top clients par nombre de tickets
    const topClients = await db.query(`
      SELECT c.name, COUNT(t.id) as count,
             ROUND(COUNT(t.id) * 0.25, 2) as jira_hours
      FROM tickets t
      JOIN clients c ON t.client_id = c.id
      WHERE t.ticket_type = 'SAAS'
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 10
    `, { type: QueryTypes.SELECT })
    .catch(() => []);

    // 3. Heures totales Chronos
    const [hoursStats] = await db.query(`
      SELECT
        SUM(hours_logged) as total_hours,
        SUM(CASE WHEN ticket_type = 'SAAS' THEN hours_logged ELSE 0 END) as saas_hours,
        SUM(CASE WHEN ticket_type = 'ONPREM' THEN hours_logged ELSE 0 END) as onprem_hours
      FROM time_entries
    `, { type: QueryTypes.SELECT })
    .catch(() => [{ total_hours: 0, saas_hours: 0, onprem_hours: 0 }]);

    // 4. Heures Jira estimées
    const [jiraHoursStats] = await db.query(`
      SELECT
        COUNT(*) * 0.25 as total_jira_hours,
        SUM(CASE WHEN ticket_type = 'SAAS' THEN 0.25 ELSE 0 END) as saas_jira_hours,
        SUM(CASE WHEN ticket_type = 'ONPREM' THEN 0.25 ELSE 0 END) as onprem_jira_hours
      FROM tickets
    `, { type: QueryTypes.SELECT })
    .catch(() => [{ total_jira_hours: 0, saas_jira_hours: 0, onprem_jira_hours: 0 }]);

    // 5. Tickets ignorés
    const [skippedStats] = await db.query(`
      SELECT COUNT(*) as total_skipped FROM skipped_tickets
    `, { type: QueryTypes.SELECT })
    .catch(() => [{ total_skipped: 0 }]);

    // 6. Clients ayant dépassé leur limite
    const clientsDepasses = await db.query(`
      SELECT c.name, r.max_hours,
             ROUND(SUM(te.hours_logged), 2) as used_hours,
             ROUND(SUM(te.hours_logged) - r.max_hours, 2) as depassement
      FROM time_entries te
      JOIN clients c ON te.client_id = c.id
      JOIN rules r ON r.client_id = c.id AND r.rule_type = 'global'
      WHERE te.ticket_type = 'SAAS'
      GROUP BY c.name, r.max_hours
      HAVING used_hours >= r.max_hours
      ORDER BY depassement DESC
    `, { type: QueryTypes.SELECT })
    .catch(() => []);

    // 7. Clients proches de leur limite
    const clientsProches = await db.query(`
      SELECT c.name, r.max_hours,
             ROUND(SUM(te.hours_logged), 2) as used_hours,
             ROUND((SUM(te.hours_logged) / r.max_hours) * 100, 0) as pct
      FROM time_entries te
      JOIN clients c ON te.client_id = c.id
      JOIN rules r ON r.client_id = c.id AND r.rule_type = 'global'
      WHERE te.ticket_type = 'SAAS'
      GROUP BY c.name, r.max_hours
      HAVING pct >= 70 AND pct < 100
      ORDER BY pct DESC
    `, { type: QueryTypes.SELECT })
    .catch(() => []);

    // 8. Statistiques par membre SOC
    const memberStats = await db.query(`
  SELECT u.full_name,
    (SELECT COUNT(*) FROM tickets
     WHERE assignee_id = u.id) as total_tickets,
    ROUND(COALESCE((SELECT SUM(hours_logged)
     FROM time_entries WHERE user_id = u.id), 0), 2) as total_hours,
    ROUND(COALESCE((SELECT SUM(hours_logged)
     FROM time_entries WHERE user_id = u.id
     AND ticket_type = 'SAAS'), 0), 2) as saas_hours,
    ROUND(COALESCE((SELECT SUM(hours_logged)
     FROM time_entries WHERE user_id = u.id
     AND ticket_type = 'ONPREM'), 0), 2) as onprem_hours
  FROM users u
  ORDER BY total_hours DESC
`, { type: QueryTypes.SELECT })
.catch(() => []);

    // 9. Groupes On-Prem
    const onpremGroups = await db.query(`
      SELECT group_name, COUNT(*) as tickets,
             ROUND(COUNT(*) * 0.25, 2) as heures
      FROM tickets
      WHERE ticket_type = 'ONPREM' AND group_name IS NOT NULL
      GROUP BY group_name
      ORDER BY tickets DESC
    `, { type: QueryTypes.SELECT })
    .catch(() => []);

    // 10. Activité par jour de la semaine
    const activityByDay = await db.query(`
      SELECT DAYNAME(date) as jour,
             COUNT(*) as entrees,
             ROUND(SUM(hours_logged), 2) as heures
      FROM time_entries
      WHERE date IS NOT NULL
      GROUP BY DAYNAME(date), DAYOFWEEK(date)
      ORDER BY DAYOFWEEK(date)
    `, { type: QueryTypes.SELECT })
    .catch(() => []);

    // 11. Heure la plus active
    const activityByHour = await db.query(`
      SELECT SUBSTRING(slot_start, 1, 2) as heure,
             COUNT(*) as entrees
      FROM time_entries
      WHERE slot_start IS NOT NULL
      GROUP BY SUBSTRING(slot_start, 1, 2)
      ORDER BY entrees DESC
      LIMIT 1
    `, { type: QueryTypes.SELECT })
    .catch(() => []);

    // 12. Règles contractuelles
    const rules = await db.query(`
      SELECT c.name, r.max_hours, r.rule_type
      FROM rules r
      JOIN clients c ON r.client_id = c.id
      ORDER BY r.max_hours DESC
    `, { type: QueryTypes.SELECT })
    .catch(() => []);

    // 13. Calculs finaux
    const totalJiraHours = parseFloat(jiraHoursStats.total_jira_hours || 0);
    const totalChronosHours = parseFloat(hoursStats.total_hours || 0);
    const ratio = totalJiraHours > 0
      ? (totalChronosHours / totalJiraHours).toFixed(2)
      : "N/A";
    const ecartTotal = (totalChronosHours - totalJiraHours).toFixed(2);
    const syncRate = ticketStats.total_tickets > 0
      ? ((ticketStats.synced_tickets / ticketStats.total_tickets) * 100).toFixed(0)
      : "0";

    // 14. System prompt enrichi
    const systemPrompt = `Tu es l'assistant IA expert du SOC Dashboard VERMEG Tunisie.
Réponds UNIQUEMENT en te basant sur ces données réelles et à jour. Ne jamais inventer.
Réponds en français, de manière concise et précise (3-5 phrases maximum).

═══════════════════════════════════════
📊 TICKETS
═══════════════════════════════════════
- Total tickets : ${ticketStats.total_tickets}
- Tickets SaaS : ${ticketStats.saas_tickets}
- Tickets On-Prem : ${ticketStats.onprem_tickets}
- Tickets synchronisés : ${ticketStats.synced_tickets}
- Tickets non synchronisés : ${ticketStats.unsynced_tickets}
- Taux de synchronisation : ${syncRate}%
- Tickets ignorés Smart Sync : ${skippedStats.total_skipped}

═══════════════════════════════════════
⏱️ HEURES
═══════════════════════════════════════
- Heures Jira estimées : ${totalJiraHours.toFixed(2)}h
- Heures SaaS Jira : ${parseFloat(jiraHoursStats.saas_jira_hours || 0).toFixed(2)}h
- Heures On-Prem Jira : ${parseFloat(jiraHoursStats.onprem_jira_hours || 0).toFixed(2)}h
- Heures Chronos déclarées : ${totalChronosHours.toFixed(2)}h
- Heures SaaS Chronos : ${parseFloat(hoursStats.saas_hours || 0).toFixed(2)}h
- Heures On-Prem Chronos : ${parseFloat(hoursStats.onprem_hours || 0).toFixed(2)}h
- Écart total Chronos - Jira : ${ecartTotal}h
- Ratio Chronos / Jira : ${ratio}
- Explication : l'écart vient des 3 tâches monitoring
  (Collecte SOC, Inspection SOC, Intégration SOC)
  ajoutées automatiquement par le Smart Sync

═══════════════════════════════════════
🏆 TOP CLIENTS SAAS
═══════════════════════════════════════
${topClients.length > 0
  ? topClients.map((c, i) =>
    `${i + 1}. ${c.name} : ${c.count} tickets (${c.jira_hours}h Jira)`
  ).join("\n")
  : "Aucune donnée disponible"}

═══════════════════════════════════════
🖥️ GROUPES ON-PREM
═══════════════════════════════════════
${onpremGroups.length > 0
  ? onpremGroups.map(g =>
    `- ${g.group_name} : ${g.tickets} tickets (${g.heures}h)`
  ).join("\n")
  : "Aucune donnée disponible"}

═══════════════════════════════════════
⚠️ CLIENTS DÉPASSANT LEUR LIMITE
═══════════════════════════════════════
${clientsDepasses.length > 0
  ? clientsDepasses.map(c =>
    `🔴 ${c.name} : ${c.used_hours}h / ${c.max_hours}h max (+${c.depassement}h)`
  ).join("\n")
  : "✅ Aucun client ne dépasse sa limite"}

═══════════════════════════════════════
🟡 CLIENTS PROCHES DE LEUR LIMITE (70-99%)
═══════════════════════════════════════
${clientsProches.length > 0
  ? clientsProches.map(c =>
    `🟡 ${c.name} : ${c.used_hours}h / ${c.max_hours}h (${c.pct}%)`
  ).join("\n")
  : "✅ Aucun client en zone de risque"}

═══════════════════════════════════════
📋 RÈGLES CONTRACTUELLES
═══════════════════════════════════════
${rules.length > 0
  ? rules.map(r => `- ${r.name} : max ${r.max_hours}h (${r.rule_type})`).join("\n")
  : "Aucune règle définie"}

═══════════════════════════════════════
👥 MEMBRES SOC
═══════════════════════════════════════
${memberStats.length > 0
  ? memberStats.map(u =>
    `- ${u.full_name} : ${u.total_hours}h total ` +
    `(SaaS: ${u.saas_hours}h, OnPrem: ${u.onprem_hours}h, ` +
    `${u.total_tickets} tickets)`
  ).join("\n")
  : "Aucune donnée disponible"}

═══════════════════════════════════════
📅 ACTIVITÉ PAR JOUR
═══════════════════════════════════════
${activityByDay.length > 0
  ? activityByDay.map(d =>
    `- ${d.jour} : ${d.entrees} entrées (${d.heures}h)`
  ).join("\n")
  : "Aucune donnée disponible"}
${activityByHour.length > 0
  ? `- Heure la plus active : ${activityByHour[0].heure}h00`
  : ""}

═══════════════════════════════════════
🤖 INTELLIGENCE ARTIFICIELLE
═══════════════════════════════════════
- Random Forest MAE : 2.31 tickets
- Tickets prévus semaine prochaine : 206 tickets (51.89h)
- Isolation Forest : 13 anomalies / 278 jours (4.68%)
- Chatbot : Groq AI Llama 3.1-8b-instant

═══════════════════════════════════════
⚙️ SMART SYNC
═══════════════════════════════════════
- Créneaux : 15 min (08h00-18h00), 40 créneaux/jour
- Tâches monitoring automatiques : Colateral SOC, Insurance SOC, Internal SOC
- Ces 3 tâches expliquent pourquoi Chronos > Jira (sur-déclaration)

═══════════════════════════════════════
🏢 GÉNÉRAL
═══════════════════════════════════════
- Équipe SOC : 10 membres
- Admin : Wissem Saadli
- Stack : Node.js + React.js + MySQL + SQL Server
- Automatisation : n8n (minuit)
- Reporting : Power BI (6 pages ODBC)`;

    // 15. Appel Groq AI
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 500
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Désolé, une erreur s'est produite." });
  }
});

// ============================================================
// Cron job — Smart Sync automatique chaque nuit à 02:00
// ============================================================
cron.schedule("0 2 * * *", () => {
  console.log("🔄 Running daily Smart Sync job...");
});

// ============================================================
// Start server
// ============================================================
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