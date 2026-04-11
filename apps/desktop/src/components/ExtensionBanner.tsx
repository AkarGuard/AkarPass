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

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "9px 16px",
      background: state === "done" ? "#ecfdf5" : state === "error" ? "#fef2f2" : "#eef2ff",
      borderBottom: `1px solid ${state === "done" ? "#6ee7b7" : state === "error" ? "#fca5a5" : "#c7d2fe"}`,
      flexShrink: 0, minHeight: 44,
      transition: "background 0.3s",
    }}>
      {/* Icon */}
      {state === "done" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" fill="#10b981" />
          <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="4" fill="#6366f1" />
          <path d="M12 8h8M12 8l-4 6.93M12 8l4 6.93M8 16h8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {/* Message */}
      <span style={{ flex: 1, fontSize: 12.5, color: state === "done" ? "#065f46" : state === "error" ? "#991b1b" : "#4338ca" }}>
        {state === "idle" && (
          <><strong>Chrome eklentisini kurun</strong> — tarayıcınızda otomatik şifre doldurma için.</>
        )}
        {state === "installing" && "Eklenti kuruluyor..."}
        {state === "done" && (
          <><strong>Eklenti kuruldu!</strong> Chrome'u yeniden başlatın, ardından bildirimi onaylayın.</>
        )}
        {state === "error" && (
          <><strong>Kurulum hatası:</strong> {errorMsg}</>
        )}
      </span>

      {/* Action button */}
      {state === "idle" && (
        <button
          onClick={install}
          style={{
            padding: "5px 14px",
            background: "#6366f1", border: "none", borderRadius: 6,
            color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
        >
          Eklentiyi Kur
        </button>
      )}

      {state === "installing" && (
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          border: "2px solid #c7d2fe", borderTopColor: "#6366f1",
          animation: "spin 0.7s linear infinite", flexShrink: 0,
        }} />
      )}

      {/* Dismiss */}
      {(state === "done" || state === "idle" || state === "error") && (
        <button
          onClick={dismiss}
          title="Kapat"
          style={{
            width: 24, height: 24, flexShrink: 0,
            background: "transparent", border: "none", borderRadius: 4,
            cursor: "pointer", color: "#818cf8", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#4338ca"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#818cf8"; }}
        >
          ✕
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
