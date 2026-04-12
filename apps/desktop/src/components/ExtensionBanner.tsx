import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const DISMISSED_KEY = "extensionBannerDismissed";

type State = "idle" | "installing" | "done" | "error";

export function ExtensionBanner() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!localStorage.getItem(DISMISSED_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function install() {
    setState("installing");
    try {
      await invoke("install_chrome_extension");
      setState("done");
    } catch (e) {
      setState("error");
      setErrorMsg(String(e));
    }
  }

  if (!visible) return null;

  const bg = state === "done" ? "var(--color-success-light)"
    : state === "error" ? "var(--color-danger-light)"
    : "var(--color-accent-light)";

  const borderColor = state === "done" ? "var(--color-success)"
    : state === "error" ? "var(--color-danger)"
    : "var(--color-accent)";

  const textColor = state === "done" ? "var(--color-success)"
    : state === "error" ? "var(--color-danger)"
    : "var(--color-accent-hover)";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "8px 14px",
      background: bg,
      borderBottom: `1px solid ${borderColor}`,
      flexShrink: 0, minHeight: 40,
      transition: "background 0.3s",
    }}>
      {/* Icon */}
      {state === "done" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" fill="var(--color-success)" />
          <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="4" fill="var(--color-accent)" />
          <path d="M12 8h8M12 8l-4 6.93M12 8l4 6.93M8 16h8" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {/* Message */}
      <span style={{ flex: 1, fontSize: 12, color: textColor }}>
        {state === "idle" && (
          <><strong>Chrome eklentisini kurun</strong> — tarayıcınızda otomatik şifre doldurma için.</>
        )}
        {state === "installing" && "Eklenti kuruluyor…"}
        {state === "done" && (
          <><strong>Eklenti kuruldu!</strong> Chrome'u yeniden başlatın ve bildirimi onaylayın.</>
        )}
        {state === "error" && (
          <><strong>Kurulum hatası:</strong> {errorMsg}</>
        )}
      </span>

      {/* Install button */}
      {state === "idle" && (
        <button
          onClick={install}
          style={{
            padding: "4px 12px",
            background: "var(--color-accent)", border: "none", borderRadius: 5,
            color: "#fff", fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
        >
          Kur
        </button>
      )}

      {/* Spinner */}
      {state === "installing" && (
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          border: "2px solid var(--color-accent-light)", borderTopColor: "var(--color-accent)",
          animation: "spin 0.7s linear infinite", flexShrink: 0,
        }} />
      )}

      {/* Dismiss */}
      {(state === "done" || state === "idle" || state === "error") && (
        <button onClick={dismiss} title="Kapat"
          style={{
            width: 22, height: 22, flexShrink: 0,
            background: "transparent", border: "none", borderRadius: 4,
            cursor: "pointer", color: textColor, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
