import { useEffect, useState } from "react";
import type { VaultEntry } from "@akarpass/core";
import { emit, emitTo, listen } from "@tauri-apps/api/event";
import { useT } from "../lib/i18n/index.js";

interface PickerTarget {
  url: string | null;
  appName: string;
  windowTitle: string;
  hwnd: number | null;
}

interface PickerData {
  matches: VaultEntry[];
  target: PickerTarget;
}

function displayWhere(target: PickerTarget, fallback: string): string {
  if (target.url) {
    try {
      return new URL(target.url).hostname;
    } catch {
      return target.url;
    }
  }
  return target.appName || fallback;
}

/**
 * PickerApp is mounted in the dedicated `picker` Tauri window.
 *
 * Lifecycle:
 *  1. On mount, emit `picker:ready` so the main window knows we can receive data
 *  2. Main window replies by emitting `picker:data` with the match list + target
 *  3. User picks (mouse/keyboard) or cancels — we emit `picker:choose` (entry id)
 *     or `picker:cancel`. Main closes/hides us and injects the credentials into
 *     the captured HWND.
 *
 * Window is frameless / always-on-top / skipTaskbar and centered on the active
 * screen so it appears as an overlay on top of whatever the user is doing.
 */
export function PickerApp() {
  const t = useT();
  const [data, setData] = useState<PickerData | null>(null);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";

    const unlistens: Array<() => void> = [];

    listen<PickerData>("picker:data", (evt) => {
      setData(evt.payload);
      setSelected(0);
      setBusy(false);
    }).then((fn) => unlistens.push(fn));

    // Announce readiness. If main already sent data before we mounted, it will
    // retry on next ready ping.
    void emit("picker:ready");

    return () => {
      for (const fn of unlistens) fn();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (busy || !data) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setBusy(true);
        void emit("picker:cancel");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => (i + 1) % data.matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => (i - 1 + data.matches.length) % data.matches.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const entry = data.matches[selected];
        if (entry) choose(entry);
        return;
      }
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= Math.min(9, data.matches.length)) {
        e.preventDefault();
        const entry = data.matches[n - 1];
        if (entry) choose(entry);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selected, busy]);

  function choose(entry: VaultEntry) {
    if (busy) return;
    setBusy(true);
    void emitTo("main", "picker:choose", entry.id);
  }

  function cancel() {
    if (busy) return;
    setBusy(true);
    void emitTo("main", "picker:cancel");
  }

  if (!data) {
    // Empty placeholder while we wait for picker:data. Stays visually blank
    // so there's no flash before content arrives.
    return <div style={{ width: "100%", height: "100vh", background: "var(--color-bg)" }} />;
  }

  const where = displayWhere(data.target, t("autofill.thisWindow"));

  return (
    <div
      onClick={cancel}
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.0)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
            {t("autofill.picker.title")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--color-text-subtle)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {t("autofill.picker.subtitleFor", { where })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {data.matches.map((entry, i) => {
            const isSelected = i === selected;
            return (
              <button
                key={entry.id}
                disabled={busy}
                onMouseEnter={() => setSelected(i)}
                onClick={() => choose(entry)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 18px",
                  background: isSelected ? "var(--color-accent-light)" : "transparent",
                  border: "none",
                  borderLeft: `3px solid ${isSelected ? "var(--color-accent)" : "transparent"}`,
                  cursor: busy ? "wait" : "pointer",
                  textAlign: "left",
                  color: "var(--color-text)",
                  transition: "background 0.08s",
                }}
              >
                <span
                  style={{
                    width: 20,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-text-subtle)",
                    fontFamily: "Consolas, monospace",
                  }}
                >
                  {i < 9 ? i + 1 : ""}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {entry.title}
                    {entry.favourite && <span style={{ marginLeft: 6, color: "#fbbf24", fontSize: 11 }}>★</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--color-text-subtle)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                    {entry.username || <em>{t("autofill.picker.noUsername")}</em>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--color-border)", background: "var(--color-surface-2)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={cancel}
            disabled={busy}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 11.5,
              color: "var(--color-text-subtle)",
              cursor: busy ? "wait" : "pointer",
              padding: "4px 8px",
            }}
          >
            {t("autofill.picker.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
