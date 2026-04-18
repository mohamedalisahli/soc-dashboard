import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from "recharts";

const COLORS = ["#C8102E", "#1a1a2e", "#0f3460", "#e94560", "#16213e", "#28a745", "#ff9800"];
const ONPREM_COLORS = ["#0f3460", "#1a1a2e", "#e94560", "#16213e", "#C8102E"];
const CLIENT_COLORS = ["#C8102E", "#0f3460", "#28a745", "#ff9800", "#e94560", "#1a1a2e", "#6c757d"];
const AI_API = "http://localhost:5001";
const PAGE_SIZE = 20;

const styles = {
  navbar: {
    background: "#C8102E", padding: "0 30px", height: "60px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
  },
  brand: { color: "white", fontSize: "20px", fontWeight: "bold", letterSpacing: "2px" },
  page: { minHeight: "100vh", background: "#f4f6f9", fontFamily: "Arial, sans-serif" },
  container: { padding: "25px" },
  kpiCard: (bg) => ({
    background: bg, borderRadius: "10px", padding: "20px", textAlign: "center",
    color: "white", boxShadow: "0 4px 15px rgba(0,0,0,0.15)", marginBottom: "20px"
  }),
  card: {
    background: "white", borderRadius: "10px", padding: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)", marginBottom: "20px"
  },
  cardTitle: {
    color: "#1a1a2e", fontWeight: "bold", fontSize: "16px", marginBottom: "15px",
    borderBottom: "2px solid #C8102E", paddingBottom: "8px"
  },
  btn: (bg) => ({
    background: bg, color: "white", border: "none",
    padding: "10px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
    fontSize: "14px", margin: "0 6px"
  }),
  tabBtn: (active) => ({
    padding: "10px 24px", borderRadius: "8px 8px 0 0", fontWeight: "bold",
    cursor: "pointer", fontSize: "14px", margin: "0 4px 0 0", border: "none",
    background: active ? "white" : "#e0e0e0", color: active ? "#C8102E" : "#666",
    borderBottom: active ? "3px solid #C8102E" : "none"
  }),
  badge: (bg) => ({
    background: bg, color: "white", padding: "4px 10px",
    borderRadius: "20px", fontSize: "12px", fontWeight: "bold"
  }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#1a1a2e", color: "white", padding: "12px 15px", textAlign: "left", fontSize: "13px" },
  td: { padding: "12px 15px", borderBottom: "1px solid #f0f0f0", fontSize: "14px", color: "#333" },
  filterSelect: {
    padding: "8px 12px", borderRadius: "6px", border: "2px solid #e0e0e0",
    fontSize: "13px", outline: "none", marginRight: "10px", cursor: "pointer"
  },
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "8px", marginTop: "15px", padding: "10px"
  },
  pageBtn: (active) => ({
    padding: "6px 12px", border: "1px solid #ddd", borderRadius: "5px",
    cursor: "pointer", background: active ? "#C8102E" : "white",
    color: active ? "white" : "#333", fontWeight: active ? "bold" : "normal"
  })
};

function Pagination({ total, page, onPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div style={styles.pagination}>
      <button style={styles.pageBtn(false)} onClick={() => onPage(1)} disabled={page === 1}>«</button>
      <button style={styles.pageBtn(false)} onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
      {start > 1 && <span style={{ padding: "6px" }}>...</span>}
      {pages.map(p => (
        <button key={p} style={styles.pageBtn(p === page)} onClick={() => onPage(p)}>{p}</button>
      ))}
      {end < totalPages && <span style={{ padding: "6px" }}>...</span>}
      <button style={styles.pageBtn(false)} onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</button>
      <button style={styles.pageBtn(false)} onClick={() => onPage(totalPages)} disabled={page === totalPages}>»</button>
      <span style={{ fontSize: "13px", color: "#666", marginLeft: "10px" }}>
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total}
      </span>
    </div>
  );
}

function Gauge({ value, max, label }) {
  const percent = Math.min((value / max) * 100, 100);
  const color = percent > 80 ? "#C8102E" : percent > 50 ? "#ff9800" : "#28a745";
  return (
    <div style={{ textAlign: "center", padding: "10px", width: "100%" }}>
      <div style={{ position: "relative", width: "120px", margin: "0 auto" }}>
        <svg viewBox="0 0 100 60" style={{ width: "120px" }}>
          <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke="#e0e0e0" strokeWidth="12" strokeLinecap="round"/>
          <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={`${(percent / 100) * 141} 141`}/>
        </svg>
      </div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color, marginTop: "5px" }}>{value}h</div>
      <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>/ {max}h max</div>
      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1a1a2e", marginTop: "6px" }}>{label}</div>
      <div style={{ height: "6px", background: "#e0e0e0", borderRadius: "3px", marginTop: "6px" }}>
        <div style={{ height: "6px", background: color, borderRadius: "3px", width: `${percent}%`, transition: "width 0.5s" }}/>
      </div>
      <div style={{ fontSize: "12px", color, marginTop: "4px", fontWeight: "bold" }}>
        {percent >= 100 ? "⚠️ Dépassé" : `${percent.toFixed(0)}%`}
      </div>
    </div>
  );
}

const ONPREM_GROUPS = ["GIS", "BDO", "CDO", "DO", "EIP"];

function Chatbot({ tickets, timeEntries, aiPredictions, aiAnomalies }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Bonjour ! Je suis l'assistant IA du SOC Dashboard VERMEG. Posez-moi des questions sur vos tickets, vos clients, vos heures ou vos anomalies !" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const saasTickets = tickets.filter(t => t.ticket_type === "SAAS");
    const onPremTickets = tickets.filter(t => t.ticket_type === "ONPREM");
    const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);
    const byClient = saasTickets.reduce((acc, t) => {
      const name = t.client_name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    return `Tu es l'assistant IA du SOC Dashboard de VERMEG Tunisie.
DONNÉES : Total tickets: ${tickets.length} (SaaS: ${saasTickets.length}, On-Prem: ${onPremTickets.length})
Heures: ${totalHeures.toFixed(2)}h
Clients SaaS: ${Object.entries(byClient).map(([c, n]) => `${c}(${n})`).join(", ")}
${aiPredictions ? `Prédiction: ${aiPredictions.total_tickets} tickets, ${aiPredictions.total_hours}h` : ""}
${aiAnomalies ? `Anomalies: ${aiAnomalies.anomalies_count} sur ${aiAnomalies.total_analyzed} jours` : ""}
Réponds en français, concis et professionnel avec des emojis.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          context: buildContext(),
          messages: [
            ...messages.filter((m, i) => i > 0).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Désolé, je n'ai pas pu répondre." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Erreur de connexion au serveur." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", padding: "15px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "24px" }}>🤖</div>
        <div>
          <div style={{ color: "white", fontWeight: "bold", fontSize: "15px" }}>Assistant IA — SOC Dashboard</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Powered by AI</div>
        </div>
        <div style={{ marginLeft: "auto", background: "#28a745", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "11px" }}>● En ligne</div>
      </div>
      <div style={{ height: "350px", overflowY: "auto", padding: "15px", background: "#f8f9fa" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "12px" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px", fontSize: "16px", flexShrink: 0 }}>🤖</div>
            )}
            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "#C8102E" : "white", color: msg.role === "user" ? "white" : "#333", fontSize: "13px", lineHeight: "1.5", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#C8102E", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "8px", fontSize: "16px", flexShrink: 0 }}>👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
            <div style={{ background: "white", padding: "10px 14px", borderRadius: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C8102E" }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "8px 15px", background: "#f0f0f0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["Quel client a le plus de tickets ?", "Y a-t-il des anomalies ?", "Prédiction pour STT ?", "Résume les données"].map(q => (
          <button key={q} onClick={() => setInput(q)} style={{ padding: "4px 10px", background: "white", border: "1px solid #C8102E", color: "#C8102E", borderRadius: "15px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>{q}</button>
        ))}
      </div>
      <div style={{ padding: "12px 15px", background: "white", display: "flex", gap: "10px", borderTop: "1px solid #f0f0f0" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === "Enter" && sendMessage()}
          placeholder="Posez une question sur vos données SOC..."
          style={{ flex: 1, padding: "10px 15px", border: "2px solid #e0e0e0", borderRadius: "25px", fontSize: "13px", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "#C8102E"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? "#ccc" : "#C8102E", color: "white", border: "none", borderRadius: "50%", width: "42px", height: "42px", cursor: "pointer", fontSize: "18px" }}>➤</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [hoursByClient, setHoursByClient] = useState([]);
  const [unsyncedTickets, setUnsyncedTickets] = useState([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("global");
  const [filterType, setFilterType] = useState("ALL");
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [filterClient, setFilterClient] = useState("ALL");
  const [ticketPage, setTicketPage] = useState(1);
  const [saasPage, setSaasPage] = useState(1);
  const [onpremPage, setOnpremPage] = useState(1);
  const [unsyncedPage, setUnsyncedPage] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [aiAnomalies, setAiAnomalies] = useState(null);
  const [aiForecast, setAiForecast] = useState(null);
  const [aiError, setAiError] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    API.get("/tickets").then(res => setTickets(res.data)).catch(console.error);
    API.get("/time-entries").then(res => setTimeEntries(res.data)).catch(console.error);
    API.get("/time-entries/stats").then(res => setHoursByClient(res.data)).catch(console.error);
    API.get("/tickets/unsynced").then(res => setUnsyncedTickets(res.data)).catch(console.error);
  }, []);

  const handleSmartSync = async () => {
    setSyncLoading(true);
    setSyncLogs([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/smart-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSyncLogs([
        `✅ Synchronisation terminée !`,
        `📥 Insérés : ${data.inserted || 0}`,
        `☁️ SaaS : ${data.saasInserted || 0}`,
        `🖥️ On-Prem : ${data.onPremInserted || 0}`,
        `⏭️ Ignorés : ${data.skipped || 0}`,
        `⏱️ Temps : ${data.totalTime || 0}s`
      ]);
      API.get("/tickets").then(res => setTickets(res.data));
      API.get("/time-entries").then(res => setTimeEntries(res.data));
      API.get("/tickets/unsynced").then(res => setUnsyncedTickets(res.data));
    } catch (err) {
      setSyncLogs(["❌ Erreur de synchronisation : " + err.message]);
    }
    setSyncLoading(false);
  };

  const handlePredictWorkload = async () => {
    setAiLoading(true); setAiError("");
    try { setAiPredictions(await (await fetch(`${AI_API}/ai/predict-workload`)).json()); }
    catch (err) { setAiError("⚠️ API IA non disponible. Lance le notebook Jupyter d'abord !"); }
    setAiLoading(false);
  };

  const handleDetectAnomalies = async () => {
    setAiLoading(true); setAiError("");
    try { setAiAnomalies(await (await fetch(`${AI_API}/ai/detect-anomalies`)).json()); }
    catch (err) { setAiError("⚠️ API IA non disponible. Lance le notebook Jupyter d'abord !"); }
    setAiLoading(false);
  };

  const handleForecast7Days = async () => {
    setAiLoading(true); setAiError("");
    try { setAiForecast(await (await fetch(`${AI_API}/ai/predict-7days`)).json()); }
    catch (err) { setAiError("⚠️ API IA non disponible. Lance le notebook Jupyter d'abord !"); }
    setAiLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const saasTickets = tickets.filter(t => t.ticket_type === "SAAS");
  const onPremTickets = tickets.filter(t => t.ticket_type === "ONPREM");
  const filteredTickets = tickets.filter(t => {
    if (filterType !== "ALL" && t.ticket_type !== filterType) return false;
    if (filterClient !== "ALL" && t.client_name !== filterClient) return false;
    if (filterGroup !== "ALL" && t.group_name !== filterGroup) return false;
    return true;
  });

  const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);

  const byClient = saasTickets.reduce((acc, t) => {
    const name = t.client_name || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const saasChartData = Object.entries(byClient).map(([client, count]) => ({ client, tickets: count, heures: count * 0.25 }));
  const saasPieData = Object.entries(byClient).map(([client, count]) => ({ name: client, value: count }));

  const byGroup = onPremTickets.reduce((acc, t) => {
    acc[t.group_name || "GIS"] = (acc[t.group_name || "GIS"] || 0) + 1;
    return acc;
  }, {});
  const onPremChartData = Object.entries(byGroup).map(([group, count]) => ({ group, tickets: count, heures: count * 0.25 }));
  const onPremPieData = Object.entries(byGroup).map(([group, count]) => ({ name: group, value: count }));

  const comparisonData = [
    { name: "SaaS", tickets: saasTickets.length, heures: saasTickets.length * 0.25 },
    { name: "On-Prem", tickets: onPremTickets.length, heures: onPremTickets.length * 0.25 }
  ];

  const byDate = timeEntries.reduce((acc, e) => {
    const d = e.date ? e.date.toString().slice(0, 10) : "N/A";
    acc[d] = (acc[d] || 0) + parseFloat(e.hours_logged || 0);
    return acc;
  }, {});
  const lineData = Object.entries(byDate).sort().map(([date, heures]) => ({ date, heures }));

  const predChartData = aiPredictions ? aiPredictions.predictions.slice(0, 10).map(p => ({
    client: p.client, tickets: p.predicted_tickets, heures: p.predicted_hours
  })) : [];

  const anomalyChartData = aiAnomalies ? Object.entries(
    aiAnomalies.anomalies.reduce((acc, a) => { acc[a.client] = (acc[a.client] || 0) + 1; return acc; }, {})
  ).map(([client, count]) => ({ client, anomalies: count })) : [];

  const forecastLineData = aiForecast ? (() => {
    const dates = aiForecast.forecast[0]?.predictions.map(p => p.date) || [];
    return dates.map((date, i) => {
      const obj = { date };
      aiForecast.forecast.forEach(c => { obj[c.client] = c.predictions[i]?.tickets || 0; });
      return obj;
    });
  })() : [];

  const clientRules = hoursByClient
    .filter(s => parseFloat(s.max_hours_per_week) > 0)
    .map(s => ({
      client: s.name || "Unknown",
      used: parseFloat(s.total_hours || 0),
      max: parseFloat(s.max_hours_per_week || 0)
    }))
    .sort((a, b) => (b.used / b.max) - (a.used / a.max));

  const paginatedFilteredTickets = filteredTickets.slice((ticketPage - 1) * PAGE_SIZE, ticketPage * PAGE_SIZE);
  const paginatedSaas = saasTickets.slice((saasPage - 1) * PAGE_SIZE, saasPage * PAGE_SIZE);
  const paginatedOnPrem = onPremTickets.slice((onpremPage - 1) * PAGE_SIZE, onpremPage * PAGE_SIZE);
  const paginatedUnsynced = unsyncedTickets.slice((unsyncedPage - 1) * PAGE_SIZE, unsyncedPage * PAGE_SIZE);

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{ height: "45px" }} />
          <span style={styles.brand}>SOC DASHBOARD</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "white", fontSize: "13px" }}>👤 {currentUser.full_name || "User"}</span>
          <button onClick={() => setShowChatbot(!showChatbot)}
            style={{ background: showChatbot ? "#28a745" : "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            🤖 Assistant IA
          </button>
          <button onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={styles.container}>
        {showChatbot && (
          <div style={{ marginBottom: "25px" }}>
            <Chatbot tickets={tickets} timeEntries={timeEntries} aiPredictions={aiPredictions} aiAnomalies={aiAnomalies} />
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "25px" }}>
          <div style={styles.kpiCard("#C8102E")}>
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>TOTAL TICKETS</div>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{tickets.length}</div>
          </div>
          <div style={styles.kpiCard("#1a1a2e")}>
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>SAAS</div>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{saasTickets.length}</div>
          </div>
          <div style={styles.kpiCard("#0f3460")}>
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>ON-PREM</div>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{onPremTickets.length}</div>
          </div>
          <div style={styles.kpiCard("#ff9800")}>
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>NON SYNCHRONISÉS</div>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{unsyncedTickets.length}</div>
          </div>
          <div style={styles.kpiCard("#28a745")}>
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>HEURES CHRONOS</div>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalHeures.toFixed(2)}h</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: "0", borderBottom: "2px solid #e0e0e0" }}>
          {["global", "saas", "onprem", "unsynced", "ai"].map(tab => (
            <button key={tab} style={styles.tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab === "global" ? "🌐 Vue Globale" : tab === "saas" ? "☁️ Vue SaaS" : tab === "onprem" ? "🖥️ Vue On-Prem" : tab === "unsynced" ? "⚠️ Non Synchronisés" : "🤖 IA & Analytics"}
            </button>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: "0 10px 10px 10px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>

          {/* VUE GLOBALE */}
          {activeTab === "global" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
                <button onClick={handleSmartSync} disabled={syncLoading}
                  style={{ background: syncLoading ? "#ccc" : "#C8102E", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", cursor: syncLoading ? "not-allowed" : "pointer", fontSize: "15px" }}>
                  {syncLoading ? "⏳ Synchronisation..." : "🧠 Smart Sync"}
                </button>
                <div style={{ flex: 1 }}>
                  {syncLogs.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {syncLogs.map((log, i) => (
                        <span key={i} style={{ padding: "4px 12px", background: log.startsWith("❌") ? "#fff0f0" : "#f0fff4", border: `1px solid ${log.startsWith("❌") ? "#C8102E" : "#28a745"}`, borderRadius: "20px", fontSize: "13px", color: log.startsWith("❌") ? "#C8102E" : "#28a745", fontWeight: "bold" }}>{log}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#999", fontSize: "13px" }}>Cliquez sur Smart Sync pour synchroniser les tickets Jira vers Chronos automatiquement</span>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>📊 SaaS vs On-Prem — Tickets</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip /><Legend />
                      <Bar dataKey="tickets" fill="#C8102E" radius={[4,4,0,0]} name="Tickets" />
                      <Bar dataKey="heures" fill="#1a1a2e" radius={[4,4,0,0]} name="Heures" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🥧 Répartition SaaS vs On-Prem</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={comparisonData} dataKey="tickets" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        <Cell fill="#C8102E" /><Cell fill="#0f3460" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={styles.cardTitle}>📈 Évolution des Heures Chronos</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} /><YAxis stroke="#666" /><Tooltip />
                  <Line type="monotone" dataKey="heures" stroke="#C8102E" strokeWidth={2} dot={{ fill: "#C8102E" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* VUE SAAS */}
          {activeTab === "saas" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>📊 Tickets par Client (SaaS)</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={saasChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="client" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip /><Legend />
                      <Bar dataKey="tickets" fill="#C8102E" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🥧 Répartition par Client (SaaS)</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={saasPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {saasPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* JAUGES ORGANISÉES */}
              <div style={styles.cardTitle}>🎯 Heures utilisées vs Max autorisées</div>

              {/* Alertes clients dépassés */}
              {clientRules.filter(r => r.used >= r.max).length > 0 && (
                <div style={{ background: "#fff0f0", border: "1px solid #C8102E", borderRadius: "8px", padding: "10px 15px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>⚠️</span>
                  <span style={{ color: "#C8102E", fontWeight: "bold", fontSize: "13px" }}>
                    {clientRules.filter(r => r.used >= r.max).length} client(s) ont dépassé leur limite :&nbsp;
                    {clientRules.filter(r => r.used >= r.max).map(r => r.client).join(", ")}
                  </span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "20px" }}>
                {clientRules.map(rule => {
                  const percent = rule.used / rule.max;
                  const borderColor = percent >= 1 ? "#C8102E" : percent >= 0.5 ? "#ff9800" : "#28a745";
                  const bgColor = percent >= 1 ? "#fff5f5" : percent >= 0.5 ? "#fffbf0" : "#f0fff4";
                  return (
                    <div key={rule.client} style={{
                      background: bgColor,
                      borderRadius: "10px",
                      padding: "10px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: `2px solid ${borderColor}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}>
                      <Gauge value={rule.used.toFixed(2)} max={rule.max} label={rule.client} />
                    </div>
                  );
                })}
              </div>

              <div style={styles.cardTitle}>🎫 Tickets SaaS ({saasTickets.length})</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Jira Key</th>
                  <th style={styles.th}>Résumé</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Date</th>
                </tr></thead>
                <tbody>
                  {paginatedSaas.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}><span style={styles.badge("#C8102E")}>{t.jira_key}</span></td>
                      <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 60)}...</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client_name || "—"}</span></td>
                      <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={saasTickets.length} page={saasPage} onPage={setSaasPage} />
            </div>
          )}

          {/* VUE ON-PREM */}
          {activeTab === "onprem" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>📊 Tickets par Groupe (On-Prem)</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={onPremChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="group" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip /><Legend />
                      <Bar dataKey="tickets" fill="#0f3460" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🥧 Répartition par Groupe (On-Prem)</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={onPremPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {onPremPieData.map((_, i) => <Cell key={i} fill={ONPREM_COLORS[i % ONPREM_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={styles.cardTitle}>🎫 Tickets On-Prem ({onPremTickets.length})</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Jira Key</th>
                  <th style={styles.th}>Résumé</th>
                  <th style={styles.th}>Groupe</th>
                  <th style={styles.th}>Date</th>
                </tr></thead>
                <tbody>
                  {paginatedOnPrem.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}><span style={styles.badge("#0f3460")}>{t.jira_key}</span></td>
                      <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 60)}...</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.group_name || "GIS"}</span></td>
                      <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={onPremTickets.length} page={onpremPage} onPage={setOnpremPage} />
            </div>
          )}

          {/* VUE NON SYNCHRONISÉS */}
          {activeTab === "unsynced" && (
            <div>
              <div style={styles.cardTitle}>⚠️ Tickets Non Synchronisés avec Chronos ({unsyncedTickets.length})</div>
              {unsyncedTickets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#28a745" }}>
                  <div style={{ fontSize: "48px", marginBottom: "15px" }}>✅</div>
                  <div style={{ fontSize: "16px" }}>Tous les tickets sont synchronisés !</div>
                </div>
              ) : (
                <>
                  <table style={styles.table}>
                    <thead><tr>
                      <th style={styles.th}>Jira Key</th>
                      <th style={styles.th}>Résumé</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Date</th>
                    </tr></thead>
                    <tbody>
                      {paginatedUnsynced.map((t, i) => (
                        <tr key={t.id} style={{ background: i % 2 === 0 ? "#fff5f5" : "#fff0f0" }}>
                          <td style={styles.td}><span style={styles.badge("#ff9800")}>{t.jira_key}</span></td>
                          <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 60)}...</td>
                          <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client_name || "—"}</span></td>
                          <td style={styles.td}><span style={styles.badge(t.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.ticket_type}</span></td>
                          <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination total={unsyncedTickets.length} page={unsyncedPage} onPage={setUnsyncedPage} />
                </>
              )}
            </div>
          )}

          {/* VUE IA */}
          {activeTab === "ai" && (
            <div>
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: "10px", padding: "20px", marginBottom: "20px", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🤖</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>Composante IA — SOC Dashboard</div>
                <div style={{ fontSize: "13px", opacity: 0.8 }}>Prédiction • Détection d'anomalies • Forecast 7 jours • Chatbot</div>
                <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "6px" }}>Powered by Random Forest & Isolation Forest</div>
              </div>

              {aiError && (
                <div style={{ padding: "12px 20px", background: "#fff3cd", border: "1px solid #ff9800", borderRadius: "8px", color: "#856404", marginBottom: "20px", fontWeight: "bold" }}>
                  {aiError}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginBottom: "25px", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={handlePredictWorkload} disabled={aiLoading} style={{ ...styles.btn("#C8102E"), padding: "12px 24px", fontSize: "14px" }}>
                  {aiLoading ? "⏳..." : "📊 Prédire la Charge"}
                </button>
                <button onClick={handleDetectAnomalies} disabled={aiLoading} style={{ ...styles.btn("#0f3460"), padding: "12px 24px", fontSize: "14px" }}>
                  {aiLoading ? "⏳..." : "🚨 Détecter Anomalies"}
                </button>
                <button onClick={handleForecast7Days} disabled={aiLoading} style={{ ...styles.btn("#28a745"), padding: "12px 24px", fontSize: "14px" }}>
                  {aiLoading ? "⏳..." : "🔮 Forecast 7 Jours"}
                </button>
                <button onClick={() => { setShowChatbot(true); setActiveTab("global"); }} style={{ ...styles.btn("#ff9800"), padding: "12px 24px", fontSize: "14px" }}>
                  💬 Ouvrir Chatbot
                </button>
              </div>

              {aiForecast && (
                <div style={{ marginBottom: "25px" }}>
                  <div style={styles.cardTitle}>🔮 Prédiction de Charge — 7 Prochains Jours</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecastLineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip /><Legend />
                      {aiForecast.forecast.map((c, i) => (
                        <Line key={c.client} type="monotone" dataKey={c.client} stroke={CLIENT_COLORS[i % CLIENT_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {aiPredictions && (
                <div style={{ marginBottom: "25px" }}>
                  <div style={styles.cardTitle}>📊 Prédiction de Charge — Semaine Prochaine</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                    <div style={styles.kpiCard("#C8102E")}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>TICKETS PRÉVUS</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiPredictions.total_tickets}</div>
                    </div>
                    <div style={styles.kpiCard("#1a1a2e")}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>HEURES PRÉVUES</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiPredictions.total_hours}h</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={predChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="client" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip /><Legend />
                      <Bar dataKey="tickets" fill="#C8102E" radius={[4,4,0,0]} name="Tickets prévus" />
                      <Bar dataKey="heures" fill="#0f3460" radius={[4,4,0,0]} name="Heures prévues" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {aiAnomalies && (
                <div>
                  <div style={styles.cardTitle}>🚨 Détection d'Anomalies</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                    <div style={styles.kpiCard("#1a1a2e")}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>JOURS ANALYSÉS</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiAnomalies.total_analyzed}</div>
                    </div>
                    <div style={styles.kpiCard("#C8102E")}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>ANOMALIES DÉTECTÉES</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiAnomalies.anomalies_count}</div>
                    </div>
                  </div>
                  {anomalyChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={anomalyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="client" stroke="#666" /><YAxis stroke="#666" /><Tooltip />
                        <Bar dataKey="anomalies" fill="#C8102E" radius={[4,4,0,0]} name="Anomalies" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {!aiPredictions && !aiAnomalies && !aiForecast && !aiError && (
                <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                  <div style={{ fontSize: "48px", marginBottom: "15px" }}>🤖</div>
                  <div style={{ fontSize: "16px", marginBottom: "8px" }}>Clique sur un bouton pour lancer l'analyse IA</div>
                  <div style={{ fontSize: "13px" }}>Assure-toi que le notebook Jupyter est en cours d'exécution</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filtres */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🔍 Filtres — Tickets ({filteredTickets.length})</div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
            <select style={styles.filterSelect} value={filterType} onChange={e => { setFilterType(e.target.value); setTicketPage(1); }}>
              <option value="ALL">Tous les types</option>
              <option value="SAAS">SaaS</option>
              <option value="ONPREM">On-Prem</option>
            </select>
            {filterType !== "ONPREM" && (
              <select style={styles.filterSelect} value={filterClient} onChange={e => { setFilterClient(e.target.value); setTicketPage(1); }}>
                <option value="ALL">Tous les clients</option>
                {[...new Set(saasTickets.map(t => t.client_name).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {filterType !== "SAAS" && (
              <select style={styles.filterSelect} value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setTicketPage(1); }}>
                <option value="ALL">Tous les groupes</option>
                {ONPREM_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
            <button onClick={() => { setFilterType("ALL"); setFilterClient("ALL"); setFilterGroup("ALL"); setTicketPage(1); }}
              style={{ padding: "8px 16px", background: "#666", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Réinitialiser
            </button>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Jira Key</th>
                <th style={styles.th}>Résumé</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Client / Groupe</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFilteredTickets.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={styles.td}><span style={styles.badge(t.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.jira_key}</span></td>
                  <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 50)}...</td>
                  <td style={styles.td}><span style={styles.badge(t.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.ticket_type}</span></td>
                  <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client_name || t.group_name || "—"}</span></td>
                  <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination total={filteredTickets.length} page={ticketPage} onPage={setTicketPage} />
        </div>

        {/* Entrées de Temps */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🕐 Mes Entrées de Temps Chronos ({timeEntries.length})</div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Slot Horaire</th>
                  <th style={styles.th}>Heures</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Synchronisé</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.slice(0, 50).map((entry, i) => (
                  <tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={styles.td}>{entry.id}</td>
                    <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{entry.client_name || "—"}</span></td>
                    <td style={styles.td}><span style={styles.badge(entry.ticket_type === "ONPREM" ? "#0f3460" : "#C8102E")}>{entry.ticket_type || "SAAS"}</span></td>
                    <td style={styles.td}>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", background: "#f0f0f0", padding: "3px 8px", borderRadius: "4px" }}>
                        {entry.slot_start} → {entry.slot_end}
                      </span>
                    </td>
                    <td style={styles.td}><span style={styles.badge("#28a745")}>{entry.hours_logged}h</span></td>
                    <td style={styles.td}>{entry.date ? entry.date.toString().slice(0, 10) : "—"}</td>
                    <td style={styles.td}>
                      <span style={styles.badge(entry.synced_to_chronos ? "#28a745" : "#ff9800")}>
                        {entry.synced_to_chronos ? "✅ Oui" : "⏳ Non"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {timeEntries.length > 50 && (
            <div style={{ textAlign: "center", padding: "10px", color: "#666", fontSize: "13px" }}>
              Affichage des 50 premières entrées sur {timeEntries.length} au total
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;