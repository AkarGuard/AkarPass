import { useEffect, useState } from "react";
import { useAutofillBridge, type AutofillStatus } from "../lib/autofill-bridge.js";
import { useT } from "../lib/i18n/index.js";

const DISMISSED_KEY = "autofillBannerDismissed";

type BannerState =
  | { kind: "hint" }
  | { kind: "typed"; entryName: string }
  | { kind: "no-match"; where: string }
  | { kind: "locked" }
  | { kind: "error"; message: string };

export function AutofillBanner() {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<BannerState>({ kind: "hint" });

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) setDismissed(true);
  }, []);

  useAutofillBridge((status: AutofillStatus) => {
    // Multi-match no longer flows through the banner — the picker is a
    // standalone overlay window. We only react to banner-relevant statuses.
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
    } else if (status.kind === "idle") {
      setState({ kind: "hint" });
    }
  });

  // Auto-revert to hint 4 s after a transient state.
  useEffect(() => {
    if (state.kind === "hint") return;
    const tid = setTimeout(() => setState({ kind: "hint" }), 4000);
    return () => clearTimeout(tid);
  }, [state.kind]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  if (dismissed && state.kind === "hint") return null;

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
