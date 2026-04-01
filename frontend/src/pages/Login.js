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
        <div style={{
          background: "#f0f0f0",
          padding: "30px",
          textAlign: "center"
        }}>
          <img
  src="/Vermeg_logo.png"
  alt="Vermeg"
  style={{ height: "70px", marginBottom: "8px" }}
/>
          <p style={{
            color: "#666",
            margin: "8px 0 0 0",
            fontSize: "13px",
            letterSpacing: "1px"
          }}>SOC DASHBOARD</p>
        </div>

        {/* Form */}
        <div style={{ padding: "35px" }}>
          <h4 style={{
            color: "#1a1a2e",
            marginBottom: "25px",
            fontWeight: "bold",
            textAlign: "center"
          }}>Connexion</h4>

          <div style={{ marginBottom: "18px" }}>
            <label style={{
              display: "block",
              marginBottom: "6px",
              color: "#444",
              fontWeight: "bold",
              fontSize: "13px"
            }}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Entrez votre username"
              style={{
                width: "100%",
                padding: "12px 15px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.3s"
              }}
              onFocus={e => e.target.style.borderColor = "#C8102E"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "6px",
              color: "#444",
              fontWeight: "bold",
              fontSize: "13px"
            }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Entrez votre password"
              style={{
                width: "100%",
                padding: "12px 15px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box"
              }}
              onFocus={e => e.target.style.borderColor = "#C8102E"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          {error && (
            <div style={{
              background: "#fff0f0",
              border: "1px solid #C8102E",
              color: "#C8102E",
              padding: "10px 15px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "13px"
            }}>⚠️ {error}</div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "13px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "1px",
              transition: "background 0.3s"
            }}
            onMouseOver={e => e.target.style.background = "#5a6268"}
            onMouseOut={e => e.target.style.background = "#6c757d"}
          >
            SE CONNECTER
          </button>

          <div style={{
            marginTop: "20px",
            padding: "12px",
            background: "#f8f8f8",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#666",
            textAlign: "center"
          }}>
            👤 User: SOCUSER / password123<br/>
            🔐 Admin: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;