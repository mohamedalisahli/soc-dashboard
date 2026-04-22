import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Treemap, ScatterChart, Scatter, ZAxis
} from "recharts";

const COLORS = ["#C8102E", "#1a1a2e", "#0f3460", "#e94560", "#16213e", "#28a745", "#ff9800"];
const ONPREM_COLORS = ["#0f3460", "#1a1a2e", "#e94560", "#16213e", "#C8102E"];
const CLIENT_COLORS = ["#C8102E", "#0f3460", "#28a745", "#ff9800", "#e94560", "#1a1a2e", "#6c757d"];
const AI_API = "http://localhost:5001";
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const PAGE_SIZE = 20;

const styles = {
  navbar: {
    background: "linear-gradient(135deg, #C8102E, #a00c26)", padding: "0 30px", height: "65px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxShadow: "0 4px 20px rgba(200,16,46,0.4)"
  },
  brand: { color: "white", fontSize: "20px", fontWeight: "bold", letterSpacing: "2px" },
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #f0f2f5, #e8edf2)", fontFamily: "Arial, sans-serif" },
  container: { padding: "25px" },
  card: {
    background: "white", borderRadius: "12px", padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "20px"
  },
  cardTitle: {
    color: "#1a1a2e", fontWeight: "bold", fontSize: "16px", marginBottom: "15px",
    borderBottom: "3px solid #C8102E", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px"
  },
  btn: (bg) => ({
    background: bg, color: "white", border: "none",
    padding: "10px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
    fontSize: "14px", margin: "0 6px", transition: "all 0.2s",
    boxShadow: `0 4px 12px ${bg}66`
  }),
  tabBtn: (active) => ({
    padding: "10px 20px", borderRadius: "8px 8px 0 0", fontWeight: "bold",
    cursor: "pointer", fontSize: "13px", margin: "0 2px 0 0", border: "none",
    background: active ? "white" : "#e0e0e0", color: active ? "#C8102E" : "#666",
    borderBottom: active ? "3px solid #C8102E" : "none",
    transition: "all 0.2s"
  }),
  badge: (bg) => ({
    background: bg, color: "white", padding: "4px 10px",
    borderRadius: "20px", fontSize: "12px", fontWeight: "bold"
  }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "white", padding: "12px 15px", textAlign: "left", fontSize: "13px" },
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

const FLIP_CSS = `
  .flip-card { background: transparent; perspective: 1000px; height: 130px; cursor: pointer; }
  .flip-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.7s cubic-bezier(0.4,0.2,0.2,1); transform-style: preserve-3d; }
  .flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
  .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; box-sizing: border-box; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  .flip-card-back { transform: rotateY(180deg); }
`;

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
      {pages.map(p => <button key={p} style={styles.pageBtn(p === page)} onClick={() => onPage(p)}>{p}</button>)}
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

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const TreemapContent = ({ x, y, width, height, name, value, index }) => {
  if (width < 40 || height < 30) return null;
  const colors = ["#C8102E", "#1a1a2e", "#0f3460", "#e94560", "#28a745", "#ff9800", "#16213e", "#6c757d"];
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={colors[index % colors.length]} stroke="#fff" strokeWidth={2} rx={4}/>
      <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="white" fontSize={Math.min(13, width / 5)} fontWeight="bold">{name}</text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={Math.min(11, width / 6)}>{value} tickets</text>
    </g>
  );
};

const ONPREM_GROUPS = ["GIS", "BDO", "CDO", "DO", "EIP"];

function ClientRetentionAI({ tickets, hoursByClient, clientRules }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = () => {
    setLoading(true);
    setTimeout(() => {
      const saasTickets = tickets.filter(t => t.ticket_type === "SAAS");
      const byClient = saasTickets.reduce((acc, t) => {
        const c = t.client_name || "Unknown";
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {});

      const results = Object.entries(byClient).map(([client, count]) => {
        const rule = clientRules.find(r => r.client === client);
        const usedPercent = rule ? (rule.used / rule.max) * 100 : 0;
        let risk, recommendation, action;

        if (count > 100 && usedPercent > 80) {
          risk = "🔴 Critique";
          recommendation = `${client} génère beaucoup de tickets et dépasse sa limite horaire. Risque de surcharge élevé.`;
          action = "Augmenter la capacité ou redistribuer les tickets entre les membres SOC.";
        } else if (count > 50 || usedPercent > 60) {
          risk = "🟡 Modéré";
          recommendation = `${client} montre une activité soutenue. Surveillance recommandée.`;
          action = "Planifier une réunion de suivi et vérifier les règles métier.";
        } else {
          risk = "🟢 Faible";
          recommendation = `${client} est dans les normes. Relation client stable.`;
          action = "Maintenir le niveau de service actuel.";
        }

        return { client, tickets: count, usedPercent: usedPercent.toFixed(0), risk, recommendation, action };
      }).sort((a, b) => b.tickets - a.tickets).slice(0, 8);

      setInsights(results);
      setLoading(false);
    }, 1200);
  };

  return (
    <div style={{ marginBottom: "25px" }}>
      <div style={styles.cardTitle}>🤝 Fidélisation Clients — Analyse IA</div>
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", padding: "15px", background: "linear-gradient(135deg, #f8f9fa, #e8edf2)", borderRadius: "10px" }}>
        <button onClick={generateInsights} disabled={loading} style={{ ...styles.btn("#C8102E"), padding: "12px 28px" }}>
          {loading ? "⏳ Analyse en cours..." : "🤝 Analyser Fidélisation Clients"}
        </button>
        <span style={{ color: "#666", fontSize: "13px" }}>Analyse IA des risques de perte client et recommandations de fidélisation</span>
      </div>
      {insights.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
          {insights.map((insight, i) => (
            <div key={i} style={{
              background: insight.risk.includes("Critique") ? "#fff5f5" : insight.risk.includes("Modéré") ? "#fffbf0" : "#f0fff4",
              borderRadius: "10px", padding: "15px",
              border: `2px solid ${insight.risk.includes("Critique") ? "#C8102E" : insight.risk.includes("Modéré") ? "#ff9800" : "#28a745"}`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontWeight: "bold", fontSize: "15px", color: "#1a1a2e" }}>📌 {insight.client}</span>
                <span style={{ fontSize: "13px", fontWeight: "bold" }}>{insight.risk}</span>
              </div>
              <div style={{ display: "flex", gap: "15px", marginBottom: "10px" }}>
                <span style={styles.badge("#1a1a2e")}>{insight.tickets} tickets</span>
                {parseFloat(insight.usedPercent) > 0 && (
                  <span style={styles.badge(parseFloat(insight.usedPercent) > 80 ? "#C8102E" : "#ff9800")}>{insight.usedPercent}% capacité</span>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#555", marginBottom: "6px" }}>📊 <strong>Analyse :</strong> {insight.recommendation}</div>
              <div style={{ fontSize: "12px", color: "#333", background: "white", padding: "8px", borderRadius: "6px" }}>✅ <strong>Action recommandée :</strong> {insight.action}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CHATBOT RÉEL — Groq API (Llama 3.1)
// ============================================================
function Chatbot({ tickets, timeEntries, aiPredictions, aiAnomalies }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Bonjour ! Je suis l'assistant IA du SOC Dashboard VERMEG, propulsé par Groq AI. Posez-moi des questions sur vos tickets, clients, heures ou anomalies !" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildContext = () => {
    const saasTickets = tickets.filter(t => t.ticket_type === "SAAS");
    const onPremTickets = tickets.filter(t => t.ticket_type === "ONPREM");
    const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);
    const byClient = saasTickets.reduce((acc, t) => {
      const name = t.client_name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    return `Tu es l'assistant IA expert du SOC Dashboard de VERMEG Tunisie. Tu analyses les données en temps réel et fournis des insights précis et actionnables.

DONNÉES EN TEMPS RÉEL :
- Total tickets : ${tickets.length} (SaaS: ${saasTickets.length}, On-Prem: ${onPremTickets.length})
- Heures Chronos totales : ${totalHeures.toFixed(2)}h
- Clients SaaS actifs : ${Object.entries(byClient).sort((a,b)=>b[1]-a[1]).map(([c, n]) => `${c}(${n} tickets)`).join(", ")}
${aiPredictions ? `- Prédiction IA semaine prochaine : ${aiPredictions.total_tickets} tickets, ${aiPredictions.total_hours}h` : ""}
${aiAnomalies ? `- Anomalies détectées : ${aiAnomalies.anomalies_count} sur ${aiAnomalies.total_analyzed} jours analysés` : ""}

CONTEXTE VERMEG :
- Équipe SOC de 10 membres
- Clients principaux : STT (dominant), SMBC, Devops, GEN, LGIM
- Groupes On-Prem : GIS, BDO, CDO, DO, EIP (240 tickets chacun)
- Smart Sync : synchronisation automatique Jira vers Chronos
- Slots horaires : 08:00 à 18:00 (créneaux de 15 minutes = 0.25h)

Réponds toujours en français, de manière concise et professionnelle avec des emojis pertinents. Fournis des analyses concrètes et des recommandations actionnables.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1000,
          messages: [
            { role: "system", content: buildContext() },
            ...messages.filter((m, i) => i > 0).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await response.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Erreur API : ${data.error.message}` }]);
      } else {
        const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu répondre.";
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Erreur de connexion à l'API Groq." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", padding: "15px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "24px" }}>🤖</div>
        <div>
          <div style={{ color: "white", fontWeight: "bold", fontSize: "15px" }}>Assistant IA — SOC Dashboard</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Powered by Groq AI (Llama 3.1)</div>
        </div>
        <div style={{ marginLeft: "auto", background: "#28a745", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "11px" }}>● En ligne</div>
      </div>
      <div style={{ height: "400px", overflowY: "auto", padding: "15px", background: "#f8f9fa" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "12px" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #1a1a2e, #0f3460)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px", fontSize: "16px", flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 14px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user" ? "linear-gradient(135deg, #C8102E, #a00c26)" : "white",
              color: msg.role === "user" ? "white" : "#333",
              fontSize: "13px", lineHeight: "1.6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              whiteSpace: "pre-wrap"
            }}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #C8102E, #a00c26)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "8px", fontSize: "16px", flexShrink: 0 }}>👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #1a1a2e, #0f3460)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
            <div style={{ background: "white", padding: "12px 16px", borderRadius: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C8102E" }} />
                ))}
                <span style={{ fontSize: "12px", color: "#666", marginLeft: "5px" }}>IA réfléchit...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "8px 15px", background: "#f0f0f0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          "Quel client a le plus de tickets ?",
          "Analyse les anomalies détectées",
          "Recommandations pour STT ?",
          "Résume les performances SOC",
          "Risques de surcharge cette semaine ?"
        ].map(q => (
          <button key={q} onClick={() => setInput(q)}
            style={{ padding: "4px 10px", background: "white", border: "1px solid #C8102E", color: "#C8102E", borderRadius: "15px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
            {q}
          </button>
        ))}
      </div>
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
          style={{ background: loading || !input.trim() ? "#ccc" : "linear-gradient(135deg, #C8102E, #a00c26)", color: "white", border: "none", borderRadius: "50%", width: "44px", height: "44px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "18px", boxShadow: "0 4px 12px rgba(200,16,46,0.3)" }}>
          ➤
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [hoursByClient, setHoursByClient] = useState([]);
  const [hoursByUser, setHoursByUser] = useState([]);
  const [unsyncedTickets, setUnsyncedTickets] = useState([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("global");
  const [comparison, setComparison] = useState([]);
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
  const [aiEstimation, setAiEstimation] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [allOnPremTickets, setAllOnPremTickets] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({ hours_logged: "", slot_start: "", slot_end: "", date: "" });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    API.get("/tickets").then(res => setTickets(res.data)).catch(console.error);
    API.get("/time-entries").then(res => setTimeEntries(res.data)).catch(console.error);
    API.get("/time-entries/stats").then(res => setHoursByClient(res.data)).catch(console.error);
    API.get("/time-entries/stats/user").then(res => setHoursByUser(res.data)).catch(console.error);
    API.get("/tickets/unsynced").then(res => setUnsyncedTickets(res.data)).catch(console.error);
    API.get("/tickets/onprem/all").then(res => setAllOnPremTickets(res.data)).catch(console.error);
    API.get("/tickets").then(ticketsRes => {
      API.get("/time-entries/stats").then(statsRes => {
        const tix = ticketsRes.data;
        const stats = statsRes.data;
        const byClient = {};
        tix.filter(t => t.ticket_type === "SAAS").forEach(t => {
          const c = t.client_name || "Unknown";
          if (!byClient[c]) byClient[c] = { client: c, jira_tickets: 0, jira_hours: 0, chronos_hours: 0 };
          byClient[c].jira_tickets += 1;
          byClient[c].jira_hours += 0.25;
        });
        stats.forEach(s => {
          const c = s.name || "Unknown";
          if (!byClient[c]) byClient[c] = { client: c, jira_tickets: 0, jira_hours: 0, chronos_hours: 0 };
          byClient[c].chronos_hours += parseFloat(s.total_hours || 0);
        });
        setComparison(Object.values(byClient).map(c => ({
          ...c,
          ecart: (c.chronos_hours - c.jira_hours).toFixed(2),
          jira_hours: c.jira_hours.toFixed(2),
          chronos_hours: c.chronos_hours.toFixed(2)
        })));
      });
    }).catch(console.error);
  }, []);

  const handleSmartSync = async () => {
    setSyncLoading(true); setSyncLogs([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/smart-sync", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setSyncLogs([`✅ Synchronisation terminée !`, `📥 Insérés : ${data.inserted || 0}`, `☁️ SaaS : ${data.saasInserted || 0}`, `🖥️ On-Prem : ${data.onPremInserted || 0}`, `⏭️ Ignorés : ${data.skipped || 0}`, `⏱️ Temps : ${data.totalTime || 0}s`]);
      API.get("/tickets").then(res => setTickets(res.data));
      API.get("/time-entries").then(res => setTimeEntries(res.data));
      API.get("/tickets/unsynced").then(res => setUnsyncedTickets(res.data));
    } catch (err) { setSyncLogs(["❌ Erreur : " + err.message]); }
    setSyncLoading(false);
  };

  const handlePredictWorkload = async () => { setAiLoading(true); setAiError(""); try { setAiPredictions(await (await fetch(`${AI_API}/ai/predict-workload`)).json()); } catch { setAiError("⚠️ API IA non disponible !"); } setAiLoading(false); };
  const handleDetectAnomalies = async () => { setAiLoading(true); setAiError(""); try { setAiAnomalies(await (await fetch(`${AI_API}/ai/detect-anomalies`)).json()); } catch { setAiError("⚠️ API IA non disponible !"); } setAiLoading(false); };
  const handleForecast7Days = async () => { setAiLoading(true); setAiError(""); try { setAiForecast(await (await fetch(`${AI_API}/ai/predict-7days`)).json()); } catch { setAiError("⚠️ API IA non disponible !"); } setAiLoading(false); };
  const handleEstimateByType = async () => { setAiLoading(true); setAiError(""); try { setAiEstimation(await (await fetch(`${AI_API}/ai/estimate-by-type`)).json()); } catch { setAiError("⚠️ API IA non disponible !"); } setAiLoading(false); };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Supprimer cette entrée ?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/time-entries/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      setTimeEntries(prev => prev.filter(e => e.id !== id));
    } catch { alert("Erreur lors de la suppression"); }
  };

  const handleEditEntry = (entry) => {
    setEditEntry(entry);
    setEditForm({ hours_logged: entry.hours_logged, slot_start: entry.slot_start, slot_end: entry.slot_end, date: entry.date ? entry.date.toString().slice(0, 10) : "" });
  };

  const handleUpdateEntry = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/time-entries/${editEntry.id}`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(editForm) });
      setTimeEntries(prev => prev.map(e => e.id === editEntry.id ? { ...e, ...editForm } : e));
      setEditEntry(null);
    } catch { alert("Erreur lors de la modification"); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("user"); window.location.reload(); };

  const saasTickets = tickets.filter(t => t.ticket_type === "SAAS");
  const onPremTickets = tickets.filter(t => t.ticket_type === "ONPREM");
  const filteredTickets = tickets.filter(t => {
    if (filterType !== "ALL" && t.ticket_type !== filterType) return false;
    if (filterClient !== "ALL" && t.client_name !== filterClient) return false;
    if (filterGroup !== "ALL" && t.group_name !== filterGroup) return false;
    return true;
  });
  const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);

  const byClient = saasTickets.reduce((acc, t) => { const name = t.client_name || "Unknown"; acc[name] = (acc[name] || 0) + 1; return acc; }, {});
  const saasChartData = Object.entries(byClient).map(([client, count]) => ({ client, tickets: count, heures: count * 0.25 }));
  const saasPieData = Object.entries(byClient).map(([client, count]) => ({ name: client, value: count }));
  const treemapData = Object.entries(byClient).map(([name, value]) => ({ name, value }));

  const byGroup = allOnPremTickets.reduce((acc, t) => { acc[t.group_name || "GIS"] = (acc[t.group_name || "GIS"] || 0) + 1; return acc; }, {});
  const onPremChartData = Object.entries(byGroup).map(([group, count]) => ({ group, tickets: count, heures: count * 0.25 }));
  const onPremPieData = Object.entries(byGroup).map(([group, count]) => ({ name: group, value: count }));

  const radarData = ONPREM_GROUPS.map(g => ({
    group: g,
    tickets: allOnPremTickets.filter(t => t.group_name === g).length,
    heures: allOnPremTickets.filter(t => t.group_name === g).length * 0.25
  }));

  const comparisonData = [
    { name: "SaaS", tickets: saasTickets.length, heures: saasTickets.length * 0.25 },
    { name: "On-Prem", tickets: allOnPremTickets.length, heures: allOnPremTickets.length * 0.25 }
  ];

  const byDate = timeEntries.reduce((acc, e) => { const d = e.date ? e.date.toString().slice(0, 10) : "N/A"; acc[d] = (acc[d] || 0) + parseFloat(e.hours_logged || 0); return acc; }, {});
  const lineData = Object.entries(byDate).sort().map(([date, heures]) => ({ date, heures }));

  const predChartData = aiPredictions ? aiPredictions.predictions.slice(0, 10).map(p => ({ client: p.client, tickets: p.predicted_tickets, heures: p.predicted_hours })) : [];
  const anomalyChartData = aiAnomalies ? Object.entries(aiAnomalies.anomalies.reduce((acc, a) => { acc[a.client] = (acc[a.client] || 0) + 1; return acc; }, {})).map(([client, count]) => ({ client, anomalies: count })) : [];
  const forecastLineData = aiForecast ? (() => {
    const dates = aiForecast.forecast[0]?.predictions.map(p => p.date) || [];
    return dates.map((date, i) => { const obj = { date }; aiForecast.forecast.forEach(c => { obj[c.client] = c.predictions[i]?.tickets || 0; }); return obj; });
  })() : [];

  const clientRules = hoursByClient.filter(s => parseFloat(s.max_hours_per_week) > 0).map(s => ({ client: s.name || "Unknown", used: parseFloat(s.total_hours || 0), max: parseFloat(s.max_hours_per_week || 0) })).sort((a, b) => (b.used / b.max) - (a.used / a.max));

  const paginatedFilteredTickets = filteredTickets.slice((ticketPage - 1) * PAGE_SIZE, ticketPage * PAGE_SIZE);
  const paginatedSaas = saasTickets.slice((saasPage - 1) * PAGE_SIZE, saasPage * PAGE_SIZE);
  const paginatedUnsynced = unsyncedTickets.slice((unsyncedPage - 1) * PAGE_SIZE, unsyncedPage * PAGE_SIZE);

  return (
    <div style={styles.page}>
      <style>{FLIP_CSS}</style>

      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{ height: "45px" }} />
          <span style={styles.brand}>SOC DASHBOARD</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "white", fontSize: "13px" }}>👤 {currentUser.full_name || "User"}</span>
          <button onClick={() => setShowChatbot(!showChatbot)}
            style={{ background: showChatbot ? "#28a745" : "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.5)", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            🤖 Assistant IA
          </button>
          <button onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.5)", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
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

        {/* ===== FLIP KPI CARDS ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "25px" }}>
          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #C8102E, #a00c26)", color: "white" }}>
                <div style={{ fontSize: "28px", marginBottom: "4px" }}>🎫</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>TOTAL TICKETS</div>
                <div style={{ fontSize: "34px", fontWeight: "bold" }}>{tickets.length}</div>
                <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #a00c26, #800a1e)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>📊 DÉTAIL</div>
                <div style={{ fontSize: "13px" }}>☁️ SaaS : <strong>{saasTickets.length}</strong></div>
                <div style={{ fontSize: "13px" }}>🖥️ On-Prem : <strong>{allOnPremTickets.length}</strong></div>
                <div style={{ fontSize: "13px" }}>⚠️ Non sync : <strong>{unsyncedTickets.length}</strong></div>
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #1a1a2e, #0d0d1a)", color: "white" }}>
                <div style={{ fontSize: "28px", marginBottom: "4px" }}>☁️</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>TICKETS SAAS</div>
                <div style={{ fontSize: "34px", fontWeight: "bold" }}>{saasTickets.length}</div>
                <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #0d0d1a, #050510)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>🏆 TOP 3</div>
                {Object.entries(byClient).sort((a,b) => b[1]-a[1]).slice(0,3).map(([c,n]) => (
                  <div key={c} style={{ fontSize: "12px" }}>📌 {c} : <strong>{n}</strong></div>
                ))}
                <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>{Object.keys(byClient).length} clients</div>
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #0f3460, #092540)", color: "white" }}>
                <div style={{ fontSize: "28px", marginBottom: "4px" }}>🖥️</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>TICKETS ON-PREM</div>
                <div style={{ fontSize: "34px", fontWeight: "bold" }}>{allOnPremTickets.length}</div>
                <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #092540, #061830)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>🗂️ PAR GROUPE</div>
                {ONPREM_GROUPS.map(g => (
                  <div key={g} style={{ fontSize: "11px" }}>🖥️ {g} : <strong>{allOnPremTickets.filter(t => t.group_name === g).length}</strong></div>
                ))}
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #ff9800, #cc7a00)", color: "white" }}>
                <div style={{ fontSize: "28px", marginBottom: "4px" }}>⚠️</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>NON SYNCHRONISÉS</div>
                <div style={{ fontSize: "34px", fontWeight: "bold" }}>{unsyncedTickets.length}</div>
                <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #cc7a00, #995c00)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>📈 STATUT SYNC</div>
                <div style={{ fontSize: "13px" }}>✅ Sync : <strong>{tickets.length - unsyncedTickets.length}</strong></div>
                <div style={{ fontSize: "13px" }}>⏳ En attente : <strong>{unsyncedTickets.length}</strong></div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  {tickets.length > 0 ? `${((tickets.length - unsyncedTickets.length) / tickets.length * 100).toFixed(0)}% complété` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #28a745, #1e7e34)", color: "white" }}>
                <div style={{ fontSize: "28px", marginBottom: "4px" }}>⏱️</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>HEURES CHRONOS</div>
                <div style={{ fontSize: "34px", fontWeight: "bold" }}>{totalHeures.toFixed(0)}h</div>
                <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #1e7e34, #155724)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>⏱️ DÉTAIL HEURES</div>
                <div style={{ fontSize: "13px" }}>☁️ SaaS : <strong>{(saasTickets.length * 0.25).toFixed(1)}h</strong></div>
                <div style={{ fontSize: "13px" }}>🖥️ On-Prem : <strong>{(allOnPremTickets.length * 0.25).toFixed(1)}h</strong></div>
                <div style={{ fontSize: "13px" }}>📊 Moy/ticket : <strong>0.25h</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div style={{ marginBottom: "0", borderBottom: "2px solid #e0e0e0", display: "flex", flexWrap: "wrap" }}>
          {["global", "saas", "onprem", "unsynced", "comparison", "ai"].map(tab => (
            <button key={tab} style={styles.tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab === "global" ? "🌐 Vue Globale" : tab === "saas" ? "☁️ Vue SaaS" : tab === "onprem" ? "🖥️ Vue On-Prem" : tab === "unsynced" ? "⚠️ Non Synchronisés" : tab === "comparison" ? "📊 Jira vs Chronos" : "🤖 IA & Analytics"}
            </button>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: "0 12px 12px 12px", padding: "25px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

          {/* ===== VUE GLOBALE ===== */}
          {activeTab === "global" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px", padding: "15px", background: "linear-gradient(135deg, #f8f9fa, #e8edf2)", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
                <button onClick={handleSmartSync} disabled={syncLoading} style={{ ...styles.btn(syncLoading ? "#ccc" : "#C8102E"), fontSize: "15px", padding: "12px 28px" }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
                <div>
                  <div style={styles.cardTitle}>📊 SaaS vs On-Prem — Tickets & Heures</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={comparisonData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                      <Bar dataKey="tickets" fill="#C8102E" radius={[6,6,0,0]} name="Tickets" />
                      <Bar dataKey="heures" fill="#0f3460" radius={[6,6,0,0]} name="Heures" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🍩 Répartition SaaS vs On-Prem</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={comparisonData} dataKey="tickets" nameKey="name" cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100} labelLine={false} label={renderDonutLabel}>
                        <Cell fill="#C8102E" /><Cell fill="#0f3460" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.cardTitle}>👥 Heures par Membre de l'Équipe</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "25px" }}>
                {hoursByUser.map(u => {
                  const used = parseFloat(u.total_hours || 0);
                  const maxHours = parseFloat(u.max_hours_per_week || 40);
                  const percent = Math.min((used / maxHours) * 100, 100);
                  const color = percent > 80 ? "#C8102E" : percent > 50 ? "#ff9800" : "#28a745";
                  const saasH = parseFloat(u.saas_hours || 0);
                  const onpremH = parseFloat(u.onprem_hours || 0);
                  return (
                    <div key={u.user_id} style={{ background: percent >= 100 ? "#fff5f5" : percent >= 50 ? "#fffbf0" : "#f0fff4", borderRadius: "12px", padding: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: `2px solid ${color}`, textAlign: "center" }}>
                      <div style={{ fontSize: "28px", marginBottom: "6px" }}>👤</div>
                      <div style={{ fontWeight: "bold", fontSize: "13px", color: "#1a1a2e", marginBottom: "10px" }}>{u.full_name}</div>
                      <div style={{ fontSize: "26px", fontWeight: "bold", color }}>{used.toFixed(2)}h</div>
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>/ {maxHours}h max/semaine</div>
                      <div style={{ height: "6px", background: "#e0e0e0", borderRadius: "3px", margin: "8px 0" }}>
                        <div style={{ height: "6px", background: color, borderRadius: "3px", width: `${percent}%`, transition: "width 0.5s" }}/>
                      </div>
                      <div style={{ fontSize: "12px", color, fontWeight: "bold", marginBottom: "8px" }}>{percent >= 100 ? "⚠️ Dépassé" : `${percent.toFixed(0)}%`}</div>
                      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: "13px", fontWeight: "bold", color: "#C8102E" }}>{saasH.toFixed(2)}h</div><div style={{ fontSize: "10px", color: "#999" }}>SaaS</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: "13px", fontWeight: "bold", color: "#0f3460" }}>{onpremH.toFixed(2)}h</div><div style={{ fontSize: "10px", color: "#999" }}>On-Prem</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: "13px", fontWeight: "bold", color: "#28a745" }}>{u.total_tickets}</div><div style={{ fontSize: "10px", color: "#999" }}>Tickets</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.cardTitle}>📈 Évolution des Heures Chronos</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={lineData}>
                  <defs>
                    <linearGradient id="colorHeures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C8102E" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={11} /><YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="heures" stroke="#C8102E" strokeWidth={2.5} fill="url(#colorHeures)" dot={{ fill: "#C8102E", r: 3 }} name="Heures" />
                </AreaChart>
              </ResponsiveContainer>

              <div style={{ marginTop: "25px" }}>
                <ClientRetentionAI tickets={tickets} hoursByClient={hoursByClient} clientRules={clientRules} />
              </div>
            </div>
          )}

          {/* ===== VUE SAAS ===== */}
          {activeTab === "saas" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>📊 Tickets par Client (SaaS) — Horizontal</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={saasChartData.sort((a,b) => b.tickets - a.tickets)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#666" />
                      <YAxis dataKey="client" type="category" stroke="#666" width={60} fontSize={11} />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Bar dataKey="tickets" fill="#C8102E" radius={[0,6,6,0]} name="Tickets">
                        {saasChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🌳 Treemap — Répartition par Client</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <Treemap data={treemapData} dataKey="value" nameKey="name" content={<TreemapContent />} />
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.cardTitle}>🎯 Heures utilisées vs Max autorisées — Par Client</div>
              {clientRules.filter(r => r.used >= r.max).length > 0 && (
                <div style={{ background: "#fff0f0", border: "1px solid #C8102E", borderRadius: "10px", padding: "10px 15px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>⚠️</span>
                  <span style={{ color: "#C8102E", fontWeight: "bold", fontSize: "13px" }}>
                    {clientRules.filter(r => r.used >= r.max).length} client(s) ont dépassé leur limite :&nbsp;
                    {clientRules.filter(r => r.used >= r.max).map(r => r.client).join(", ")}
                  </span>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "25px" }}>
                {clientRules.map(rule => {
                  const percent = rule.used / rule.max;
                  const borderColor = percent >= 1 ? "#C8102E" : percent >= 0.5 ? "#ff9800" : "#28a745";
                  const bgColor = percent >= 1 ? "#fff5f5" : percent >= 0.5 ? "#fffbf0" : "#f0fff4";
                  return (
                    <div key={rule.client} style={{ background: bgColor, borderRadius: "12px", padding: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: `2px solid ${borderColor}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Gauge value={rule.used.toFixed(2)} max={rule.max} label={rule.client} />
                    </div>
                  );
                })}
              </div>

              <div style={styles.cardTitle}>🎫 Tickets SaaS ({saasTickets.length})</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Client</th><th style={styles.th}>Date</th></tr></thead>
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

          {/* ===== VUE ON-PREM ===== */}
          {activeTab === "onprem" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>🕸️ Spider Chart — Répartition On-Prem</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius={100} data={radarData}>
                      <PolarGrid stroke="#e0e0e0" />
                      <PolarAngleAxis dataKey="group" tick={{ fontSize: 13, fontWeight: "bold", fill: "#1a1a2e" }} />
                      <PolarRadiusAxis angle={90} domain={[0, Math.max(...radarData.map(d => d.tickets)) + 10]} tick={{ fontSize: 10 }} />
                      <Radar name="Tickets" dataKey="tickets" stroke="#C8102E" fill="#C8102E" fillOpacity={0.3} strokeWidth={2} />
                      <Radar name="Heures" dataKey="heures" stroke="#0f3460" fill="#0f3460" fillOpacity={0.2} strokeWidth={2} />
                      <Legend /><Tooltip contentStyle={{ borderRadius: "8px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🍩 Répartition par Groupe (On-Prem)</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={onPremPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={70} outerRadius={110} labelLine={false} label={renderDonutLabel}>
                        {onPremPieData.map((_, i) => <Cell key={i} fill={ONPREM_COLORS[i % ONPREM_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.cardTitle}>🎯 Heures par Groupe (On-Prem)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "25px" }}>
                {ONPREM_GROUPS.map((group) => {
                  const groupTickets = allOnPremTickets.filter(t => t.group_name === group).length;
                  const groupHours = groupTickets * 0.25;
                  const maxHours = 50;
                  const percent = Math.min((groupHours / maxHours) * 100, 100);
                  const color = percent > 80 ? "#C8102E" : percent > 50 ? "#ff9800" : "#0f3460";
                  return (
                    <div key={group} style={{ background: "white", borderRadius: "12px", padding: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: `2px solid ${color}`, textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>🖥️</div>
                      <div style={{ fontWeight: "bold", fontSize: "15px", color: "#1a1a2e", marginBottom: "8px" }}>{group}</div>
                      <div style={{ fontSize: "26px", fontWeight: "bold", color }}>{groupHours.toFixed(2)}h</div>
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>/ {maxHours}h max</div>
                      <div style={{ height: "6px", background: "#e0e0e0", borderRadius: "3px", margin: "8px 0" }}>
                        <div style={{ height: "6px", background: color, borderRadius: "3px", width: `${percent}%`, transition: "width 0.5s" }}/>
                      </div>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{groupTickets} tickets</div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.cardTitle}>🎫 Tickets On-Prem ({allOnPremTickets.length})</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Groupe</th><th style={styles.th}>Assigné à</th><th style={styles.th}>Date</th></tr></thead>
                <tbody>
                  {allOnPremTickets.slice((onpremPage-1)*PAGE_SIZE, onpremPage*PAGE_SIZE).map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}><span style={styles.badge("#0f3460")}>{t.jira_key}</span></td>
                      <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 60)}...</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.group_name || "GIS"}</span></td>
                      <td style={styles.td}><span style={styles.badge("#666")}>{t.assignee_name || "—"}</span></td>
                      <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={allOnPremTickets.length} page={onpremPage} onPage={setOnpremPage} />
            </div>
          )}

          {/* ===== VUE COMPARAISON ===== */}
          {activeTab === "comparison" && (
            <div>
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: "12px", padding: "20px", marginBottom: "20px", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>Comparaison Jira vs Chronos</div>
                <div style={{ fontSize: "13px", opacity: 0.8 }}>Écart entre les heures estimées Jira et les heures réelles Chronos par client</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "20px" }}>
                {[
                  { label: "HEURES JIRA (ESTIMÉES)", value: `${comparison.reduce((acc, c) => acc + parseFloat(c.jira_hours), 0).toFixed(2)}h`, bg: "#C8102E" },
                  { label: "HEURES CHRONOS (RÉELLES)", value: `${comparison.reduce((acc, c) => acc + parseFloat(c.chronos_hours), 0).toFixed(2)}h`, bg: "#0f3460" },
                  { label: "ÉCART TOTAL", value: `${comparison.reduce((acc, c) => acc + parseFloat(c.ecart), 0).toFixed(2)}h`, bg: "#ff9800" }
                ].map((kpi, i) => (
                  <div key={i} style={{ background: kpi.bg, borderRadius: "12px", padding: "20px", textAlign: "center", color: "white", boxShadow: `0 8px 25px ${kpi.bg}44` }}>
                    <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "8px" }}>{kpi.label}</div>
                    <div style={{ fontSize: "32px", fontWeight: "bold" }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div style={styles.cardTitle}>📊 Heures Jira vs Chronos par Client</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="client" stroke="#666" /><YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                  <Bar dataKey="jira_hours" fill="#C8102E" radius={[6,6,0,0]} name="Heures Jira (estimées)" />
                  <Bar dataKey="chronos_hours" fill="#0f3460" radius={[6,6,0,0]} name="Heures Chronos (réelles)" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ ...styles.cardTitle, marginTop: "20px" }}>📋 Détail par Client</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Client</th><th style={styles.th}>Tickets Jira</th><th style={styles.th}>Heures Jira</th><th style={styles.th}>Heures Chronos</th><th style={styles.th}>Écart</th><th style={styles.th}>Statut</th></tr></thead>
                <tbody>
                  {comparison.sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart)).map((c, i) => {
                    const ecart = parseFloat(c.ecart);
                    const statut = ecart > 5 ? "⚠️ Sur-déclaré" : ecart < -5 ? "❌ Sous-déclaré" : "✅ OK";
                    const statutColor = ecart > 5 ? "#ff9800" : ecart < -5 ? "#C8102E" : "#28a745";
                    return (
                      <tr key={c.client} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{c.client}</span></td>
                        <td style={styles.td}><strong>{c.jira_tickets}</strong></td>
                        <td style={styles.td}><span style={styles.badge("#C8102E")}>{c.jira_hours}h</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{c.chronos_hours}h</span></td>
                        <td style={styles.td}><span style={{ fontWeight: "bold", color: ecart > 0 ? "#ff9800" : ecart < 0 ? "#C8102E" : "#28a745" }}>{ecart > 0 ? "+" : ""}{c.ecart}h</span></td>
                        <td style={styles.td}><span style={styles.badge(statutColor)}>{statut}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== VUE NON SYNCHRONISÉS ===== */}
          {activeTab === "unsynced" && (
            <div>
              <div style={styles.cardTitle}>⚠️ Tickets Non Synchronisés avec Chronos ({unsyncedTickets.length})</div>
              {unsyncedTickets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#28a745" }}>
                  <div style={{ fontSize: "64px", marginBottom: "15px" }}>✅</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>Tous les tickets sont synchronisés !</div>
                </div>
              ) : (
                <>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Date</th></tr></thead>
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

          {/* ===== VUE IA ===== */}
          {activeTab === "ai" && (
            <div>
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: "12px", padding: "20px", marginBottom: "20px", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🤖</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>Composante IA — SOC Dashboard</div>
                <div style={{ fontSize: "13px", opacity: 0.8 }}>Prédiction • Détection d'anomalies • Forecast 7 jours • Estimation • Fidélisation</div>
                <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "6px" }}>Powered by Random Forest & Isolation Forest</div>
              </div>

              {aiError && <div style={{ padding: "12px 20px", background: "#fff3cd", border: "1px solid #ff9800", borderRadius: "8px", color: "#856404", marginBottom: "20px", fontWeight: "bold" }}>{aiError}</div>}

              <div style={{ display: "flex", gap: "12px", marginBottom: "25px", justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { label: "📊 Prédire la Charge", handler: handlePredictWorkload, color: "#C8102E" },
                  { label: "🚨 Détecter Anomalies", handler: handleDetectAnomalies, color: "#0f3460" },
                  { label: "🔮 Forecast 7 Jours", handler: handleForecast7Days, color: "#28a745" },
                  { label: "⏱️ Estimer par Type", handler: handleEstimateByType, color: "#6c757d" },
                ].map(b => (
                  <button key={b.label} onClick={b.handler} disabled={aiLoading} style={{ ...styles.btn(aiLoading ? "#ccc" : b.color), padding: "12px 24px", fontSize: "14px" }}>
                    {aiLoading ? "⏳..." : b.label}
                  </button>
                ))}
                <button onClick={() => { setShowChatbot(true); setActiveTab("global"); }} style={{ ...styles.btn("#ff9800"), padding: "12px 24px", fontSize: "14px" }}>💬 Assistant IA</button>
              </div>

              {aiForecast && (
                <div style={{ marginBottom: "25px" }}>
                  <div style={styles.cardTitle}>🔮 Forecast Charge de Travail — 7 Prochains Jours</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecastLineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                      {aiForecast.forecast.slice(0,5).map((c, i) => (
                        <Line key={c.client} type="monotone" dataKey={c.client} stroke={CLIENT_COLORS[i % CLIENT_COLORS.length]} strokeWidth={2.5} dot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {aiPredictions && (
                <div style={{ marginBottom: "25px" }}>
                  <div style={styles.cardTitle}>📊 Prédiction de Charge — Semaine Prochaine</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                    <div style={{ background: "#C8102E", borderRadius: "12px", padding: "20px", textAlign: "center", color: "white", boxShadow: "0 8px 25px #C8102E44" }}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>TICKETS PRÉVUS</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiPredictions.total_tickets}</div>
                    </div>
                    <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", textAlign: "center", color: "white" }}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>HEURES PRÉVUES</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiPredictions.total_hours}h</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={predChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="client" stroke="#666" /><YAxis stroke="#666" />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                      <Bar dataKey="tickets" fill="#C8102E" radius={[6,6,0,0]} name="Tickets prévus" />
                      <Bar dataKey="heures" fill="#0f3460" radius={[6,6,0,0]} name="Heures prévues" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {aiAnomalies && (
                <div style={{ marginBottom: "25px" }}>
                  <div style={styles.cardTitle}>🚨 Détection d'Anomalies</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                    <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", textAlign: "center", color: "white" }}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>JOURS ANALYSÉS</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiAnomalies.total_analyzed}</div>
                    </div>
                    <div style={{ background: "#C8102E", borderRadius: "12px", padding: "20px", textAlign: "center", color: "white" }}>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>ANOMALIES DÉTECTÉES</div>
                      <div style={{ fontSize: "36px", fontWeight: "bold" }}>{aiAnomalies.anomalies_count}</div>
                    </div>
                  </div>
                  {anomalyChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={anomalyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="client" stroke="#666" /><YAxis stroke="#666" /><Tooltip contentStyle={{ borderRadius: "8px" }} />
                        <Bar dataKey="anomalies" fill="#C8102E" radius={[6,6,0,0]} name="Anomalies" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {aiEstimation && (
                <div style={{ marginBottom: "25px" }}>
                  <div style={styles.cardTitle}>⏱️ Estimation Temps par Type de Ticket</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "20px" }}>
                    {[
                      { label: "HAUTE COMPLEXITÉ", value: aiEstimation.complexity.high, sub: "tickets (≥0.5h)", bg: "#C8102E" },
                      { label: "MOYENNE COMPLEXITÉ", value: aiEstimation.complexity.medium, sub: "tickets (0.25-0.5h)", bg: "#ff9800" },
                      { label: "FAIBLE COMPLEXITÉ", value: aiEstimation.complexity.low, sub: "tickets (0.25h)", bg: "#28a745" }
                    ].map((k, i) => (
                      <div key={i} style={{ background: k.bg, borderRadius: "12px", padding: "20px", textAlign: "center", color: "white", boxShadow: `0 8px 25px ${k.bg}44` }}>
                        <div style={{ fontSize: "11px", opacity: 0.9 }}>{k.label}</div>
                        <div style={{ fontSize: "36px", fontWeight: "bold" }}>{k.value}</div>
                        <div style={{ fontSize: "11px", opacity: 0.8 }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Type</th><th style={styles.th}>Temps Moyen Estimé</th><th style={styles.th}>Total Tickets</th></tr></thead>
                    <tbody>
                      {aiEstimation.by_type.map((t, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={styles.td}><span style={styles.badge(t.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.ticket_type}</span></td>
                          <td style={styles.td}><strong>{parseFloat(t.avg_hours).toFixed(2)}h</strong></td>
                          <td style={styles.td}>{t.total_tickets}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!aiPredictions && !aiAnomalies && !aiForecast && !aiEstimation && !aiError && (
                <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>
                  <div style={{ fontSize: "64px", marginBottom: "15px" }}>🤖</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Clique sur un bouton pour lancer l'analyse IA</div>
                  <div style={{ fontSize: "13px" }}>Assure-toi que le notebook Jupyter est en cours d'exécution</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== FILTRES ===== */}
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
            <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Type</th><th style={styles.th}>Client / Groupe</th><th style={styles.th}>Date</th></tr></thead>
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

        {/* ===== ENTRÉES DE TEMPS ===== */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🕐 Mes Entrées de Temps Chronos ({timeEntries.length})</div>

          {editEntry && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "30px", width: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "20px", borderBottom: "3px solid #C8102E", paddingBottom: "10px" }}>✏️ Modifier l'entrée #{editEntry.id}</div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px" }}>Heures</label>
                  <input type="number" step="0.25" value={editForm.hours_logged} onChange={e => setEditForm({ ...editForm, hours_logged: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px" }}>Slot début</label>
                  <input type="time" value={editForm.slot_start?.slice(0,5)} onChange={e => setEditForm({ ...editForm, slot_start: e.target.value + ":00" })}
                    style={{ width: "100%", padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px" }}>Slot fin</label>
                  <input type="time" value={editForm.slot_end?.slice(0,5)} onChange={e => setEditForm({ ...editForm, slot_end: e.target.value + ":00" })}
                    style={{ width: "100%", padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px" }}>Date</label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={() => setEditEntry(null)} style={{ padding: "10px 20px", background: "#666", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Annuler</button>
                  <button onClick={handleUpdateEntry} style={{ padding: "10px 20px", background: "#28a745", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>✅ Sauvegarder</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th>
                  <th style={styles.th}>Slot Horaire</th><th style={styles.th}>Heures</th><th style={styles.th}>Date</th>
                  <th style={styles.th}>Synchronisé</th><th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.slice(0, 50).map((entry, i) => (
                  <tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={styles.td}>{entry.id}</td>
                    <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{entry.client_name || "—"}</span></td>
                    <td style={styles.td}><span style={styles.badge(entry.ticket_type === "ONPREM" ? "#0f3460" : "#C8102E")}>{entry.ticket_type || "SAAS"}</span></td>
                    <td style={styles.td}><span style={{ fontSize: "12px", fontFamily: "monospace", background: "#f0f0f0", padding: "3px 8px", borderRadius: "4px" }}>{entry.slot_start} → {entry.slot_end}</span></td>
                    <td style={styles.td}><span style={styles.badge("#28a745")}>{entry.hours_logged}h</span></td>
                    <td style={styles.td}>{entry.date ? entry.date.toString().slice(0, 10) : "—"}</td>
                    <td style={styles.td}><span style={styles.badge(entry.synced_to_chronos ? "#28a745" : "#ff9800")}>{entry.synced_to_chronos ? "✅ Oui" : "⏳ Non"}</span></td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleEditEntry(entry)} style={{ padding: "4px 10px", background: "#0f3460", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>✏️ Modifier</button>
                        <button onClick={() => handleDeleteEntry(entry.id)} style={{ padding: "4px 10px", background: "#C8102E", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🗑️ Supprimer</button>
                      </div>
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