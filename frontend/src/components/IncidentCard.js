import React from "react";

const statusColor = {
  pending: "#facc15",
  dispatched: "#3b82f6",
  in_progress: "#f97316",
  completed: "#22c55e",
};

export default function IncidentCard({ incident, onDispatch, onSelect }) {
  return (
    <div
      onClick={() => onSelect?.(incident)}
      style={{
        background: "linear-gradient(180deg, #161b22 0%, #111827 100%)",
        borderRadius: 14,
        padding: 15,
        marginBottom: 12,
        border: `1px solid ${statusColor[incident.status] || "#374151"}`,
        cursor: onSelect ? "pointer" : "default",
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong style={{ letterSpacing: 0.3 }}>{incident.type.toUpperCase()}</strong>
        <span style={{ color: statusColor[incident.status], textTransform: "capitalize", fontWeight: 600 }}>{incident.status.replace("_", " ")}</span>
      </div>
      <div style={{ color: "#94a3b8", marginTop: 6 }}>{incident.description || "No description"}</div>
      {onDispatch && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDispatch(incident);
          }}
          style={{ marginTop: 10, background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontWeight: 600 }}
        >
          Dispatch
        </button>
      )}
    </div>
  );
}
