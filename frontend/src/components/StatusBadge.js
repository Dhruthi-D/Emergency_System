import React from "react";

export const statusMeta = {
  pending: { label: "Pending", color: "#f8c14a", background: "rgba(248, 193, 74, 0.14)" },
  dispatched: { label: "Dispatched", color: "#5cc8ff", background: "rgba(92, 200, 255, 0.14)" },
  in_progress: { label: "In Progress", color: "#ff9f43", background: "rgba(255, 159, 67, 0.14)" },
  completed: { label: "Completed", color: "#4ade80", background: "rgba(74, 222, 128, 0.14)" },
  fake: { label: "Cleared", color: "#fb7185", background: "rgba(251, 113, 133, 0.14)" },
};

export const incidentTypeMeta = {
  accident: { label: "Accident", icon: "A", color: "#ff6b6b", background: "rgba(255, 107, 107, 0.14)" },
  fire: { label: "Fire", icon: "F", color: "#ff9f43", background: "rgba(255, 159, 67, 0.14)" },
  gas: { label: "Gas Leak", icon: "G", color: "#b088ff", background: "rgba(176, 136, 255, 0.14)" },
  health: { label: "Health", icon: "H", color: "#34d399", background: "rgba(52, 211, 153, 0.14)" },
};

const baseStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  borderRadius: 999,
  border: "1px solid currentColor",
  padding: "5px 9px",
  fontSize: 12,
  lineHeight: 1,
  fontWeight: 800,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

export function StatusBadge({ status, compact = false, style }) {
  const meta = statusMeta[status] || { label: status || "Unknown", color: "#cbd5e1", background: "rgba(203, 213, 225, 0.12)" };
  return (
    <span
      style={{
        ...baseStyle,
        color: meta.color,
        background: meta.background,
        padding: compact ? "4px 7px" : baseStyle.padding,
        fontSize: compact ? 11 : baseStyle.fontSize,
        ...style,
      }}
    >
      {meta.label}
    </span>
  );
}

export function IncidentTypeBadge({ type, compact = false, style }) {
  const meta = incidentTypeMeta[type] || { label: type || "Incident", icon: "I", color: "#cbd5e1", background: "rgba(203, 213, 225, 0.12)" };
  return (
    <span
      style={{
        ...baseStyle,
        color: meta.color,
        background: meta.background,
        padding: compact ? "4px 7px" : baseStyle.padding,
        fontSize: compact ? 11 : baseStyle.fontSize,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: compact ? 16 : 18,
          height: compact ? 16 : 18,
          borderRadius: 999,
          background: meta.color,
          color: "#10131b",
          fontSize: compact ? 10 : 11,
          fontWeight: 900,
        }}
      >
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

export function getIncidentTypeMeta(type) {
  return incidentTypeMeta[type] || incidentTypeMeta.accident;
}

export default StatusBadge;
