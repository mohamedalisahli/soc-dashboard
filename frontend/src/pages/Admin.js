import { useEffect, useState } from "react";
import API from "../services/api";

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
    setMsg("Règle mise à jour ✅");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="bg-dark min-vh-100 text-white">

      {/* Navbar */}
      <nav className="navbar navbar-dark bg-danger px-4">
        <span className="navbar-brand fw-bold fs-4">🔐 Admin Panel — SOC Dashboard</span>
        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Déconnexion
        </button>
      </nav>

      <div className="container-fluid p-4">

        {msg && <div className="alert alert-success">{msg}</div>}

        {/* Rules Table */}
        <div className="card bg-secondary p-3 mb-4">
          <h5 className="text-white mb-3">⚙️ Règles Métier (Max Heures par Client)</h5>
          <table className="table table-dark table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Max Heures</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td>{rule.id}</td>
                  <td><span className="badge bg-info">{rule.client_name}</span></td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-dark text-white"
                      defaultValue={rule.max_hours}
                      id={`rule-${rule.id}`}
                      style={{ width: "100px" }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm"
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
        <div className="card bg-secondary p-3">
          <h5 className="text-white mb-3">🕐 Toutes les Entrées de Temps</h5>
          <table className="table table-dark table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Client ID</th>
                <th>Heures</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.id}</td>
                  <td>{entry.user_id}</td>
                  <td>{entry.client_id}</td>
                  <td><span className="badge bg-success">{entry.hours_logged}h</span></td>
                  <td>{entry.date}</td>
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