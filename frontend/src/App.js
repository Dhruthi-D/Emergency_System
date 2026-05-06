import React, { useState } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import { setToken } from "./services/api";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    setToken("");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <div>
      <button onClick={logout} style={{ position: "fixed", top: 12, right: 12, zIndex: 1000, background: "#111827", border: "1px solid #374151", color: "#fff", borderRadius: 10, padding: "9px 12px", fontWeight: 600 }}>
        Logout
      </button>
      {user.role === "admin" ? <AdminDashboard /> : <CitizenDashboard />}
    </div>
  );
}
