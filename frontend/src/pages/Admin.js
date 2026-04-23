import { useEffect, useState } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const COLORS = ["#C8102E", "#1a1a2e", "#0f3460", "#e94560", "#28a745", "#ff9800", "#16213e", "#6c757d"];

const FLIP_CSS = `
  .flip-card { background: transparent; perspective: 1000px; height: 130px; cursor: pointer; }
  .flip-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.7s cubic-bezier(0.4,0.2,0.2,1); transform-style: preserve-3d; }
  .flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
  .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; box-sizing: border-box; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  .flip-card-back { transform: rotateY(180deg); }
`;

const styles = {
  navbar: {
    background: "linear-gradient(135deg, #1a1a2e, #0f3460)", padding: "0 30px", height: "65px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
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
    borderBottom: "3px solid #C8102E", paddingBottom: "8px"
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "white", padding: "12px 15px", textAlign: "left", fontSize: "13px" },
  td: { padding: "12px 15px", borderBottom: "1px solid #f0f0f0", fontSize: "14px", color: "#333" },
  badge: (bg) => ({ background: bg, color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }),
  input: { padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "6px", width: "80px", fontSize: "14px", outline: "none" },
  btnModify: { background: "#C8102E", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  filterSelect: { padding: "8px 12px", borderRadius: "6px", border: "2px solid #e0e0e0", fontSize: "13px", outline: "none", marginRight: "10px", cursor: "pointer" },
  tabBtn: (active) => ({
    padding: "10px 18px", borderRadius: "8px 8px 0 0", fontWeight: "bold",
    cursor: "pointer", fontSize: "13px", margin: "0 2px 0 0", border: "none",
    background: active ? "white" : "#e0e0e0", color: active ? "#C8102E" : "#666",
    borderBottom: active ? "3px solid #C8102E" : "none"
  }),
  select: { padding: "8px 12px", borderRadius: "6px", border: "2px solid #e0e0e0", fontSize: "13px", outline: "none", cursor: "pointer", width: "100%" }
};

function Admin() {
  const [rules, setRules] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [rulesRes, usersRes, statsRes, ticketsRes, teRes] = await Promise.all([
        API.get("/rules"),
        API.get("/admin/users"),
        API.get("/admin/stats"),
        API.get("/admin/tickets"),
        API.get("/admin/time-entries")
      ]);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setTickets(ticketsRes.data);
      setTimeEntries(teRes.data);

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

  // ✅ CORRIGÉ — filtre time entries avec les valeurs courantes
  const handleFilterTimeEntries = () => {
    const params = {};
    if (filterClient) params.client_id = filterClient;
    if (filterUser) params.user_id = filterUser;
    if (filterType) params.ticket_type = filterType;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    API.get("/admin/time-entries", { params })
      .then(res => setTimeEntries(res.data))
      .catch(err => console.error(err));
  };

  // ✅ CORRIGÉ — filtre tickets avec les valeurs courantes
  const handleFilterTickets = () => {
    const params = {};
    if (filterType) params.ticket_type = filterType;
    if (filterUser) params.user_id = filterUser;
    API.get("/admin/tickets", { params })
      .then(res => setTickets(res.data))
      .catch(err => console.error(err));
  };

  // ✅ CORRIGÉ — réinitialiser time entries
  const handleResetTimeEntries = () => {
    setFilterClient("");
    setFilterUser("");
    setFilterType("");
    setFilterDateFrom("");
    setFilterDateTo("");
    API.get("/admin/time-entries")
      .then(res => setTimeEntries(res.data))
      .catch(err => console.error(err));
  };

  // ✅ CORRIGÉ — réinitialiser tickets
  const handleResetTickets = () => {
    setFilterType("");
    setFilterUser("");
    API.get("/admin/tickets")
      .then(res => setTickets(res.data))
      .catch(err => console.error(err));
  };

  const showMsg = (text, type = "success") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleUpdateRule = async (id, max_hours) => {
    await API.put(`/rules/${id}`, { max_hours: parseFloat(max_hours) });
    showMsg("✅ Règle mise à jour avec succès !");
    loadData();
  };

  const handleCreateUserRule = async () => {
    if (!newRuleClientId || !newRuleUserId || !newRuleMaxHours) {
      showMsg("⚠️ Veuillez remplir tous les champs !", "error");
      return;
    }
    try {
      await API.post("/rules", {
        client_id: parseInt(newRuleClientId),
        user_id: parseInt(newRuleUserId),
        max_hours: parseFloat(newRuleMaxHours)
      });
      showMsg("✅ Règle per_user créée avec succès !");
      setNewRuleClientId(""); setNewRuleUserId(""); setNewRuleMaxHours("");
      loadData();
    } catch (err) {
      showMsg("❌ Erreur : " + err.message, "error");
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Supprimer cette règle ?")) return;
    try {
      await API.delete(`/rules/${id}`);
      showMsg("✅ Règle supprimée !");
      loadData();
    } catch (err) {
      showMsg("❌ Erreur suppression", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const globalRules = rules.filter(r => r.rule_type === "global" || !r.user_id);
  const perUserRules = rules.filter(r => r.rule_type === "per_user" && r.user_id);

  const saasTickets = tickets.filter(t => t.ticket_type === "SAAS").length;
  const onpremTickets = tickets.filter(t => t.ticket_type === "ONPREM").length;
  const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);
  const syncedCount = timeEntries.filter(e => e.synced_to_chronos).length;

  const ticketsByTypeData = [
    { name: "SaaS", value: saasTickets },
    { name: "On-Prem", value: onpremTickets }
  ];

  const hoursByUserData = stats?.byUser?.map(u => ({
    name: u.full_name?.split(" ")[0] || u.username,
    heures: parseFloat(u.total_hours || 0).toFixed(2),
    tickets: u.total_tickets
  })) || [];

  const hoursByClientData = stats?.byClient?.slice(0, 8).map(c => ({
    name: c.name,
    heures: parseFloat(c.total_hours || 0).toFixed(2),
    max: c.max_hours_per_week || 0
  })) || [];

  const radarData = stats?.byUser?.slice(0, 6).map(u => ({
    user: u.full_name?.split(" ")[0],
    saas: parseFloat(u.saas_hours || 0),
    onprem: parseFloat(u.onprem_hours || 0),
    tickets: u.total_tickets
  })) || [];

  const byDate = timeEntries.reduce((acc, e) => {
    const d = e.date ? e.date.toString().slice(0, 10) : "N/A";
    acc[d] = (acc[d] || 0) + parseFloat(e.hours_logged || 0);
    return acc;
  }, {});
  const areaData = Object.entries(byDate).sort().slice(-30).map(([date, heures]) => ({ date: date.slice(5), heures }));

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
          <button onClick={handleLogout} style={{ background: "#C8102E", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={styles.container}>
        {msg && (
          <div style={{ padding: "12px 20px", background: msgType === "error" ? "#fff0f0" : "#f0fff4", border: `1px solid ${msgType === "error" ? "#C8102E" : "#28a745"}`, borderRadius: "8px", color: msgType === "error" ? "#C8102E" : "#28a745", marginBottom: "20px", fontWeight: "bold" }}>
            {msg}
          </div>
        )}

        {/* FLIP KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "25px" }}>
          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #C8102E, #a00c26)", color: "white" }}>
                <div style={{ fontSize: "26px", marginBottom: "4px" }}>🎫</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>TOTAL TICKETS</div>
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>{tickets.length}</div>
                <div style={{ fontSize: "10px", opacity: 0.6 }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #a00c26, #800a1e)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>📊 DÉTAIL</div>
                <div style={{ fontSize: "13px" }}>☁️ SaaS : <strong>{saasTickets}</strong></div>
                <div style={{ fontSize: "13px" }}>🖥️ On-Prem : <strong>{onpremTickets}</strong></div>
                <div style={{ fontSize: "13px" }}>👥 Users : <strong>{users.length}</strong></div>
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #1a1a2e, #0d0d1a)", color: "white" }}>
                <div style={{ fontSize: "26px", marginBottom: "4px" }}>🕐</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>ENTRÉES DE TEMPS</div>
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>{timeEntries.length}</div>
                <div style={{ fontSize: "10px", opacity: 0.6 }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #0d0d1a, #050510)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>⏱️ DÉTAIL</div>
                <div style={{ fontSize: "13px" }}>✅ Sync : <strong>{syncedCount}</strong></div>
                <div style={{ fontSize: "13px" }}>⏳ Non sync : <strong>{timeEntries.length - syncedCount}</strong></div>
                <div style={{ fontSize: "13px" }}>📊 Total : <strong>{totalHeures.toFixed(1)}h</strong></div>
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #0f3460, #092540)", color: "white" }}>
                <div style={{ fontSize: "26px", marginBottom: "4px" }}>👥</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>MEMBRES SOC</div>
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>{users.length}</div>
                <div style={{ fontSize: "10px", opacity: 0.6 }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #092540, #061830)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>👥 ÉQUIPE</div>
                <div style={{ fontSize: "12px" }}>🔐 Admins : <strong>{users.filter(u => u.role === "admin").length}</strong></div>
                <div style={{ fontSize: "12px" }}>👤 Users : <strong>{users.filter(u => u.role !== "admin").length}</strong></div>
                <div style={{ fontSize: "12px" }}>⚙️ Règles : <strong>{rules.length}</strong></div>
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #28a745, #1e7e34)", color: "white" }}>
                <div style={{ fontSize: "26px", marginBottom: "4px" }}>⏱️</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>HEURES TOTALES</div>
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalHeures.toFixed(0)}h</div>
                <div style={{ fontSize: "10px", opacity: 0.6 }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #1e7e34, #155724)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>⏱️ HEURES</div>
                <div style={{ fontSize: "12px" }}>☁️ SaaS : <strong>{(saasTickets * 0.25).toFixed(1)}h</strong></div>
                <div style={{ fontSize: "12px" }}>🖥️ On-Prem : <strong>{(onpremTickets * 0.25).toFixed(1)}h</strong></div>
                <div style={{ fontSize: "12px" }}>📊 Moy/ticket : <strong>0.25h</strong></div>
              </div>
            </div>
          </div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front" style={{ background: "linear-gradient(135deg, #ff9800, #cc7a00)", color: "white" }}>
                <div style={{ fontSize: "26px", marginBottom: "4px" }}>⚠️</div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>CLIENTS DÉPASSÉS</div>
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>{stats?.exceedingClients?.length || 0}</div>
                <div style={{ fontSize: "10px", opacity: 0.6 }}>Survoler →</div>
              </div>
              <div className="flip-card-back" style={{ background: "linear-gradient(135deg, #cc7a00, #995c00)", color: "white" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>⚠️ DÉPASSEMENTS</div>
                {stats?.exceedingClients?.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ fontSize: "11px" }}>🔴 {c.name} : {parseFloat(c.total_hours).toFixed(1)}h</div>
                ))}
                {!stats?.exceedingClients?.length && <div style={{ fontSize: "12px" }}>✅ Aucun dépassement</div>}
              </div>
            </div>
          </div>
        </div>

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
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: "12px", padding: "20px", marginBottom: "25px", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>Vue d'ensemble — Administration SOC VERMEG</div>
                <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "6px" }}>Supervision globale de l'équipe, des tickets et des performances</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>📊 Tickets SaaS vs On-Prem</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={ticketsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={70} outerRadius={110}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        <Cell fill="#C8102E" /><Cell fill="#0f3460" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>📈 Évolution Heures (30 derniers jours)</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#C8102E" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" fontSize={10} />
                      <YAxis stroke="#666" />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="heures" stroke="#C8102E" strokeWidth={2} fill="url(#adminGrad)" name="Heures" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>👥 Heures par Membre de l'Équipe</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={hoursByUserData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#666" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#666" width={70} fontSize={11} />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Bar dataKey="heures" name="Heures" radius={[0,6,6,0]}>
                        {hoursByUserData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🕸️ Spider Chart — Activité Équipe</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius={90} data={radarData}>
                      <PolarGrid stroke="#e0e0e0" />
                      <PolarAngleAxis dataKey="user" tick={{ fontSize: 11, fontWeight: "bold", fill: "#1a1a2e" }} />
                      <PolarRadiusAxis angle={90} tick={{ fontSize: 9 }} />
                      <Radar name="SaaS (h)" dataKey="saas" stroke="#C8102E" fill="#C8102E" fillOpacity={0.3} strokeWidth={2} />
                      <Radar name="On-Prem (h)" dataKey="onprem" stroke="#0f3460" fill="#0f3460" fillOpacity={0.2} strokeWidth={2} />
                      <Legend />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.cardTitle}>🎯 Heures Utilisées vs Max Autorisées — Par Client</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hoursByClientData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Legend />
                  <Bar dataKey="heures" fill="#C8102E" radius={[6,6,0,0]} name="Heures utilisées" />
                  <Bar dataKey="max" fill="#0f3460" radius={[6,6,0,0]} name="Max autorisé" />
                </BarChart>
              </ResponsiveContainer>

              {stats?.exceedingClients?.length > 0 && (
                <div style={{ background: "#fff5f5", border: "2px solid #C8102E", borderRadius: "12px", padding: "15px", marginTop: "20px" }}>
                  <div style={{ color: "#C8102E", fontWeight: "bold", marginBottom: "10px", fontSize: "15px" }}>⚠️ Clients ayant dépassé la limite d'heures :</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {stats.exceedingClients.map((c, i) => (
                      <div key={i} style={{ background: "#C8102E", color: "white", padding: "8px 15px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold" }}>
                        🔴 {c.name} : {parseFloat(c.total_hours).toFixed(2)}h / {c.max_hours_per_week}h
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ ...styles.cardTitle, marginTop: "25px" }}>👥 Jauges Heures — Membres de l'Équipe</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
                {stats?.byUser?.map(u => {
                  const used = parseFloat(u.total_hours || 0);
                  const max = 40;
                  const percent = Math.min((used / max) * 100, 100);
                  const color = percent > 80 ? "#C8102E" : percent > 50 ? "#ff9800" : "#28a745";
                  return (
                    <div key={u.user_id} style={{ background: percent >= 100 ? "#fff5f5" : percent >= 50 ? "#fffbf0" : "#f0fff4", borderRadius: "12px", padding: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: `2px solid ${color}`, textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>👤</div>
                      <div style={{ fontWeight: "bold", fontSize: "12px", color: "#1a1a2e", marginBottom: "8px" }}>{u.full_name}</div>
                      <div style={{ fontSize: "22px", fontWeight: "bold", color }}>{used.toFixed(1)}h</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>/ {max}h ref</div>
                      <div style={{ height: "5px", background: "#e0e0e0", borderRadius: "3px", margin: "6px 0" }}>
                        <div style={{ height: "5px", background: color, borderRadius: "3px", width: `${percent}%` }}/>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #e0e0e0" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#C8102E" }}>{parseFloat(u.saas_hours || 0).toFixed(1)}h</div>
                          <div style={{ fontSize: "9px", color: "#999" }}>SaaS</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#0f3460" }}>{parseFloat(u.onprem_hours || 0).toFixed(1)}h</div>
                          <div style={{ fontSize: "9px", color: "#999" }}>OnPrem</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#28a745" }}>{u.total_tickets}</div>
                          <div style={{ fontSize: "9px", color: "#999" }}>Tickets</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RULES TAB */}
          {activeTab === "rules" && (
            <div>
              <div style={styles.cardTitle}>⚙️ Règles Globales — Max Heures par Client</div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Max Heures</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {globalRules.map((rule, i) => (
                    <tr key={rule.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}>{rule.id}</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{rule.client?.name || "—"}</span></td>
                      <td style={styles.td}><span style={styles.badge("#0f3460")}>{rule.rule_type}</span></td>
                      <td style={styles.td}>
                        <input type="number" style={styles.input} defaultValue={rule.max_hours} id={`rule-${rule.id}`} />
                      </td>
                      <td style={styles.td}>
                        <button style={styles.btnModify} onClick={() => {
                          const val = document.getElementById(`rule-${rule.id}`).value;
                          handleUpdateRule(rule.id, val);
                        }}>Modifier</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ ...styles.cardTitle, marginTop: "30px" }}>👤 Règles par Utilisateur</div>
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
                <div style={{ fontWeight: "bold", color: "#1a1a2e", marginBottom: "15px", fontSize: "14px" }}>➕ Créer une nouvelle règle per_user</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "15px", alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Client</label>
                    <select style={styles.select} value={newRuleClientId} onChange={e => setNewRuleClientId(e.target.value)}>
                      <option value="">Sélectionner un client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Membre SOC</label>
                    <select style={styles.select} value={newRuleUserId} onChange={e => setNewRuleUserId(e.target.value)}>
                      <option value="">Sélectionner un user</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Max Heures/semaine</label>
                    <input type="number" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                      placeholder="ex: 20" value={newRuleMaxHours} onChange={e => setNewRuleMaxHours(e.target.value)} />
                  </div>
                  <button onClick={handleCreateUserRule}
                    style={{ background: "#28a745", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                    ✅ Créer
                  </button>
                </div>
              </div>

              {perUserRules.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "13px" }}>Aucune règle per_user définie.</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Membre SOC</th>
                      <th style={styles.th}>Max Heures</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perUserRules.map((rule, i) => (
                      <tr key={rule.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={styles.td}>{rule.id}</td>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{rule.client?.name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{rule.user?.full_name || "—"}</span></td>
                        <td style={styles.td}>
                          <input type="number" style={styles.input} defaultValue={rule.max_hours} id={`rule-${rule.id}`} />
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button style={styles.btnModify} onClick={() => {
                              const val = document.getElementById(`rule-${rule.id}`).value;
                              handleUpdateRule(rule.id, val);
                            }}>Modifier</button>
                            <button style={{ ...styles.btnModify, background: "#666" }} onClick={() => handleDeleteRule(rule.id)}>🗑️ Supprimer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TIME ENTRIES TAB */}
          {activeTab === "timeentries" && (
            <div>
              <div style={styles.cardTitle}>🕐 Toutes les Entrées de Temps ({timeEntries.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                <select style={styles.filterSelect} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                  <option value="">Tous les clients</option>
                  {[...new Set(timeEntries.map(e => e.client_name))].filter(Boolean).map(c => (
                    <option key={c} value={timeEntries.find(e => e.client_name === c)?.client_id}>{c}</option>
                  ))}
                </select>
                <select style={styles.filterSelect} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                  <option value="">Tous les users</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
                <select style={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Tous les types</option>
                  <option value="SAAS">SaaS</option>
                  <option value="ONPREM">On-Prem</option>
                </select>
                <input type="date" style={styles.filterSelect} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                <input type="date" style={styles.filterSelect} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                {/* ✅ CORRIGÉ */}
                <button onClick={handleFilterTimeEntries} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={handleResetTimeEntries} style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
              </div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>User</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Slot Horaire</th>
                      <th style={styles.th}>Heures</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Synchronisé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map((entry, i) => (
                      <tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={styles.td}>{entry.id}</td>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{entry.user_name || entry.user_id}</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{entry.client_name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge(entry.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{entry.ticket_type}</span></td>
                        <td style={styles.td}>
                          <span style={{ fontSize: "12px", fontFamily: "monospace", background: "#f0f0f0", padding: "3px 8px", borderRadius: "4px" }}>
                            {entry.slot_start} → {entry.slot_end}
                          </span>
                        </td>
                        <td style={styles.td}><span style={styles.badge("#28a745")}>{entry.hours_logged}h</span></td>
                        <td style={styles.td}>{entry.date}</td>
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
            </div>
          )}

          {/* TICKETS TAB */}
          {activeTab === "tickets" && (
            <div>
              <div style={styles.cardTitle}>🎫 Tous les Tickets ({tickets.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                <select style={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Tous les types</option>
                  <option value="SAAS">SaaS</option>
                  <option value="ONPREM">On-Prem</option>
                </select>
                <select style={styles.filterSelect} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                  <option value="">Tous les users</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
                {/* ✅ CORRIGÉ */}
                <button onClick={handleFilterTickets} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={handleResetTickets} style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
              </div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Jira Key</th>
                      <th style={styles.th}>Résumé</th>
                      <th style={styles.th}>Assignee</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t, i) => (
                      <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={styles.td}><span style={styles.badge("#C8102E")}>{t.jira_key}</span></td>
                        <td style={styles.td} title={t.summary}>{t.summary?.substring(0, 50)}...</td>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.assignee_name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{t.client_name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge(t.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{t.ticket_type}</span></td>
                        <td style={styles.td}>{t.outage_start ? new Date(t.outage_start).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div>
              <div style={styles.cardTitle}>👥 Membres de l'équipe SOC ({users.length})</div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Nom Complet</th>
                    <th style={styles.th}>Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}>{user.id}</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{user.username}</span></td>
                      <td style={styles.td}>{user.full_name}</td>
                      <td style={styles.td}>
                        <span style={styles.badge(user.role === "admin" ? "#C8102E" : "#28a745")}>
                          {user.role === "admin" ? "🔐 Admin" : "👤 User"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && stats && (
            <div>
              <div style={styles.cardTitle}>📈 Statistiques — Heures par Client et par User</div>

              {stats.exceedingClients?.length > 0 && (
                <div style={{ background: "#fff5f5", border: "2px solid #C8102E", borderRadius: "10px", padding: "15px", marginBottom: "20px" }}>
                  <div style={{ color: "#C8102E", fontWeight: "bold", marginBottom: "10px" }}>⚠️ Clients ayant dépassé la limite :</div>
                  {stats.exceedingClients.map((c, i) => (
                    <div key={i} style={{ padding: "5px 0", color: "#C8102E" }}>
                      🔴 {c.name} : {parseFloat(c.total_hours).toFixed(2)}h / {c.max_hours_per_week}h max
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#1a1a2e" }}>📊 Heures par Client</div>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Client</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Tickets</th>
                        <th style={styles.th}>Heures</th>
                        <th style={styles.th}>Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byClient?.map((s, i) => {
                        const hours = parseFloat(s.total_hours || 0).toFixed(2);
                        const max = s.max_hours_per_week || 0;
                        const exceeded = max > 0 && parseFloat(hours) > max;
                        return (
                          <tr key={i} style={{ background: exceeded ? "#fff5f5" : i % 2 === 0 ? "white" : "#fafafa" }}>
                            <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{s.name}</span></td>
                            <td style={styles.td}><span style={styles.badge(s.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{s.ticket_type}</span></td>
                            <td style={styles.td}>{s.total_tickets}</td>
                            <td style={styles.td}><span style={styles.badge(exceeded ? "#C8102E" : "#28a745")}>{hours}h</span></td>
                            <td style={styles.td}>{max > 0 ? `${max}h` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#1a1a2e" }}>👥 Heures par User</div>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>User</th>
                        <th style={styles.th}>Tickets</th>
                        <th style={styles.th}>SaaS</th>
                        <th style={styles.th}>On-Prem</th>
                        <th style={styles.th}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byUser?.map((s, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{s.full_name}</span></td>
                          <td style={styles.td}>{s.total_tickets}</td>
                          <td style={styles.td}><span style={styles.badge("#C8102E")}>{parseFloat(s.saas_hours || 0).toFixed(1)}h</span></td>
                          <td style={styles.td}><span style={styles.badge("#0f3460")}>{parseFloat(s.onprem_hours || 0).toFixed(1)}h</span></td>
                          <td style={styles.td}><span style={styles.badge("#28a745")}>{parseFloat(s.total_hours || 0).toFixed(1)}h</span></td>
                        </tr>
                      ))}
                    </tbody>
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