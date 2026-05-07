import React, { useState } from "react";
import api, { setToken } from "../services/api";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "citizen" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    try {
      const endpoint = mode === "login" ? "login/" : "register/";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      setToken(data.access);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuth(data.user);
    } catch (e) {
      setError(e.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at top, #1f2937 0%, #0b1220 55%)", padding: 16 }}>
      <div style={{ width: "min(95vw, 520px)", padding: "clamp(18px, 4.2vw, 28px) clamp(16px, 4vw, 24px)", background: "#111827", borderRadius: 20, border: "1px solid #1f2937", boxShadow: "0 24px 54px rgba(0,0,0,0.45)" }}>
        <div style={{ color: "#93c5fd", fontWeight: 800, letterSpacing: 0.5, marginBottom: 8, fontSize: "clamp(13px, 2.8vw, 15px)" }}>Smart City Emergency</div>
        <h2 style={{ margin: "0 0 8px", fontSize: "clamp(28px, 6vw, 38px)", lineHeight: 1.08 }}>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
        <div style={{ color: "#94a3b8", marginBottom: 18, fontSize: "clamp(15px, 3.7vw, 17px)", lineHeight: 1.4 }}>
          {mode === "login" ? "Sign in to access dashboards and live incident updates." : "Register to report incidents and coordinate response."}
        </div>
        {mode === "register" && (
          <input
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 10, padding: "13px 14px", borderRadius: 12, border: "1px solid #374151", background: "#0f172a", color: "#fff", fontSize: "clamp(15px, 3.7vw, 17px)" }}
          />
        )}
        <input
          placeholder="Email Address"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ width: "100%", boxSizing: "border-box", marginBottom: 10, padding: "13px 14px", borderRadius: 12, border: "1px solid #374151", background: "#0f172a", color: "#fff", fontSize: "clamp(15px, 3.7vw, 17px)" }}
        />
        <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    onChange={(e) => setForm({ ...form, password: e.target.value })}
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "13px 45px 13px 14px",
      borderRadius: 12,
      border: "1px solid #374151",
      background: "#0f172a",
      color: "#fff",
      fontSize: "clamp(15px, 3.7vw, 17px)"
    }}
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      background: "transparent",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      fontSize: "14px"
    }}
  >
    {showPassword ? "Hide" : "Show"}
  </button>
        {mode === "register" && (
          <select
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 10, padding: "13px 14px", borderRadius: 12, border: "1px solid #374151", background: "#0f172a", color: "#fff", fontSize: "clamp(15px, 3.7vw, 17px)" }}
          >
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {error && <div style={{ color: "#f87171", marginBottom: 10, fontSize: "clamp(13px, 3.5vw, 15px)" }}>{error}</div>}
        <button
          onClick={submit}
          style={{ width: "100%", boxSizing: "border-box", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: "13px 14px", fontWeight: 700, fontSize: "clamp(15px, 3.7vw, 17px)", cursor: "pointer" }}
        >
          {mode === "login" ? "Login" : "Create Account"}
        </button>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{ width: "100%", boxSizing: "border-box", marginTop: 10, background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151", borderRadius: 12, padding: "12px 14px", fontWeight: 600, fontSize: "clamp(14px, 3.5vw, 16px)", cursor: "pointer" }}
        >
          {mode === "login" ? "Switch to Register" : "Switch to Login"}
        </button>
      </div>
    </div>
  );
}
