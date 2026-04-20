require('dotenv').config();
const db = require('./config/database');
const { QueryTypes } = require('sequelize');
const fs = require('fs');

db.query(`
  SELECT te.id, t.jira_key as chronos_entry_id, te.user_id, te.client_id, 
         te.hours_logged, te.date, te.ticket_type, te.group_name,
         te.slot_start, te.slot_end, c.name as client_name, u.full_name as assignee_name
  FROM time_entries te
  LEFT JOIN clients c ON te.client_id = c.id
  LEFT JOIN users u ON te.user_id = u.id
  LEFT JOIN tickets t ON te.ticket_id = t.id
  WHERE te.group_name IS NOT NULL OR c.ticket_type = 'ONPREM'
`, {type: QueryTypes.SELECT})
.then(rows => {
  const headers = Object.keys(rows[0]).join(',');
  const csv = rows.map(r => Object.values(r).join(',')).join('\n');
  fs.writeFileSync('C:/Users/MSI/Downloads/time_entries.csv', headers + '\n' + csv);
  console.log('✅ CSV exporté : ' + rows.length + ' lignes');
  process.exit();
})
.catch(e => { console.error(e); process.exit(); });