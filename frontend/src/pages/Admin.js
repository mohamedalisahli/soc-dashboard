import { useEffect, useState } from "react";
import API from "../services/api";

const styles = {
  navbar: {
    background: "#1a1a2e",
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
  },
  badge: (bg) => ({
    background: bg,
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold"
  }),
  input: {
    padding: "8px 12px",
    border: "2px solid #e0e0e0",
    borderRadius: "6px",
    width: "80px",
    fontSize: "14px",
    outline: "none"
  },
  btnModify: {
    background: "#C8102E",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px"
  }
};

function Admin() {
  const [rules, setRules] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    API.get("/rules").then(res => setRules(res.data));
    API.get("/admin/time-entries").then(res => setTimeEntries(res.data));
  }, []);

  const handleUpdateRule = async (id, max_hours) => {
    await API.put(`/rules/${id}`, { max_hours: parseFloat(max_hours) });
    setMsg("✅ Règle mise à jour avec succès !");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.reload();
  };

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
  <img src="/vermeg_logo2.png" alt="Vermeg" style={{ height: "70px" }} />
  <span style={styles.brand}>ADMIN PANEL</span>
</div>
        <button
          onClick={handleLogout}
          style={{ background: "#C8102E", color: "white", border: "none", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          Déconnexion
        </button>
      </nav>

      <div style={styles.container}>

        {/* Alert */}
        {msg && (
          <div style={{ padding: "12px 20px", background: "#f0fff4", border: "1px solid #28a745", borderRadius: "8px", color: "#28a745", marginBottom: "20px", fontWeight: "bold" }}>
            {msg}
          </div>
        )}

        {/* Rules Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>⚙️ Règles Métier — Max Heures par Client</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Max Heures</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => (
                <tr key={rule.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={styles.td}>{rule.id}</td>
                  <td style={styles.td}>
                    <span style={styles.badge("#1a1a2e")}>{rule.client_name}</span>
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      style={styles.input}
                      defaultValue={rule.max_hours}
                      id={`rule-${rule.id}`}
                    />
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.btnModify}
                      onClick={() => {
                        const val = document.getElementById(`rule-${rule.id}`).value;
                        handleUpdateRule(rule.id, val);
                      }}
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Time Entries Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🕐 Toutes les Entrées de Temps</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>User ID</th>
                <th style={styles.th}>Client ID</th>
                <th style={styles.th}>Heures</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry, i) => (
                <tr key={entry.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={styles.td}>{entry.id}</td>
                  <td style={styles.td}>{entry.user_id}</td>
                  <td style={styles.td}>{entry.client_id}</td>
                  <td style={styles.td}>
                    <span style={styles.badge("#28a745")}>{entry.hours_logged}h</span>
                  </td>
                  <td style={styles.td}>{entry.date}</td>
                  <td style={styles.td}>
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {entry.chronos_entry_id || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default Admin;