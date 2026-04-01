import { useEffect, useState } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  RadialBarChart, RadialBar
} from "recharts";

const COLORS = ["#C8102E", "#1a1a2e", "#0f3460", "#e94560", "#16213e"];

const styles = {
  navbar: {
    background: "#C8102E",
    padding: "0 30px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
  },
  brand: {
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "2px"
  },
  page: {
    minHeight: "100vh",
    background: "#f4f6f9",
    fontFamily: "Arial, sans-serif"
  },
  container: { padding: "25px" },
  kpiCard: (bg) => ({
    background: bg,
    borderRadius: "10px",
    padding: "20px",
    textAlign: "center",
    color: "white",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    marginBottom: "20px"
  }),
  card: {
    background: "white",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    marginBottom: "20px"
  },
  cardTitle: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: "16px",
    marginBottom: "15px",
    borderBottom: "2px solid #C8102E",
    paddingBottom: "8px"
  },
  btn: (bg) => ({
    background: bg,
    color: "white",
    border: "none",
    padding: "12px 30px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    letterSpacing: "1px",
    margin: "0 8px"
  }),
  badge: (bg) => ({
    background: bg,
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold"
  }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#1a1a2e",
    color: "white",
    padding: "12px 15px",
    textAlign: "left",
    fontSize: "13px"
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "14px",
    color: "#333"
  }
};

// Jauge simple
function Gauge({ value, max, label }) {
  const percent = Math.min((value / max) * 100, 100);
  const color = percent > 80 ? "#C8102E" : percent > 50 ? "#ff9800" : "#28a745";
  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <div style={{ position: "relative", width: "150px", margin: "0 auto" }}>
        <svg viewBox="0 0 100 60" style={{ width: "150px" }}>
          <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke="#f0f0f0" strokeWidth="10" strokeLinecap="round"/>
          <path
            d="M10,55 A45,45 0 0,1 90,55"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(percent / 100) * 141} 141`}
          />
        </svg>
        <div style={{ position: "absolute", bottom: "0", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color }}>{value}h</div>
          <div style={{ fontSize: "11px", color: "#999" }}>/ {max}h max</div>
        </div>
      </div>
      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1a1a2e", marginTop: "8px" }}>{label}</div>
      <div style={{
        height: "6px", background: "#f0f0f0", borderRadius: "3px", marginTop: "6px"
      }}>
        <div style={{
          height: "6px", background: color, borderRadius: "3px",
          width: `${percent}%`, transition: "width 0.5s"
        }} />
      </div>
    </div>
  );
}

const RULES = [
  { client: "SMBC", max: 15 },
  { client: "STT", max: 20 },
  { client: "LGIM", max: 10 },
  { client: "GEN", max: 10 },
  { client: "Devops", max: 8 }
];

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [syncMsg, setSyncMsg] = useState("");
  const [smartResult, setSmartResult] = useState(null);
  const [skipped, setSkipped] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/tickets").then(res => setTickets(res.data));
    API.get("/time-entries").then(res => setTimeEntries(res.data));
  }, []);

  const handleSync = async () => {
    const res = await API.post("/sync");
    setSyncMsg(res.data.message);
  };

  const handleSmartSync = async () => {
    setLoading(true);
    setSmartResult(null);
    try {
      const res = await API.post("/smart-sync");
      setSmartResult(res.data);
      const skippedRes = await API.get("/skipped-tickets");
      setSkipped(skippedRes.data);
      const entriesRes = await API.get("/time-entries");
      setTimeEntries(entriesRes.data);
    } catch (err) {
      setSyncMsg("Erreur lors du Smart Sync");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.reload();
  };

  const totalTime = tickets.length * 15;
  const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);

  const byClient = tickets.reduce((acc, t) => {
    acc[t.client] = (acc[t.client] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(byClient).map(([client, count]) => ({
    client, tickets: count, heures: count * 0.25
  }));

  const pieData = Object.entries(byClient).map(([client, count]) => ({
    name: client, value: count
  }));

  // Line chart — entrées par date
  const byDate = timeEntries.reduce((acc, e) => {
    const d = e.date ? e.date.toString().slice(0, 10) : "N/A";
    acc[d] = (acc[d] || 0) + parseFloat(e.hours_logged || 0);
    return acc;
  }, {});
  const lineData = Object.entries(byDate).map(([date, heures]) => ({ date, heures }));

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{ height: "45px" }} />
          <span style={styles.brand}>SOC DASHBOARD</span>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          Déconnexion
        </button>
      </nav>

      <div style={styles.container}>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
          <div style={styles.kpiCard("#C8102E")}>
            <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "8px" }}>TOTAL TICKETS</div>
            <div style={{ fontSize: "36px", fontWeight: "bold" }}>{tickets.length}</div>
          </div>
          <div style={styles.kpiCard("#1a1a2e")}>
            <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "8px" }}>TEMPS TOTAL</div>
            <div style={{ fontSize: "36px", fontWeight: "bold" }}>{totalTime} min</div>
          </div>
          <div style={styles.kpiCard("#0f3460")}>
            <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "8px" }}>CLIENTS</div>
            <div style={{ fontSize: "36px", fontWeight: "bold" }}>{Object.keys(byClient).length}</div>
          </div>
          <div style={styles.kpiCard("#28a745")}>
            <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "8px" }}>HEURES CHRONOS</div>
            <div style={{ fontSize: "36px", fontWeight: "bold" }}>{totalHeures.toFixed(2)}h</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>📊 Tickets par Client</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="client" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" fill="#C8102E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>🥧 Répartition par Client</div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>📈 Évolution des Heures Chronos</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" />
              <Tooltip />
              <Line type="monotone" dataKey="heures" stroke="#C8102E" strokeWidth={2} dot={{ fill: "#C8102E" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Jauges par client */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🎯 Heures utilisées vs Max autorisées par Client</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
            {RULES.map(rule => {
              const used = timeEntries
                .filter(e => e.chronos_entry_id && e.chronos_entry_id.includes(rule.client.toUpperCase()))
                .reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);
              return <Gauge key={rule.client} value={used.toFixed(2)} max={rule.max} label={rule.client} />;
            })}
          </div>
        </div>

        {/* Time Entries Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🕐 Entrées de Temps Chronos</div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Commentaire (Ticket)</th>
                  <th style={styles.th}>Heures</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((entry, i) => (
                  <tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={styles.td}>{entry.id}</td>
                    <td style={styles.td}>
                      <span style={styles.badge(entry.chronos_entry_id ? "#0f3460" : "#999")}>
                        {entry.chronos_entry_id || "—"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge("#28a745")}>{entry.hours_logged}h</span>
                    </td>
                    <td style={styles.td}>{entry.date ? entry.date.toString().slice(0, 10) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tickets Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🎫 Liste des Tickets Jira</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Titre</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Temps</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, i) => (
                <tr key={ticket.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={styles.td}><span style={styles.badge("#C8102E")}>{ticket.id}</span></td>
                  <td style={styles.td}>{ticket.title}</td>
                  <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{ticket.client}</span></td>
                  <td style={styles.td}>15 min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sync Buttons */}
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <button style={styles.btn("#0f3460")} onClick={handleSync}>🔄 Sync Classique</button>
          <button style={styles.btn(loading ? "#999" : "#C8102E")} onClick={handleSmartSync} disabled={loading}>
            {loading ? "⏳ En cours..." : "🧠 Smart Sync"}
          </button>
          {syncMsg && (
            <div style={{ marginTop: "15px", padding: "12px", background: "#f0fff4", border: "1px solid #28a745", borderRadius: "8px", color: "#28a745" }}>
              ✅ {syncMsg}
            </div>
          )}
        </div>

        {/* Smart Sync Result */}
        {smartResult && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>🧠 Résultat Smart Sync</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  <div style={styles.kpiCard("#28a745")}>
                    <div style={{ fontSize: "12px" }}>Insérés</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold" }}>{smartResult.inserted}</div>
                  </div>
                  <div style={styles.kpiCard("#C8102E")}>
                    <div style={{ fontSize: "12px" }}>Ignorés</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold" }}>{smartResult.skipped}</div>
                  </div>
                  <div style={styles.kpiCard("#0f3460")}>
                    <div style={{ fontSize: "12px" }}>Restant</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold" }}>{smartResult.remainingTime}h</div>
                  </div>
                </div>
                <div style={{ marginTop: "12px", padding: "10px", background: "#f8f8f8", borderRadius: "8px", fontSize: "13px", color: "#666" }}>
                  ✅ Tâches par défaut : <strong>{smartResult.defaultTasksTime}h</strong> chacune (col_soc, ins_soc, int_soc)
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>📋 Logs</div>
                <div style={{ maxHeight: "180px", overflowY: "auto", fontSize: "12px" }}>
                  {smartResult.logs.map((log, i) => (
                    <div key={i} style={{
                      padding: "4px 0",
                      color: log.includes("✅") ? "#28a745" : log.includes("⚠️") ? "#ff9800" : "#C8102E"
                    }}>{log}</div>
                  ))}
                </div>
              </div>
            </div>

            {skipped.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>⚠️ Tickets Ignorés</div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Ticket ID</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skipped.map(s => (
                      <tr key={s.id}>
                        <td style={styles.td}><span style={styles.badge("#C8102E")}>{s.ticket_id}</span></td>
                        <td style={styles.td}>{s.client}</td>
                        <td style={styles.td}>{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;