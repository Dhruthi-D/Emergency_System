import React from "react";
import { getIncidentTypeMeta, StatusBadge } from "./StatusBadge";

const relativeTime = (value) => {
  if (!value) return "Just now";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 45) return "Just now";
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["min", 60],
  ];
  const [unit, size] = units.find(([, size]) => seconds >= size) || ["sec", 1];
  const count = Math.floor(seconds / size);
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
};

const coordinateText = (incident) => {
  const lat = Number(incident.latitude);
  const lng = Number(incident.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Location unavailable";
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

export default function IncidentCard({ incident, onDispatch, onSelect, active = false }) {
  const typeMeta = getIncidentTypeMeta(incident.type);
  const isInteractive = Boolean(onSelect);

  const handleSelect = () => {
    onSelect?.(incident);
  };

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect();
        }
      }}
      className={`incident-card ${active ? "incident-card-active" : ""}`}
      style={{
        "--incident-color": typeMeta.color,
        background: "linear-gradient(145deg, rgba(22, 29, 43, 0.92), rgba(9, 14, 25, 0.96))",
        borderRadius: 8,
        padding: 14,
        marginBottom: 11,
        border: `1px solid ${active ? typeMeta.color : "rgba(255,255,255,0.11)"}`,
        borderLeft: `4px solid ${typeMeta.color}`,
        cursor: isInteractive ? "pointer" : "default",
        boxShadow: active ? `0 0 0 1px ${typeMeta.color}, 0 14px 34px rgba(0,0,0,0.34)` : `0 9px 28px rgba(0,0,0,0.23), 0 0 18px ${typeMeta.color}20`,
        transition: "transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease",
        outline: "none",
      }}
    >
      <style>{`
        .incident-card:hover,
        .incident-card:focus-visible {
          transform: translateY(-2px);
          border-color: var(--incident-color) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,0.33), 0 0 24px color-mix(in srgb, var(--incident-color) 38%, transparent) !important;
        }
        .incident-card-active {
          transform: translateY(-1px);
        }
        @supports not (color: color-mix(in srgb, red, transparent)) {
          .incident-card:hover,
          .incident-card:focus-visible {
            box-shadow: 0 16px 42px rgba(0,0,0,0.33) !important;
          }
        }
      `}</style>
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <div
          aria-hidden="true"
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: typeMeta.background,
            color: typeMeta.color,
            border: `1px solid ${typeMeta.color}55`,
            fontSize: 18,
            fontWeight: 900,
            flex: "0 0 auto",
          }}
        >
          {typeMeta.icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, textTransform: "capitalize", lineHeight: 1.2 }}>
                {typeMeta.label}
              </div>
              <div style={{ color: "#8fa1b7", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{relativeTime(incident.created_at)}</div>
            </div>
            <StatusBadge status={incident.status} compact />
          </div>

          <div
            style={{
              color: "#cbd5e1",
              marginTop: 9,
              lineHeight: 1.42,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {incident.description || "No description provided."}
          </div>

          {(incident.images || []).filter((image) => image.image_url).length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, overflow: "hidden" }}>
              {(incident.images || []).filter((image) => image.image_url).slice(0, 3).map((image) => (
                <div
                  key={image.id || image.image_url}
                  style={{
                    width: 46,
                    height: 36,
                    borderRadius: 7,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))",
                    flex: "0 0 auto",
                  }}
                >
                  <img src={image.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginTop: 11,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.055)",
                color: "#b6c2d2",
                borderRadius: 8,
                padding: "7px 8px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Loc {coordinateText(incident)}
            </div>
            {onDispatch && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDispatch(incident);
                }}
                style={{
                  background: "linear-gradient(135deg, #2563eb, #0891b2)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 11px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Dispatch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
