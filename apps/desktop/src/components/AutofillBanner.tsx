import { useEffect, useRef, useState } from "react";
import type { VaultEntry } from "@akarpass/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAutofillBridge, type AutofillStatus } from "../lib/autofill-bridge.js";
import { useT } from "../lib/i18n/index.js";

const DISMISSED_KEY = "autofillBannerDismissed";

type BannerState =
  | { kind: "hint" }
  | { kind: "typed"; entryName: string }
  | { kind: "no-match"; where: string }
  | { kind: "locked" }
  | { kind: "error"; message: string }
  | {
      kind: "multi-match";
      where: string;
      matches: VaultEntry[];
      onChoose: (entry: VaultEntry) => Promise<void>;
      onCancel: () => void;
    };

export function AutofillBanner() {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<BannerState>({ kind: "hint" });

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) setDismissed(true);
  }, []);

  useAutofillBridge((status: AutofillStatus) => {
    setDismissed(false);
    localStorage.removeItem(DISMISSED_KEY);
    if (status.kind === "typed") {
      setState({ kind: "typed", entryName: status.entry.title });
    } else if (status.kind === "no-match") {
      const where = status.target.url ?? status.target.appName ?? t("autofill.thisWindow");
      setState({ kind: "no-match", where });
    } else if (status.kind === "locked") {
      setState({ kind: "locked" });
    } else if (status.kind === "error") {
      setState({ kind: "error", message: status.message });
    } else if (status.kind === "multi-match") {
      const where = status.target.url ?? status.target.appName ?? t("autofill.thisWindow");
      setState({
        kind: "multi-match",
        where,
        matches: status.matches,
        onChoose: status.onChoose,
        onCancel: status.onCancel,
      });
    } else if (status.kind === "idle") {
      setState({ kind: "hint" });
    }
  });

  // Auto-revert to hint 4 s after a transient state (excluding multi-match,
  // which is an interactive modal that must wait for the user).
  useEffect(() => {
    if (state.kind === "hint" || state.kind === "multi-match") return;
    const tid = setTimeout(() => setState({ kind: "hint" }), 4000);
    return () => clearTimeout(tid);
  }, [state.kind]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  // Banner palette/message only — picker modal renders below independently.
  const showBanner = !(dismissed && state.kind === "hint") && state.kind !== "multi-match";

  const palette = (() => {
    switch (state.kind) {
      case "typed":
        return { bg: "var(--color-success-light)", border: "var(--color-success)", text: "var(--color-success)" };
      case "no-match":
      case "locked":
        return { bg: "var(--color-warning-light, rgba(234,179,8,0.12))", border: "var(--color-warning, #eab308)", text: "var(--color-warning, #a16207)" };
      case "error":
        return { bg: "var(--color-danger-light)", border: "var(--color-danger)", text: "var(--color-danger)" };
      default:
        return { bg: "var(--color-accent-light)", border: "var(--color-accent)", text: "var(--color-accent-hover)" };
    }
  })();

  const message = (() => {
    switch (state.kind) {
      case "typed":
        return (<><strong>{t("autofill.filled")}</strong> {state.entryName}</>);
      case "no-match":
        return (<><strong>{t("autofill.noMatch.strong")}</strong> {t("autofill.noMatch.rest", { where: state.where })}</>);
      case "locked":
        return (<><strong>{t("autofill.locked.strong")}</strong> {t("autofill.locked.rest")}</>);
      case "error":
        return (<><strong>{t("autofill.error.strong")}</strong> {state.message}</>);
      default:
        return (
          <>
            <strong>{t("autofill.active.strong")}</strong> {t("autofill.active.rest")}{" "}
            <kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>Shift</kbd> + <kbd style={kbdStyle}>L</kbd>.
          </>
        );
    }
  })();

  return (
    <>
      {showBanner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 14px",
            background: palette.bg,
            borderBottom: `1px solid ${palette.border}`,
            flexShrink: 0,
            minHeight: 40,
            transition: "background 0.25s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="10" rx="2" stroke={palette.border} strokeWidth="1.6" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke={palette.border} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span style={{ flex: 1, fontSize: 12, color: palette.text }}>{message}</span>
          {state.kind === "hint" && (
            <button
              onClick={dismiss}
              title={t("autofill.close")}
              style={{
                width: 22, height: 22, flexShrink: 0,
                background: "transparent", border: "none", borderRadius: 4,
                cursor: "pointer", color: palette.text,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0.7,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="9" y2="9" />
                <line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          )}
        </div>
      )}

      {state.kind === "multi-match" && (
        <MultiMatchPicker
          where={state.where}
          matches={state.matches}
          onChoose={async (entry) => {
            await state.onChoose(entry);
            setState({ kind: "hint" });
          }}
          onCancel={() => {
            state.onCancel();
            setState({ kind: "hint" });
          }}
        />
      )}
    </>
  );
}

// ── Multi-match picker ─────────────────────────────────────────────────────

function MultiMatchPicker({
  where,
  matches,
  onChoose,
  onCancel,
}: {
  where: string;
  matches: VaultEntry[];
  onChoose: (entry: VaultEntry) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Bring the AkarPass window to front so the user can see and click the
  // picker. Rust's SetForegroundWindow will move focus back to the captured
  // HWND when the user picks — we don't need to hide the window ourselves.
  useEffect(() => {
    (async () => {
      try {
        const win = getCurrentWindow();
        await win.unminimize();
        await win.show();
        await win.setFocus();
      } catch {
        /* ignore — cosmetic */
      }
    })();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (busy) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => (i + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const entry = matches[selected];
        if (entry) void handleChoose(entry);
        return;
      }
      // Quick-jump 1..9
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= Math.min(9, matches.length)) {
        e.preventDefault();
        const entry = matches[n - 1];
        if (entry) void handleChoose(entry);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, matches, busy]);

  async function handleChoose(entry: VaultEntry) {
    if (busy) return;
    setBusy(true);
    try {
      await onChoose(entry);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxHeight: "80vh",
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
          <div style={{ fontSize: 11.5, color: "var(--color-text-subtle)", marginTop: 3 }}>
            {t("autofill.picker.subtitleFor", { where })}
          </div>
        </div>

        <div ref={listRef} style={{ overflowY: "auto", padding: "6px 0" }}>
          {matches.map((entry, i) => {
            const isSelected = i === selected;
            const isBusy = busy && isSelected;
            return (
              <button
                key={entry.id}
                disabled={busy}
                onMouseEnter={() => setSelected(i)}
                onClick={() => handleChoose(entry)}
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
                {isBusy && (
                  <span style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>…</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--color-border)", background: "var(--color-surface-2)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
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

const kbdStyle: React.CSSProperties = {
  padding: "1px 6px",
  borderRadius: 4,
  background: "rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 11,
  fontFamily: "ui-monospace, Consolas, monospace",
};
