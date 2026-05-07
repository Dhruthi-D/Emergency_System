import React, { useCallback, useEffect, useState } from "react";
import IncidentCard from "../components/IncidentCard";
import ReportIncidentModal from "../components/ReportIncidentModal";
import Toast from "../components/Toast";
import api, { getToken } from "../services/api";

const toastId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function CitizenDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message, type = "info") => {
    setToasts((prev) => {
      if (prev.some((toast) => toast.message === message && toast.type === type)) return prev;
      return [...prev, { id: toastId(), message, type }].slice(-4);
    });
  }, []);

  const upsertIncident = useCallback((incoming) => {
    if (!incoming?.id) return;
    setIncidents((prev) => [incoming, ...prev.filter((incident) => incident.id !== incoming.id)]);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("incidents/");
      setIncidents(data || []);
      setError("");
    } catch (e) {
      const message = e.response?.data?.detail || "Unable to load your incident reports.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = getToken();
    const baseWsUrl =
      process.env.REACT_APP_WS_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/incidents/`;
    const separator = baseWsUrl.includes("?") ? "&" : "?";
    const ws = new WebSocket(token ? `${baseWsUrl}${separator}token=${encodeURIComponent(token)}` : baseWsUrl);

    ws.onmessage = (evt) => {
      try {
        const { event, payload } = JSON.parse(evt.data);
        upsertIncident(payload);
        if (event === "status_updated" && payload?.status === "dispatched") {
          pushToast("Your report has been dispatched.", "success");
        }
        if (event === "incident_marked_fake") {
          pushToast("A report was cleared after admin review.", "info");
        }
      } catch {
        setError("Received an unreadable realtime update.");
      }
    };

    ws.onclose = (event) => {
      if (event.code === 4401 || event.code === 4403) {
        setError("Realtime updates are unavailable for this session.");
      }
    };

    return () => ws.close();
  }, [pushToast, upsertIncident]);

  const createIncident = async (payload) => {
    setSubmitting(true);
    try {
      await api.post("incidents/", payload);
      pushToast("Incident submitted successfully.", "success");
      setShowModal(false);
      load();
    } catch (e) {
      pushToast(e.response?.data?.detail || "Failed to submit incident.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="citizen-dashboard">
      <style>{`
        .citizen-dashboard {
          min-height: 100vh;
          color: #f8fafc;
          background:
            radial-gradient(circle at 18% 10%, rgba(52, 211, 153, 0.13), transparent 30%),
            radial-gradient(circle at 92% 18%, rgba(248, 193, 74, 0.12), transparent 28%),
            linear-gradient(135deg, #070b12 0%, #111827 56%, #090c12 100%);
          padding: 16px;
          box-sizing: border-box;
        }
        .citizen-shell {
          width: min(100%, 980px);
          margin: 0 auto;
          display: grid;
          gap: 14px;
        }
        .citizen-panel {
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 12px;
          background: rgba(12, 18, 29, 0.68);
          backdrop-filter: blur(18px);
          box-shadow: 0 22px 58px rgba(0,0,0,0.3);
          padding: 16px;
        }
        .citizen-alert {
          border: 1px solid rgba(251, 113, 133, 0.36);
          background: rgba(127, 29, 29, 0.34);
          color: #fecdd3;
          border-radius: 8px;
          padding: 9px 10px;
          font-weight: 700;
        }
        .citizen-skeleton {
          height: 124px;
          border-radius: 8px;
          margin-bottom: 11px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.13), rgba(255,255,255,0.06));
          background-size: 220% 100%;
          animation: citizenSkeleton 1.2s ease-in-out infinite;
        }
        .citizen-empty {
          border: 1px dashed rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.045);
          border-radius: 8px;
          padding: 22px;
          color: #a7b5c8;
          text-align: center;
        }
        .citizen-empty-art {
          width: 92px;
          height: 60px;
          margin: 0 auto 12px;
          border-radius: 9px;
          border: 1px solid rgba(52, 211, 153, 0.28);
          background:
            linear-gradient(90deg, transparent 47%, rgba(52, 211, 153, 0.34) 48%, rgba(52, 211, 153, 0.34) 52%, transparent 53%),
            linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(92, 200, 255, 0.1));
          position: relative;
        }
        .citizen-empty-art::before {
          content: "";
          position: absolute;
          left: 33px;
          top: 16px;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: rgba(92, 200, 255, 0.74);
          box-shadow: 0 0 0 8px rgba(92, 200, 255, 0.12);
        }
        .report-button {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 900;
          border-radius: 999px;
          padding: 14px 18px;
          min-height: 48px;
          background: linear-gradient(135deg, #dc2626, #f97316);
          color: #fff;
          border: none;
          box-shadow: 0 16px 38px rgba(0,0,0,0.35);
          font-weight: 900;
          cursor: pointer;
        }
        @keyframes citizenSkeleton {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @media (max-width: 620px) {
          .citizen-dashboard {
            padding: 10px;
          }
          .citizen-panel {
            padding: 13px;
          }
          .report-button {
            left: 14px;
            right: 14px;
            bottom: 14px;
          }
        }
      `}</style>

      <div className="citizen-shell">
        <header className="citizen-panel">
          <h2 style={{ margin: "0 0 6px", fontSize: 30, lineHeight: 1.1 }}>Citizen Dashboard</h2>
          <div style={{ color: "#a7b5c8", lineHeight: 1.45 }}>Track your own reports and receive realtime response updates.</div>
          {error && <div className="citizen-alert" style={{ marginTop: 12 }}>{error}</div>}
        </header>

        <section className="citizen-panel">
          {loading ? (
            <>
              <div className="citizen-skeleton" />
              <div className="citizen-skeleton" />
            </>
          ) : incidents.length ? (
            incidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />)
          ) : (
            <div className="citizen-empty">
              <div className="citizen-empty-art" />
              <strong>No reports yet.</strong>
              <div style={{ marginTop: 6 }}>Use Report Incident when you need emergency assistance.</div>
            </div>
          )}
        </section>
      </div>

      <button type="button" onClick={() => setShowModal(true)} className="report-button">
        Report Incident
      </button>
      {showModal && <ReportIncidentModal onClose={() => setShowModal(false)} onSubmit={createIncident} loading={submitting} />}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
