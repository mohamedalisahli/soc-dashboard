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
  }
};

function Gauge({ value, max, label }) {
  const percent = Math.min((value / max) * 100, 100);
  const color = percent > 80 ? "#C8102E" : percent > 50 ? "#ff9800" : "#28a745";
  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <div style={{ position: "relative", width: "150px", margin: "0 auto" }}>
        <svg viewBox="0 0 100 60" style={{ width: "150px" }}>
          <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke="#f0f0f0" strokeWidth="10" strokeLinecap="round"/>
          <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={`${(percent / 100) * 141} 141`}/>
        </svg>
        <div style={{ position: "absolute", bottom: "0", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color }}>{value}h</div>
          <div style={{ fontSize: "11px", color: "#999" }}>/ {max}h max</div>
        </div>
      </div>
      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1a1a2e", marginTop: "8px" }}>{label}</div>
      <div style={{ height: "6px", background: "#f0f0f0", borderRadius: "3px", marginTop: "6px" }}>
        <div style={{ height: "6px", background: color, borderRadius: "3px", width: `${percent}%`, transition: "width 0.5s" }}/>
      </div>
    </div>
  );
}

const RULES = [
  { client: "SMBC", max: 15 }, { client: "STT", max: 20 },
  { client: "LGIM", max: 10 }, { client: "GEN", max: 10 }, { client: "Devops", max: 8 }
];
const ONPREM_GROUPS = ["GIS", "BDO", "CDO", "DO", "EIP"];

// ============================================================
// CHATBOT COMPONENT
// ============================================================
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
    const saasTickets = tickets.filter(t => t.type === "SAAS");
    const onPremTickets = tickets.filter(t => t.type === "ONPREM");
    const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);
    const byClient = saasTickets.reduce((acc, t) => { acc[t.client] = (acc[t.client] || 0) + 1; return acc; }, {});

    return `Tu es l'assistant IA du SOC Dashboard de VERMEG Tunisie. Tu aides l'équipe SOC à analyser leurs données.

DONNÉES ACTUELLES :
- Total tickets : ${tickets.length} (SaaS: ${saasTickets.length}, On-Prem: ${onPremTickets.length})
- Heures Chronos totales : ${totalHeures.toFixed(2)}h
- Clients SaaS : ${Object.entries(byClient).map(([c, n]) => `${c}(${n})`).join(", ")}
- Groupes On-Prem : GIS, BDO, CDO, DO, EIP
- Règles métier : STT max 20h, SMBC max 15h, LGIM max 10h, GEN max 10h, Devops max 8h
${aiPredictions ? `- Prédiction semaine prochaine : ${aiPredictions.total_tickets} tickets, ${aiPredictions.total_hours}h` : ""}
${aiAnomalies ? `- Anomalies détectées : ${aiAnomalies.anomalies_count} sur ${aiAnomalies.total_analyzed} jours analysés` : ""}

Réponds en français, de façon concise et professionnelle. Utilise des emojis quand approprié.`;
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          context: buildContext(),
          messages: [
            ...messages.filter((m, i) => i > 0).map(m => ({
              role: m.role, content: m.content
            })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await response.json();
      const reply = data.reply || "Désolé, je n'ai pas pu répondre.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Erreur de connexion au serveur." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", padding: "15px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "24px" }}>🤖</div>
        <div>
          <div style={{ color: "white", fontWeight: "bold", fontSize: "15px" }}>Assistant IA — SOC Dashboard</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Powered by Claude AI</div>
        </div>
        <div style={{ marginLeft: "auto", background: "#28a745", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "11px" }}>● En ligne</div>
      </div>

      {/* Messages */}
      <div style={{ height: "350px", overflowY: "auto", padding: "15px", background: "#f8f9fa" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "12px" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px", fontSize: "16px", flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user" ? "#C8102E" : "white",
              color: msg.role === "user" ? "white" : "#333",
              fontSize: "13px", lineHeight: "1.5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
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
            <div style={{ background: "white", padding: "10px 14px", borderRadius: "18px 18px 18px 4px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C8102E", animation: `bounce 0.6s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions rapides */}
      <div style={{ padding: "8px 15px", background: "#f0f0f0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["Quel client a le plus de tickets ?", "Y a-t-il des anomalies ?", "Prédiction pour STT ?", "Résume les données"].map(q => (
          <button key={q} onClick={() => setInput(q)}
            style={{ padding: "4px 10px", background: "white", border: "1px solid #C8102E", color: "#C8102E", borderRadius: "15px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 15px", background: "white", display: "flex", gap: "10px", borderTop: "1px solid #f0f0f0" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === "Enter" && sendMessage()}
          placeholder="Posez une question sur vos données SOC..."
          style={{ flex: 1, padding: "10px 15px", border: "2px solid #e0e0e0", borderRadius: "25px", fontSize: "13px", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "#C8102E"}
          onBlur={e => e.target.style.borderColor = "#e0e0e0"}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? "#ccc" : "#C8102E", color: "white", border: "none", borderRadius: "50%", width: "42px", height: "42px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "18px" }}>
          ➤
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [syncMsg, setSyncMsg] = useState("");
  const [smartResult, setSmartResult] = useState(null);
  const [skipped, setSkipped] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("global");
  const [filterType, setFilterType] = useState("ALL");
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [filterClient, setFilterClient] = useState("ALL");

  // IA States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [aiAnomalies, setAiAnomalies] = useState(null);
  const [aiForecast, setAiForecast] = useState(null);
  const [aiError, setAiError] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    API.get("/tickets").then(res => setTickets(res.data));
    API.get("/time-entries").then(res => setTimeEntries(res.data));
  }, []);

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
    } catch (err) { setSyncMsg("Erreur lors du Smart Sync"); }
    setLoading(false);
  };

  const handlePredictWorkload = async () => {
    setAiLoading(true); setAiError("");
    try {
      const res = await fetch(`${AI_API}/ai/predict-workload`);
      setAiPredictions(await res.json());
    } catch (err) { setAiError("⚠️ API IA non disponible. Lance le notebook Jupyter d'abord !"); }
    setAiLoading(false);
  };

  const handleDetectAnomalies = async () => {
    setAiLoading(true); setAiError("");
    try {
      const res = await fetch(`${AI_API}/ai/detect-anomalies`);
      setAiAnomalies(await res.json());
    } catch (err) { setAiError("⚠️ API IA non disponible. Lance le notebook Jupyter d'abord !"); }
    setAiLoading(false);
  };

  const handleForecast7Days = async () => {
    setAiLoading(true); setAiError("");
    try {
      const res = await fetch(`${AI_API}/ai/predict-7days`);
      setAiForecast(await res.json());
    } catch (err) { setAiError("⚠️ API IA non disponible. Lance le notebook Jupyter d'abord !"); }
    setAiLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.reload();
  };

  const saasTickets = tickets.filter(t => t.type === "SAAS");
  const onPremTickets = tickets.filter(t => t.type === "ONPREM");

  const filteredTickets = tickets.filter(t => {
    if (filterType !== "ALL" && t.type !== filterType) return false;
    if (filterClient !== "ALL" && t.client !== filterClient) return false;
    if (filterGroup !== "ALL" && t.group_name !== filterGroup) return false;
    return true;
  });

  const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);

  const byClient = saasTickets.reduce((acc, t) => { acc[t.client] = (acc[t.client] || 0) + 1; return acc; }, {});
  const saasChartData = Object.entries(byClient).map(([client, count]) => ({ client, tickets: count, heures: count * 0.25 }));
  const saasPieData = Object.entries(byClient).map(([client, count]) => ({ name: client, value: count }));

  const byGroup = onPremTickets.reduce((acc, t) => { acc[t.group_name] = (acc[t.group_name] || 0) + 1; return acc; }, {});
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
  const lineData = Object.entries(byDate).map(([date, heures]) => ({ date, heures }));

  const predChartData = aiPredictions ? aiPredictions.predictions.slice(0, 10).map(p => ({
    client: p.client, tickets: p.predicted_tickets, heures: p.predicted_hours
  })) : [];

  const anomalyChartData = aiAnomalies ? Object.entries(
    aiAnomalies.anomalies.reduce((acc, a) => { acc[a.client] = (acc[a.client] || 0) + 1; return acc; }, {})
  ).map(([client, count]) => ({ client, anomalies: count })) : [];

  // Forecast 7 days — transformer pour LineChart
  const forecastLineData = aiForecast ? (() => {
    const dates = aiForecast.forecast[0]?.predictions.map(p => p.date) || [];
    return dates.map((date, i) => {
      const obj = { date };
      aiForecast.forecast.forEach(c => { obj[c.client] = c.predictions[i]?.tickets || 0; });
      return obj;
    });
  })() : [];

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{ height: "45px" }} />
          <span style={styles.brand}>SOC DASHBOARD</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

        {/* Chatbot flottant */}
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
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>TEMPS TOTAL</div>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{tickets.length * 15} min</div>
          </div>
          <div style={styles.kpiCard("#28a745")}>
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>HEURES CHRONOS</div>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalHeures.toFixed(2)}h</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: "0", borderBottom: "2px solid #e0e0e0" }}>
          {["global", "saas", "onprem", "ai"].map(tab => (
            <button key={tab} style={styles.tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab === "global" ? "🌐 Vue Globale" : tab === "saas" ? "☁️ Vue SaaS" : tab === "onprem" ? "🖥️ Vue On-Prem" : "🤖 IA & Analytics"}
            </button>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: "0 10px 10px 10px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>

          {/* VUE GLOBALE */}
          {activeTab === "global" && (
            <div>
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
              <div style={styles.cardTitle}>🎯 Heures utilisées vs Max autorisées</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
                {RULES.map(rule => {
                  const used = timeEntries
                    .filter(e => e.chronos_entry_id && e.chronos_entry_id.includes(rule.client.toUpperCase()))
                    .reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);
                  return <Gauge key={rule.client} value={used.toFixed(2)} max={rule.max} label={rule.client} />;
                })}
              </div>
              <div style={styles.cardTitle}>🎫 Tickets SaaS</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Titre</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Temps</th></tr></thead>
                <tbody>
                  {saasTickets.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}><span style={styles.badge("#C8102E")}>{t.id}</span></td>
                      <td style={styles.td}>{t.title}</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client}</span></td>
                      <td style={styles.td}><span style={styles.badge("#C8102E")}>SAAS</span></td>
                      <td style={styles.td}>15 min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <div style={styles.cardTitle}>🎫 Tickets On-Prem</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Titre</th><th style={styles.th}>Groupe</th><th style={styles.th}>Type</th><th style={styles.th}>Temps</th></tr></thead>
                <tbody>
                  {onPremTickets.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}><span style={styles.badge("#0f3460")}>{t.id}</span></td>
                      <td style={styles.td}>{t.title}</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.group_name}</span></td>
                      <td style={styles.td}><span style={styles.badge("#0f3460")}>ON-PREM</span></td>
                      <td style={styles.td}>15 min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VUE IA */}
          {activeTab === "ai" && (
            <div>
              {/* Header IA */}
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: "10px", padding: "20px", marginBottom: "20px", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🤖</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>Composante IA — SOC Dashboard</div>
                <div style={{ fontSize: "13px", opacity: 0.8 }}>Prédiction • Détection d'anomalies • Forecast 7 jours • Chatbot</div>
                <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "6px" }}>Powered by Random Forest, Isolation Forest & Claude AI</div>
              </div>

              {aiError && (
                <div style={{ padding: "12px 20px", background: "#fff3cd", border: "1px solid #ff9800", borderRadius: "8px", color: "#856404", marginBottom: "20px", fontWeight: "bold" }}>
                  {aiError}
                </div>
              )}

              {/* Boutons IA */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "25px", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={handlePredictWorkload} disabled={aiLoading}
                  style={{ ...styles.btn("#C8102E"), padding: "12px 24px", fontSize: "14px" }}>
                  {aiLoading ? "⏳..." : "📊 Prédire la Charge"}
                </button>
                <button onClick={handleDetectAnomalies} disabled={aiLoading}
                  style={{ ...styles.btn("#0f3460"), padding: "12px 24px", fontSize: "14px" }}>
                  {aiLoading ? "⏳..." : "🚨 Détecter Anomalies"}
                </button>
                <button onClick={handleForecast7Days} disabled={aiLoading}
                  style={{ ...styles.btn("#28a745"), padding: "12px 24px", fontSize: "14px" }}>
                  {aiLoading ? "⏳..." : "🔮 Forecast 7 Jours"}
                </button>
                <button onClick={() => { setShowChatbot(true); setActiveTab("global"); }}
                  style={{ ...styles.btn("#ff9800"), padding: "12px 24px", fontSize: "14px" }}>
                  💬 Ouvrir Chatbot
                </button>
              </div>

              {/* Forecast 7 jours */}
              {aiForecast && (
                <div style={{ marginBottom: "25px" }}>
                  <div style={styles.cardTitle}>🔮 Prédiction de Charge — 7 Prochains Jours</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecastLineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" />
                      <YAxis stroke="#666" label={{ value: "Tickets/jour", angle: -90, position: "insideLeft", fill: "#666", fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      {aiForecast.forecast.map((c, i) => (
                        <Line key={c.client} type="monotone" dataKey={c.client}
                          stroke={CLIENT_COLORS[i % CLIENT_COLORS.length]} strokeWidth={2}
                          dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginTop: "15px" }}>
                    {forecastLineData.map((day, i) => {
                      const maxClient = aiForecast.forecast.reduce((max, c) => 
                        c.predictions[i]?.tickets > (max.val || 0) ? { name: c.client, val: c.predictions[i]?.tickets } : max, {});
                      return (
                        <div key={i} style={{ background: "#f8f9fa", borderRadius: "8px", padding: "10px", textAlign: "center", border: "1px solid #e0e0e0" }}>
                          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>{day.date}</div>
                          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#C8102E" }}>{maxClient.name}</div>
                          <div style={{ fontSize: "11px", color: "#999" }}>{maxClient.val?.toFixed(0)} tickets</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Résultats Prédictions */}
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
                  <div style={{ marginTop: "15px" }}>
                    <table style={styles.table}>
                      <thead><tr><th style={styles.th}>Client</th><th style={styles.th}>Tickets Prévus</th><th style={styles.th}>Heures Prévues</th><th style={styles.th}>Charge</th></tr></thead>
                      <tbody>
                        {aiPredictions.predictions.map((p, i) => {
                          const maxT = Math.max(...aiPredictions.predictions.map(x => x.predicted_tickets));
                          const percent = Math.round((p.predicted_tickets / maxT) * 100);
                          const color = percent > 70 ? "#C8102E" : percent > 40 ? "#ff9800" : "#28a745";
                          return (
                            <tr key={p.client} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{p.client}</span></td>
                              <td style={styles.td}><strong>{p.predicted_tickets}</strong></td>
                              <td style={styles.td}><span style={styles.badge("#0f3460")}>{p.predicted_hours}h</span></td>
                              <td style={styles.td}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ flex: 1, height: "8px", background: "#f0f0f0", borderRadius: "4px" }}>
                                    <div style={{ width: `${percent}%`, height: "8px", background: color, borderRadius: "4px" }} />
                                  </div>
                                  <span style={{ fontSize: "12px", color, fontWeight: "bold" }}>{percent}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Résultats Anomalies */}
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
                  <div style={{ marginTop: "15px", maxHeight: "300px", overflowY: "auto" }}>
                    <table style={styles.table}>
                      <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Client</th><th style={styles.th}>Tickets</th><th style={styles.th}>Heures</th><th style={styles.th}>Statut</th></tr></thead>
                      <tbody>
                        {aiAnomalies.anomalies.map((a, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fff5f5" : "#fff0f0" }}>
                            <td style={styles.td}>{a.date}</td>
                            <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{a.client}</span></td>
                            <td style={styles.td}><strong style={{ color: "#C8102E" }}>{a.ticket_count}</strong></td>
                            <td style={styles.td}>{a.total_hours}h</td>
                            <td style={styles.td}><span style={styles.badge("#C8102E")}>⚠️ Anomalie</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
          <div style={styles.cardTitle}>🔍 Filtres — Tickets</div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
            <select style={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">Tous les types</option>
              <option value="SAAS">SaaS</option>
              <option value="ONPREM">On-Prem</option>
            </select>
            <select style={styles.filterSelect} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
              <option value="ALL">Tous les clients</option>
              {["STT", "SMBC", "LGIM", "GEN", "Devops"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select style={styles.filterSelect} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
              <option value="ALL">Tous les groupes</option>
              {ONPREM_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={() => { setFilterType("ALL"); setFilterClient("ALL"); setFilterGroup("ALL"); }}
              style={{ padding: "8px 16px", background: "#666", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Réinitialiser
            </button>
          </div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Titre</th><th style={styles.th}>Type</th><th style={styles.th}>Client / Groupe</th><th style={styles.th}>Temps</th></tr></thead>
            <tbody>
              {filteredTickets.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={styles.td}><span style={styles.badge(t.type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.id}</span></td>
                  <td style={styles.td}>{t.title}</td>
                  <td style={styles.td}><span style={styles.badge(t.type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.type}</span></td>
                  <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client || t.group_name}</span></td>
                  <td style={styles.td}>15 min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Entrées de Temps */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🕐 Entrées de Temps Chronos</div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Ticket</th><th style={styles.th}>Type</th><th style={styles.th}>Groupe</th><th style={styles.th}>Heures</th><th style={styles.th}>Date</th></tr></thead>
              <tbody>
                {timeEntries.map((entry, i) => (
                  <tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={styles.td}>{entry.id}</td>
                    <td style={styles.td}><span style={styles.badge(entry.ticket_type === "ONPREM" ? "#0f3460" : "#C8102E")}>{entry.chronos_entry_id || "—"}</span></td>
                    <td style={styles.td}><span style={styles.badge(entry.ticket_type === "ONPREM" ? "#0f3460" : "#C8102E")}>{entry.ticket_type || "SAAS"}</span></td>
                    <td style={styles.td}>{entry.group_name || "—"}</td>
                    <td style={styles.td}><span style={styles.badge("#28a745")}>{entry.hours_logged}h</span></td>
                    <td style={styles.td}>{entry.date ? entry.date.toString().slice(0, 10) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Button */}
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <button style={styles.btn(loading ? "#999" : "#C8102E")} onClick={handleSmartSync} disabled={loading}>
            {loading ? "⏳ En cours..." : "🧠 Smart Sync (SaaS + On-Prem)"}
          </button>
          {syncMsg && <div style={{ marginTop: "15px", padding: "12px", background: "#f0fff4", border: "1px solid #28a745", borderRadius: "8px", color: "#28a745" }}>✅ {syncMsg}</div>}
        </div>

        {/* Smart Sync Result */}
        {smartResult && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>🧠 Résultat Smart Sync</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  <div style={styles.kpiCard("#28a745")}><div style={{ fontSize: "11px" }}>Total Insérés</div><div style={{ fontSize: "24px", fontWeight: "bold" }}>{smartResult.inserted}</div></div>
                  <div style={styles.kpiCard("#C8102E")}><div style={{ fontSize: "11px" }}>SaaS</div><div style={{ fontSize: "24px", fontWeight: "bold" }}>{smartResult.saasInserted || 0}</div></div>
                  <div style={styles.kpiCard("#0f3460")}><div style={{ fontSize: "11px" }}>On-Prem</div><div style={{ fontSize: "24px", fontWeight: "bold" }}>{smartResult.onPremInserted || 0}</div></div>
                  <div style={styles.kpiCard("#ff9800")}><div style={{ fontSize: "11px" }}>Ignorés</div><div style={{ fontSize: "24px", fontWeight: "bold" }}>{smartResult.skipped}</div></div>
                </div>
                <div style={{ marginTop: "12px", padding: "10px", background: "#f8f8f8", borderRadius: "8px", fontSize: "13px", color: "#666" }}>
                  ✅ Temps restant : <strong>{smartResult.remainingTime}h</strong> — Tâches défaut : <strong>{smartResult.defaultTasksTime}h</strong> chacune
                </div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardTitle}>📋 Logs</div>
                <div style={{ maxHeight: "180px", overflowY: "auto", fontSize: "12px" }}>
                  {smartResult.logs.map((log, i) => (
                    <div key={i} style={{ padding: "4px 0", color: log.includes("✅") ? "#28a745" : log.includes("⚠️") ? "#ff9800" : "#C8102E" }}>{log}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;