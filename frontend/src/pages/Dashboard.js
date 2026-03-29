import { useEffect, useState } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CFE"];

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    API.get("/tickets").then(res => setTickets(res.data));
  }, []);

  const handleSync = async () => {
    const res = await API.post("/sync");
    setSyncMsg(res.data.message);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const totalTime = tickets.length * 15;

  const byClient = tickets.reduce((acc, t) => {
    acc[t.client] = (acc[t.client] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(byClient).map(([client, count]) => ({
    client,
    tickets: count,
    heures: count * 0.25
  }));

  const pieData = Object.entries(byClient).map(([client, count]) => ({
    name: client,
    value: count
  }));

  return (
    <div className="bg-dark min-vh-100 text-white">

      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold fs-4">🛡️ SOC Dashboard</span>
        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Déconnexion
        </button>
      </nav>

      <div className="container-fluid p-4">

        {/* KPI Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card bg-primary text-white text-center p-3">
              <h6>Total Tickets</h6>
              <h2 className="fw-bold">{tickets.length}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success text-white text-center p-3">
              <h6>Temps Total</h6>
              <h2 className="fw-bold">{totalTime} min</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-info text-white text-center p-3">
              <h6>Clients</h6>
              <h2 className="fw-bold">{Object.keys(byClient).length}</h2>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="row mb-4">

          {/* Bar Chart */}
          <div className="col-md-6">
            <div className="card bg-secondary p-3">
              <h5 className="text-white mb-3">📊 Tickets par Client</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="client" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="col-md-6">
            <div className="card bg-secondary p-3">
              <h5 className="text-white mb-3">🥧 Répartition par Client</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="card bg-secondary p-3 mb-4">
          <h5 className="text-white mb-3">🎫 Liste des Tickets</h5>
          <table className="table table-dark table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Client</th>
                <th>Temps</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td><span className="badge bg-primary">{ticket.id}</span></td>
                  <td>{ticket.title}</td>
                  <td><span className="badge bg-info">{ticket.client}</span></td>
                  <td>15 min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sync Button */}
        <div className="text-center">
          <button
            className="btn btn-warning fw-bold px-5 py-2"
            onClick={handleSync}
          >
            🔄 Synchroniser vers Chronos
          </button>
          {syncMsg && (
            <div className="alert alert-success mt-3">
              ✅ {syncMsg}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;