import React, { useEffect, useMemo, useState } from "react";
import IncidentCard from "../components/IncidentCard";
import MapPanel from "../components/MapPanel";
import api from "../services/api";

const tabs = ["upcoming", "live", "completed"];

export default function AdminDashboard() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 960;
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [junctions, setJunctions] = useState([]);
  const [route, setRoute] = useState([]);
  const [routesByIncident, setRoutesByIncident] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("routesByIncident") || "{}");
    } catch {
      return {};
    }
  });
  const [signals, setSignals] = useState([]);
  const [tab, setTab] = useState("upcoming");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      const { data } = await api.get("dashboard/");
      setIncidents(data.incidents);
      setServices(data.services);
      setJunctions(data.junctions);
      setError("");
    } catch {
      setError("Unable to load dashboard data.");
    }
  };

  useEffect(() => {
    loadDashboard();
    const wsUrl =
      process.env.REACT_APP_WS_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/incidents/`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (evt) => {
      const { payload } = JSON.parse(evt.data);
      setIncidents((prev) => [payload, ...prev.filter((i) => i.id !== payload.id)]);
    };
    return () => ws.close();
  }, []);

  const filtered = useMemo(
    () =>
      incidents.filter((i) => {
        if (tab === "upcoming") return i.status === "pending";
        if (tab === "live") return i.status === "dispatched" || i.status === "in_progress";
        return i.status === "completed";
      }),
    [incidents, tab]
  );

  const dispatch = async (incident) => {
    try {
      const { data } = await api.post("dispatch/", { incident_id: incident.id, vehicle_count: 1, vehicle_type: "ambulance" });
      setRoute(data.route || []);
      setRoutesByIncident((prev) => {
        const next = { ...prev, [incident.id]: { points: data.route || [], type: incident.type, updatedAt: Date.now() } };
        localStorage.setItem("routesByIncident", JSON.stringify(next));
        return next;
      });
      setSignals(data.traffic_signals || []);
      setNearbyServices(data.nearby_services || []);
      setError("");
      loadDashboard();
    } catch (e) {
      setError(e.response?.data?.detail || "Dispatch failed. Please retry.");
    }
  };

  const previewNearby = async (incident) => {
    try {
      const { data } = await api.get(`nearby-services/?incident_id=${incident.id}`);
      setNearbyServices(data.nearby_services || []);
      setRoute(data.route_preview || []);
      setRoutesByIncident((prev) => {
        const next = { ...prev, [incident.id]: { points: data.route_preview || [], type: incident.type, updatedAt: Date.now() } };
        localStorage.setItem("routesByIncident", JSON.stringify(next));
        return next;
      });
      setError("");
    } catch (e) {
      setError(e.response?.data?.detail || "Nearby service lookup failed.");
    }
  };

  const activeRoutes = useMemo(() => {
    const activeIds = new Set(
      incidents
        .filter((i) => i.status !== "completed")
        .map((i) => i.id)
    );
    const typeToColor = { fire: "#fb923c", gas: "#a78bfa", health: "#34d399", accident: "#22d3ee" };
    return Object.entries(routesByIncident)
      .filter(([id, v]) => activeIds.has(Number(id)) && (v?.points || []).length > 1)
      .map(([id, v]) => ({
        id: `inc-${id}`,
        points: v.points,
        color: typeToColor[v.type] || "#22d3ee",
      }));
  }, [routesByIncident, incidents]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(330px, 420px) 1fr",
        minHeight: "100vh",
        background: "#0b1220",
        color: "#fff",
        gap: 14,
        padding: 14,
      }}
    >
      <div style={{ padding: 14, overflowY: "auto", background: "#111827", borderRadius: 16, border: "1px solid #1f2937" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 28 }}>Admin Control Center</h2>
        <div style={{ color: "#9ca3af", marginBottom: 12 }}>Monitor incidents and dispatch nearest responders.</div>
        {error && (
          <div style={{ background: "#7f1d1d", color: "#fecaca", padding: "8px 10px", borderRadius: 10, marginBottom: 10 }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#2563eb" : "#1f2937", color: "#fff", border: "1px solid #374151", borderRadius: 10, padding: "9px 13px", fontWeight: 600, textTransform: "capitalize", transition: "all .25s" }}>
              {t}
            </button>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ color: "#9ca3af", background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>No incidents in this tab right now.</div>}
        {filtered.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} onSelect={previewNearby} onDispatch={tab === "upcoming" ? dispatch : null} />
        ))}
      </div>
      <div style={{ padding: 6 }}>
        <div style={{ height: isMobile ? "50vh" : "calc(100vh - 40px)", minHeight: 320, background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 10 }}>
          <MapPanel incidents={incidents} services={services} nearbyServices={nearbyServices} route={route} routes={activeRoutes} signals={signals} junctions={junctions} />
        </div>
      </div>
    </div>
  );
}
