import React, { useEffect } from "react";

const toneMeta = {
  success: { border: "#34d399", background: "rgba(6, 78, 59, 0.92)" },
  error: { border: "#fb7185", background: "rgba(127, 29, 29, 0.92)" },
  info: { border: "#5cc8ff", background: "rgba(15, 23, 42, 0.94)" },
};

export default function Toast({ toasts = [], onDismiss, duration = 3200 }) {
  useEffect(() => {
    if (!toasts.length || !onDismiss) return undefined;
    const timers = toasts.map((toast) => window.setTimeout(() => onDismiss(toast.id), toast.duration || duration));
    return () => timers.forEach(window.clearTimeout);
  }, [duration, onDismiss, toasts]);

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        top: 18,
        right: 18,
        zIndex: 3000,
        display: "grid",
        gap: 10,
        width: "min(360px, calc(100vw - 28px))",
      }}
    >
      {toasts.map((toast) => {
        const tone = toneMeta[toast.type] || toneMeta.info;
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => onDismiss?.(toast.id)}
            style={{
              width: "100%",
              textAlign: "left",
              color: "#f8fafc",
              background: tone.background,
              border: `1px solid ${tone.border}`,
              borderRadius: 8,
              padding: "11px 13px",
              boxShadow: "0 16px 42px rgba(0, 0, 0, 0.34)",
              backdropFilter: "blur(18px)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {toast.message}
          </button>
        );
      })}
    </div>
  );
}
