import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function App() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [loggedIn, setLoggedIn] = useState(!!token);
  const [userRole, setUserRole] = useState(role || "");

  const handleLogin = (role) => {
    setLoggedIn(true);
    setUserRole(role);
    localStorage.setItem("role", role);
  };

  if (!loggedIn) return <Login onLogin={handleLogin} />;
  if (userRole === "admin") return <Admin />;
  return <Dashboard />;
}

export default App;