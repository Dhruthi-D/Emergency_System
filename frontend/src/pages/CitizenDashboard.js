import React, { useEffect, useState } from "react";
import IncidentCard from "../components/IncidentCard";
import ReportIncidentModal from "../components/ReportIncidentModal";
import api from "../services/api";

export default function CitizenDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    const { data } = await api.get("incidents/");
    setIncidents(data);
  };

  useEffect(() => {
    load();
    const wsUrl =
      process.env.REACT_APP_WS_URL || "ws://localhost:8000/ws/incidents/";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (evt) => {
      const { payload } = JSON.parse(evt.data);
      setIncidents((prev) => [payload, ...prev.filter((i) => i.id !== payload.id)]);
    };
    return () => ws.close();
  }, []);

  const createIncident = async (payload) => {
    setLoading(true);
    try {
      await api.post("incidents/", payload);
      setToast("Incident submitted successfully");
      setShowModal(false);
      load();
    } catch {
      setToast("Failed to submit incident");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "white", padding: 16 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 30 }}>Citizen Dashboard</h2>
        <div style={{ color: "#94a3b8", marginBottom: 14 }}>Track Real-Time incidents and report emergencies quickly.</div>
        {incidents.length === 0 && <div style={{ background: "#111827", border: "1px solid #1f2937", color: "#9ca3af", padding: 12, borderRadius: 12 }}>No incidents yet. Use Report Incident to create one.</div>}
        {incidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />)}
      </div>
      <button onClick={() => setShowModal(true)} style={{ position: "fixed", right: 18, bottom: 18, borderRadius: 999, padding: "14px 18px", background: "#ef4444", color: "#fff", border: "none", boxShadow: "0 10px 24px rgba(0,0,0,0.35)", fontWeight: 700 }}>
        Report Incident
      </button>
      {showModal && <ReportIncidentModal onClose={() => setShowModal(false)} onSubmit={createIncident} loading={loading} />}
      {toast && <div style={{ position: "fixed", top: 18, right: 18, background: "#1f2937", border: "1px solid #374151", padding: "10px 14px", borderRadius: 10 }}>{toast}</div>}
    </div>
  );
}
