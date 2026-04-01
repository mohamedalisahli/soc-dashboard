const connection = require("../config/database");

const DAILY_CAPACITY = 8 * 60; // 8 heures en minutes
const SLOT_DURATION = 15; // 15 minutes par ticket
const START_HOUR = 8; // 08:00
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

    // Trier par date de création
    tickets.sort((a, b) => new Date(a.created) - new Date(b.created));

    // Récupérer les règles métier
    const rulesMap = {};
    rules.forEach(r => rulesMap[r.client_name] = r.max_hours);

    let completed = 0;
    const total = tickets.length;

    if (total === 0) {
      finishSync();
      return;
    }

    tickets.forEach(ticket => {
      const client = ticket.client;
      const maxHours = rulesMap[client] || 999;

      // Vérifier limite client
      if ((clientHours[client] || 0) + 0.25 > maxHours) {
        logs.push(`⚠️ SKIP: ${ticket.id} — limite client ${client} atteinte`);
        skipped.push({ ticket_id: ticket.id, client, reason: `Max hours (${maxHours}h) exceeded` });

        const skipQuery = `INSERT INTO skipped_tickets (ticket_id, client, reason) VALUES (?, ?, ?)`;
        connection.query(skipQuery, [ticket.id, client, `Max hours exceeded`], () => {
          completed++;
          if (completed === total) finishSync();
        });
        return;
      }

      // Trouver slot disponible
      const slot = findAvailableSlot(usedSlots, today);
      if (!slot) {
        logs.push(`⚠️ SKIP: ${ticket.id} — aucun slot disponible`);
        skipped.push({ ticket_id: ticket.id, client, reason: "No slot available" });
        completed++;
        if (completed === total) finishSync();
        return;
      }

      // Marquer slot comme utilisé
      usedSlots.add(`${today}_${slot}`);
      clientHours[client] = (clientHours[client] || 0) + 0.25;

      const comment = ticket.id;
      const slotTime = formatTime(slot);
      logs.push(`✅ INSERT: ${ticket.id} → slot ${slotTime} (${client})`);

      const query = `INSERT INTO time_entries (user_id, client_id, hours_logged, date, chronos_entry_id) VALUES (?, 1, 0.25, ?, ?)`;
      connection.query(query, [userId, today, comment], (err) => {
        if (err) logs.push(`❌ ERROR: ${err.message}`);
        else inserted.push(ticket.id);
        completed++;
        if (completed === total) finishSync();
      });
    });

    function finishSync() {
      // Calculer temps restant
      const usedMinutes = inserted.length * SLOT_DURATION;
      const remainingMinutes = DAILY_CAPACITY - usedMinutes;
      const timePerTask = Math.floor(remainingMinutes / 3 / SLOT_DURATION) * SLOT_DURATION;

      logs.push(`\n⏱️ Temps restant: ${remainingMinutes} min → ${timePerTask} min par tâche`);

      // Insérer les 3 tâches par défaut
      const defaultInserts = DEFAULT_TASKS.map(task => [userId, 1, timePerTask / 60, today, task]);

      connection.query(
        `INSERT INTO time_entries (user_id, client_id, hours_logged, date, chronos_entry_id) VALUES ?`,
        [defaultInserts],
        (err) => {
          if (err) logs.push(`❌ Erreur tâches défaut: ${err.message}`);
          else logs.push(`✅ Tâches par défaut insérées: col_soc, ins_soc, int_soc`);

          resolve({
            inserted: inserted.length,
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