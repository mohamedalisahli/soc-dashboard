import { useState } from "react";
import API from "../services/api";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await API.post("/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      onLogin(res.data.role);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">🛡️ SOC Dashboard</h2>
          <p className="text-muted">Connectez-vous pour accéder au dashboard</p>
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold">Username</label>
          <input
            type="text"
            className="form-control"
            placeholder="Entrez votre username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Entrez votre password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button
          className="btn btn-primary w-100 fw-bold"
          onClick={handleLogin}
        >
          Se connecter
        </button>
        <div className="mt-3 p-2 bg-light rounded">
          <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
            👤 User: SOCUSER / password123
          </p>
          <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
            🔐 Admin: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;