import React from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const icon = (color, label = "") =>
  L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:${color};border-radius:10px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#0b1220;font-weight:900;font-size:12px;box-shadow:0 6px 14px rgba(0,0,0,0.35)">${label}</div>`,
  });

const incidentStyle = (type) => {
  if (type === "fire") return { color: "#fb923c", label: "F" };
  if (type === "gas") return { color: "#a78bfa", label: "G" };
  if (type === "health") return { color: "#34d399", label: "+" };
  return { color: "#f87171", label: "!" }; // accident/default
};

export default function MapPanel({ incidents, services, nearbyServices, route, routes, signals, junctions }) {
  const computedRoutes = Array.isArray(routes) ? routes : (route?.length ? [{ id: "single", points: route, color: "#22d3ee" }] : []);
  return (
    <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: "100%", width: "100%", borderRadius: 16 }}>
      {/* Base layer so map always renders a visible surface */}
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((i) => (
        <Marker
          key={`i-${i.id}`}
          position={[i.latitude, i.longitude]}
          icon={icon(incidentStyle(i.type).color, incidentStyle(i.type).label)}
        >
          <Popup>{`${i.type} (${i.status})`}</Popup>
        </Marker>
      ))}
      {services.map((s) => (
        <Marker key={`s-${s.id}`} position={[s.latitude, s.longitude]} icon={icon("#3b82f6")}>
          <Popup>{`${s.name} (${s.type})`}</Popup>
        </Marker>
      ))}
      {nearbyServices?.map((s) => (
        <Marker key={`ns-${s.id}`} position={[s.latitude, s.longitude]} icon={icon("#f59e0b")}>
          <Popup>{`Nearest: ${s.name} (${s.type})`}</Popup>
        </Marker>
      ))}
      {junctions?.map((j) => (
        <CircleMarker key={j.name} center={[j.lat, j.lng]} radius={4} pathOptions={{ color: "#facc15" }}>
          <Popup>{j.name}</Popup>
        </CircleMarker>
      ))}
      {signals.map((s) => (
        <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={6} pathOptions={{ color: s.status === "green" ? "#22c55e" : "#dc2626" }} />
      ))}
      {computedRoutes.map((r, idx) => (
        <Polyline
          key={r.id || `r-${idx}`}
          positions={(r.points || []).map((p) => [p.lat, p.lng])}
          pathOptions={{ color: r.color || "#22d3ee", weight: 4, opacity: 0.9 }}
        />
      ))}
    </MapContainer>
  );
}
