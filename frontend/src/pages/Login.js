import { useState } from "react";
import API from "../services/api";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.role);
    } catch (err) {
      setError("Identifiants invalides. Vérifiez votre username et password.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "0",
        width: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        overflow: "hidden"
      }}>
        {/* Header Vermeg */}
        <div style={{ background: "#f0f0f0", padding: "30px", textAlign: "center" }}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{ height: "70px", marginBottom: "8px" }} />
          <p style={{ color: "#666", margin: "8px 0 0 0", fontSize: "13px", letterSpacing: "1px" }}>SOC DASHBOARD</p>
        </div>

        {/* Form */}
        <div style={{ padding: "35px" }}>
          <h4 style={{ color: "#1a1a2e", marginBottom: "25px", fontWeight: "bold", textAlign: "center" }}>Connexion</h4>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "#444", fontWeight: "bold", fontSize: "13px" }}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleLogin()}
              placeholder="ex: wissem.saadli"
              style={{ width: "100%", padding: "12px 15px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#C8102E"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "#444", fontWeight: "bold", fontSize: "13px" }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleLogin()}
              placeholder="password123"
              style={{ width: "100%", padding: "12px 15px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#C8102E"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #C8102E", color: "#C8102E", padding: "10px 15px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px" }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", padding: "13px", background: loading ? "#999" : "#C8102E", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "1px" }}
          >
            {loading ? "⏳ Connexion..." : "SE CONNECTER"}
          </button>

          <div style={{ marginTop: "20px", padding: "12px", background: "#f8f8f8", borderRadius: "8px", fontSize: "12px", color: "#666" }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#1a1a2e" }}>👥 Comptes disponibles :</div>
            <div>👤 <strong>socuser</strong> / password123</div>
            <div>🔐 <strong>wissem.saadli</strong> / password123 (Admin)</div>
            <div>👤 <strong>khaled.ksibi</strong> / password123</div>
            <div>👤 <strong>ahmed.samti</strong> / password123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;