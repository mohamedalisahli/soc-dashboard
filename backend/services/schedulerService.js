const connection = require("../config/database");

const DAILY_CAPACITY = 8 * 60;
const SLOT_DURATION = 15;
const START_HOUR = 8;
const DEFAULT_TASKS = ["col_soc_monitoring", "ins_soc_monitoring", "int_soc_monitoring"];

const findAvailableSlot = (usedSlots, date) => {
  let currentMinutes = START_HOUR * 60;
  while (currentMinutes < 18 * 60) {
    const slotKey = `${date}_${currentMinutes}`;
    if (!usedSlots.has(slotKey)) return currentMinutes;
    currentMinutes += SLOT_DURATION;
  }
  return null;
};

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const smartSync = (userId, tickets, rules) => {
  return new Promise((resolve) => {
    const usedSlots = new Set();
    const logs = [];
    const inserted = [];
    const skipped = [];
    const clientHours = {};
    const today = new Date().toISOString().split("T")[0];

    // Séparer SaaS et On-Prem
    const saasTickets = tickets.filter(t => t.type === "SAAS");
    const onPremTickets = tickets.filter(t => t.type === "ONPREM");

    logs.push(`📋 Total tickets: ${tickets.length} (SaaS: ${saasTickets.length}, On-Prem: ${onPremTickets.length})`);

    // Trier par date de création
    tickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Récupérer les règles métier (SaaS uniquement)
    const rulesMap = {};
    rules.forEach(r => rulesMap[r.client_name] = r.max_hours);

    let completed = 0;
    const total = tickets.length;

    if (total === 0) {
      finishSync();
      return;
    }

    tickets.forEach(ticket => {
      const isSaas = ticket.type === "SAAS";
      const label = isSaas ? ticket.client : ticket.group_name;

      // Vérifier limite client (SaaS uniquement)
      if (isSaas) {
        const maxHours = rulesMap[ticket.client] || 999;
        if ((clientHours[ticket.client] || 0) + 0.25 > maxHours) {
          logs.push(`⚠️ SKIP [SAAS]: ${ticket.id} — limite client ${ticket.client} atteinte`);
          skipped.push({ ticket_id: ticket.id, client: ticket.client, reason: `Max hours (${maxHours}h) exceeded` });

          const skipQuery = `INSERT INTO skipped_tickets (ticket_id, client, reason) VALUES (?, ?, ?)`;
          connection.query(skipQuery, [ticket.id, ticket.client, `Max hours exceeded`], () => {
            completed++;
            if (completed === total) finishSync();
          });
          return;
        }
      }

      // Trouver slot disponible
      const slot = findAvailableSlot(usedSlots, today);
      if (!slot) {
        logs.push(`⚠️ SKIP: ${ticket.id} — aucun slot disponible`);
        skipped.push({ ticket_id: ticket.id, client: label, reason: "No slot available" });
        completed++;
        if (completed === total) finishSync();
        return;
      }

      // Marquer slot comme utilisé
      usedSlots.add(`${today}_${slot}`);

      // Mettre à jour les heures (SaaS uniquement)
      if (isSaas) {
        clientHours[ticket.client] = (clientHours[ticket.client] || 0) + 0.25;
      }

      const slotTime = formatTime(slot);
      const typeLabel = isSaas ? "SAAS" : "ONPREM";
      logs.push(`✅ INSERT [${typeLabel}]: ${ticket.id} → slot ${slotTime} (${label})`);

      const query = `INSERT INTO time_entries (user_id, client_id, hours_logged, date, chronos_entry_id, ticket_type, group_name) VALUES (?, 1, 0.25, ?, ?, ?, ?)`;
      connection.query(query, [userId, today, ticket.id, ticket.type, isSaas ? null : ticket.group_name], (err) => {
        if (err) {
          // Fallback si les colonnes n'existent pas encore
          const fallbackQuery = `INSERT INTO time_entries (user_id, client_id, hours_logged, date, chronos_entry_id) VALUES (?, 1, 0.25, ?, ?)`;
          connection.query(fallbackQuery, [userId, today, ticket.id], (err2) => {
            if (err2) logs.push(`❌ ERROR: ${err2.message}`);
            else inserted.push(ticket.id);
            completed++;
            if (completed === total) finishSync();
          });
        } else {
          inserted.push(ticket.id);
          completed++;
          if (completed === total) finishSync();
        }
      });
    });

    function finishSync() {
      const usedMinutes = inserted.length * SLOT_DURATION;
      const remainingMinutes = DAILY_CAPACITY - usedMinutes;
      const timePerTask = Math.floor(remainingMinutes / 3 / SLOT_DURATION) * SLOT_DURATION;

      logs.push(`\n⏱️ Temps restant: ${remainingMinutes} min → ${timePerTask} min par tâche`);

      const defaultInserts = DEFAULT_TASKS.map(task => [userId, 1, timePerTask / 60, today, task]);

      connection.query(
        `INSERT INTO time_entries (user_id, client_id, hours_logged, date, chronos_entry_id) VALUES ?`,
        [defaultInserts],
        (err) => {
          if (err) logs.push(`❌ Erreur tâches défaut: ${err.message}`);
          else logs.push(`✅ Tâches par défaut insérées: col_soc, ins_soc, int_soc`);

          // Statistiques par type
          const saasInserted = inserted.filter(id => saasTickets.find(t => t.id === id));
          const onPremInserted = inserted.filter(id => onPremTickets.find(t => t.id === id));

          resolve({
            inserted: inserted.length,
            saasInserted: saasInserted.length,
            onPremInserted: onPremInserted.length,
            skipped: skipped.length,
            totalTime: inserted.length * 0.25,
            remainingTime: remainingMinutes / 60,
            defaultTasksTime: timePerTask / 60,
            logs,
            skippedTickets: skipped
          });
        }
      );
    }
  });
};

module.exports = { smartSync };