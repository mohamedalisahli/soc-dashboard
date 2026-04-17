require('dotenv').config();
const seq = require('./config/database');
const { QueryTypes } = require('sequelize');

seq.query('SELECT * FROM time_entries WHERE user_id = 2 LIMIT 5', { type: QueryTypes.SELECT })
.then(r => {
  console.log("Time entries Sabeur:", JSON.stringify(r));
  return seq.query('SELECT * FROM skipped_tickets WHERE user_id = 2 LIMIT 5', { type: QueryTypes.SELECT });
})
.then(r => {
  console.log("Skipped tickets Sabeur:", JSON.stringify(r));
  process.exit();
})
.catch(e => { console.error(e.message); process.exit(); });