import { useEffect, useState } from "react";
import API from "../services/api";

const styles = {
  navbar: {
    background: "#1a1a2e", padding: "0 30px", height: "60px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
  },
  brand: { color: "white", fontSize: "20px", fontWeight: "bold", letterSpacing: "2px" },
  page: { minHeight: "100vh", background: "#f4f6f9", fontFamily: "Arial, sans-serif" },
  container: { padding: "25px" },
  card: {
    background: "white", borderRadius: "10px", padding: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)", marginBottom: "20px"
  },
  cardTitle: {
    color: "#1a1a2e", fontWeight: "bold", fontSize: "16px", marginBottom: "15px",
    borderBottom: "2px solid #C8102E", paddingBottom: "8px"
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#1a1a2e", color: "white", padding: "12px 15px", textAlign: "left", fontSize: "13px" },
  td: { padding: "12px 15px", borderBottom: "1px solid #f0f0f0", fontSize: "14px", color: "#333" },
  badge: (bg) => ({ background: bg, color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }),
  input: { padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "6px", width: "80px", fontSize: "14px", outline: "none" },
  btnModify: { background: "#C8102E", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  filterSelect: { padding: "8px 12px", borderRadius: "6px", border: "2px solid #e0e0e0", fontSize: "13px", outline: "none", marginRight: "10px", cursor: "pointer" },
  tabBtn: (active) => ({
    padding: "10px 20px", borderRadius: "8px 8px 0 0", fontWeight: "bold",
    cursor: "pointer", fontSize: "14px", margin: "0 4px 0 0", border: "none",
    background: active ? "white" : "#e0e0e0", color: active ? "#C8102E" : "#666",
    borderBottom: active ? "3px solid #C8102E" : "none"
  }),
  kpiCard: (bg) => ({
    background: bg, borderRadius: "10px", padding: "15px", textAlign: "center",
    color: "white", boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
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
  const [activeTab, setActiveTab] = useState("rules");

  const [filterClient, setFilterClient] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Formulaire nouvelle règle per_user
  const [newRuleClientId, setNewRuleClientId] = useState("");
  const [newRuleUserId, setNewRuleUserId] = useState("");
  const [newRuleMaxHours, setNewRuleMaxHours] = useState("");

  // eslint-disable-next-line
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [rulesRes, usersRes, statsRes] = await Promise.all([
        API.get("/rules"),
        API.get("/admin/users"),
        API.get("/admin/stats")
      ]);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);

      // Extraire les clients depuis les règles
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
    loadTimeEntries();
    loadTickets();
  };

  const loadTimeEntries = async () => {
    try {
      const params = {};
      if (filterClient) params.client_id = filterClient;
      if (filterUser) params.user_id = filterUser;
      if (filterType) params.ticket_type = filterType;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      const res = await API.get("/admin/time-entries", { params });
      setTimeEntries(res.data);
    } catch (err) { console.error(err); }
  };

  const loadTickets = async () => {
    try {
      const params = {};
      if (filterClient) params.client_id = filterClient;
      if (filterUser) params.user_id = filterUser;
      if (filterType) params.ticket_type = filterType;
      const res = await API.get("/admin/tickets", { params });
      setTickets(res.data);
    } catch (err) { console.error(err); }
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

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{ height: "45px" }} />
          <span style={styles.brand}>ADMIN PANEL</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ color: "white", fontSize: "13px" }}>👤 {currentUser.full_name || "Admin"}</span>
          <button onClick={handleLogout} style={{ background: "#C8102E", color: "white", border: "none", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
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

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "25px" }}>
          <div style={styles.kpiCard("#C8102E")}>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>TOTAL TICKETS</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{tickets.length}</div>
          </div>
          <div style={styles.kpiCard("#1a1a2e")}>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>ENTRÉES DE TEMPS</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{timeEntries.length}</div>
          </div>
          <div style={styles.kpiCard("#0f3460")}>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>MEMBRES SOC</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{users.length}</div>
          </div>
          <div style={styles.kpiCard("#C8102E")}>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>CLIENTS DÉPASSÉS</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{stats?.exceedingClients?.length || 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: "0", borderBottom: "2px solid #e0e0e0" }}>
          {["rules", "timeentries", "tickets", "users", "stats"].map(tab => (
            <button key={tab} style={styles.tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab === "rules" ? "⚙️ Règles" : tab === "timeentries" ? "🕐 Entrées de Temps" : tab === "tickets" ? "🎫 Tickets" : tab === "users" ? "👥 Users" : "📊 Stats"}
            </button>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: "0 10px 10px 10px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>

          {/* RULES TAB */}
          {activeTab === "rules" && (
            <div>
              {/* RÈGLES GLOBALES */}
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

              {/* RÈGLES PER_USER */}
              <div style={{ ...styles.cardTitle, marginTop: "30px" }}>👤 Règles par Utilisateur — Max Heures par User par Client</div>

              {/* Formulaire création */}
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

              {/* Table des règles per_user */}
              {perUserRules.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "13px" }}>
                  Aucune règle per_user définie. Créez-en une ci-dessus.
                </div>
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
                        <td style={styles.td} style={{ display: "flex", gap: "8px" }}>
                          <button style={styles.btnModify} onClick={() => {
                            const val = document.getElementById(`rule-${rule.id}`).value;
                            handleUpdateRule(rule.id, val);
                          }}>Modifier</button>
                          <button style={{ ...styles.btnModify, background: "#666" }} onClick={() => handleDeleteRule(rule.id)}>
                            🗑️ Supprimer
                          </button>
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
              <div style={styles.cardTitle}>🕐 Toutes les Entrées de Temps</div>
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
                <button onClick={loadTimeEntries} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={() => { setFilterClient(""); setFilterUser(""); setFilterType(""); setFilterDateFrom(""); setFilterDateTo(""); setTimeout(loadTimeEntries, 100); }}
                  style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
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
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{entry.client_name || entry.client_id}</span></td>
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
              <div style={styles.cardTitle}>🎫 Tous les Tickets</div>
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
                <button onClick={loadTickets} style={{ ...styles.btnModify, background: "#C8102E" }}>🔍 Filtrer</button>
                <button onClick={() => { setFilterType(""); setFilterUser(""); setTimeout(loadTickets, 100); }}
                  style={{ ...styles.btnModify, background: "#666" }}>Réinitialiser</button>
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
              <div style={styles.cardTitle}>👥 Membres de l'équipe SOC</div>
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
              <div style={styles.cardTitle}>📊 Statistiques — Heures par Client et par User</div>

              {stats.exceedingClients?.length > 0 && (
                <div style={{ background: "#fff5f5", border: "1px solid #C8102E", borderRadius: "8px", padding: "15px", marginBottom: "20px" }}>
                  <div style={{ color: "#C8102E", fontWeight: "bold", marginBottom: "10px" }}>⚠️ Clients ayant dépassé la limite d'heures :</div>
                  {stats.exceedingClients.map((c, i) => (
                    <div key={i} style={{ padding: "5px 0", color: "#C8102E" }}>
                      • {c.name} : {parseFloat(c.total_hours).toFixed(2)}h / {c.max_hours_per_week}h max
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
                        <th style={styles.th}>Heures</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byUser?.map((s, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{s.full_name}</span></td>
                          <td style={styles.td}>{s.total_tickets}</td>
                          <td style={styles.td}><span style={styles.badge("#0f3460")}>{parseFloat(s.total_hours || 0).toFixed(2)}h</span></td>
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