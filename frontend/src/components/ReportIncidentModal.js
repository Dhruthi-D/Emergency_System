import React, { useEffect, useRef, useState } from "react";

const types = ["accident", "fire", "gas", "health"];
const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.78;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };
    image.src = url;
  });

const canvasToDataUrl = (canvas, type = "image/jpeg", quality = JPEG_QUALITY) => canvas.toDataURL(type, quality);

const compressFileToDataUrl = async (file) => {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);
  return canvasToDataUrl(canvas, file.type === "image/png" ? "image/png" : "image/jpeg");
};

export default function ReportIncidentModal({ onClose, onSubmit, loading }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [captured, setCaptured] = useState([]);
  const [type, setType] = useState("accident");
  const [description, setDescription] = useState("");
  const [geo, setGeo] = useState({ latitude: "", longitude: "" });
  const [manual, setManual] = useState({ latitude: "", longitude: "" });
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setError("");
    } catch {
      setError("Camera permission denied or unavailable.");
    }
  };

  const addImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const available = MAX_IMAGES - captured.length;
    if (available <= 0) {
      setError(`Attach at most ${MAX_IMAGES} images.`);
      return;
    }

    setProcessing(true);
    try {
      const next = [];
      for (const file of files.slice(0, available)) {
        if (!file.type.startsWith("image/")) {
          setError("Only image files are allowed.");
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setError("Each image must be 8 MB or smaller.");
          continue;
        }
        next.push(await compressFileToDataUrl(file));
      }
      if (next.length) {
        setCaptured((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
        setError("");
      }
    } catch (err) {
      setError(err.message || "Unable to process image.");
    } finally {
      setProcessing(false);
    }
  };

  const capture = () => {
    if (!videoRef.current || captured.length >= MAX_IMAGES) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCaptured((prev) => [...prev, canvasToDataUrl(canvas)].slice(0, MAX_IMAGES));
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
      <style>{`
        .incident-dropzone {
          border: 1px dashed rgba(148, 163, 184, 0.52);
          background: rgba(15, 23, 42, 0.72);
          border-radius: 10px;
          padding: 13px;
          color: #cbd5e1;
          cursor: pointer;
          transition: border-color .2s ease, background .2s ease;
        }
        .incident-dropzone-active {
          border-color: #5cc8ff;
          background: rgba(8, 145, 178, 0.18);
        }
        .incident-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 9px;
          margin-top: 10px;
        }
      `}</style>
      <div style={{ width: "min(94vw, 620px)", background: "#111827", borderRadius: 16, padding: 16, border: "1px solid #1f2937", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 24 }}>Report Incident</h3>
        <div style={{ color: "#9ca3af", marginBottom: 10 }}>Use camera, upload evidence, and share your location.</div>

        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0f172a", color: "#fff" }}>
          {types.map((item) => (
            <option key={item}>{item}</option>
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

        {error && <div style={{ color: "#f87171", marginTop: 8, fontWeight: 700 }}>{error}</div>}

        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 10, marginTop: 10, maxHeight: "30vh", objectFit: "cover", background: "#000" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div
          className={`incident-dropzone ${dragging ? "incident-dropzone-active" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addImages(event.dataTransfer.files);
          }}
          style={{ marginTop: 12 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              addImages(event.target.files);
              event.target.value = "";
            }}
            style={{ display: "none" }}
          />
          <div style={{ fontWeight: 900 }}>Drop images here or click to upload</div>
          <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 13 }}>Stored locally by Django. Up to {MAX_IMAGES} images, 8 MB each.</div>
        </div>

        {captured.length > 0 && (
          <div className="incident-image-grid">
            {captured.map((src, index) => (
              <div key={src.slice(0, 40)} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, overflow: "hidden", background: "#050814" }}>
                <img src={src} alt="Incident preview" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
                <button
                  type="button"
                  onClick={() => setCaptured((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                  style={{ width: "100%", background: "#374151", color: "#fff", border: "none", padding: "7px 8px", fontWeight: 800 }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 12 }}>
          <button onClick={startCamera} type="button" style={{ background: "#1f2937", color: "#fff", border: "1px solid #374151", borderRadius: 10, padding: "10px 12px", minHeight: 42 }}>Start Camera</button>
          <button onClick={capture} type="button" disabled={captured.length >= MAX_IMAGES} style={{ background: "#1f2937", color: "#fff", border: "1px solid #374151", borderRadius: 10, padding: "10px 12px", minHeight: 42, opacity: captured.length >= MAX_IMAGES ? 0.55 : 1 }}>Capture ({captured.length}/{MAX_IMAGES})</button>
          <button onClick={fetchLocation} type="button" style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 12px", minHeight: 42 }}>Use Current Location</button>
          <button disabled={loading || processing} onClick={submit} type="button" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700, minHeight: 42, opacity: loading || processing ? 0.6 : 1 }}>{loading ? "Submitting..." : processing ? "Processing..." : "Submit"}</button>
          <button onClick={onClose} type="button" style={{ background: "#374151", color: "#fff", border: "none", borderRadius: 10, padding: "10px 12px", minHeight: 42 }}>Close</button>
        </div>
      </div>
    </div>
  );
}
