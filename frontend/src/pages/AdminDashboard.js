import React, { useCallback, useEffect, useMemo, useState } from "react";
import IncidentCard from "../components/IncidentCard";
import IncidentPreviewModal from "../components/IncidentPreviewModal";
import MapPanel from "../components/MapPanel";
import Toast from "../components/Toast";
import { StatusBadge } from "../components/StatusBadge";
import api, { getToken } from "../services/api";

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "live", label: "Live" },
  { id: "completed", label: "Completed" },
];

const statusForTab = {
  upcoming: ["pending"],
  live: ["dispatched", "in_progress"],
  completed: ["completed"],
};

const typeToRouteColor = { fire: "#ff9f43", gas: "#b088ff", health: "#34d399", accident: "#5cc8ff" };

const toastId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AdminDashboard() {
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
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeIncidentId, setActiveIncidentId] = useState(null);
  const [focusIncident, setFocusIncident] = useState(null);
  const [actionState, setActionState] = useState(null);
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
    setSelectedIncident((prev) => (prev?.id === incoming.id ? incoming : prev));
  }, []);

  const removeIncidentArtifacts = useCallback((incidentId) => {
    setRoute([]);
    setNearbyServices([]);
    setSignals([]);
    setRoutesByIncident((prev) => {
      const next = { ...prev };
      delete next[incidentId];
      localStorage.setItem("routesByIncident", JSON.stringify(next));
      return next;
    });
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("dashboard/");
      setIncidents(data.incidents || []);
      setServices(data.services || []);
      setJunctions(data.junctions || []);
      setError("");
    } catch (e) {
      const message = e.response?.data?.detail || "Unable to load dashboard data.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
        if (!payload?.id) return;
        upsertIncident(payload);
        if (payload.status === "fake") {
          removeIncidentArtifacts(payload.id);
          setSelectedIncident((prev) => (prev?.id === payload.id ? null : prev));
          setActiveIncidentId((prev) => (prev === payload.id ? null : prev));
          if (event === "incident_marked_fake") pushToast("Fake incident cleared.", "success");
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
  }, [pushToast, removeIncidentArtifacts, upsertIncident]);

  const visibleForQueue = useMemo(() => incidents.filter((incident) => incident.status !== "fake"), [incidents]);

  const filtered = useMemo(() => {
    const statuses = statusForTab[tab] || [];
    return visibleForQueue.filter((incident) => statuses.includes(incident.status));
  }, [tab, visibleForQueue]);

  const counts = useMemo(
    () =>
      tabs.reduce((acc, item) => {
        const statuses = statusForTab[item.id] || [];
        acc[item.id] = visibleForQueue.filter((incident) => statuses.includes(incident.status)).length;
        return acc;
      }, {}),
    [visibleForQueue]
  );

  const focusOnIncident = useCallback((incident) => {
    setActiveIncidentId(incident.id);
    setFocusIncident({ ...incident, focusKey: Date.now() });
  }, []);

  const persistRouteForIncident = useCallback((incident, points) => {
    setRoutesByIncident((prev) => {
      const next = { ...prev, [incident.id]: { points: points || [], type: incident.type, updatedAt: Date.now() } };
      localStorage.setItem("routesByIncident", JSON.stringify(next));
      return next;
    });
  }, []);

  const previewNearby = useCallback(
    async (incident) => {
      try {
        const { data } = await api.get(`nearby-services/?incident_id=${incident.id}`);
        const previewRoute = data.route_preview || [];
        setNearbyServices(data.nearby_services || []);
        setRoute(previewRoute);
        persistRouteForIncident(incident, previewRoute);
        setError("");
      } catch (e) {
        const message = e.response?.data?.detail || "Nearby service lookup failed.";
        setError(message);
      }
    },
    [persistRouteForIncident]
  );

  const openIncident = useCallback(
    (incident) => {
      setSelectedIncident(incident);
      setActiveIncidentId(incident.id);
      if (!["fake", "completed"].includes(incident.status)) {
        previewNearby(incident);
      }
    },
    [previewNearby]
  );

  const dispatchIncident = useCallback(
    async (incident) => {
      try {
        setActionState({ id: incident.id, type: "dispatch" });
        const { data } = await api.post("dispatch/", { incident_id: incident.id, vehicle_count: 1, vehicle_type: "ambulance" });
        const nextRoute = data.route || [];
        setRoute(nextRoute);
        persistRouteForIncident(incident, nextRoute);
        setSignals(data.traffic_signals || []);
        setNearbyServices(data.nearby_services || []);
        const updated = { ...incident, status: "dispatched" };
        upsertIncident(updated);
        setSelectedIncident(updated);
        setError("");
        pushToast("Dispatch started successfully.", "success");
        focusOnIncident(updated);
      } catch (e) {
        const message = e.response?.data?.detail || "Dispatch failed. Please retry.";
        setError(message);
        pushToast(message, "error");
      } finally {
        setActionState(null);
      }
    },
    [focusOnIncident, persistRouteForIncident, pushToast, upsertIncident]
  );

  const clearIncident = useCallback(
    async (incident) => {
      const confirmed = window.confirm("Clear this incident as fake or spam?");
      if (!confirmed) return;
      try {
        setActionState({ id: incident.id, type: "clear" });
        const { data } = await api.patch(`incidents/${incident.id}/mark_fake/`);
        upsertIncident(data);
        removeIncidentArtifacts(incident.id);
        setSelectedIncident(null);
        if (activeIncidentId === incident.id) setActiveIncidentId(null);
        pushToast("Fake incident cleared.", "success");
      } catch (e) {
        const message = e.response?.data?.detail || "Unable to clear this incident.";
        setError(message);
        pushToast(message, "error");
      } finally {
        setActionState(null);
      }
    },
    [activeIncidentId, pushToast, removeIncidentArtifacts, upsertIncident]
  );

  const activeRoutes = useMemo(() => {
    const activeIds = new Set(incidents.filter((incident) => ["pending", "dispatched", "in_progress"].includes(incident.status)).map((incident) => incident.id));
    return Object.entries(routesByIncident)
      .filter(([id, value]) => activeIds.has(Number(id)) && (value?.points || []).length > 1)
      .map(([id, value]) => ({
        id: `inc-${id}`,
        points: value.points,
        color: typeToRouteColor[value.type] || "#5cc8ff",
      }));
  }, [routesByIncident, incidents]);

  const currentActionMatches = (type) => actionState?.type === type && actionState?.id === selectedIncident?.id;

  return (
    <div className="admin-dashboard">
      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(320px, 410px) minmax(0, 1fr);
          gap: 14px;
          padding: 14px;
          color: #f8fafc;
          background:
            radial-gradient(circle at 18% 12%, rgba(20, 184, 166, 0.16), transparent 30%),
            radial-gradient(circle at 88% 18%, rgba(248, 193, 74, 0.13), transparent 28%),
            linear-gradient(135deg, #070b12 0%, #111827 52%, #090c12 100%);
          box-sizing: border-box;
        }
        .admin-sidebar {
          position: sticky;
          top: 14px;
          height: calc(100vh - 28px);
          overflow: hidden;
          display: grid;
          grid-template-rows: auto auto 1fr;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          background: rgba(12, 18, 29, 0.72);
          box-shadow: 0 22px 58px rgba(0,0,0,0.34);
          backdrop-filter: blur(18px);
        }
        .admin-header {
          padding: 18px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .admin-tabbar {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding: 12px 14px;
        }
        .admin-tab {
          min-height: 42px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.055);
          color: #cbd5e1;
          font-weight: 900;
          cursor: pointer;
          transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }
        .admin-tab:hover {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.22);
        }
        .admin-tab-active {
          background: linear-gradient(135deg, rgba(15, 118, 110, 0.72), rgba(37, 99, 235, 0.72));
          color: #fff;
        }
        .incident-list {
          overflow-y: auto;
          padding: 0 14px 14px;
        }
        .admin-map-shell {
          min-height: 520px;
          height: calc(100vh - 28px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          background: rgba(12, 18, 29, 0.62);
          box-shadow: 0 22px 58px rgba(0,0,0,0.28);
          backdrop-filter: blur(18px);
          padding: 10px;
          box-sizing: border-box;
        }
        .admin-alert {
          margin-top: 12px;
          border: 1px solid rgba(251, 113, 133, 0.36);
          background: rgba(127, 29, 29, 0.34);
          color: #fecdd3;
          border-radius: 8px;
          padding: 9px 10px;
          font-weight: 700;
        }
        .admin-skeleton {
          height: 128px;
          border-radius: 8px;
          margin-bottom: 11px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.13), rgba(255,255,255,0.06));
          background-size: 220% 100%;
          animation: adminSkeleton 1.2s ease-in-out infinite;
        }
        .admin-empty {
          border: 1px dashed rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.045);
          border-radius: 8px;
          padding: 18px;
          color: #a7b5c8;
          text-align: center;
        }
        .admin-empty-art {
          width: 84px;
          height: 54px;
          margin: 0 auto 12px;
          border-radius: 8px;
          border: 1px solid rgba(92, 200, 255, 0.28);
          background:
            linear-gradient(90deg, transparent 48%, rgba(92, 200, 255, 0.36) 49%, rgba(92, 200, 255, 0.36) 51%, transparent 52%),
            linear-gradient(180deg, rgba(92, 200, 255, 0.13), rgba(52, 211, 153, 0.11));
          position: relative;
        }
        .admin-empty-art::before {
          content: "";
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          left: 30px;
          top: 15px;
          background: rgba(248, 193, 74, 0.72);
          box-shadow: 0 0 0 8px rgba(248, 193, 74, 0.12);
        }
        @keyframes adminSkeleton {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @media (max-width: 1020px) {
          .admin-dashboard {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            position: static;
            height: auto;
            max-height: none;
          }
          .incident-list {
            max-height: 48vh;
          }
          .admin-map-shell {
            height: 56vh;
            min-height: 380px;
          }
        }
        @media (max-width: 620px) {
          .admin-dashboard {
            padding: 10px;
            gap: 10px;
          }
          .admin-tabbar {
            grid-template-columns: 1fr;
          }
          .admin-map-shell {
            height: 52vh;
            min-height: 320px;
            padding: 7px;
          }
        }
      `}</style>

      <aside className="admin-sidebar">
        <div className="admin-header">
          <h2 style={{ margin: "0 0 6px", fontSize: 28, lineHeight: 1.1 }}>Admin Control Center</h2>
          <div style={{ color: "#9fb0c7", lineHeight: 1.45 }}>Monitor verified signals, inspect reports, and dispatch responders.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 13 }}>
            <StatusBadge status="pending" compact style={{ textTransform: "none" }} />
            <StatusBadge status="dispatched" compact style={{ textTransform: "none" }} />
            <StatusBadge status="completed" compact style={{ textTransform: "none" }} />
          </div>
          {error && <div className="admin-alert">{error}</div>}
        </div>

        <div className="admin-tabbar">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`admin-tab ${tab === item.id ? "admin-tab-active" : ""}`}
            >
              {item.label} ({counts[item.id] || 0})
            </button>
          ))}
        </div>

        <div className="incident-list">
          {loading ? (
            <>
              <div className="admin-skeleton" />
              <div className="admin-skeleton" />
              <div className="admin-skeleton" />
            </>
          ) : filtered.length ? (
            filtered.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                active={activeIncidentId === incident.id}
                onSelect={openIncident}
              />
            ))
          ) : (
            <div className="admin-empty">
              <div className="admin-empty-art" />
              <strong>No incidents in this queue.</strong>
              <div style={{ marginTop: 6 }}>Realtime updates will appear here as soon as they arrive.</div>
            </div>
          )}
        </div>
      </aside>

      <main className="admin-map-shell">
        <MapPanel
          incidents={visibleForQueue}
          services={services}
          nearbyServices={nearbyServices}
          route={route}
          routes={activeRoutes}
          signals={signals}
          junctions={junctions}
          activeIncidentId={activeIncidentId}
          focusIncident={focusIncident}
          onIncidentSelect={openIncident}
        />
      </main>

      <IncidentPreviewModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onDispatch={dispatchIncident}
        onClear={clearIncident}
        onFocusMap={focusOnIncident}
        dispatching={currentActionMatches("dispatch")}
        clearing={currentActionMatches("clear")}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
