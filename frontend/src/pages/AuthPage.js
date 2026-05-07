import React, { useState } from "react";
import api, { setToken } from "../services/api";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "citizen",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Submit Form
  const submit = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint = mode === "login" ? "login/" : "register/";

      const payload =
        mode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : form;

      const { data } = await api.post(endpoint, payload);

      setToken(data.access);

      localStorage.setItem("user", JSON.stringify(data.user));

      onAuth(data.user);
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Enter Key Support
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      submit();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #111827 50%, #1e293b 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "rgba(17, 24, 39, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.45)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#60a5fa",
              letterSpacing: "1px",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}
          >
            Smart City Emergency
          </div>

          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "clamp(28px, 5vw, 38px)",
              fontWeight: "800",
            }}
          >
            {mode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </h1>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "10px",
              fontSize: "15px",
              lineHeight: "1.5",
            }}
          >
            {mode === "login"
              ? "Login to access emergency dashboards and incident reports."
              : "Register to report incidents and coordinate response."}
          </p>
        </div>

        {/* Name */}
        {mode === "register" && (
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email Address"
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />

        {/* Password */}
        <div
          style={{
            position: "relative",
            marginBottom: "14px",
          }}
        >
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            onKeyDown={handleKeyDown}
            style={{
              ...inputStyle,
              marginBottom: 0,
              paddingRight: "70px",
            }}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#60a5fa",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Role */}
        {mode === "register" && (
          <select
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
            style={inputStyle}
          >
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
          </select>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              padding: "12px",
              borderRadius: "12px",
              marginBottom: "14px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background:
              "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "16px",
            cursor: "pointer",
            transition: "0.2s",
            marginTop: "6px",
          }}
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>

        {/* Switch Mode */}
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            onClick={() =>
              setMode(
                mode === "login"
                  ? "register"
                  : "login"
              )
            }
            style={{
              background: "transparent",
              border: "none",
              color: "#60a5fa",
              marginLeft: "6px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {mode === "login"
              ? "Register"
              : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Input Style
const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: "14px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #374151",
  background: "#0f172a",
  color: "#ffffff",
  fontSize: "16px",
  outline: "none",
};