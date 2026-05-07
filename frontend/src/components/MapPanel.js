import React, { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { getIncidentTypeMeta, statusMeta } from "./StatusBadge";

const simpleIcon = (color, label = "") =>
  L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;background:${color};border-radius:999px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#06111f;font-weight:900;font-size:12px;box-shadow:0 8px 18px rgba(0,0,0,0.38)">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const incidentIcon = (type, active = false) => {
  const meta = getIncidentTypeMeta(type);
  return L.divIcon({
    className: "",
    html: `
      <div class="incident-marker-shell ${active ? "incident-marker-active" : ""}" style="--marker-color:${meta.color}">
        <div class="incident-marker-core">${meta.icon}</div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
};

function MapFocusController({ focusIncident, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!focusIncident) return undefined;
    const lat = Number(focusIncident.latitude);
    const lng = Number(focusIncident.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;

    map.flyTo([lat, lng], 16, { animate: true, duration: 1.1 });
    const timer = window.setTimeout(() => {
      markerRefs.current[focusIncident.id]?.openPopup();
    }, 760);
    return () => window.clearTimeout(timer);
  }, [focusIncident, map, markerRefs]);

  return null;
}

function IncidentMarkers({ incidents, activeIncidentId, focusIncident, onIncidentSelect }) {
  const markerRefs = useRef({});

  useEffect(() => {
    const ids = new Set(incidents.map((incident) => String(incident.id)));
    Object.keys(markerRefs.current).forEach((id) => {
      if (!ids.has(id)) delete markerRefs.current[id];
    });
  }, [incidents]);

  return (
    <>
      <MapFocusController focusIncident={focusIncident} markerRefs={markerRefs} />
      {incidents.map((incident) => {
        const meta = getIncidentTypeMeta(incident.type);
        const status = statusMeta[incident.status] || {};
        return (
          <Marker
            key={`i-${incident.id}`}
            position={[incident.latitude, incident.longitude]}
            icon={incidentIcon(incident.type, activeIncidentId === incident.id)}
            eventHandlers={{
              click: () => onIncidentSelect?.(incident),
            }}
            ref={(marker) => {
              if (marker) markerRefs.current[incident.id] = marker;
            }}
          >
            <Popup>
              <div style={{ minWidth: 170 }}>
                <strong style={{ color: meta.color, textTransform: "capitalize" }}>{meta.label}</strong>
                <div style={{ marginTop: 4, color: "#334155", textTransform: "capitalize" }}>{status.label || incident.status}</div>
                <div style={{ marginTop: 6 }}>{incident.description || "No description provided."}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function MapPanel({
  incidents = [],
  services = [],
  nearbyServices = [],
  route = [],
  routes,
  signals = [],
  junctions = [],
  activeIncidentId,
  focusIncident,
  onIncidentSelect,
}) {
  const computedRoutes = useMemo(
    () => (Array.isArray(routes) ? routes : route?.length ? [{ id: "single", points: route, color: "#22d3ee" }] : []),
    [route, routes]
  );
  const visibleIncidents = useMemo(() => incidents.filter((incident) => incident.status !== "fake"), [incidents]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <style>{`
        .incident-marker-shell {
          position: relative;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .incident-marker-core {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--marker-color);
          color: #07111f;
          border: 2px solid #fff;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 9px 20px rgba(0,0,0,0.42);
          position: relative;
          z-index: 2;
        }
        .incident-marker-active::before,
        .incident-marker-active::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: 999px;
          border: 2px solid var(--marker-color);
          animation: incidentPulse 1.35s ease-out infinite;
        }
        .incident-marker-active::after {
          animation-delay: .42s;
        }
        @keyframes incidentPulse {
          0% { transform: scale(.72); opacity: .85; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .leaflet-container {
          background: #0f172a;
          font-family: inherit;
        }
      `}</style>
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={11}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", borderRadius: 12 }}
      >
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <IncidentMarkers
          incidents={visibleIncidents}
          activeIncidentId={activeIncidentId}
          focusIncident={focusIncident}
          onIncidentSelect={onIncidentSelect}
        />

        {services.map((service) => (
          <Marker key={`s-${service.id}`} position={[service.latitude, service.longitude]} icon={simpleIcon("#5cc8ff", "S")}>
            <Popup>{`${service.name} (${service.type})`}</Popup>
          </Marker>
        ))}
        {nearbyServices?.map((service) => (
          <Marker key={`ns-${service.id}`} position={[service.latitude, service.longitude]} icon={simpleIcon("#f8c14a", "N")}>
            <Popup>{`Nearest: ${service.name} (${service.type})`}</Popup>
          </Marker>
        ))}
        {junctions?.map((junction) => (
          <CircleMarker key={junction.name} center={[junction.lat, junction.lng]} radius={4} pathOptions={{ color: "#f8c14a" }}>
            <Popup>{junction.name}</Popup>
          </CircleMarker>
        ))}
        {signals.map((signal) => (
          <CircleMarker
            key={signal.id}
            center={[signal.lat, signal.lng]}
            radius={6}
            pathOptions={{ color: signal.status === "green" ? "#34d399" : "#ef4444" }}
          />
        ))}
        {computedRoutes.map((routeItem, idx) => (
          <Polyline
            key={routeItem.id || `r-${idx}`}
            positions={(routeItem.points || []).map((point) => [point.lat, point.lng])}
            pathOptions={{ color: routeItem.color || "#22d3ee", weight: 4, opacity: 0.9 }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
