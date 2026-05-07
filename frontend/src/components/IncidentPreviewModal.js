import React, { useEffect, useMemo, useState } from "react";
import { IncidentTypeBadge, StatusBadge } from "./StatusBadge";

const shellStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2200,
  background: "rgba(3, 7, 18, 0.78)",
  backdropFilter: "blur(14px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 14,
};

const buttonBase = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding: "11px 13px",
  minHeight: 44,
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

export default function IncidentPreviewModal({
  incident,
  onClose,
  onDispatch,
  onClear,
  onFocusMap,
  dispatching = false,
  clearing = false,
}) {
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    setExpandedImage(null);
  }, [incident?.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        expandedImage ? setExpandedImage(null) : onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedImage, onClose]);

  const reporterName = useMemo(() => {
    if (!incident) return "";
    if (incident.source === "sensor") return "Sensor Alert";
    return incident.reporter_name || incident.created_by_name || "Unknown Reporter";
  }, [incident]);

  if (!incident) return null;

  const images = (incident.images || []).filter((image) => image.image_url);
  const canDispatch = incident.status === "pending";
  const canClear = !["completed", "fake"].includes(incident.status);
  const latitude = Number(incident.latitude);
  const longitude = Number(incident.longitude);

  return (
    <div style={shellStyle} role="dialog" aria-modal="true" aria-label="Incident preview" onMouseDown={onClose}>
      <style>{`
        .incident-preview-panel {
          width: min(920px, 96vw);
          max-height: min(90vh, 860px);
          overflow: hidden;
          display: grid;
          grid-template-rows: auto 1fr auto;
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 12px;
          background:
            linear-gradient(145deg, rgba(20, 28, 43, 0.94), rgba(10, 15, 25, 0.96)),
            rgba(15, 23, 42, 0.94);
          color: #f8fafc;
          box-shadow: 0 30px 90px rgba(0,0,0,0.48);
        }
        .incident-preview-content {
          overflow-y: auto;
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
          gap: 16px;
        }
        .incident-preview-card {
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.055);
          border-radius: 8px;
          padding: 14px;
        }
        .incident-preview-images {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 9px;
        }
        .incident-preview-footer {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 14px 18px 18px;
          border-top: 1px solid rgba(255,255,255,0.1);
          background: rgba(2, 6, 23, 0.42);
        }
        .incident-preview-action:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        @media (max-width: 760px) {
          .incident-preview-panel {
            width: 100%;
            max-height: 94vh;
          }
          .incident-preview-content {
            grid-template-columns: 1fr;
            padding: 14px;
          }
          .incident-preview-footer {
            grid-template-columns: 1fr;
            padding: 12px 14px 14px;
          }
        }
      `}</style>
      <div className="incident-preview-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "17px 18px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 9 }}>
              <IncidentTypeBadge type={incident.type} />
              <StatusBadge status={incident.status} />
            </div>
            <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>Incident Preview</h2>
            <div style={{ marginTop: 6, color: "#b6c2d2", fontWeight: 700 }}>Reporter: {reporterName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.07)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            x
          </button>
        </header>

        <section className="incident-preview-content">
          <div className="incident-preview-card">
            <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
              Description
            </div>
            <p style={{ margin: 0, color: "#eef2ff", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {incident.description || "No description was provided."}
            </p>
          </div>

          <div className="incident-preview-card">
            <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
              Coordinates
            </div>
            <button
              type="button"
              onClick={() => onFocusMap?.(incident)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "1px solid rgba(92, 200, 255, 0.28)",
                background: "rgba(92, 200, 255, 0.08)",
                color: "#dff7ff",
                borderRadius: 8,
                padding: "10px 11px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {Number.isFinite(latitude) ? latitude.toFixed(6) : incident.latitude}, {Number.isFinite(longitude) ? longitude.toFixed(6) : incident.longitude}
            </button>
          </div>

          <div className="incident-preview-card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 900, textTransform: "uppercase", marginBottom: 10 }}>
              Incident Images
            </div>
            {images.length ? (
              <div className="incident-preview-images">
                {images.map((image) => {
                  const src = image.image_url;
                  return (
                    <button
                      key={image.id || src}
                      type="button"
                      onClick={() => setExpandedImage(src)}
                      style={{
                        padding: 0,
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#050814",
                        cursor: "zoom-in",
                        aspectRatio: "4 / 3",
                        backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))",
                      }}
                    >
                      <img src={src} alt="Incident evidence" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ border: "1px dashed rgba(255,255,255,0.14)", borderRadius: 8, padding: 18, color: "#94a3b8" }}>
                No uploaded images for this incident.
              </div>
            )}
          </div>
        </section>

        <footer className="incident-preview-footer">
          <button
            type="button"
            onClick={() => onFocusMap?.(incident)}
            className="incident-preview-action"
            style={{ ...buttonBase, background: "linear-gradient(135deg, #0f766e, #0891b2)" }}
          >
            Open in Map
          </button>
          <button
            type="button"
            onClick={() => onDispatch?.(incident)}
            disabled={!canDispatch || dispatching}
            className="incident-preview-action"
            style={{ ...buttonBase, background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
          >
            {dispatching ? "Dispatching..." : "Dispatch"}
          </button>
          <button
            type="button"
            onClick={() => onClear?.(incident)}
            disabled={!canClear || clearing}
            className="incident-preview-action"
            style={{ ...buttonBase, background: "linear-gradient(135deg, #b91c1c, #f43f5e)" }}
          >
            {clearing ? "Clearing..." : "Clear Incident"}
          </button>
        </footer>
      </div>

      {expandedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded incident image"
          onMouseDown={(event) => {
            event.stopPropagation();
            setExpandedImage(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.86)",
            padding: 18,
            cursor: "zoom-out",
          }}
        >
          <img
            src={expandedImage}
            alt="Expanded incident evidence"
            style={{ maxWidth: "96vw", maxHeight: "92vh", borderRadius: 8, border: "1px solid rgba(255,255,255,0.16)" }}
          />
        </div>
      )}
    </div>
  );
}
