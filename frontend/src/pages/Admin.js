import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, LineChart, Line
} from "recharts";

const COLORS = ["#C8102E", "#1a1a2e", "#0f3460", "#e94560", "#28a745", "#ff9800", "#16213e", "#6c757d"];
const CLIENT_COLORS = ["#C8102E","#0f3460","#28a745","#ff9800","#e94560","#1a1a2e","#6c757d"];
const MONITORING_TASKS = ["Colateral SOC", "Insurance SOC", "Internal SOC"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = ["08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h"];
const AI_API = "http://localhost:5001";

const FLIP_CSS = `
  .flip-card { background: transparent; perspective: 1000px; height: 130px; cursor: pointer; }
  .flip-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.7s cubic-bezier(0.4,0.2,0.2,1); transform-style: preserve-3d; }
  .flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
  .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; box-sizing: border-box; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  .flip-card-back { transform: rotateY(180deg); }
  .heatmap-cell { transition: all 0.2s; cursor: pointer; }
  .heatmap-cell:hover { transform: scale(1.15); filter: brightness(1.2); }
  .bullet-bar { transition: width 0.6s ease; }
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
`;

const styles = {
  navbar: { background: "linear-gradient(135deg, #1a1a2e, #0f3460)", padding: "0 30px", height: "65px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" },
  brand: { color: "white", fontSize: "20px", fontWeight: "bold", letterSpacing: "2px" },
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #f0f2f5, #e8edf2)", fontFamily: "Arial, sans-serif" },
  container: { padding: "25px" },
  card: { background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "20px" },
  cardTitle: { color: "#1a1a2e", fontWeight: "bold", fontSize: "16px", marginBottom: "15px", borderBottom: "3px solid #C8102E", paddingBottom: "8px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "white", padding: "12px 15px", textAlign: "left", fontSize: "13px" },
  td: { padding: "12px 15px", borderBottom: "1px solid #f0f0f0", fontSize: "14px", color: "#333" },
  badge: (bg) => ({ background: bg, color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }),
  input: { padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "6px", width: "80px", fontSize: "14px", outline: "none" },
  btnModify: { background: "#C8102E", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  btn: (bg) => ({ background: bg, color: "white", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", margin: "0 6px" }),
  filterSelect: { padding: "8px 12px", borderRadius: "6px", border: "2px solid #e0e0e0", fontSize: "13px", outline: "none", marginRight: "10px", cursor: "pointer" },
  tabBtn: (active) => ({ padding: "10px 18px", borderRadius: "8px 8px 0 0", fontWeight: "bold", cursor: "pointer", fontSize: "13px", margin: "0 2px 0 0", border: "none", background: active ? "white" : "#e0e0e0", color: active ? "#C8102E" : "#666", borderBottom: active ? "3px solid #C8102E" : "none" }),
  select: { padding: "8px 12px", borderRadius: "6px", border: "2px solid #e0e0e0", fontSize: "13px", outline: "none", cursor: "pointer", width: "100%" }
};

function CrossFilterBanner({ selected, onClear }) {
  if (!selected) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px", background:"linear-gradient(135deg,#1a1a2e,#0f3460)", borderRadius:"10px", padding:"10px 18px", marginBottom:"18px", boxShadow:"0 4px 15px rgba(0,0,0,0.2)", animation:"slideDown 0.3s ease" }}>
      <span style={{fontSize:"18px"}}>🎯</span>
      <span style={{color:"white", fontWeight:"bold", fontSize:"14px"}}>Filtre actif : <span style={{background:"rgba(255,255,255,0.2)", padding:"2px 10px", borderRadius:"15px", marginLeft:"4px"}}>{selected}</span></span>
      <span style={{color:"rgba(255,255,255,0.7)", fontSize:"12px"}}>— Tous les visuels sont filtrés</span>
      <button onClick={onClear} style={{marginLeft:"auto", background:"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.4)", padding:"5px 14px", borderRadius:"20px", cursor:"pointer", fontSize:"12px", fontWeight:"bold"}}>✕ Effacer filtre</button>
    </div>
  );
}

function ActivityHeatmap({ timeEntries, selectedClient, onSelectClient }) {
  const filtered = selectedClient ? timeEntries.filter(e => (e.client_name || e.group_name) === selectedClient) : timeEntries;
  const grid = DAYS.map((_, di) => HOURS.map((_, hi) => {
    const hour = 8 + hi;
    const entries = filtered.filter(e => {
      if (!e.date || !e.slot_start) return false;
      const d = new Date(e.date).getDay(); const dayIdx = d === 0 ? 6 : d - 1;
      const h = parseInt(e.slot_start?.split(":")[0] || "0");
      return dayIdx === di && h === hour;
    });
    return { count: entries.length, entries };
  }));
  const maxVal = Math.max(...grid.flat().map(c => c.count), 1);
  const getColor = (v) => { if (v === 0) return "#f0f2f5"; const p = v / maxVal; if (p < 0.25) return "#fce4e4"; if (p < 0.5) return "#f48fb1"; if (p < 0.75) return "#e94560"; return "#C8102E"; };

  const handleCellClick = (cell) => {
    if (!onSelectClient || cell.entries.length === 0) return;
    const counts = {};
    cell.entries.forEach(e => {
      const name = e.client_name || e.group_name;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    const topName = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topName) onSelectClient(topName === selectedClient ? null : topName);
  };

  return (
    <div style={{ overflowX: "auto" }}>
      {selectedClient && <div style={{fontSize:"12px",color:"#C8102E",fontWeight:"bold",marginBottom:"8px"}}>🎯 Filtré sur : {selectedClient}</div>}
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px", paddingLeft: "36px" }}>
        {HOURS.map(h => <div key={h} style={{ width: "32px", fontSize: "10px", color: "#999", textAlign: "center" }}>{h}</div>)}
      </div>
      {grid.map((row, di) => (
        <div key={di} style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "32px", fontSize: "11px", color: "#666", fontWeight: "bold" }}>{DAYS[di]}</div>
          {row.map((cell, hi) => (
            <div key={hi} className="heatmap-cell"
              title={`${DAYS[di]} ${HOURS[hi]} — ${cell.count} entrée(s)${cell.count > 0 ? " (clic pour filtrer)" : ""}`}
              onClick={() => handleCellClick(cell)}
              style={{ width: "32px", height: "28px", borderRadius: "5px", background: getColor(cell.count), display: "flex", alignItems: "center", justifyContent: "center", cursor: cell.count > 0 ? "pointer" : "default" }}>
              {cell.count > 0 && <span style={{ fontSize: "10px", fontWeight: "bold", color: cell.count / maxVal > 0.4 ? "white" : "#C8102E" }}>{cell.count}</span>}
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", paddingLeft: "36px" }}>
        <span style={{ fontSize: "11px", color: "#999" }}>Moins</span>
        {["#f0f2f5", "#fce4e4", "#f48fb1", "#e94560", "#C8102E"].map((c, i) => <div key={i} style={{ width: "18px", height: "18px", borderRadius: "3px", background: c }} />)}
        <span style={{ fontSize: "11px", color: "#999" }}>Plus</span>
      </div>
    </div>
  );
}

function WaterfallChart({ comparison, selectedClient, onSelectClient }) {
  if (!comparison.length) return <div style={{ textAlign: "center", color: "#999", padding: "40px" }}>Aucune donnée</div>;
  const data = comparison.filter(c => Math.abs(parseFloat(c.ecart)) > 0).slice(0, 8).map(c => ({ client: c.client, ecart: parseFloat(c.ecart) }));
  const CustomBar = (props) => {
    const { x, y, width, height, payload } = props;
    if (!height || !payload) return null;
    const client = payload.client; const ecart = payload.ecart;
    const isSelected = selectedClient === client; const isDimmed = selectedClient && !isSelected;
    const fill = ecart > 0 ? "#ff9800" : "#C8102E";
    return (
      <g style={{cursor:"pointer"}} onClick={() => onSelectClient && onSelectClient(client === selectedClient ? null : client)}>
        <rect x={x} y={y} width={width} height={Math.abs(height)} fill={fill} rx={4} opacity={isDimmed ? 0.2 : 1} stroke={isSelected ? "#1a1a2e" : "none"} strokeWidth={isSelected ? 3 : 0}/>
        <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="bold" fill={isDimmed?"#ccc":fill}>{ecart > 0 ? "+" : ""}{ecart.toFixed(1)}h</text>
      </g>
    );
  };
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="client" tick={{ fontSize: 11, fill: "#666" }} />
        <YAxis tick={{ fontSize: 11, fill: "#666" }} tickFormatter={v => `${v}h`} />
        <ReferenceLine y={0} stroke="#1a1a2e" strokeWidth={2} />
        <Tooltip contentStyle={{ borderRadius: "8px" }} formatter={(v) => [`${parseFloat(v).toFixed(2)}h`, "Écart"]} />
        <Bar dataKey="ecart" name="Écart (h)" shape={<CustomBar />} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BulletChart({ data, title, colorScheme = "red", selectedClient, onSelectClient }) {
  const accent = colorScheme === "red" ? "#C8102E" : "#0f3460";
  if (!data || data.length === 0) return null;
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      {data.map((item, i) => {
        const valuePct = Math.min((item.value / item.max) * 100, 100);
        const targetPct = Math.min((item.target / item.max) * 100, 100);
        const overTarget = item.value > item.target;
        const isSelected = selectedClient === item.label;
        const isDimmed = selectedClient && !isSelected;
        return (
          <div key={i} onClick={() => onSelectClient && onSelectClient(item.label === selectedClient ? null : item.label)}
            style={{ marginBottom: "16px", opacity: isDimmed ? 0.25 : 1, transition: "opacity 0.2s", cursor: "pointer", padding:"4px 8px", borderRadius:"8px", background: isSelected ? "rgba(200,16,46,0.06)" : "transparent", border: isSelected ? "1px solid rgba(200,16,46,0.3)" : "1px solid transparent" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: isSelected ? "#C8102E" : "#1a1a2e" }}>{isSelected ? "🎯 " : ""}{item.label}</span>
              <span style={{ fontSize: "12px", color: "#666" }}><span style={{ color: overTarget ? "#C8102E" : "#28a745", fontWeight: "bold" }}>{item.value.toFixed(1)}h</span>{" / "}{item.target.toFixed(0)}h objectif</span>
            </div>
            <div style={{ position: "relative", height: "24px", background: "#f0f2f5", borderRadius: "6px", overflow: "visible" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: `${Math.min(targetPct * 1.2, 100)}%`, height: "100%", background: "#e0e4ea", borderRadius: "6px" }} />
              <div className="bullet-bar" style={{ position: "absolute", left: 0, top: "5px", height: "14px", width: `${valuePct}%`, background: overTarget ? `linear-gradient(90deg,${accent},${accent}cc)` : "linear-gradient(90deg,#28a745,#1e7e34)", borderRadius: "4px" }} />
              <div style={{ position: "absolute", left: `${targetPct}%`, top: "-3px", width: "3px", height: "30px", background: "#1a1a2e", borderRadius: "2px", transform: "translateX(-50%)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "3px" }}>
              <span style={{ fontSize: "11px", color: overTarget ? "#C8102E" : "#28a745", fontWeight: "bold" }}>{overTarget ? `⚠️ +${(item.value - item.target).toFixed(1)}h` : `✅ -${(item.target - item.value).toFixed(1)}h restant`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const R = Math.PI / 180, r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
};

function Admin() {
  const [rules, setRules] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [unsyncedTickets, setUnsyncedTickets] = useState([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterClient, setFilterClient] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [newRuleClientId, setNewRuleClientId] = useState("");
  const [newRuleUserId, setNewRuleUserId] = useState("");
  const [newRuleMaxHours, setNewRuleMaxHours] = useState("");
  const [clotureDate, setClotureDate] = useState("");
  const [filterSyncClient, setFilterSyncClient] = useState("");
const [filterSyncDateFrom, setFilterSyncDateFrom] = useState("");
const [filterSyncDateTo, setFilterSyncDateTo] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [aiAnomalies, setAiAnomalies] = useState(null);
  const [aiForecast, setAiForecast] = useState(null);
  const [aiEstimation, setAiEstimation] = useState(null);
  const [aiError, setAiError] = useState("");

  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([{role:"assistant",content:"👋 Bonjour Admin ! Je suis l'assistant IA du SOC Dashboard. Posez-moi vos questions sur les tickets, heures et performances !"}]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // CROSS-FILTER STATE
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterDashClient, setFilterDashClient] = useState("");
  const [filterDashDateFrom, setFilterDashDateFrom] = useState("");
  const [filterDashDateTo, setFilterDashDateTo] = useState("");

  const handleSelectClient = useCallback((client) => {
    setSelectedClient(prev => prev === client ? null : client);
    setSelectedMember(null);
  }, []);
  const handleSelectMember = useCallback((member) => {
    setSelectedMember(prev => prev === member ? null : member);
    setSelectedClient(null);
  }, []);
  const clearFilter = useCallback(() => { setSelectedClient(null); setSelectedMember(null); }, []);
  const activeFilter = selectedClient || selectedMember;

  // Fonction de filtrage universelle
  const getFilteredTickets = useCallback((ticketsData) => {
    return ticketsData.filter(t => {
      if (selectedClient && t.client_name !== selectedClient) return false;
      if (selectedMember && t.assignee_name !== selectedMember) return false;
      return true;
    });
  }, [selectedClient, selectedMember]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [rulesRes, usersRes, statsRes, ticketsRes, teRes, clotureRes] = await Promise.all([
        API.get("/rules"),
        API.get("/admin/users"),
        API.get("/admin/stats"),
        API.get("/admin/tickets"),
        API.get("/admin/time-entries"),
        API.get("/admin/cloture-date").catch(() => ({ data: null }))
      ]);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setTickets(ticketsRes.data);
      setTimeEntries(teRes.data);
      
      if (clotureRes?.data?.cloture_date) {
        setClotureDate(clotureRes.data.cloture_date);
      }
      
      const uniqueClients = [];
      const seen = new Set();
      rulesRes.data.forEach(r => {
        if (r.client && !seen.has(r.client.id)) {
          seen.add(r.client.id);
          uniqueClients.push(r.client);
        }
      });
      setClients(uniqueClients);
    } catch (err) { console.error(err); }
  };

  const callAI = async (ep, setter) => {
    setAiLoading(true); setAiError("");
    try { setter(await (await fetch(`${AI_API}${ep}`)).json()); }
    catch { setAiError("⚠️ API IA non disponible — vérifiez que Flask tourne sur localhost:5001"); }
    setAiLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    setChatMessages(p => [...p, {role:"user", content:msg}]); setChatLoading(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch("http://localhost:5000/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body: JSON.stringify({messages:[...chatMessages.filter((_,i)=>i>0).map(m=>({role:m.role,content:m.content})),{role:"user",content:msg}]})
      });
      const d = await r.json();
      setChatMessages(p => [...p, {role:"assistant", content:d.reply||"Désolé, erreur."}]);
    } catch { setChatMessages(p => [...p, {role:"assistant", content:"⚠️ Erreur API."}]); }
    setChatLoading(false);
  };

  const handleFilterTimeEntries = () => {
    const params = {};
    if (filterClient) params.client_id = filterClient;
    if (filterUser) params.user_id = filterUser;
    if (filterType) params.ticket_type = filterType;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    API.get("/admin/time-entries", { params }).then(res => setTimeEntries(res.data)).catch(console.error);
  };
  const handleFilterTickets = () => {
    const params = {};
    if (filterType) params.ticket_type = filterType;
    if (filterUser) params.user_id = filterUser;
    API.get("/admin/tickets", { params }).then(res => setTickets(res.data)).catch(console.error);
  };
  const handleResetTimeEntries = () => {
    setFilterClient(""); setFilterUser(""); setFilterType(""); setFilterDateFrom(""); setFilterDateTo("");
    API.get("/admin/time-entries").then(res => setTimeEntries(res.data)).catch(console.error);
  };
  const handleResetTickets = () => {
    setFilterType(""); setFilterUser("");
    API.get("/admin/tickets").then(res => setTickets(res.data)).catch(console.error);
  };
  const showMsg = (text, type = "success") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 3000); };
  const handleUpdateRule = async (id, max_hours) => { await API.put(`/rules/${id}`, { max_hours: parseFloat(max_hours) }); showMsg("✅ Règle mise à jour !"); loadData(); };
  const handleCreateUserRule = async () => {
    if (!newRuleClientId || !newRuleUserId || !newRuleMaxHours) { showMsg("⚠️ Veuillez remplir tous les champs !", "error"); return; }
    try {
      await API.post("/rules", { client_id: parseInt(newRuleClientId), user_id: parseInt(newRuleUserId), max_hours: parseFloat(newRuleMaxHours) });
      showMsg("✅ Règle per_user créée !"); setNewRuleClientId(""); setNewRuleUserId(""); setNewRuleMaxHours(""); loadData();
    } catch (err) { showMsg("❌ Erreur : " + err.message, "error"); }
  };

  // Gestion de la date de clôture
  const handleUpdateClotureDate = async () => {
    if (!clotureDate) {
      showMsg("⚠️ Veuillez sélectionner une date de clôture !", "error");
      return;
    }
    try {
      await API.post("/admin/cloture-date", { cloture_date: clotureDate });
      showMsg(`✅ Date de clôture enregistrée : ${new Date(clotureDate).toLocaleDateString('fr-FR')}`);
    } catch (err) {
      showMsg("❌ Erreur : " + err.message, "error");
    }
  };

  const handleClearClotureDate = async () => {
    try {
      await API.delete("/admin/cloture-date");
      setClotureDate("");
      showMsg("✅ Date de clôture supprimée !");
    } catch (err) {
      showMsg("❌ Erreur : " + err.message, "error");
    }
  };

  // Smart Sync avec date de clôture
  const handleSmartSync = async () => {
    setSyncLoading(true);
    setSyncLogs([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/smart-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          cloture_date: clotureDate || null 
        })
      });
      const data = await res.json();
      setSyncLogs([
        `✅ Terminée !`,
        `📥 Insérés: ${data.inserted || 0}`,
        `☁️ SaaS: ${data.saasInserted || 0}`,
        `🖥️ OnPrem: ${data.onPremInserted || 0}`,
        `⏭️ Ignorés: ${data.skipped || 0}`,
        clotureDate ? `🔒 Date de clôture: ${new Date(clotureDate).toLocaleDateString('fr-FR')}` : '🔓 Pas de date de clôture'
      ]);
      API.get("/tickets").then(r => setTickets(r.data));
      API.get("/time-entries").then(r => setTimeEntries(r.data));
      API.get("/tickets/unsynced").then(r => setUnsyncedTickets(r.data));
    } catch (err) {
      setSyncLogs(["❌ Erreur: " + err.message]);
    }
    setSyncLoading(false);
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Supprimer cette règle ?")) return;
    try { await API.delete(`/rules/${id}`); showMsg("✅ Règle supprimée !"); loadData(); }
    catch (err) { showMsg("❌ Erreur suppression", "error"); }
  };
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("user"); window.location.reload(); };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const globalRules = rules.filter(r => r.rule_type === "global" || !r.user_id);
  const perUserRules = rules.filter(r => r.rule_type === "per_user" && r.user_id);
  
  const cfTimeEntries = selectedClient
    ? timeEntries.filter(e => (e.client_name || e.group_name) === selectedClient)
    : selectedMember
    ? timeEntries.filter(e => e.user_name === selectedMember)
    : timeEntries;
  const cfTickets = selectedClient
    ? tickets.filter(t => (t.client_name || t.group_name) === selectedClient)
    : selectedMember
    ? tickets.filter(t => t.assignee_name === selectedMember)
    : tickets;

  const hoursByUserData = stats?.byUser?.map(u => ({ name: u.full_name?.split(" ")[0] || u.username, heures: parseFloat(u.total_hours || 0) })) || [];
  const syncedCount = cfTimeEntries.filter(e => e.synced_to_chronos).length;
  const syncRate = cfTimeEntries.length > 0 ? ((syncedCount / cfTimeEntries.length) * 100).toFixed(0) : "0";

  const radarData = stats?.byUser?.slice(0, 6).map(u => ({ user: u.full_name?.split(" ")[0] || u.username || "?", saas: Math.min(parseFloat(u.saas_hours || 0), 50), onprem: parseFloat(u.onprem_hours || 0) })) || [];

  const byDate = cfTimeEntries.reduce((acc, e) => { const d = e.date ? e.date.toString().slice(0, 10) : "N/A"; if (d === "N/A" || d.startsWith("1970")) return acc; acc[d] = (acc[d] || 0) + parseFloat(e.hours_logged || 0); return acc; }, {});
  const areaData = Object.entries(byDate).sort().slice(-30).map(([date, heures]) => ({ date: date.slice(5), heures }));

  const bulletData = stats?.byClient?.filter(c => c.max_hours_per_week > 0 && c.ticket_type === "SAAS" && !MONITORING_TASKS.includes(c.name)).slice(0, 6).map(c => ({ label: c.name, value: parseFloat(c.total_hours || 0), target: parseFloat(c.max_hours_per_week) * 0.8, max: Math.max(parseFloat(c.total_hours || 0) * 1.1, parseFloat(c.max_hours_per_week)) })) || [];
  const memberBulletData = stats?.byUser?.slice(0, 6).map(u => ({ label: u.full_name?.split(" ")[0] || u.username, value: parseFloat(u.total_hours || 0), target: 32, max: Math.max(parseFloat(u.total_hours || 0) * 1.1, 40) })) || [];

  const predChartData = aiPredictions ? aiPredictions.predictions.slice(0,10).map(p=>({client:p.client,tickets:p.predicted_tickets,heures:p.predicted_hours})) : [];
  const anomalyChart = aiAnomalies ? Object.entries(aiAnomalies.anomalies.reduce((a,x)=>{a[x.client]=(a[x.client]||0)+1;return a;},{})).map(([client,anomalies])=>({client,anomalies})) : [];
  const forecastData = aiForecast ? (()=>{ const dates=aiForecast.forecast[0]?.predictions.map(p=>p.date)||[]; return dates.map((date,i)=>{ const o={date}; aiForecast.forecast.forEach(c=>{o[c.client]=c.predictions[i]?.tickets||0;}); return o; }); })() : [];

  return (
    <div style={styles.page}>
      <style>{FLIP_CSS}</style>
      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{ height: "45px" }} />
          <span style={styles.brand}>ADMIN PANEL</span>
          <span style={{ background: "#C8102E", color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" }}>🔐 Administrateur</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ color: "white", fontSize: "13px" }}>👤 {currentUser.full_name || "Admin"}</span>
          <button onClick={()=>setShowChatbot(!showChatbot)} style={{ background: showChatbot?"#28a745":"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.5)", padding:"8px 18px", borderRadius:"8px", cursor:"pointer", fontWeight:"bold" }}>🤖 Assistant IA</button>
          <button onClick={handleLogout} style={{ background: "#C8102E", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Déconnexion</button>
        </div>
      </nav>

      {/* CHATBOT */}
      {showChatbot && (
        <div style={{position:"fixed",bottom:"90px",right:"25px",width:"380px",borderRadius:"16px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",zIndex:9999,overflow:"hidden",border:"1px solid #e0e0e0"}}>
          <div style={{background:"linear-gradient(135deg,#1a1a2e,#0f3460)",padding:"14px 18px",display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{fontSize:"22px"}}>🤖</div>
            <div><div style={{color:"white",fontWeight:"bold",fontSize:"14px"}}>Assistant IA — Admin SOC</div><div style={{color:"rgba(255,255,255,0.7)",fontSize:"11px"}}>Powered by Groq AI (Llama 3.1)</div></div>
            <div style={{marginLeft:"auto",background:"#28a745",color:"white",padding:"3px 8px",borderRadius:"20px",fontSize:"10px"}}>● En ligne</div>
            <button onClick={()=>setShowChatbot(false)} style={{background:"rgba(255,255,255,0.15)",color:"white",border:"none",width:"26px",height:"26px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"6px"}}>✕</button>
          </div>
          <div style={{height:"300px",overflowY:"auto",padding:"14px",background:"#f8f9fa"}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:"10px"}}>
                {m.role==="assistant"&&<div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",marginRight:"6px",fontSize:"14px",flexShrink:0}}>🤖</div>}
                <div style={{maxWidth:"80%",padding:"9px 12px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"#C8102E":"white",color:m.role==="user"?"white":"#333",fontSize:"12px",lineHeight:"1.5",boxShadow:"0 2px 6px rgba(0,0,0,0.08)",whiteSpace:"pre-wrap"}}>{m.content}</div>
                {m.role==="user"&&<div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#C8102E",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"6px",fontSize:"14px",flexShrink:0}}>👤</div>}
              </div>
            ))}
            {chatLoading&&<div style={{color:"#666",fontSize:"12px",padding:"8px"}}>🤖 Réfléchit...</div>}
          </div>
          <div style={{padding:"6px 12px",background:"#f0f0f0",display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {["Clients dépassés ?","Anomalies récentes ?","Performance équipe"].map(q=>(
              <button key={q} onClick={()=>setChatInput(q)} style={{padding:"3px 8px",background:"white",border:"1px solid #C8102E",color:"#C8102E",borderRadius:"12px",fontSize:"10px",cursor:"pointer"}}>{q}</button>
            ))}
          </div>
          <div style={{padding:"10px 12px",background:"white",display:"flex",gap:"8px",borderTop:"1px solid #f0f0f0"}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyPress={e=>e.key==="Enter"&&sendChat()} placeholder="Posez une question admin..." style={{flex:1,padding:"8px 12px",border:"2px solid #e0e0e0",borderRadius:"20px",fontSize:"12px",outline:"none"}}/>
            <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{background:"#C8102E",color:"white",border:"none",borderRadius:"50%",width:"36px",height:"36px",cursor:"pointer",fontSize:"16px",flexShrink:0}}>➤</button>
          </div>
        </div>
      )}
      <button onClick={()=>setShowChatbot(!showChatbot)} style={{position:"fixed",bottom:"25px",right:"25px",width:"58px",height:"58px",borderRadius:"50%",background:showChatbot?"#28a745":"linear-gradient(135deg,#C8102E,#a00c26)",color:"white",border:"none",fontSize:"26px",cursor:"pointer",boxShadow:"0 6px 20px rgba(0,0,0,0.25)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s"}}>
        {showChatbot?"✕":"🤖"}
      </button>

      <div style={styles.container}>
        {msg && <div style={{ padding: "12px 20px", background: msgType === "error" ? "#fff0f0" : "#f0fff4", border: `1px solid ${msgType === "error" ? "#C8102E" : "#28a745"}`, borderRadius: "8px", color: msgType === "error" ? "#C8102E" : "#28a745", marginBottom: "20px", fontWeight: "bold" }}>{msg}</div>}

        {/* KPI CARDS - Filtrés */}
        {(() => {
          const totalTickets = cfTickets.length;
          const saasCount = cfTickets.filter(t => t.ticket_type === "SAAS").length;
          const onpremCount = cfTickets.filter(t => t.ticket_type === "ONPREM").length;
          const totalHours = cfTimeEntries.reduce((a,e) => a + parseFloat(e.hours_logged || 0), 0);
          const synced = cfTimeEntries.filter(e => e.synced_to_chronos).length;
          const syncRate = cfTimeEntries.length > 0 ? ((synced / cfTimeEntries.length) * 100).toFixed(0) : "0";
          const exceedingClients = stats?.exceedingClients?.filter(c => {
            if (selectedClient && c.name !== selectedClient) return false;
            if (selectedMember) return false;
            return true;
          }) || [];
          
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "25px" }}>
              {[
                { front: { icon: "🎫", label: "TOTAL TICKETS", value: totalTickets, bg: "linear-gradient(135deg,#C8102E,#a00c26)" }, back: { bg: "linear-gradient(135deg,#a00c26,#800a1e)", rows: [["☁️ SaaS", saasCount], ["🖥️ On-Prem", onpremCount], ["👥 Users", users.length]] } },
                { front: { icon: "🕐", label: "ENTRÉES DE TEMPS", value: cfTimeEntries.length, bg: "linear-gradient(135deg,#1a1a2e,#0d0d1a)" }, back: { bg: "linear-gradient(135deg,#0d0d1a,#050510)", rows: [["✅ Sync", synced], ["⏳ Non sync", cfTimeEntries.length - synced], ["📊 Total", `${totalHours.toFixed(1)}h`]] } },
                { front: { icon: "👥", label: "MEMBRES SOC", value: users.length, bg: "linear-gradient(135deg,#0f3460,#092540)" }, back: { bg: "linear-gradient(135deg,#092540,#061830)", rows: [["🔐 Admins", users.filter(u => u.role === "admin").length], ["👤 Users", users.filter(u => u.role !== "admin").length], ["⚙️ Règles", rules.length]] } },
                { front: { icon: "⏱️", label: "HEURES TOTALES", value: `${totalHours.toFixed(0)}h`, bg: "linear-gradient(135deg,#28a745,#1e7e34)" }, back: { bg: "linear-gradient(135deg,#1e7e34,#155724)", rows: [["☁️ SaaS", `${(saasCount * 0.25).toFixed(1)}h`], ["🖥️ On-Prem", `${(onpremCount * 0.25).toFixed(1)}h`], ["📊 Sync", `${syncRate}%`]] } },
                { front: { icon: "⚠️", label: "CLIENTS DÉPASSÉS", value: exceedingClients.length || 0, bg: "linear-gradient(135deg,#ff9800,#cc7a00)" }, back: { bg: "linear-gradient(135deg,#cc7a00,#995c00)", rows: exceedingClients.slice(0, 3).map(c => [`🔴 ${c.name}`, `${parseFloat(c.total_hours).toFixed(1)}h`]) || [["✅ Aucun", "dépassement"]] } },
              ].map((card, i) => (
                <div key={i} className="flip-card">
                  <div className="flip-card-inner">
                    <div className="flip-card-front" style={{ background: card.front.bg, color: "white" }}>
                      <div style={{ fontSize: "26px", marginBottom: "4px" }}>{card.front.icon}</div>
                      <div style={{ fontSize: "11px", opacity: 0.9 }}>{card.front.label}</div>
                      <div style={{ fontSize: "32px", fontWeight: "bold" }}>{card.front.value}</div>
                      {activeFilter && <div style={{fontSize:"9px",background:"rgba(255,255,255,0.2)",padding:"2px 8px",borderRadius:"10px",marginTop:"4px"}}>🎯 {activeFilter}</div>}
                      <div style={{ fontSize: "10px", opacity: 0.6 }}>Survoler →</div>
                    </div>
                    <div className="flip-card-back" style={{ background: card.back.bg, color: "white" }}>
                      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>📊 DÉTAIL</div>
                      {card.back.rows.map(([label, val], j) => <div key={j} style={{ fontSize: "12px" }}>{label} : <strong>{val}</strong></div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* TABS */}
        <div style={{ marginBottom: "0", borderBottom: "2px solid #e0e0e0", display: "flex", flexWrap: "wrap" }}>
          {["dashboard", "rules", "timeentries", "tickets", "users", "stats"].map(tab => (
            <button key={tab} style={styles.tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab === "dashboard" ? "📊 Dashboard" : tab === "rules" ? "⚙️ Règles" : tab === "timeentries" ? "🕐 Entrées de Temps" : tab === "tickets" ? "🎫 Tickets" : tab === "users" ? "👥 Users" : "📈 Stats"}
            </button>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: "0 12px 12px 12px", padding: "25px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div>
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: "12px", padding: "20px", marginBottom: "20px", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>Vue d'ensemble — Administration SOC VERMEG</div>
                <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "6px" }}>Supervision globale de l'équipe, des tickets, des performances et de l'IA</div>
              </div>

              <div style={{background:"#f0f7ff",border:"1px solid #7AAFD4",borderRadius:"8px",padding:"10px 16px",marginBottom:"16px",fontSize:"13px",color:"#0f3460"}}>
                💡 <strong>Cross-filtering actif</strong> — Clique sur un client ou un membre dans les graphiques pour filtrer tous les visuels.
              </div>
              <CrossFilterBanner selected={activeFilter} onClear={clearFilter} />

              {/* Filtres Date/Client pour le mini-dashboard */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", fontWeight: "bold" }}>👤 Client</div>
                  <select
                    value={filterDashClient}
                    onChange={e => setFilterDashClient(e.target.value)}
                    style={{ ...styles.filterSelect, marginRight: 0, minWidth: "150px" }}
                  >
                    <option value="">Tous les clients</option>
                    {[...new Set(tickets.filter(t => t.ticket_type === "SAAS" && !MONITORING_TASKS.includes(t.client_name)).map(t => t.client_name).filter(Boolean))].sort().map(c => 
                      <option key={c} value={c}>{c}</option>
                    )}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", fontWeight: "bold" }}>📅 Date début</div>
                  <input
                    type="date"
                    value={filterDashDateFrom}
                    onChange={e => setFilterDashDateFrom(e.target.value)}
                    style={{ ...styles.filterSelect, marginRight: 0 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", fontWeight: "bold" }}>📅 Date fin</div>
                  <input
                    type="date"
                    value={filterDashDateTo}
                    onChange={e => setFilterDashDateTo(e.target.value)}
                    style={{ ...styles.filterSelect, marginRight: 0 }}
                  />
                </div>
                <button
                  onClick={() => { setFilterDashClient(""); setFilterDashDateFrom(""); setFilterDashDateTo(""); }}
                  style={{ ...styles.btnModify, background: "#666", height: "38px" }}
                >
                  🔄 Réinitialiser
                </button>
              </div>

              {/* ===== SMART SYNC ===== */}
              <div style={{display:"flex", alignItems:"center", gap:"15px", marginBottom:"25px", padding:"15px", background:"linear-gradient(135deg,#f8f9fa,#e8edf2)", borderRadius:"12px", border:"1px solid #e0e0e0"}}>
                <button onClick={handleSmartSync} disabled={syncLoading} style={{...styles.btn(syncLoading?"#ccc":"#C8102E"), fontSize:"15px", padding:"12px 28px"}}>
                  {syncLoading ? "⏳ Synchronisation..." : "🧠 Smart Sync"}
                </button>
                <div style={{flex:1}}>
                  {syncLogs.length > 0 ? (
                    <div style={{display:"flex", flexWrap:"wrap", gap:"8px"}}>
                      {syncLogs.map((log,i) => (
                        <span key={i} style={{padding:"4px 12px", background:log.startsWith("❌")?"#fff0f0":"#f0fff4", border:`1px solid ${log.startsWith("❌")?"#C8102E":"#28a745"}`, borderRadius:"20px", fontSize:"13px", color:log.startsWith("❌")?"#C8102E":"#28a745", fontWeight:"bold"}}>
                          {log}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{color:"#999", fontSize:"13px"}}>Synchronise automatiquement les tickets Jira vers Chronos</span>
                  )}
                </div>
              </div>

              {/* Row 1: Répartition + Synchronisation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                
                {/* ===== RÉPARTITION GLOBALE DES TICKETS ===== */}
                <div>
                  {(() => {
                    let filteredTicketsForRepartition = tickets;
                    const targetClient = selectedClient || filterDashClient;
                    if (targetClient) {
                      filteredTicketsForRepartition = filteredTicketsForRepartition.filter(t => (t.client_name || t.group_name) === targetClient);
                    }
                    if (filterDashDateFrom) {
                      filteredTicketsForRepartition = filteredTicketsForRepartition.filter(t => t.outage_start && new Date(t.outage_start) >= new Date(filterDashDateFrom));
                    }
                    if (filterDashDateTo) {
                      filteredTicketsForRepartition = filteredTicketsForRepartition.filter(t => t.outage_start && new Date(t.outage_start) <= new Date(filterDashDateTo + "T23:59:59"));
                    }
                    if (selectedMember) {
                      filteredTicketsForRepartition = filteredTicketsForRepartition.filter(t => t.assignee_name === selectedMember);
                    }
                    
                    const saasCount = filteredTicketsForRepartition.filter(t => t.ticket_type === "SAAS").length;
                    const onpremCount = filteredTicketsForRepartition.filter(t => t.ticket_type === "ONPREM").length;
                    const ticketsByTypeData = [
                      { name: "SaaS", value: saasCount },
                      { name: "On-Prem", value: onpremCount }
                    ];
                    const displayName = targetClient || selectedMember || "";
                    const dateDisplay = (filterDashDateFrom || filterDashDateTo) ? ` 📅 ${filterDashDateFrom || "..."} → ${filterDashDateTo || "..."}` : "";
                    
                    return (
                      <>
                        <div style={styles.cardTitle}>
                          📊 Répartition Globale des Tickets
                          {displayName && <span style={{fontSize:"11px",color:"#C8102E",fontWeight:"normal",marginLeft:"6px"}}>— {displayName}</span>}
                          <span style={{fontSize:"10px",color:"#666",fontWeight:"normal",marginLeft:"4px"}}>{dateDisplay}</span>
                        </div>
                        {ticketsByTypeData.reduce((sum, d) => sum + d.value, 0) === 0 ? (
                          <div style={{textAlign:"center", padding:"40px", color:"#999"}}>
                            <div style={{fontSize:"36px"}}>🎫</div>
                            <div style={{fontSize:"14px",marginTop:"8px"}}>Aucun ticket pour ce filtre</div>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie data={ticketsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} labelLine={false} label={renderDonutLabel}
                                onClick={(d)=>handleSelectClient(d.name===selectedClient?null:d.name)} style={{cursor:"pointer"}}>
                                <Cell fill="#C8102E" opacity={selectedClient&&selectedClient!=="SaaS"?0.3:1}/>
                                <Cell fill="#0f3460" opacity={selectedClient&&selectedClient!=="On-Prem"?0.3:1}/>
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: "8px" }} formatter={(value, name) => [`${value} tickets`, name]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {/* ===== ÉTAT DE SYNCHRONISATION ===== */}
                <div>
                  <div style={styles.cardTitle}>✅ État de Synchronisation Chronos</div>
                  {(() => {
                    let filteredTicketsForSync = tickets;
                    const targetClient = selectedClient || filterDashClient;
                    if (targetClient) {
                      filteredTicketsForSync = filteredTicketsForSync.filter(t => (t.client_name || t.group_name) === targetClient);
                    }
                    if (filterDashDateFrom) {
                      filteredTicketsForSync = filteredTicketsForSync.filter(t => t.outage_start && new Date(t.outage_start) >= new Date(filterDashDateFrom));
                    }
                    if (filterDashDateTo) {
                      filteredTicketsForSync = filteredTicketsForSync.filter(t => t.outage_start && new Date(t.outage_start) <= new Date(filterDashDateTo + "T23:59:59"));
                    }
                    if (selectedMember) {
                      filteredTicketsForSync = filteredTicketsForSync.filter(t => t.assignee_name === selectedMember);
                    }
                    const total = filteredTicketsForSync.length;
                    const synced = filteredTicketsForSync.filter(t => t.synced_to_chronos).length;
                    const rate = total > 0 ? ((synced / total) * 100).toFixed(0) : "0";
                    
                    return (
                      <div style={{display:"flex",flexDirection:"column",gap:"12px",padding:"15px"}}>
                        <div style={{background:"linear-gradient(135deg,#28a745,#1e7e34)",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}>
                          <div style={{fontSize:"42px",fontWeight:"bold"}}>{rate}%</div>
                          <div style={{fontSize:"13px",opacity:0.9}}>Taux de synchronisation</div>
                          {(targetClient || selectedMember) && (
                            <div style={{fontSize:"11px",opacity:0.7,marginTop:"4px"}}>🎯 {targetClient || selectedMember}</div>
                          )}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                          <div style={{background:"#f0fff4",border:"2px solid #28a745",borderRadius:"10px",padding:"12px",textAlign:"center"}}>
                            <div style={{fontSize:"22px",fontWeight:"bold",color:"#28a745"}}>{synced}</div>
                            <div style={{fontSize:"11px",color:"#666"}}>✅ Synchronisés</div>
                          </div>
                          <div style={{background:"#fffbf0",border:"2px solid #ff9800",borderRadius:"10px",padding:"12px",textAlign:"center"}}>
                            <div style={{fontSize:"22px",fontWeight:"bold",color:"#ff9800"}}>{total - synced}</div>
                            <div style={{fontSize:"11px",color:"#666"}}>⏳ En attente</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Row 2: Charge de Travail + Spider */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                
                {/* ===== CHARGE DE TRAVAIL PAR MEMBRE ===== */}
                <div>
                  {(() => {
                    let filteredTEForMembers = timeEntries;
                    const targetClient = selectedClient || filterDashClient;
                    if (targetClient) {
                      filteredTEForMembers = filteredTEForMembers.filter(e => (e.client_name || e.group_name) === targetClient);
                    }
                    if (filterDashDateFrom) {
                      filteredTEForMembers = filteredTEForMembers.filter(e => e.date && new Date(e.date) >= new Date(filterDashDateFrom));
                    }
                    if (filterDashDateTo) {
                      filteredTEForMembers = filteredTEForMembers.filter(e => e.date && new Date(e.date) <= new Date(filterDashDateTo + "T23:59:59"));
                    }
                    
                    const hoursByMember = filteredTEForMembers.reduce((acc, e) => {
                      const memberName = e.user_name;
                      if (!memberName) return acc;
                      if (!acc[memberName]) acc[memberName] = 0;
                      acc[memberName] += parseFloat(e.hours_logged || 0);
                      return acc;
                    }, {});
                    
                    let memberData = Object.entries(hoursByMember).map(([name, heures]) => ({
                      name: name.split(" ")[0] || name,
                      heures: parseFloat(heures)
                    }));
                    
                    if (selectedMember) {
                      memberData = memberData.filter(d => d.name === selectedMember);
                    }
                    
                    memberData = memberData.sort((a,b) => b.heures - a.heures);
                    const displayName = selectedClient || filterDashClient || "";
                    const dateDisplay = (filterDashDateFrom || filterDashDateTo) ? ` 📅 ${filterDashDateFrom || "..."} → ${filterDashDateTo || "..."}` : "";
                    
                    return (
                      <>
                        <div style={styles.cardTitle}>
                          👥 Charge de Travail par Membre SOC 
                          <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span>
                          {displayName && <span style={{fontSize:"11px",color:"#C8102E",fontWeight:"normal",marginLeft:"6px"}}>— {displayName}</span>}
                          <span style={{fontSize:"10px",color:"#666",fontWeight:"normal",marginLeft:"4px"}}>{dateDisplay}</span>
                        </div>
                        {memberData.length === 0 ? (
                          <div style={{textAlign:"center", padding:"40px", color:"#999"}}>
                            <div style={{fontSize:"36px"}}>👤</div>
                            <div style={{fontSize:"14px",marginTop:"8px"}}>Aucun membre actif pour ce filtre</div>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={memberData} layout="vertical"
                              onClick={d=>{const n=d?.activePayload?.[0]?.payload?.name;if(n) handleSelectMember(n);}}
                              style={{cursor:"pointer"}}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                              <XAxis type="number" stroke="#666" fontSize={11}/>
                              <YAxis dataKey="name" type="category" stroke="#666" width={70} fontSize={11}/>
                              <Tooltip contentStyle={{ borderRadius: "8px" }}/>
                              <Bar dataKey="heures" name="Heures" radius={[0,6,6,0]}>
                                {memberData.map(({name},i)=>(
                                  <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={selectedMember&&selectedMember!==name?0.2:1} style={{cursor:"pointer"}}/>
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {/* ===== RADAR CHART ===== */}
                <div>
                  {(() => {
                    let filteredRadarData = radarData;
                    const targetClient = selectedClient || filterDashClient;
                    if (targetClient) {
                      const memberNames = timeEntries
                        .filter(e => (e.client_name || e.group_name) === targetClient)
                        .map(e => e.user_name)
                        .filter(Boolean);
                      if (memberNames.length > 0) {
                        const uniqueMemberNames = [...new Set(memberNames)];
                        filteredRadarData = radarData.filter(d => uniqueMemberNames.includes(d.user));
                      } else {
                        filteredRadarData = [];
                      }
                    }
                    if (selectedMember) {
                      filteredRadarData = radarData.filter(d => d.user === selectedMember);
                    }
                    const displayName = selectedClient || filterDashClient || "";
                    const memberDisplay = selectedMember ? ` — ${selectedMember}` : "";
                    const dateDisplay = (filterDashDateFrom || filterDashDateTo) ? ` 📅 ${filterDashDateFrom || "..."} → ${filterDashDateTo || "..."}` : "";
                    
                    return (
                      <>
                        <div style={styles.cardTitle}>
                          🕸️ Analyse Multi-Dimensionnelle de l'Équipe
                          {displayName && <span style={{fontSize:"11px",color:"#C8102E",fontWeight:"normal",marginLeft:"6px"}}>— {displayName}</span>}
                          {memberDisplay && <span style={{fontSize:"11px",color:"#C8102E",fontWeight:"normal",marginLeft:"6px"}}>{memberDisplay}</span>}
                          <span style={{fontSize:"10px",color:"#666",fontWeight:"normal",marginLeft:"4px"}}>{dateDisplay}</span>
                        </div>
                        {filteredRadarData.length === 0 ? (
                          <div style={{textAlign:"center", padding:"40px", color:"#999"}}>
                            <div style={{fontSize:"36px"}}>🕸️</div>
                            <div style={{fontSize:"14px",marginTop:"8px"}}>Aucune donnée pour ce filtre</div>
                          </div>
                        ) : filteredRadarData.length === 1 ? (
                          <div style={{textAlign:"center", padding:"30px", color:"#666", background:"#f8f9fa", borderRadius:"10px"}}>
                            <div style={{fontSize:"24px"}}>👤</div>
                            <div style={{fontSize:"14px",fontWeight:"bold",marginTop:"8px"}}>{filteredRadarData[0].user}</div>
                            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"15px", marginTop:"15px"}}>
                              <div style={{background:"#C8102E", borderRadius:"10px", padding:"15px", color:"white"}}>
                                <div style={{fontSize:"11px",opacity:0.8}}>SaaS (h)</div>
                                <div style={{fontSize:"24px",fontWeight:"bold"}}>{filteredRadarData[0].saas.toFixed(1)}</div>
                              </div>
                              <div style={{background:"#0f3460", borderRadius:"10px", padding:"15px", color:"white"}}>
                                <div style={{fontSize:"11px",opacity:0.8}}>On-Prem (h)</div>
                                <div style={{fontSize:"24px",fontWeight:"bold"}}>{filteredRadarData[0].onprem.toFixed(1)}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={280}>
                            <RadarChart cx="50%" cy="50%" outerRadius={90} data={filteredRadarData}>
                              <PolarGrid stroke="#e0e0e0"/>
                              <PolarAngleAxis 
                                dataKey="user" 
                                tick={{ fontSize: 11, fontWeight: "bold", fill: "#1a1a2e" }}
                                onClick={(data) => {
                                  if (data && data.value) {
                                    handleSelectMember(data.value === selectedMember ? null : data.value);
                                  }
                                }}
                                style={{cursor:"pointer"}}
                              />
                              <PolarRadiusAxis angle={90} tick={{ fontSize: 9 }} domain={[0, 'auto']}/>
                              <Radar name="SaaS (h)" dataKey="saas" stroke="#C8102E" fill="#C8102E" fillOpacity={0.3} strokeWidth={2}/>
                              <Radar name="On-Prem (h)" dataKey="onprem" stroke="#0f3460" fill="#0f3460" fillOpacity={0.2} strokeWidth={2}/>
                              <Legend />
                              <Tooltip contentStyle={{ borderRadius: "8px" }} formatter={(value) => [`${parseFloat(value).toFixed(1)}h`, '']} />
                            </RadarChart>
                          </ResponsiveContainer>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Consommation Horaire vs Limite */}
              {(() => {
                let filteredTimeEntries = timeEntries;
                if (selectedClient) {
                  filteredTimeEntries = filteredTimeEntries.filter(e => (e.client_name || e.group_name) === selectedClient);
                } else if (filterDashClient) {
                  filteredTimeEntries = filteredTimeEntries.filter(e => (e.client_name || e.group_name) === filterDashClient);
                }
                if (filterDashDateFrom) {
                  filteredTimeEntries = filteredTimeEntries.filter(e => e.date && new Date(e.date) >= new Date(filterDashDateFrom));
                }
                if (filterDashDateTo) {
                  filteredTimeEntries = filteredTimeEntries.filter(e => e.date && new Date(e.date) <= new Date(filterDashDateTo + "T23:59:59"));
                }
                if (selectedMember) {
                  filteredTimeEntries = filteredTimeEntries.filter(e => e.user_name === selectedMember);
                }
                
                const hoursByClientFiltered = filteredTimeEntries.reduce((acc, e) => {
                  const clientName = e.client_name || e.group_name;
                  if (!clientName) return acc;
                  if (MONITORING_TASKS.includes(clientName)) return acc;
                  if (!acc[clientName]) acc[clientName] = 0;
                  acc[clientName] += parseFloat(e.hours_logged || 0);
                  return acc;
                }, {});
                
                let clientData = stats?.byClient?.filter(c => c.ticket_type === "SAAS" && c.max_hours_per_week > 0 && !MONITORING_TASKS.includes(c.name))
                  .map(c => ({ 
                    name: c.name, 
                    heures: hoursByClientFiltered[c.name] || 0,
                    max: parseFloat(c.max_hours_per_week || 0),
                    isSelected: selectedClient === c.name || filterDashClient === c.name,
                    isDimmed: (selectedClient || filterDashClient) && (selectedClient !== c.name && filterDashClient !== c.name)
                  })) || [];
                
                const targetClient = selectedClient || filterDashClient;
                const filteredData = targetClient ? clientData.filter(d => d.name === targetClient) : clientData;
                const displayData = filteredData.slice(0, 8);
                
                return (
                  <>
                    <div style={styles.cardTitle}>
                      🎯 Consommation Horaire vs Limite par Client SaaS 
                      <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span>
                      {targetClient && <span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {targetClient}</span>}
                      {(filterDashDateFrom || filterDashDateTo) && (
                        <span style={{fontSize:"11px",color:"#0f3460",fontWeight:"normal",marginLeft:"8px"}}>
                          📅 {filterDashDateFrom || "..."} → {filterDashDateTo || "..."}
                        </span>
                      )}
                    </div>
                    {displayData.length === 0 ? (
                      <div style={{textAlign:"center", padding:"40px", color:"#999"}}>
                        <div style={{fontSize:"36px"}}>🔍</div>
                        <div style={{fontSize:"14px",marginTop:"8px"}}>Aucune donnée pour ce filtre</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={displayData} onClick={d=>{const n=d?.activePayload?.[0]?.payload?.name;if(n) handleSelectClient(n===selectedClient?null:n);}} style={{cursor:"pointer"}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                          <XAxis dataKey="name" stroke="#666" fontSize={11}/>
                          <YAxis stroke="#666"/>
                          <Tooltip contentStyle={{ borderRadius: "8px" }}/>
                          <Legend/>
                          <Bar dataKey="heures" fill="#C8102E" radius={[6,6,0,0]} name="Heures utilisées">
                            {displayData.map((d,i)=>(
                              <Cell key={i} fill="#C8102E" opacity={d.isDimmed?0.2:1} style={{cursor:"pointer"}}/>
                            ))}
                          </Bar>
                          <Bar dataKey="max" fill="#0f3460" radius={[6,6,0,0]} name="Max autorisé">
                            {displayData.map((d,i)=>(
                              <Cell key={i} fill="#0f3460" opacity={d.isDimmed?0.2:1} style={{cursor:"pointer"}}/>
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </>
                );
              })()}

              {/* Heatmap + Top 5 Membres */}
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "20px", marginTop: "25px" }}>
                
                {/* ===== HEATMAP ===== */}
                <div style={styles.card}>
                  {(() => {
                    let filteredHeatmapEntries = timeEntries;
                    const targetClient = selectedClient || filterDashClient;
                    if (targetClient) {
                      filteredHeatmapEntries = filteredHeatmapEntries.filter(e => (e.client_name || e.group_name) === targetClient);
                    }
                    if (filterDashDateFrom) {
                      filteredHeatmapEntries = filteredHeatmapEntries.filter(e => e.date && new Date(e.date) >= new Date(filterDashDateFrom));
                    }
                    if (filterDashDateTo) {
                      filteredHeatmapEntries = filteredHeatmapEntries.filter(e => e.date && new Date(e.date) <= new Date(filterDashDateTo + "T23:59:59"));
                    }
                    if (selectedMember) {
                      filteredHeatmapEntries = filteredHeatmapEntries.filter(e => e.user_name === selectedMember);
                    }
                    const displayName = selectedClient || filterDashClient || selectedMember || "Toute l'Équipe";
                    const dateDisplay = (filterDashDateFrom || filterDashDateTo) ? ` 📅 ${filterDashDateFrom || "..."} → ${filterDashDateTo || "..."}` : "";
                    
                    return (
                      <>
                        <div style={styles.cardTitle}>
                          🌡️ Distribution Horaire de l'Activité — {displayName}
                          <span style={{fontSize:"11px",color:"#666",fontWeight:"normal",marginLeft:"8px"}}>{dateDisplay}</span>
                        </div>
                        <ActivityHeatmap timeEntries={filteredHeatmapEntries} selectedClient={targetClient} onSelectClient={handleSelectClient} />
                      </>
                    );
                  })()}
                </div>
                
                {/* ===== TOP 5 MEMBRES ===== */}
                <div style={styles.card}>
                  {(() => {
                    let filteredUserData = hoursByUserData;
                    const targetClient = selectedClient || filterDashClient;
                    if (targetClient) {
                      const memberNames = timeEntries
                        .filter(e => (e.client_name || e.group_name) === targetClient)
                        .map(e => e.user_name)
                        .filter(Boolean);
                      filteredUserData = hoursByUserData.filter(u => memberNames.includes(u.name));
                    }
                    if (selectedMember) {
                      filteredUserData = hoursByUserData.filter(u => u.name === selectedMember);
                    }
                    const topData = [...filteredUserData].sort((a,b)=>b.heures-a.heures).slice(0, 5);
                    const displayName = selectedClient || filterDashClient || "";
                    const dateDisplay = (filterDashDateFrom || filterDashDateTo) ? ` 📅 ${filterDashDateFrom || "..."} → ${filterDashDateTo || "..."}` : "";
                    
                    return (
                      <>
                        <div style={styles.cardTitle}>
                          🏆 Membres les Plus Actifs — Top 5 
                          <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span>
                          {displayName && <span style={{fontSize:"11px",color:"#C8102E",fontWeight:"normal",marginLeft:"6px"}}>— {displayName}</span>}
                          <span style={{fontSize:"10px",color:"#666",fontWeight:"normal",marginLeft:"4px"}}>{dateDisplay}</span>
                        </div>
                        {topData.length === 0 ? (
                          <div style={{textAlign:"center", padding:"40px", color:"#999"}}>
                            <div style={{fontSize:"36px"}}>👤</div>
                            <div style={{fontSize:"14px",marginTop:"8px"}}>Aucun membre actif pour ce filtre</div>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topData} layout="vertical" margin={{right:50}}
                              onClick={d=>{const n=d?.activePayload?.[0]?.payload?.name;if(n) handleSelectMember(n);}}
                              style={{cursor:"pointer"}}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                              <XAxis type="number" stroke="#666" fontSize={11}/>
                              <YAxis dataKey="name" type="category" stroke="#666" width={70} fontSize={11}/>
                              <Tooltip contentStyle={{ borderRadius: "8px" }}/>
                              <Bar dataKey="heures" name="Heures" radius={[0,6,6,0]}>
                                {topData.map(({name},i)=>(
                                  <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={selectedMember&&selectedMember!==name?0.2:1} style={{cursor:"pointer"}}/>
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>


{/* ===== SYNCHRONISATION PAR UTILISATEUR ET CLIENT ===== */}
{(() => {
  // Filtrer les tickets selon les filtres de date uniquement
  let filteredTicketsForUserSync = tickets;
  
  if (filterSyncDateFrom) {
    filteredTicketsForUserSync = filteredTicketsForUserSync.filter(t => t.outage_start && new Date(t.outage_start) >= new Date(filterSyncDateFrom));
  }
  if (filterSyncDateTo) {
    filteredTicketsForUserSync = filteredTicketsForUserSync.filter(t => t.outage_start && new Date(t.outage_start) <= new Date(filterSyncDateTo + "T23:59:59"));
  }
  
  // Agrégation : pour chaque utilisateur, pour chaque client, compter les tickets synchronisés
  const userClientSyncData = {};
  
  filteredTicketsForUserSync.forEach(t => {
    const clientName = t.client_name || t.group_name || "Inconnu";
    const assignee = t.assignee_name || "Non assigné";
    const isSynced = t.synced_to_chronos || false;
    
    if (!userClientSyncData[assignee]) {
      userClientSyncData[assignee] = {};
    }
    if (!userClientSyncData[assignee][clientName]) {
      userClientSyncData[assignee][clientName] = {
        total: 0,
        synced: 0,
        unsynced: 0
      };
    }
    
    userClientSyncData[assignee][clientName].total += 1;
    if (isSynced) {
      userClientSyncData[assignee][clientName].synced += 1;
    } else {
      userClientSyncData[assignee][clientName].unsynced += 1;
    }
  });
  
  // Transformer en tableau pour le graphique
  const chartData = [];
  Object.keys(userClientSyncData).forEach(userName => {
    const clients = userClientSyncData[userName];
    Object.keys(clients).forEach(clientName => {
      const data = clients[clientName];
      chartData.push({
        user: userName,
        client: clientName,
        total: data.total,
        synced: data.synced,
        unsynced: data.unsynced
      });
    });
  });
  
  // Trier par utilisateur puis par client
  chartData.sort((a, b) => {
    if (a.user !== b.user) return a.user.localeCompare(b.user);
    return a.client.localeCompare(b.client);
  });
  
  // Limiter à 20 lignes pour lisibilité
  const limitedData = chartData.slice(0, 20);
  
  // Couleurs pour les utilisateurs
  const userColors = {};
  const colorPalette = ["#C8102E", "#0f3460", "#28a745", "#ff9800", "#e94560", "#16213e", "#6c757d", "#17a2b8", "#6610f2", "#fd7e14"];
  let colorIndex = 0;
  
  const getUserColor = (user) => {
    if (!userColors[user]) {
      userColors[user] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    }
    return userColors[user];
  };
  
  const resetSyncFilters = () => {
    setFilterSyncDateFrom("");
    setFilterSyncDateTo("");
  };
  
  const hasActiveSyncFilters = filterSyncDateFrom || filterSyncDateTo;
  
  // Compter les totaux par utilisateur
  const userTotals = {};
  chartData.forEach(item => {
    if (!userTotals[item.user]) {
      userTotals[item.user] = { total: 0, synced: 0, unsynced: 0 };
    }
    userTotals[item.user].total += item.total;
    userTotals[item.user].synced += item.synced;
    userTotals[item.user].unsynced += item.unsynced;
  });
  
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        👥 Synchronisation par Utilisateur et Client
        <span style={{fontSize:"11px",color:"#999",fontWeight:"normal",marginLeft:"8px"}}>
          (tickets synchronisés par assignee)
        </span>
      </div>
      
      {/* ===== FILTRES DÉDIÉS (Date uniquement) ===== */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        flexWrap: "wrap", 
        alignItems: "flex-end", 
        marginBottom: "20px", 
        padding: "15px", 
        background: "#f8f9fa", 
        borderRadius: "10px" 
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", fontWeight: "bold" }}>📅 Date début</div>
          <input
            type="date"
            value={filterSyncDateFrom}
            onChange={e => setFilterSyncDateFrom(e.target.value)}
            style={{ ...styles.filterSelect, marginRight: 0 }}
          />
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", fontWeight: "bold" }}>📅 Date fin</div>
          <input
            type="date"
            value={filterSyncDateTo}
            onChange={e => setFilterSyncDateTo(e.target.value)}
            style={{ ...styles.filterSelect, marginRight: 0 }}
          />
        </div>
        <button
          onClick={resetSyncFilters}
          style={{ ...styles.btnModify, background: "#666", height: "38px" }}
        >
          🔄 Réinitialiser
        </button>
        {hasActiveSyncFilters && (
          <span style={{ fontSize: "11px", color: "#C8102E", fontWeight: "bold", marginLeft: "4px" }}>
            🎯 Filtres actifs
          </span>
        )}
      </div>
      
      {limitedData.length === 0 ? (
        <div style={{textAlign:"center", padding:"40px", color:"#999"}}>
          <div style={{fontSize:"36px"}}>👤</div>
          <div style={{fontSize:"14px",marginTop:"8px"}}>Aucune donnée de synchronisation pour ce filtre</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Utilisateur</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th} style={{textAlign:"center"}}>Total</th>
                  <th style={styles.th} style={{textAlign:"center"}}>✅ Synchro</th>
                  <th style={styles.th} style={{textAlign:"center"}}>⏳ En attente</th>
                </tr>
              </thead>
              <tbody>
                {limitedData.map((item, index) => {
                  const barColor = getUserColor(item.user);
                  const isFirstRow = index === 0 || limitedData[index - 1].user !== item.user;
                  const userTotal = userTotals[item.user];
                  const isLastRow = index === limitedData.length - 1 || limitedData[index + 1].user !== item.user;
                  
                  return (
                    <tr 
                      key={`${item.user}-${item.client}-${index}`} 
                      style={{ 
                        background: index % 2 === 0 ? "white" : "#fafafa",
                        borderBottom: isLastRow ? "3px solid #1a1a2e" : "1px solid #f0f0f0"
                      }}
                    >
                      {isFirstRow ? (
                        <td style={{...styles.td, fontWeight: "bold", borderRight: "2px solid #e0e0e0"}}>
                          <span style={styles.badge(barColor)}>👤 {item.user}</span>
                          <div style={{fontSize:"10px", color:"#666", marginTop:"2px"}}>
                            Total: {userTotal.total} | ✅ {userTotal.synced} | ⏳ {userTotal.unsynced}
                          </div>
                        </td>
                      ) : (
                        <td style={{...styles.td, borderRight: "2px solid #e0e0e0"}}></td>
                      )}
                      <td style={styles.td}>
                        <span style={styles.badge("#1a1a2e")}>{item.client}</span>
                      </td>
                      <td style={{...styles.td, textAlign:"center", fontWeight:"bold"}}>
                        {item.total}
                      </td>
                      <td style={{...styles.td, textAlign:"center", color:"#28a745", fontWeight:"bold"}}>
                        {item.synced}
                      </td>
                      <td style={{...styles.td, textAlign:"center", color:"#ff9800", fontWeight:"bold"}}>
                        {item.unsynced}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Statistiques récapitulatives */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "12px", 
            marginTop: "15px",
            padding: "15px",
            background: "#f8f9fa",
            borderRadius: "8px"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Total Tickets</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1a1a2e" }}>
                {limitedData.reduce((sum, d) => sum + d.total, 0)}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>✅ Synchronisés</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#28a745" }}>
                {limitedData.reduce((sum, d) => sum + d.synced, 0)}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>⏳ En attente</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ff9800" }}>
                {limitedData.reduce((sum, d) => sum + d.unsynced, 0)}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* ===== RÉCAPITULATIF DE COMPARAISON ENTRE UTILISATEURS ===== */}
<div style={{ 
  marginTop: "25px", 
  padding: "20px", 
  background: "linear-gradient(135deg, #f8f9fa, #e8edf2)", 
  borderRadius: "10px",
  border: "1px solid #e0e0e0"
}}>
  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    gap: "10px", 
    marginBottom: "15px" 
  }}>
    <span style={{ fontSize: "20px" }}>📊</span>
    <span style={{ fontWeight: "bold", fontSize: "15px", color: "#1a1a2e" }}>
      Comparaison entre Utilisateurs
    </span>
    {(filterSyncDateFrom || filterSyncDateTo) && (
      <span style={{ fontSize: "11px", color: "#666", fontWeight: "normal" }}>
        (période filtrée)
      </span>
    )}
  </div>
  
  {Object.keys(userTotals).length === 0 ? (
    <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
      Aucune donnée disponible
    </div>
  ) : (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
      gap: "15px" 
    }}>
      {Object.keys(userTotals).map((user, index) => {
        const data = userTotals[user];
        const color = getUserColor(user);
        const percent = data.total > 0 ? Math.round((data.synced / data.total) * 100) : 0;
        const barColor = percent >= 80 ? "#28a745" : percent >= 50 ? "#ff9800" : "#C8102E";
        
        // Récupérer les clients de cet utilisateur
        const userClients = chartData
          .filter(item => item.user === user)
          .sort((a, b) => b.total - a.total);
        
        return (
          <div 
            key={user} 
            style={{ 
              background: "white", 
              borderRadius: "10px", 
              padding: "15px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderLeft: `4px solid ${color}`
            }}
          >
            {/* En-tête utilisateur */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              marginBottom: "10px",
              paddingBottom: "8px",
              borderBottom: "2px solid #f0f0f0"
            }}>
              <span style={styles.badge(color)}>👤</span>
              <span style={{ fontWeight: "bold", fontSize: "14px", color: "#1a1a2e" }}>
                {user}
              </span>
              <span style={{ 
                marginLeft: "auto", 
                fontSize: "11px", 
                color: "#666",
                background: "#f8f9fa",
                padding: "2px 10px",
                borderRadius: "12px"
              }}>
                Total: {data.total}
              </span>
            </div>
            
            {/* Résumé rapide */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "6px", 
              marginBottom: "10px" 
            }}>
              <div style={{ 
                textAlign: "center", 
                background: "#f0fff4", 
                borderRadius: "6px", 
                padding: "6px" 
              }}>
                <div style={{ fontSize: "10px", color: "#666" }}>✅ Synchro</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#28a745" }}>
                  {data.synced}
                </div>
              </div>
              <div style={{ 
                textAlign: "center", 
                background: "#fffbf0", 
                borderRadius: "6px", 
                padding: "6px" 
              }}>
                <div style={{ fontSize: "10px", color: "#666" }}>⏳ En attente</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ff9800" }}>
                  {data.unsynced}
                </div>
              </div>
            </div>
            
            {/* Barre de progression */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <div style={{ 
                flex: 1, 
                height: "8px", 
                background: "#e0e0e0", 
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{ 
                  width: `${percent}%`, 
                  height: "100%", 
                  background: barColor, 
                  borderRadius: "4px",
                  transition: "width 0.5s ease"
                }} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: barColor, minWidth: "40px" }}>
                {percent}%
              </span>
            </div>
            
            {/* Détail par client */}
            <div style={{ 
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid #f0f0f0"
            }}>
              <div style={{ 
                fontSize: "10px", 
                color: "#999", 
                fontWeight: "bold",
                marginBottom: "4px"
              }}>
                📋 Détail par client :
              </div>
              {userClients.map((client, idx) => {
                const clientPercent = client.total > 0 ? Math.round((client.synced / client.total) * 100) : 0;
                const clientColor = clientPercent >= 80 ? "#28a745" : clientPercent >= 50 ? "#ff9800" : "#C8102E";
                
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px",
                      padding: "3px 0",
                      fontSize: "11px",
                      borderBottom: idx < userClients.length - 1 ? "1px solid #f5f5f5" : "none"
                    }}
                  >
                    <span style={{ 
                      fontWeight: "bold", 
                      color: "#1a1a2e",
                      minWidth: "80px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {client.client}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "10px", color: "#666" }}>
                      {client.total} tickets
                    </span>
                    <span style={{ color: "#28a745", fontSize: "10px", fontWeight: "bold" }}>
                      ✅ {client.synced}
                    </span>
                    <span style={{ color: "#ff9800", fontSize: "10px", fontWeight: "bold" }}>
                      ⏳ {client.unsynced}
                    </span>
                    <span style={{ 
                      fontSize: "10px", 
                      fontWeight: "bold", 
                      color: clientColor,
                      minWidth: "35px",
                      textAlign: "right"
                    }}>
                      {clientPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
      
    </div>
  );
})()}


              {/* Mini Dashboard Filtrable */}
              {(() => {
                const filteredTickets = tickets.filter(t => {
                  if (t.ticket_type !== "SAAS") return false;
                  if (MONITORING_TASKS.includes(t.client_name)) return false;
                  if (filterDashClient && t.client_name !== filterDashClient) return false;
                  if (filterDashDateFrom && t.outage_start && new Date(t.outage_start) < new Date(filterDashDateFrom)) return false;
                  if (filterDashDateTo && t.outage_start && new Date(t.outage_start) > new Date(filterDashDateTo + "T23:59:59")) return false;
                  return true;
                });

                const byClientFiltered = filteredTickets.reduce((acc, t) => {
                  const c = t.client_name || "—";
                  if (!acc[c]) acc[c] = { client: c, tickets: 0, heures: 0 };
                  acc[c].tickets += 1;
                  acc[c].heures += 0.25;
                  return acc;
                }, {});
                const chartData = Object.values(byClientFiltered).sort((a, b) => b.tickets - a.tickets);

                const totalTickets = filteredTickets.length;
                const totalHeures = (totalTickets * 0.25).toFixed(1);
                const clientsUniques = chartData.length;
                const topClient = chartData[0]?.client || "—";

                const clientsList = [...new Set(
                  tickets.filter(t => t.ticket_type === "SAAS" && !MONITORING_TASKS.includes(t.client_name))
                         .map(t => t.client_name).filter(Boolean)
                )].sort();

                return (
                  <div style={{ ...styles.card, marginTop: "20px" }}>
                    <div style={styles.cardTitle}>📊 Analyse Tickets SaaS par Client & Période</div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                      {[
                        { icon: "🎫", label: "Tickets", value: totalTickets, color: "#C8102E" },
                        { icon: "⏱️", label: "Heures Jira", value: `${totalHeures}h`, color: "#0f3460" },
                        { icon: "🏢", label: "Clients", value: clientsUniques, color: "#28a745" },
                        { icon: "🏆", label: "Top Client", value: topClient, color: "#ff9800" },
                      ].map((k, i) => (
                        <div key={i} style={{ background: k.color, borderRadius: "10px", padding: "14px", textAlign: "center", color: "white" }}>
                          <div style={{ fontSize: "20px" }}>{k.icon}</div>
                          <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "4px" }}>{k.label}</div>
                          <div style={{ fontSize: "22px", fontWeight: "bold", marginTop: "4px" }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {chartData.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                        <div style={{ fontSize: "36px" }}>🔍</div>
                        <div style={{ fontSize: "14px", marginTop: "8px" }}>Aucun ticket trouvé pour ces critères</div>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 35, 200)}>
                          <BarChart data={chartData} layout="vertical"
                            onClick={d=>{const c=d?.activePayload?.[0]?.payload?.client;if(c) handleSelectClient(c===selectedClient?null:c);}}
                            style={{cursor:"pointer"}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                            <XAxis type="number" stroke="#666" fontSize={11}/>
                            <YAxis dataKey="client" type="category" stroke="#666" width={90} fontSize={12}/>
                            <Tooltip contentStyle={{ borderRadius: "8px" }} formatter={(v, n) => [n === "tickets" ? `${v} tickets` : `${v}h`, n === "tickets" ? "Tickets" : "Heures Jira"]}/>
                            <Legend/>
                            <Bar dataKey="tickets" fill="#C8102E" radius={[0,6,6,0]} name="Tickets">
                              {chartData.map(({client}, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={selectedClient && selectedClient !== client ? 0.2 : 1} style={{cursor:"pointer"}}/>
                              ))}
                            </Bar>
                            <Bar dataKey="heures" fill="#0f3460" radius={[0,6,6,0]} name="Heures Jira">
                              {chartData.map(({client}, i) => (
                                <Cell key={i} fill="#0f3460" opacity={selectedClient && selectedClient !== client ? 0.2 : 1} style={{cursor:"pointer"}}/>
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>

                        {filterDashClient && (
                          <div style={{ marginTop: "20px" }}>
                            <div style={{ fontWeight: "bold", color: "#1a1a2e", fontSize: "14px", marginBottom: "10px" }}>
                              📋 Détail tickets — {filterDashClient}
                            </div>
                            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                              <table style={styles.table}>
                                <thead>
                                  <tr>
                                    <th style={styles.th}>Jira Key</th>
                                    <th style={styles.th}>Résumé</th>
                                    <th style={styles.th}>Assignee</th>
                                    <th style={styles.th}>Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredTickets.map((t, i) => (
                                    <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                                      <td style={styles.td}><span style={styles.badge("#C8102E")}>{t.jira_key}</span></td>
                                      <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 50)}...</td>
                                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.assignee_name || "—"}</span></td>
                                      <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Bullet Charts */}
              {(() => {
                let filteredBulletData = bulletData;
                const targetClient = selectedClient || filterDashClient;
                if (targetClient) {
                  filteredBulletData = bulletData.filter(d => d.label === targetClient);
                }
                if (selectedMember) {
                  const memberClients = timeEntries
                    .filter(e => e.user_name === selectedMember)
                    .map(e => e.client_name)
                    .filter(Boolean);
                  filteredBulletData = bulletData.filter(d => memberClients.includes(d.label));
                }
                if (filterDashDateFrom || filterDashDateTo) {
                  let filteredTE = timeEntries;
                  if (filterDashDateFrom) {
                    filteredTE = filteredTE.filter(e => e.date && new Date(e.date) >= new Date(filterDashDateFrom));
                  }
                  if (filterDashDateTo) {
                    filteredTE = filteredTE.filter(e => e.date && new Date(e.date) <= new Date(filterDashDateTo + "T23:59:59"));
                  }
                  const hoursByClient = filteredTE.reduce((acc, e) => {
                    const clientName = e.client_name || e.group_name;
                    if (!clientName) return acc;
                    if (MONITORING_TASKS.includes(clientName)) return acc;
                    if (!acc[clientName]) acc[clientName] = 0;
                    acc[clientName] += parseFloat(e.hours_logged || 0);
                    return acc;
                  }, {});
                  filteredBulletData = bulletData.map(d => ({
                    ...d,
                    value: hoursByClient[d.label] || 0
                  }));
                  if (targetClient) {
                    filteredBulletData = filteredBulletData.filter(d => d.label === targetClient);
                  }
                }
                if (targetClient || selectedMember || filterDashDateFrom || filterDashDateTo) {
                  filteredBulletData = filteredBulletData.filter(d => d.value > 0);
                }
                
                let filteredMemberBulletData = memberBulletData;
                if (selectedMember) {
                  filteredMemberBulletData = memberBulletData.filter(d => d.label === selectedMember);
                }
                
                const displayName = selectedClient || filterDashClient || "";
                const dateDisplay = (filterDashDateFrom || filterDashDateTo) ? ` 📅 ${filterDashDateFrom || "..."} → ${filterDashDateTo || "..."}` : "";
                const memberDisplay = selectedMember ? ` 👤 ${selectedMember}` : "";
                
                return (
                  <>
                    {filteredBulletData.length > 0 && (
                      <BulletChart 
                        data={filteredBulletData} 
                        title={`🎯 Performance Clients SaaS vs Objectifs Contractuels${displayName ? ` — ${displayName}` : ""}${dateDisplay}${memberDisplay}`}
                        colorScheme="red" 
                        selectedClient={selectedClient} 
                        onSelectClient={handleSelectClient} 
                      />
                    )}
                    {filteredMemberBulletData.length > 0 && (
                      <BulletChart 
                        data={filteredMemberBulletData} 
                        title={`🎯 Performance Membres SOC vs Objectifs${selectedMember ? ` — ${selectedMember}` : ""}`}
                        colorScheme="blue" 
                        selectedClient={selectedMember} 
                        onSelectClient={handleSelectMember} 
                      />
                    )}
                    {filteredBulletData.length === 0 && !selectedMember && (
                      <div style={{textAlign:"center", padding:"30px", color:"#999", background:"#f8f9fa", borderRadius:"10px", marginBottom:"20px"}}>
                        <div style={{fontSize:"24px"}}>📊</div>
                        <div style={{fontSize:"14px",marginTop:"8px"}}>Aucune donnée de performance pour ce filtre</div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Alertes */}
              {stats?.exceedingClients?.filter(c => {
                if (selectedClient && c.name !== selectedClient) return false;
                if (selectedMember) return false;
                return true;
              }).length > 0 && (
                <div style={{ background: "#fff5f5", border: "2px solid #C8102E", borderRadius: "12px", padding: "15px", marginTop: "20px" }}>
                  <div style={{ color: "#C8102E", fontWeight: "bold", marginBottom: "10px", fontSize: "15px" }}>⚠️ Clients ayant dépassé la limite d'heures :</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {stats.exceedingClients.filter(c => {
                      if (selectedClient && c.name !== selectedClient) return false;
                      if (selectedMember) return false;
                      return true;
                    }).map((c, i) => (
                      <div key={i} onClick={()=>handleSelectClient(c.name===selectedClient?null:c.name)} style={{ background: selectedClient===c.name?"#1a1a2e":"#C8102E", color: "white", padding: "8px 15px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", cursor:"pointer", transition:"background 0.2s" }}>
                        🔴 {c.name} : {parseFloat(c.total_hours).toFixed(2)}h / {c.max_hours_per_week}h
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Évolution */}
              <div style={{ ...styles.cardTitle, marginTop: "25px" }}>📈 Charge de Travail Quotidienne — 30 Derniers Jours
                {activeFilter && <span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {activeFilter}</span>}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData}>
                  <defs><linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C8102E" stopOpacity={0.3}/><stop offset="95%" stopColor="#C8102E" stopOpacity={0.02}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" stroke="#666" fontSize={10}/><YAxis stroke="#666"/>
                  <Tooltip contentStyle={{ borderRadius: "8px" }}/>
                  <Area type="monotone" dataKey="heures" stroke="#C8102E" strokeWidth={2} fill="url(#adminGrad)" name="Heures"/>
                </AreaChart>
              </ResponsiveContainer>

              {/* Jauges membres */}
              <div style={{ ...styles.cardTitle, marginTop: "25px" }}>👥 Tableau de Bord Membres — Heures & Tickets</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
                {stats?.byUser?.map(u => {
                  const used = parseFloat(u.total_hours || 0); const saasH = parseFloat(u.saas_hours || 0); const onpremH = parseFloat(u.onprem_hours || 0);
                  const max = 40; const percent = Math.min((used / max) * 100, 100);
                  const color = used > 400 ? "#C8102E" : used > 38 ? "#ff9800" : "#28a745";
                  const bg = used > 400 ? "#fff5f5" : used > 38 ? "#fffbf0" : "#f0fff4";
                  const isSelected = selectedMember === u.full_name;
                  const isDimmed = selectedMember && !isSelected;
                  return (
                    <div key={u.user_id} onClick={() => handleSelectMember(u.full_name === selectedMember ? null : u.full_name)}
                      style={{ background: isDimmed ? "#f8f8f8" : bg, borderRadius: "12px", padding: "15px", boxShadow: isSelected ? "0 0 0 3px #1a1a2e,0 4px 15px rgba(0,0,0,0.1)" : "0 4px 15px rgba(0,0,0,0.08)", border: `2px solid ${isSelected ? "#1a1a2e" : isDimmed ? "#e0e0e0" : color}`, textAlign: "center", cursor: "pointer", opacity: isDimmed ? 0.25 : 1, transition: "all 0.2s" }}>
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>👤</div>
                      <div style={{ fontWeight: "bold", fontSize: "12px", color: isSelected ? "#C8102E" : "#1a1a2e", marginBottom: "8px" }}>{isSelected ? "🎯 " : ""}{u.full_name}</div>
                      <div style={{ fontSize: "22px", fontWeight: "bold", color }}>{used.toFixed(1)}h</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>/ {max}h ref</div>
                      <div style={{ height: "5px", background: "#e0e0e0", borderRadius: "3px", margin: "6px 0" }}><div style={{ height: "5px", background: color, borderRadius: "3px", width: `${percent}%` }} /></div>
                      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #e0e0e0" }}>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", fontWeight: "bold", color: "#C8102E" }}>{saasH.toFixed(1)}h</div><div style={{ fontSize: "9px", color: "#999" }}>SaaS</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", fontWeight: "bold", color: "#0f3460" }}>{onpremH.toFixed(1)}h</div><div style={{ fontSize: "9px", color: "#999" }}>OnPrem</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", fontWeight: "bold", color: "#28a745" }}>{u.total_tickets}</div><div style={{ fontSize: "9px", color: "#999" }}>Tickets</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* JIRA VS CHRONOS */}
              {(() => {
                const byC = {};
                const filtered = getFilteredTickets(tickets);
                filtered.filter(t => t.ticket_type === "SAAS" && t.client_name && !MONITORING_TASKS.includes(t.client_name))
                  .forEach(t => { const c = t.client_name; if (!byC[c]) byC[c] = { client: c, jira_hours: 0, chronos_hours: 0 }; byC[c].jira_hours += 0.25; });
                stats?.byClient?.forEach(s => { 
                  const c = s.name || "?"; 
                  if (MONITORING_TASKS.includes(c)) { 
                    byC[c] = { client: c, jira_hours: 0, chronos_hours: parseFloat(s.total_hours || 0) }; 
                  } else { 
                    if (!byC[c]) byC[c] = { client: c, jira_hours: 0, chronos_hours: 0 }; 
                    byC[c].chronos_hours = parseFloat(s.total_hours || 0); 
                  } 
                });
                const comparisonData = Object.values(byC).map(c => ({ 
                  ...c, 
                  jira_tickets: Math.round(c.jira_hours/0.25), 
                  ecart: (c.chronos_hours - c.jira_hours).toFixed(2), 
                  jira_hours: c.jira_hours.toFixed(2), 
                  chronos_hours: c.chronos_hours.toFixed(2) 
                }));
                const filteredComparison = selectedClient ? comparisonData.filter(c => c.client === selectedClient) : comparisonData;
                const totalJira = filteredComparison.reduce((a,c) => a + parseFloat(c.jira_hours), 0);
                const totalChronos = filteredComparison.reduce((a,c) => a + parseFloat(c.chronos_hours), 0);
                const totalEcart = filteredComparison.reduce((a,c) => a + parseFloat(c.ecart), 0);
                
                return (
                  <div style={{ marginTop: "30px" }}>
                    <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0f3460)", borderRadius: "12px", padding: "15px 20px", marginBottom: "20px", color: "white", display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ fontSize: "24px" }}>📊</div>
                      <div><div style={{ fontSize: "16px", fontWeight: "bold" }}>Analyse des Écarts — Jira vs Chronos</div><div style={{ fontSize: "12px", opacity: 0.8 }}>Comparaison des heures estimées (Jira) et des heures réelles (Chronos)</div></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "15px", marginBottom: "20px" }}>
                      {[
                        { label: "HEURES JIRA", value: `${totalJira.toFixed(2)}h`, bg: "#C8102E" },
                        { label: "HEURES CHRONOS", value: `${totalChronos.toFixed(2)}h`, bg: "#0f3460" },
                        { label: "ÉCART TOTAL", value: `${totalEcart.toFixed(2)}h`, bg: "#ff9800" }
                      ].map((k, i) => (
                        <div key={i} style={{ background: k.bg, borderRadius: "12px", padding: "20px", textAlign: "center", color: "white" }}>
                          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "8px" }}>{k.label}</div>
                          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{k.value}</div>
                          {selectedClient && <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>🎯 {selectedClient}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={styles.card}>
                      <div style={styles.cardTitle}>📉 Waterfall — Écarts Jira vs Chronos <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                      <p style={{ fontSize: "12px", color: "#888", marginTop: "-8px", marginBottom: "10px" }}>🟠 Sur-déclaré · 🔴 Sous-déclaré</p>
                      <WaterfallChart comparison={comparisonData} selectedClient={selectedClient} onSelectClient={handleSelectClient} />
                    </div>
                    <div style={styles.cardTitle}>📊 Comparaison Heures Jira vs Chronos <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData} onClick={d=>{const c=d?.activePayload?.[0]?.payload?.client;if(c) handleSelectClient(c===selectedClient?null:c);}} style={{cursor:"pointer"}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="client" stroke="#666"/><YAxis stroke="#666"/>
                        <Tooltip contentStyle={{ borderRadius: "8px" }}/><Legend/>
                        <Bar dataKey="jira_hours" fill="#C8102E" radius={[6,6,0,0]} name="Heures Jira">
                          {comparisonData.map(({client},i)=><Cell key={i} fill="#C8102E" opacity={selectedClient&&selectedClient!==client?0.25:1} style={{cursor:"pointer"}}/>)}
                        </Bar>
                        <Bar dataKey="chronos_hours" fill="#0f3460" radius={[6,6,0,0]} name="Heures Chronos">
                          {comparisonData.map(({client},i)=><Cell key={i} fill="#0f3460" opacity={selectedClient&&selectedClient!==client?0.25:1} style={{cursor:"pointer"}}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ ...styles.cardTitle, marginTop: "20px" }}>📋 Tableau Détaillé des Écarts {selectedClient && <span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {selectedClient}</span>}</div>
                    <table style={styles.table}>
                      <thead><tr><th style={styles.th}>Client</th><th style={styles.th}>Tickets</th><th style={styles.th}>Heures Jira</th><th style={styles.th}>Heures Chronos</th><th style={styles.th}>Écart</th><th style={styles.th}>Statut</th></tr></thead>
                      <tbody>{[...comparisonData].filter(c=>!selectedClient||c.client===selectedClient).sort((a,b)=>Math.abs(b.ecart)-Math.abs(a.ecart)).map((c,i)=>{
                        const ecart=parseFloat(c.ecart);
                        return <tr key={c.client} style={{background:i%2===0?"white":"#fafafa",cursor:"pointer"}} onClick={()=>handleSelectClient(c.client===selectedClient?null:c.client)}>
                          <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{c.client}</span></td>
                          <td style={styles.td}>{c.jira_tickets}</td>
                          <td style={styles.td}><span style={styles.badge("#C8102E")}>{c.jira_hours}h</span></td>
                          <td style={styles.td}><span style={styles.badge("#0f3460")}>{c.chronos_hours}h</span></td>
                          <td style={styles.td}><span style={{fontWeight:"bold",color:ecart>0?"#ff9800":ecart<0?"#C8102E":"#28a745"}}>{ecart>0?"+":""}{c.ecart}h</span></td>
                          <td style={styles.td}><span style={styles.badge(ecart>5?"#ff9800":ecart<-5?"#C8102E":"#28a745")}>{ecart>5?"⚠️ Sur-déclaré":ecart<-5?"❌ Sous-déclaré":"✅ OK"}</span></td>
                        </tr>;
                      })}</tbody>
                    </table>
                  </div>
                );
              })()}

              {/* IA & ANALYTICS - NE PAS TOUCHER */}
              <div style={{ marginTop: "30px" }}>
                <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0f3460)", borderRadius: "12px", padding: "15px 20px", marginBottom: "20px", color: "white", display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ fontSize: "24px" }}>🤖</div>
                  <div><div style={{ fontSize: "16px", fontWeight: "bold" }}>Analyse Intelligente — IA & Analytics</div><div style={{ fontSize: "12px", opacity: 0.8 }}>Prédiction · Anomalies · Forecast · Estimation de Complexité</div></div>
                </div>
                {aiError && <div style={{padding:"12px 20px",background:"#fff3cd",border:"1px solid #ff9800",borderRadius:"8px",marginBottom:"20px",fontWeight:"bold"}}>{aiError}</div>}
                <div style={{display:"flex",gap:"12px",marginBottom:"25px",justifyContent:"center",flexWrap:"wrap"}}>
                  {[
                    ["📊 Prédire la Charge","/ai/predict-workload",setAiPredictions,"#C8102E"],
                    ["🚨 Détecter Anomalies","/ai/detect-anomalies",setAiAnomalies,"#0f3460"],
                    ["🔮 Forecast 7 Jours","/ai/predict-7days",setAiForecast,"#28a745"],
                    ["⏱️ Estimer Complexité","/ai/estimate-by-type",setAiEstimation,"#6c757d"]
                  ].map(([lbl,ep,setter,color])=>(
                    <button key={lbl} onClick={()=>callAI(ep,setter)} disabled={aiLoading} style={{...styles.btn(aiLoading?"#ccc":color),padding:"12px 24px",fontSize:"14px"}}>{aiLoading?"⏳...":lbl}</button>
                  ))}
                </div>
                {aiForecast && (
                  <div style={{marginBottom:"25px"}}>
                    <div style={styles.cardTitle}>🔮 Prévision de Charge — 7 Prochains Jours</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" stroke="#666"/><YAxis stroke="#666"/>
                        <Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>
                        {aiForecast.forecast.slice(0,5).map((c,i)=><Line key={c.client} type="monotone" dataKey={c.client} stroke={CLIENT_COLORS[i%CLIENT_COLORS.length]} strokeWidth={2.5} dot={{r:4}}/>)}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {aiPredictions && (
                  <div style={{marginBottom:"25px"}}>
                    <div style={styles.cardTitle}>📊 Prédiction de Charge — Semaine Prochaine</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"15px",marginBottom:"20px"}}>
                      <div style={{background:"#C8102E",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px",marginBottom:"8px"}}>TICKETS PRÉVUS</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiPredictions.total_tickets}</div></div>
                      <div style={{background:"#1a1a2e",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px",marginBottom:"8px"}}>HEURES PRÉVUES</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiPredictions.total_hours}h</div></div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={predChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="client" stroke="#666"/><YAxis stroke="#666"/>
                        <Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>
                        <Bar dataKey="tickets" fill="#C8102E" radius={[6,6,0,0]} name="Tickets prévus"/>
                        <Bar dataKey="heures" fill="#0f3460" radius={[6,6,0,0]} name="Heures prévues"/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {aiAnomalies && (
                  <div style={{marginBottom:"25px"}}>
                    <div style={styles.cardTitle}>🚨 Détection d'Anomalies — Isolation Forest</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"15px",marginBottom:"20px"}}>
                      <div style={{background:"#1a1a2e",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px",marginBottom:"8px"}}>JOURS ANALYSÉS</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiAnomalies.total_analyzed}</div></div>
                      <div style={{background:"#C8102E",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px",marginBottom:"8px"}}>ANOMALIES DÉTECTÉES</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiAnomalies.anomalies_count}</div></div>
                    </div>
                    {anomalyChart.length > 0 && (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={anomalyChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="client" stroke="#666"/><YAxis stroke="#666"/>
                          <Tooltip contentStyle={{borderRadius:"8px"}}/>
                          <Bar dataKey="anomalies" fill="#C8102E" radius={[6,6,0,0]} name="Anomalies"/>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
                {aiEstimation && (
                  <div style={{marginBottom:"25px"}}>
                    <div style={styles.cardTitle}>⏱️ Estimation de Complexité par Type de Ticket</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"15px"}}>
                      {[["HAUTE","complexity.high","#C8102E","≥0.5h"],["MOYENNE","complexity.medium","#ff9800","0.25-0.5h"],["FAIBLE","complexity.low","#28a745","0.25h"]].map(([lbl,key,color,sub])=>{
                        const val=key.split(".").reduce((o,k)=>o[k],aiEstimation);
                        return <div key={lbl} style={{background:color,borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"11px",marginBottom:"8px"}}>{lbl} COMPLEXITÉ</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{val}</div><div style={{fontSize:"11px",opacity:0.8}}>tickets ({sub})</div></div>;
                      })}
                    </div>
                  </div>
                )}
                {!aiPredictions && !aiAnomalies && !aiForecast && !aiEstimation && !aiError && (
                  <div style={{textAlign:"center",padding:"40px",color:"#999",background:"#f8f9fa",borderRadius:"12px"}}>
                    <div style={{fontSize:"48px"}}>🤖</div>
                    <div style={{fontSize:"16px",fontWeight:"bold",marginTop:"10px"}}>Clique sur un bouton pour lancer l'analyse IA</div>
                    <div style={{fontSize:"13px",marginTop:"6px"}}>Powered by Random Forest & Isolation Forest</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RULES TAB */}
          {activeTab === "rules" && (
            <div>
              {/* ===== DATE DE CLÔTURE ===== */}
              <div style={{ 
                background: "linear-gradient(135deg, #fff5f5, #ffe8e8)", 
                border: "2px solid #C8102E", 
                borderRadius: "12px", 
                padding: "20px", 
                marginBottom: "25px",
                boxShadow: "0 4px 15px rgba(200,16,46,0.1)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                  <span style={{ fontSize: "24px" }}>🔒</span>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", color: "#1a1a2e" }}>
                      Date de Clôture des Synchronisations
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Tous les tickets après cette date ne seront pas synchronisés
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      📅 Date de clôture
                    </label>
                    <input
                      type="date"
                      value={clotureDate}
                      onChange={e => setClotureDate(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "2px solid #C8102E",
                        fontSize: "14px",
                        outline: "none",
                        background: "white",
                        minWidth: "200px"
                      }}
                    />
                  </div>
                  <button onClick={handleUpdateClotureDate} style={{ background: "#C8102E", color: "white", border: "none", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                    ✅ Appliquer
                  </button>
                  <button onClick={handleClearClotureDate} style={{ background: "#666", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                    🗑️ Supprimer
                  </button>
                </div>
                
                {clotureDate && (
                  <div style={{ marginTop: "12px", padding: "10px 16px", background: "#fff0f0", border: "1px solid #C8102E", borderRadius: "6px", color: "#C8102E", fontSize: "13px", fontWeight: "bold" }}>
                    ⚠️ Date de clôture active : <span style={{ background: "#C8102E", color: "white", padding: "2px 12px", borderRadius: "4px" }}>
                      {new Date(clotureDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    — Les tickets après cette date ne seront pas synchronisés
                  </div>
                )}
              </div>

              <div style={styles.cardTitle}>⚙️ Règles Globales — Limites Horaires par Client SaaS</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Max Heures</th><th style={styles.th}>Action</th></tr></thead>
                <tbody>{globalRules.map((rule, i) => (<tr key={rule.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}><td style={styles.td}>{rule.id}</td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{rule.client?.name || "—"}</span></td><td style={styles.td}><span style={styles.badge("#0f3460")}>{rule.rule_type}</span></td><td style={styles.td}><input type="number" style={styles.input} defaultValue={rule.max_hours} id={`rule-${rule.id}`} /></td><td style={styles.td}><button style={styles.btnModify} onClick={() => { const val = document.getElementById(`rule-${rule.id}`).value; handleUpdateRule(rule.id, val); }}>Modifier</button></td></tr>))}</tbody>
              </table>
              <div style={{ ...styles.cardTitle, marginTop: "30px" }}>👤 Règles Individuelles par Membre SOC</div>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
                <div style={{ fontWeight: "bold", color: "#1a1a2e", marginBottom: "15px", fontSize: "14px" }}>➕ Créer une nouvelle règle per_user</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "15px", alignItems: "end" }}>
                  <div><label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Client</label><select style={styles.select} value={newRuleClientId} onChange={e => setNewRuleClientId(e.target.value)}><option value="">Sélectionner un client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Membre SOC</label><select style={styles.select} value={newRuleUserId} onChange={e => setNewRuleUserId(e.target.value)}><option value="">Sélectionner un user</option>{users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>
                  <div><label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Max Heures/semaine</label><input type="number" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }} placeholder="ex: 20" value={newRuleMaxHours} onChange={e => setNewRuleMaxHours(e.target.value)} /></div>
                  <button onClick={handleCreateUserRule} style={{ background: "#28a745", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>✅ Créer</button>
                </div>
              </div>
              {perUserRules.length === 0 ? <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "13px" }}>Aucune règle per_user définie.</div> : (
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Client</th><th style={styles.th}>Membre SOC</th><th style={styles.th}>Max Heures</th><th style={styles.th}>Actions</th></tr></thead>
                  <tbody>{perUserRules.map((rule, i) => (<tr key={rule.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}><td style={styles.td}>{rule.id}</td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{rule.client?.name || "—"}</span></td><td style={styles.td}><span style={styles.badge("#0f3460")}>{rule.user?.full_name || "—"}</span></td><td style={styles.td}><input type="number" style={styles.input} defaultValue={rule.max_hours} id={`rule-${rule.id}`} /></td><td style={styles.td}><div style={{ display: "flex", gap: "8px" }}><button style={styles.btnModify} onClick={() => { const val = document.getElementById(`rule-${rule.id}`).value; handleUpdateRule(rule.id, val); }}>Modifier</button><button style={{ ...styles.btnModify, background: "#666" }} onClick={() => handleDeleteRule(rule.id)}>🗑️ Supprimer</button></div></td></tr>))}</tbody>
                </table>
              )}
            </div>
          )}

          {/* TIME ENTRIES TAB */}
          {activeTab === "timeentries" && (
            <div>
              <div style={styles.cardTitle}>🕐 Toutes les Entrées de Temps ({cfTimeEntries.length}) {activeFilter && <span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>🎯 {activeFilter}</span>}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                <select style={styles.filterSelect} value={filterClient} onChange={e => setFilterClient(e.target.value)}><option value="">Tous les clients</option>{[...new Set(timeEntries.map(e => e.client_name))].filter(Boolean).map(c => <option key={c} value={timeEntries.find(e => e.client_name === c)?.client_id}>{c}</option>)}</select>
                <select style={styles.filterSelect} value={filterUser} onChange={e => setFilterUser(e.target.value)}><option value="">Tous les users</option>{users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select>
                <select style={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}><option value="">Tous les types</option><option value="SAAS">SaaS</option><option value="ONPREM">On-Prem</option></select>
                <input type="date" style={styles.filterSelect} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                <input type="date" style={styles.filterSelect} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                <button onClick={handleFilterTimeEntries} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={handleResetTimeEntries} style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
                {activeFilter && <button onClick={clearFilter} style={{...styles.btnModify, background:"#0f3460"}}>✕ Effacer filtre cross</button>}
              </div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>User</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Slot Horaire</th><th style={styles.th}>Heures</th><th style={styles.th}>Date</th><th style={styles.th}>Synchronisé</th></tr></thead>
                  <tbody>{cfTimeEntries.map((entry, i) => (<tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}><td style={styles.td}>{entry.id}</td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{entry.user_name || entry.user_id}</span></td><td style={styles.td}><span style={styles.badge("#0f3460")}>{entry.client_name || entry.group_name || "—"}</span></td><td style={styles.td}><span style={styles.badge(entry.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{entry.ticket_type}</span></td><td style={styles.td}><span style={{ fontSize: "12px", fontFamily: "monospace", background: "#f0f0f0", padding: "3px 8px", borderRadius: "4px" }}>{entry.slot_start} → {entry.slot_end}</span></td><td style={styles.td}><span style={styles.badge("#28a745")}>{entry.hours_logged}h</span></td><td style={styles.td}>{entry.date}</td><td style={styles.td}><span style={styles.badge(entry.synced_to_chronos ? "#28a745" : "#ff9800")}>{entry.synced_to_chronos ? "✅ Oui" : "⏳ Non"}</span></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* TICKETS TAB */}
          {activeTab === "tickets" && (
            <div>
              <div style={styles.cardTitle}>🎫 Tous les Tickets ({cfTickets.length}) {activeFilter && <span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>🎯 {activeFilter}</span>}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                <select style={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}><option value="">Tous les types</option><option value="SAAS">SaaS</option><option value="ONPREM">On-Prem</option></select>
                <select style={styles.filterSelect} value={filterUser} onChange={e => setFilterUser(e.target.value)}><option value="">Tous les users</option>{users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select>
                <button onClick={handleFilterTickets} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={handleResetTickets} style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
                {activeFilter && <button onClick={clearFilter} style={{...styles.btnModify, background:"#0f3460"}}>✕ Effacer filtre cross</button>}
              </div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Assignee</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Date</th><th style={styles.th}>Statut Limite</th></tr></thead>
                  <tbody>{cfTickets.filter(t => (!filterType || t.ticket_type===filterType) && (!filterUser || String(t.assignee_id)===String(filterUser))).map((t, i) => {
                    const clientTickets = tickets.filter(t2=>t2.client_name===t.client_name&&t2.ticket_type==="SAAS");
                    const idx = clientTickets.findIndex(t2=>t2.id===t.id);
                    const heures = (idx+1)*0.25;
                    const rule = stats?.byClient?.find(c=>c.name===t.client_name);
                    const max = parseFloat(rule?.max_hours_per_week||0);
                    const hAvant = idx*0.25;
                    return(
                      <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={styles.td}><span style={styles.badge("#C8102E")}>{t.jira_key}</span></td>
                        <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 50)}...</td>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.assignee_name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{t.client_name || t.group_name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge(t.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.ticket_type}</span></td>
                        <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                        <td style={styles.td}>{(() => {
                          if(t.ticket_type!=="SAAS") return <span style={styles.badge("#0f3460")}>🖥️ On-Prem</span>;
                          if(!max) return <span style={styles.badge("#6c757d")}>— Pas de règle</span>;
                          if(hAvant>max) return <span style={styles.badge("#C8102E")}>🔴 Au-delà limite</span>;
                          if(heures>max) return <span style={styles.badge("#ff9800")}>⚠️ Seuil dépassé ici</span>;
                          return <span style={styles.badge("#28a745")}>✅ OK</span>;
                        })()}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div>
              <div style={styles.cardTitle}>👥 Membres de l'équipe SOC ({users.length})</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Username</th><th style={styles.th}>Nom Complet</th><th style={styles.th}>Rôle</th></tr></thead>
                <tbody>{users.map((user, i) => (<tr key={user.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}><td style={styles.td}>{user.id}</td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{user.username}</span></td><td style={styles.td}>{user.full_name}</td><td style={styles.td}><span style={styles.badge(user.role === "admin" ? "#C8102E" : "#28a745")}>{user.role === "admin" ? "🔐 Admin" : "👤 User"}</span></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && stats && (
            <div>
              <div style={styles.cardTitle}>📈 Tableau de Bord Statistique — Heures par Client et par Membre</div>
              {stats.exceedingClients?.length > 0 && (
                <div style={{ background: "#fff5f5", border: "2px solid #C8102E", borderRadius: "10px", padding: "15px", marginBottom: "20px" }}>
                  <div style={{ color: "#C8102E", fontWeight: "bold", marginBottom: "10px" }}>⚠️ Clients ayant dépassé la limite :</div>
                  {stats.exceedingClients.map((c, i) => <div key={i} style={{ padding: "5px 0", color: "#C8102E" }}>🔴 {c.name} : {parseFloat(c.total_hours).toFixed(2)}h / {c.max_hours_per_week}h max</div>)}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#1a1a2e" }}>📊 Consommation Horaire par Client SaaS</div>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Tickets</th><th style={styles.th}>Heures</th><th style={styles.th}>Max</th></tr></thead>
                    <tbody>{stats.byClient?.map((s, i) => { const hours = parseFloat(s.total_hours || 0).toFixed(2); const max = s.max_hours_per_week || 0; const exceeded = max > 0 && parseFloat(hours) > max; return <tr key={i} style={{ background: exceeded ? "#fff5f5" : i % 2 === 0 ? "white" : "#fafafa" }}><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{s.name}</span></td><td style={styles.td}><span style={styles.badge(s.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{s.ticket_type}</span></td><td style={styles.td}>{s.total_tickets}</td><td style={styles.td}><span style={styles.badge(exceeded ? "#C8102E" : "#28a745")}>{hours}h</span></td><td style={styles.td}>{max > 0 ? `${max}h` : "—"}</td></tr>; })}</tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#1a1a2e" }}>👥 Charge de Travail par Membre SOC</div>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>User</th><th style={styles.th}>Tickets</th><th style={styles.th}>SaaS</th><th style={styles.th}>On-Prem</th><th style={styles.th}>Total</th></tr></thead>
                    <tbody>{stats.byUser?.map((s, i) => (<tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{s.full_name}</span></td><td style={styles.td}>{s.total_tickets}</td><td style={styles.td}><span style={styles.badge("#C8102E")}>{parseFloat(s.saas_hours || 0).toFixed(1)}h</span></td><td style={styles.td}><span style={styles.badge("#0f3460")}>{parseFloat(s.onprem_hours || 0).toFixed(1)}h</span></td><td style={styles.td}><span style={styles.badge("#28a745")}>{parseFloat(s.total_hours || 0).toFixed(1)}h</span></td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;