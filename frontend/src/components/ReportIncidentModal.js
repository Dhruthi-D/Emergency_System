import React, { useEffect, useRef, useState } from "react";

const types = ["accident", "fire", "gas", "health"];

export default function ReportIncidentModal({ onClose, onSubmit, loading }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState([]);
  const [type, setType] = useState("accident");
  const [description, setDescription] = useState("");
  const [geo, setGeo] = useState({ latitude: "", longitude: "" });
  const [manual, setManual] = useState({ latitude: "", longitude: "" });
  const [error, setError] = useState("");

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        });
        setError("");
      },
      () => setError("Unable to fetch location. Enter coordinates manually.")
    );
  };

  useEffect(() => {
    fetchLocation();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is unavailable on this page. Use HTTPS or localhost.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setError("");
    } catch {
      setError("Camera permission denied or unavailable.");
    }
  };

  const capture = () => {
    if (!videoRef.current || captured.length >= 3) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    setCaptured((prev) => [...prev, canvas.toDataURL("image/jpeg", 0.7)]);
  };

  const submit = () => {
    const latitude = manual.latitude || geo.latitude;
    const longitude = manual.longitude || geo.longitude;
    if (!latitude || !longitude) {
      setError("Location required. Fetch automatically or enter coordinates manually.");
      return;
    }
    onSubmit({
      type,
      description,
      latitude: Number(latitude),
      longitude: Number(longitude),
      captured_images: captured,
    });
  };

  const latitudeValue = manual.latitude || geo.latitude;
  const longitudeValue = manual.longitude || geo.longitude;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.82)", zIndex: 99, overflowY: "auto", padding: "14px 10px 28px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "min(94vw, 560px)", background: "#111827", borderRadius: 16, padding: 16, border: "1px solid #1f2937", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 24 }}>Report Incident</h3>
        <div style={{ color: "#9ca3af", marginBottom: 10 }}>Use camera and location to submit accurate incident details.</div>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0f172a", color: "#fff" }}>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" style={{ width: "100%", minHeight: 78, padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0f172a", color: "#fff", boxSizing: "border-box" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
          <input
            value={latitudeValue}
            onChange={(e) => setManual({ ...manual, latitude: e.target.value })}
            placeholder="Latitude"
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0f172a", color: "#fff" }}
          />
          <input
            value={longitudeValue}
            onChange={(e) => setManual({ ...manual, longitude: e.target.value })}
            placeholder="Longitude"
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0f172a", color: "#fff" }}
          />
        </div>
        {error && <div style={{ color: "#f87171", marginTop: 8 }}>{error}</div>}
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 10, marginTop: 10, maxHeight: "34vh", objectFit: "cover", background: "#000" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 12 }}>
          <button onClick={startCamera} style={{ background: "#1f2937", color: "#fff", border: "1px solid #374151", borderRadius: 10, padding: "10px 12px", minHeight: 42 }}>Start Camera</button>
          <button onClick={capture} style={{ background: "#1f2937", color: "#fff", border: "1px solid #374151", borderRadius: 10, padding: "10px 12px", minHeight: 42 }}>Capture ({captured.length}/3)</button>
          <button onClick={fetchLocation} style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 12px", minHeight: 42 }}>Use Current Location</button>
          <button disabled={loading} onClick={submit} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700, minHeight: 42 }}>{loading ? "Submitting..." : "Submit"}</button>
          <button onClick={onClose} style={{ background: "#374151", color: "#fff", border: "none", borderRadius: 10, padding: "10px 12px", minHeight: 42 }}>Close</button>
        </div>
      </div>
    </div>
  );
}
