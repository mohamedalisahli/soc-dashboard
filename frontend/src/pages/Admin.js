import { useEffect, useState } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ReferenceLine
} from "recharts";

const COLORS = ["#C8102E", "#1a1a2e", "#0f3460", "#e94560", "#28a745", "#ff9800", "#16213e", "#6c757d"];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = ["08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h"];

const TUNISIA_CITIES = [
  { name: "Tunis",     x: 245, y: 98,  clients: ["STT", "SMBC", "GEN"] },
  { name: "Sfax",      x: 230, y: 220, clients: ["LGIM", "MILL"] },
  { name: "Sousse",    x: 248, y: 168, clients: ["Devops"] },
  { name: "Monastir",  x: 258, y: 182, clients: ["VEGGO"] },
  { name: "Bizerte",   x: 238, y: 68,  clients: ["HAYS"] },
  { name: "Nabeul",    x: 272, y: 120, clients: ["SMBC"] },
  { name: "Ariana",    x: 248, y: 92,  clients: ["STT"] },
  { name: "Ben Arous", x: 252, y: 106, clients: ["GEN"] },
];

const FLIP_CSS = `
  .flip-card { background: transparent; perspective: 1000px; height: 130px; cursor: pointer; }
  .flip-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.7s cubic-bezier(0.4,0.2,0.2,1); transform-style: preserve-3d; }
  .flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
  .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; box-sizing: border-box; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  .flip-card-back { transform: rotateY(180deg); }
  .heatmap-cell { transition: all 0.2s; cursor: pointer; }
  .heatmap-cell:hover { transform: scale(1.15); filter: brightness(1.2); }
  .map-dot { transition: all 0.3s; cursor: pointer; }
  .map-dot:hover { transform: scale(1.4); }
  .bullet-bar { transition: width 0.6s ease; }
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
  card: { background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "20px" },
  cardTitle: { color: "#1a1a2e", fontWeight: "bold", fontSize: "16px", marginBottom: "15px", borderBottom: "3px solid #C8102E", paddingBottom: "8px" },
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

// ── HEATMAP ──
function ActivityHeatmap({ timeEntries }) {
  const grid = DAYS.map((_, di) =>
    HOURS.map((_, hi) => {
      const hour = 8 + hi;
      return timeEntries.filter(e => {
        if (!e.date || !e.slot_start) return false;
        const d = new Date(e.date).getDay();
        const dayIdx = d === 0 ? 6 : d - 1;
        const h = parseInt(e.slot_start?.split(":")[0] || "0");
        return dayIdx === di && h === hour;
      }).length;
    })
  );
  const maxVal = Math.max(...grid.flat(), 1);
  const getColor = (v) => {
    if (v === 0) return "#f0f2f5";
    const pct = v / maxVal;
    if (pct < 0.25) return "#fce4e4";
    if (pct < 0.5)  return "#f48fb1";
    if (pct < 0.75) return "#e94560";
    return "#C8102E";
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px", paddingLeft: "36px" }}>
        {HOURS.map(h => <div key={h} style={{ width: "32px", fontSize: "10px", color: "#999", textAlign: "center" }}>{h}</div>)}
      </div>
      {grid.map((row, di) => (
        <div key={di} style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "32px", fontSize: "11px", color: "#666", fontWeight: "bold" }}>{DAYS[di]}</div>
          {row.map((val, hi) => (
            <div key={hi} className="heatmap-cell"
              title={`${DAYS[di]} ${HOURS[hi]} — ${val} entrée(s)`}
              style={{ width: "32px", height: "28px", borderRadius: "5px", background: getColor(val), display: "flex", alignItems: "center", justifyContent: "center" }}>
              {val > 0 && <span style={{ fontSize: "10px", fontWeight: "bold", color: val / maxVal > 0.4 ? "white" : "#C8102E" }}>{val}</span>}
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", paddingLeft: "36px" }}>
        <span style={{ fontSize: "11px", color: "#999" }}>Moins</span>
        {["#f0f2f5", "#fce4e4", "#f48fb1", "#e94560", "#C8102E"].map((c, i) => (
          <div key={i} style={{ width: "18px", height: "18px", borderRadius: "3px", background: c }} />
        ))}
        <span style={{ fontSize: "11px", color: "#999" }}>Plus</span>
      </div>
    </div>
  );
}

// ── WATERFALL CHART ──
function WaterfallChart({ comparison }) {
  if (!comparison.length) return <div style={{ textAlign: "center", color: "#999", padding: "40px" }}>Aucune donnée</div>;
  const data = comparison.slice(0, 8).map(c => ({
    client: c.client,
    ecart: parseFloat(c.ecart),
    jira: parseFloat(c.jira_hours),
    chronos: parseFloat(c.chronos_hours),
  }));
  const CustomBar = (props) => {
    const { x, y, width, height, ecart } = props;
    if (!height) return null;
    const fill = ecart > 0 ? "#ff9800" : ecart < 0 ? "#C8102E" : "#28a745";
    return (
      <g>
        <rect x={x} y={y} width={width} height={Math.abs(height)} fill={fill} rx={4} />
        <text x={x + width / 2} y={ecart < 0 ? y + Math.abs(height) + 14 : y - 5}
          textAnchor="middle" fontSize={10} fontWeight="bold" fill={fill}>
          {ecart > 0 ? "+" : ""}{ecart.toFixed(1)}h
        </text>
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
        <Tooltip contentStyle={{ borderRadius: "8px" }} formatter={(v, n) => [`${parseFloat(v).toFixed(2)}h`, n]} />
        <Bar dataKey="ecart" name="Écart (h)" shape={<CustomBar />} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── TUNISIA MAP ──
function TunisiaMap({ byClient }) {
  const [tooltip, setTooltip] = useState(null);
  const totalTickets = Object.values(byClient).reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 340 420" style={{ width: "100%", maxWidth: "300px", margin: "0 auto", display: "block" }}>
        <path d="M220,20 L260,25 L285,50 L290,80 L280,110 L295,140 L295,170 L280,200 L270,230 L265,260 L250,285 L240,310 L230,340 L215,360 L200,375 L185,370 L175,355 L165,330 L160,300 L155,270 L150,240 L145,210 L140,180 L138,150 L135,120 L140,90 L150,65 L165,40 L185,22 Z"
          fill="#e8f4fd" stroke="#7AAFD4" strokeWidth="2" />
        <line x1="140" y1="120" x2="295" y2="120" stroke="#c0d8ed" strokeWidth="0.5" strokeDasharray="4,4" />
        <line x1="140" y1="180" x2="290" y2="180" stroke="#c0d8ed" strokeWidth="0.5" strokeDasharray="4,4" />
        <line x1="145" y1="240" x2="275" y2="240" stroke="#c0d8ed" strokeWidth="0.5" strokeDasharray="4,4" />
        {TUNISIA_CITIES.map(city => {
          const ticketCount = city.clients.reduce((a, c) => a + (byClient[c] || 0), 0);
          const r = Math.max(8, Math.min(22, 6 + ticketCount / 15));
          const pct = ticketCount / totalTickets;
          const color = pct > 0.3 ? "#C8102E" : pct > 0.15 ? "#e94560" : pct > 0.05 ? "#0f3460" : "#7AAFD4";
          return (
            <g key={city.name}
              onMouseEnter={() => setTooltip({ ...city, ticketCount })}
              onMouseLeave={() => setTooltip(null)}>
              <circle className="map-dot" cx={city.x} cy={city.y} r={r}
                fill={color} fillOpacity={0.85} stroke="white" strokeWidth="1.5" />
              {ticketCount > 0 && (
                <text x={city.x} y={city.y + 1} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: "9px", fill: "white", fontWeight: "bold", pointerEvents: "none" }}>
                  {ticketCount}
                </text>
              )}
              <text x={city.x} y={city.y + r + 10} textAnchor="middle"
                style={{ fontSize: "9px", fontWeight: "bold", fill: "#1a1a2e", pointerEvents: "none" }}>
                {city.name}
              </text>
            </g>
          );
        })}
        <text x="310" y="150" fontSize="8" fill="#7AAFD4" transform="rotate(-90,310,150)">Méditerranée</text>
      </svg>
      {tooltip && (
        <div style={{ position: "absolute", top: "10px", left: "10px", background: "#1a1a2e", color: "white", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", pointerEvents: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>📍 {tooltip.name}</div>
          <div>Tickets : <strong>{tooltip.ticketCount}</strong></div>
          <div>Clients : <strong>{tooltip.clients.join(", ")}</strong></div>
        </div>
      )}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px", justifyContent: "center" }}>
        {[["#C8102E", ">30%"], ["#e94560", "15-30%"], ["#0f3460", "5-15%"], ["#7AAFD4", "<5%"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: c }} />
            <span style={{ fontSize: "11px", color: "#666" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BULLET CHART ──
function BulletChart({ data, title, colorScheme = "red" }) {
  const accent = colorScheme === "red" ? "#C8102E" : "#0f3460";
  return (
    <div>
      <div style={styles.cardTitle}>{title}</div>
      {data.map((item, i) => {
        const valuePct = Math.min((item.value / item.max) * 100, 100);
        const targetPct = Math.min((item.target / item.max) * 100, 100);
        const overTarget = item.value > item.target;
        return (
          <div key={i} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1a1a2e" }}>{item.label}</span>
              <span style={{ fontSize: "11px", color: "#666" }}>
                <span style={{ color: overTarget ? "#C8102E" : "#28a745", fontWeight: "bold" }}>{item.value.toFixed(1)}h</span>
                {" / "}{item.target}h objectif
              </span>
            </div>
            <div style={{ position: "relative", height: "22px", background: "#f0f2f5", borderRadius: "6px" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: `${Math.min((item.target / item.max) * 100 * 1.2, 100)}%`, height: "100%", background: "#e0e4ea", borderRadius: "6px" }} />
              <div className="bullet-bar" style={{ position: "absolute", left: 0, top: "4px", height: "14px", width: `${valuePct}%`, background: overTarget ? `linear-gradient(90deg,${accent},${accent}cc)` : "linear-gradient(90deg,#28a745,#1e7e34)", borderRadius: "4px" }} />
              <div style={{ position: "absolute", left: `${targetPct}%`, top: "-3px", width: "3px", height: "28px", background: "#1a1a2e", borderRadius: "2px", transform: "translateX(-50%)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
              <span style={{ fontSize: "10px", color: overTarget ? "#C8102E" : "#28a745", fontWeight: "bold" }}>
                {overTarget ? `⚠️ +${(item.value - item.target).toFixed(1)}h` : `✅ -${(item.target - item.value).toFixed(1)}h restant`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  const [mapTooltip, setMapTooltip] = useState(null);

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
      showMsg("⚠️ Veuillez remplir tous les champs !", "error"); return;
    }
    try {
      await API.post("/rules", { client_id: parseInt(newRuleClientId), user_id: parseInt(newRuleUserId), max_hours: parseFloat(newRuleMaxHours) });
      showMsg("✅ Règle per_user créée avec succès !");
      setNewRuleClientId(""); setNewRuleUserId(""); setNewRuleMaxHours("");
      loadData();
    } catch (err) { showMsg("❌ Erreur : " + err.message, "error"); }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Supprimer cette règle ?")) return;
    try {
      await API.delete(`/rules/${id}`);
      showMsg("✅ Règle supprimée !");
      loadData();
    } catch (err) { showMsg("❌ Erreur suppression", "error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("user");
    window.location.reload();
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const globalRules = rules.filter(r => r.rule_type === "global" || !r.user_id);
  const perUserRules = rules.filter(r => r.rule_type === "per_user" && r.user_id);

  const saasTickets = tickets.filter(t => t.ticket_type === "SAAS").length;
  const onpremTickets = tickets.filter(t => t.ticket_type === "ONPREM").length;
  const totalHeures = timeEntries.reduce((acc, e) => acc + parseFloat(e.hours_logged || 0), 0);
  const syncedCount = timeEntries.filter(e => e.synced_to_chronos).length;

  const ticketsByTypeData = [{ name: "SaaS", value: saasTickets }, { name: "On-Prem", value: onpremTickets }];

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

  // Data for new visualizations
  const byClient = tickets.filter(t => t.ticket_type === "SAAS").reduce((a, t) => {
    const n = t.client_name || "?"; a[n] = (a[n] || 0) + 1; return a;
  }, {});

  // Comparison data for Waterfall (admin sees all)
  const comparison = (() => {
    const byC = {};
    tickets.filter(t => t.ticket_type === "SAAS").forEach(t => {
      const c = t.client_name || "?";
      if (!byC[c]) byC[c] = { client: c, jira_hours: 0, chronos_hours: 0 };
      byC[c].jira_hours += 0.25;
    });
    stats?.byClient?.forEach(s => {
      const c = s.name || "?";
      if (!byC[c]) byC[c] = { client: c, jira_hours: 0, chronos_hours: 0 };
      byC[c].chronos_hours = parseFloat(s.total_hours || 0);
    });
    return Object.values(byC).map(c => ({
      ...c,
      ecart: (c.chronos_hours - c.jira_hours).toFixed(2),
      jira_hours: c.jira_hours.toFixed(2),
      chronos_hours: c.chronos_hours.toFixed(2)
    })).filter(c => Math.abs(parseFloat(c.ecart)) > 0);
  })();

  // Bullet chart — top clients vs their max
  const bulletData = stats?.byClient?.filter(c => c.max_hours_per_week > 0).slice(0, 6).map(c => ({
    label: c.name,
    value: parseFloat(c.total_hours || 0),
    target: parseFloat(c.max_hours_per_week) * 0.8,
    max: parseFloat(c.max_hours_per_week)
  })) || [];

  // Bullet chart — members
  const memberBulletData = stats?.byUser?.slice(0, 6).map(u => ({
    label: u.full_name?.split(" ")[0] || u.username,
    value: parseFloat(u.total_hours || 0),
    target: 32,
    max: 40
  })) || [];

  const syncRate = tickets.length > 0 ? ((syncedCount / timeEntries.length) * 100).toFixed(0) : "0";
  const syncPieData = [{ name: "Synchronisés", value: syncedCount }, { name: "Non sync", value: timeEntries.length - syncedCount }];

  const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const R = Math.PI / 180, r = innerRadius + (outerRadius - innerRadius) * 0.5;
    return <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
  };

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
          <button onClick={handleLogout} style={{ background: "#C8102E", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Déconnexion</button>
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
          {[
            { front: { icon: "🎫", label: "TOTAL TICKETS", value: tickets.length, bg: "linear-gradient(135deg,#C8102E,#a00c26)" }, back: { bg: "linear-gradient(135deg,#a00c26,#800a1e)", rows: [["☁️ SaaS", saasTickets], ["🖥️ On-Prem", onpremTickets], ["👥 Users", users.length]] } },
            { front: { icon: "🕐", label: "ENTRÉES DE TEMPS", value: timeEntries.length, bg: "linear-gradient(135deg,#1a1a2e,#0d0d1a)" }, back: { bg: "linear-gradient(135deg,#0d0d1a,#050510)", rows: [["✅ Sync", syncedCount], ["⏳ Non sync", timeEntries.length - syncedCount], ["📊 Total", `${totalHeures.toFixed(1)}h`]] } },
            { front: { icon: "👥", label: "MEMBRES SOC", value: users.length, bg: "linear-gradient(135deg,#0f3460,#092540)" }, back: { bg: "linear-gradient(135deg,#092540,#061830)", rows: [["🔐 Admins", users.filter(u => u.role === "admin").length], ["👤 Users", users.filter(u => u.role !== "admin").length], ["⚙️ Règles", rules.length]] } },
            { front: { icon: "⏱️", label: "HEURES TOTALES", value: `${totalHeures.toFixed(0)}h`, bg: "linear-gradient(135deg,#28a745,#1e7e34)" }, back: { bg: "linear-gradient(135deg,#1e7e34,#155724)", rows: [["☁️ SaaS", `${(saasTickets * 0.25).toFixed(1)}h`], ["🖥️ On-Prem", `${(onpremTickets * 0.25).toFixed(1)}h`], ["📊 Sync", `${syncRate}%`]] } },
            { front: { icon: "⚠️", label: "CLIENTS DÉPASSÉS", value: stats?.exceedingClients?.length || 0, bg: "linear-gradient(135deg,#ff9800,#cc7a00)" }, back: { bg: "linear-gradient(135deg,#cc7a00,#995c00)", rows: stats?.exceedingClients?.slice(0, 3).map(c => [`🔴 ${c.name}`, `${parseFloat(c.total_hours).toFixed(1)}h`]) || [["✅ Aucun", "dépassement"]] } },
          ].map((card, i) => (
            <div key={i} className="flip-card">
              <div className="flip-card-inner">
                <div className="flip-card-front" style={{ background: card.front.bg, color: "white" }}>
                  <div style={{ fontSize: "26px", marginBottom: "4px" }}>{card.front.icon}</div>
                  <div style={{ fontSize: "11px", opacity: 0.9 }}>{card.front.label}</div>
                  <div style={{ fontSize: "32px", fontWeight: "bold" }}>{card.front.value}</div>
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

        {/* TABS */}
        <div style={{ marginBottom: "0", borderBottom: "2px solid #e0e0e0", display: "flex", flexWrap: "wrap" }}>
          {["dashboard", "rules", "timeentries", "tickets", "users", "stats"].map(tab => (
            <button key={tab} style={styles.tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab === "dashboard" ? "📊 Dashboard" : tab === "rules" ? "⚙️ Règles" : tab === "timeentries" ? "🕐 Entrées de Temps" : tab === "tickets" ? "🎫 Tickets" : tab === "users" ? "👥 Users" : "📈 Stats"}
            </button>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: "0 12px 12px 12px", padding: "25px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

          {/* ═══ DASHBOARD TAB ═══ */}
          {activeTab === "dashboard" && (
            <div>
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: "12px", padding: "20px", marginBottom: "25px", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>Vue d'ensemble — Administration SOC VERMEG</div>
                <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "6px" }}>Supervision globale de l'équipe, des tickets et des performances</div>
              </div>

              {/* Row 1: Pie + Area */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>📊 Tickets SaaS vs On-Prem</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={ticketsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={70} outerRadius={110} labelLine={false} label={renderDonutLabel}>
                        <Cell fill="#C8102E" /><Cell fill="#0f3460" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🔄 Taux de Synchronisation — {syncRate}%</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={syncPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90} labelLine={false} label={renderDonutLabel}>
                        <Cell fill="#28a745" /><Cell fill="#ff9800" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 2: Bar members + Spider */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <div style={styles.cardTitle}>👥 Heures par Membre de l'Équipe</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={hoursByUserData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#666" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#666" width={70} fontSize={11} />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Bar dataKey="heures" name="Heures" radius={[0, 6, 6, 0]}>
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
                      <Legend /><Tooltip contentStyle={{ borderRadius: "8px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 3: Heures vs Max */}
              <div style={styles.cardTitle}>🎯 Heures Utilisées vs Max Autorisées — Par Client</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hoursByClientData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} /><Legend />
                  <Bar dataKey="heures" fill="#C8102E" radius={[6, 6, 0, 0]} name="Heures utilisées" />
                  <Bar dataKey="max" fill="#0f3460" radius={[6, 6, 0, 0]} name="Max autorisé" />
                </BarChart>
              </ResponsiveContainer>

              {/* ═══ 🌡️ HEATMAP ═══ */}
              <div style={{ ...styles.card, marginTop: "25px" }}>
                <div style={styles.cardTitle}>🌡️ Heatmap — Activité de l'Équipe par Jour & Heure</div>
                <p style={{ fontSize: "12px", color: "#888", marginTop: "-8px", marginBottom: "14px" }}>
                  Distribution de toutes les entrées Chronos par jour de la semaine et créneau horaire
                </p>
                <ActivityHeatmap timeEntries={timeEntries} />
              </div>

              {/* ═══ 📉 WATERFALL ═══ */}
              <div style={{ ...styles.card, marginTop: "20px" }}>
                <div style={styles.cardTitle}>📉 Waterfall Chart — Écarts Jira vs Chronos par Client</div>
                <p style={{ fontSize: "12px", color: "#888", marginTop: "-8px", marginBottom: "10px" }}>
                  🟠 Sur-déclaré (Chronos {">"} Jira) · 🔴 Sous-déclaré (Chronos {"<"} Jira) · 🟢 OK
                </p>
                <WaterfallChart comparison={comparison} />
              </div>

              {/* ═══ 🗺️ CARTE + 🎯 BULLET ═══ */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>🗺️ Carte Tunisie — Répartition Clients SaaS</div>
                  <p style={{ fontSize: "12px", color: "#888", marginTop: "-8px", marginBottom: "12px" }}>
                    Localisation géographique des clients par région
                  </p>
                  <TunisiaMap byClient={byClient} />
                </div>
                <div style={styles.card}>
                  <BulletChart data={bulletData} title="🎯 Bullet Chart — Objectifs vs Réalisé (Clients)" colorScheme="red" />
                  <div style={{ marginTop: "20px" }}>
                    <BulletChart data={memberBulletData} title="🎯 Bullet Chart — Objectifs vs Réalisé (Membres)" colorScheme="blue" />
                  </div>
                </div>
              </div>

              {/* Alertes dépassements */}
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

              {/* Évolution Heures */}
              <div style={{ ...styles.cardTitle, marginTop: "25px" }}>📈 Évolution Heures (30 derniers jours)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C8102E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={10} />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="heures" stroke="#C8102E" strokeWidth={2} fill="url(#adminGrad)" name="Heures" />
                </AreaChart>
              </ResponsiveContainer>

              {/* Jauges membres */}
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
                        <div style={{ height: "5px", background: color, borderRadius: "3px", width: `${percent}%` }} />
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

          {/* ═══ RULES TAB ═══ */}
          {activeTab === "rules" && (
            <div>
              <div style={styles.cardTitle}>⚙️ Règles Globales — Max Heures par Client</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Max Heures</th><th style={styles.th}>Action</th></tr></thead>
                <tbody>
                  {globalRules.map((rule, i) => (
                    <tr key={rule.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}>{rule.id}</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{rule.client?.name || "—"}</span></td>
                      <td style={styles.td}><span style={styles.badge("#0f3460")}>{rule.rule_type}</span></td>
                      <td style={styles.td}><input type="number" style={styles.input} defaultValue={rule.max_hours} id={`rule-${rule.id}`} /></td>
                      <td style={styles.td}><button style={styles.btnModify} onClick={() => { const val = document.getElementById(`rule-${rule.id}`).value; handleUpdateRule(rule.id, val); }}>Modifier</button></td>
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
                    <input type="number" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }} placeholder="ex: 20" value={newRuleMaxHours} onChange={e => setNewRuleMaxHours(e.target.value)} />
                  </div>
                  <button onClick={handleCreateUserRule} style={{ background: "#28a745", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>✅ Créer</button>
                </div>
              </div>

              {perUserRules.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "13px" }}>Aucune règle per_user définie.</div>
              ) : (
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Client</th><th style={styles.th}>Membre SOC</th><th style={styles.th}>Max Heures</th><th style={styles.th}>Actions</th></tr></thead>
                  <tbody>
                    {perUserRules.map((rule, i) => (
                      <tr key={rule.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={styles.td}>{rule.id}</td>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{rule.client?.name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{rule.user?.full_name || "—"}</span></td>
                        <td style={styles.td}><input type="number" style={styles.input} defaultValue={rule.max_hours} id={`rule-${rule.id}`} /></td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button style={styles.btnModify} onClick={() => { const val = document.getElementById(`rule-${rule.id}`).value; handleUpdateRule(rule.id, val); }}>Modifier</button>
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

          {/* ═══ TIME ENTRIES TAB ═══ */}
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
                <button onClick={handleFilterTimeEntries} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={handleResetTimeEntries} style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
              </div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>User</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Slot Horaire</th><th style={styles.th}>Heures</th><th style={styles.th}>Date</th><th style={styles.th}>Synchronisé</th></tr></thead>
                  <tbody>
                    {timeEntries.map((entry, i) => (
                      <tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={styles.td}>{entry.id}</td>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{entry.user_name || entry.user_id}</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{entry.client_name || "—"}</span></td>
                        <td style={styles.td}><span style={styles.badge(entry.ticket_type === "SAAS" ? "#C8102E" : "#0f3460")}>{entry.ticket_type}</span></td>
                        <td style={styles.td}><span style={{ fontSize: "12px", fontFamily: "monospace", background: "#f0f0f0", padding: "3px 8px", borderRadius: "4px" }}>{entry.slot_start} → {entry.slot_end}</span></td>
                        <td style={styles.td}><span style={styles.badge("#28a745")}>{entry.hours_logged}h</span></td>
                        <td style={styles.td}>{entry.date}</td>
                        <td style={styles.td}><span style={styles.badge(entry.synced_to_chronos ? "#28a745" : "#ff9800")}>{entry.synced_to_chronos ? "✅ Oui" : "⏳ Non"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ TICKETS TAB ═══ */}
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
                <button onClick={handleFilterTickets} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={handleResetTickets} style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
              </div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Assignee</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Date</th></tr></thead>
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

          {/* ═══ USERS TAB ═══ */}
          {activeTab === "users" && (
            <div>
              <div style={styles.cardTitle}>👥 Membres de l'équipe SOC ({users.length})</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Username</th><th style={styles.th}>Nom Complet</th><th style={styles.th}>Rôle</th></tr></thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={styles.td}>{user.id}</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{user.username}</span></td>
                      <td style={styles.td}>{user.full_name}</td>
                      <td style={styles.td}><span style={styles.badge(user.role === "admin" ? "#C8102E" : "#28a745")}>{user.role === "admin" ? "🔐 Admin" : "👤 User"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ STATS TAB ═══ */}
          {activeTab === "stats" && stats && (
            <div>
              <div style={styles.cardTitle}>📈 Statistiques — Heures par Client et par User</div>
              {stats.exceedingClients?.length > 0 && (
                <div style={{ background: "#fff5f5", border: "2px solid #C8102E", borderRadius: "10px", padding: "15px", marginBottom: "20px" }}>
                  <div style={{ color: "#C8102E", fontWeight: "bold", marginBottom: "10px" }}>⚠️ Clients ayant dépassé la limite :</div>
                  {stats.exceedingClients.map((c, i) => (
                    <div key={i} style={{ padding: "5px 0", color: "#C8102E" }}>🔴 {c.name} : {parseFloat(c.total_hours).toFixed(2)}h / {c.max_hours_per_week}h max</div>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#1a1a2e" }}>📊 Heures par Client</div>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Tickets</th><th style={styles.th}>Heures</th><th style={styles.th}>Max</th></tr></thead>
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
                    <thead><tr><th style={styles.th}>User</th><th style={styles.th}>Tickets</th><th style={styles.th}>SaaS</th><th style={styles.th}>On-Prem</th><th style={styles.th}>Total</th></tr></thead>
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