import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useT, useLanguage, LANGUAGES } from "../lib/i18n/index.js";

const DEFAULT_ACCEL = "CommandOrControl+Shift+L";
const IS_MAC = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
const MOD_LABEL = IS_MAC ? "\u2318" : "Ctrl";

function prettyAccel(accel: string): string {
  const parts = accel.split("+").map((p) => {
    if (p === "CommandOrControl" || p === "CmdOrCtrl") return MOD_LABEL;
    return p;
  });
  return parts.join(IS_MAC ? " " : " + ");
}

function normalizeKey(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  const map: Record<string, string> = {
    Space: "Space", Enter: "Enter", Tab: "Tab", Backspace: "Backspace",
    ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right",
    Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown",
    Insert: "Insert", Delete: "Delete",
    Minus: "Minus", Equal: "Equal", Comma: "Comma", Period: "Period",
    Slash: "Slash", Backslash: "Backslash", Semicolon: "Semicolon",
    Quote: "Quote", BracketLeft: "BracketLeft", BracketRight: "BracketRight",
    Backquote: "Backquote",
  };
  return map[code] ?? null;
}

type CaptureOutcome =
  | { kind: "pending" }
  | { kind: "accel"; value: string }
  | { kind: "error"; code: "no-modifier" | "invalid" };

function captureFromEvent(e: KeyboardEvent): CaptureOutcome {
  if (["Control", "Meta", "Alt", "Shift"].includes(e.key)) {
    return { kind: "pending" };
  }
  const mods: string[] = [];
  if (e.ctrlKey || e.metaKey) mods.push("CommandOrControl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");

  const key = normalizeKey(e.code);
  if (!key) return { kind: "error", code: "invalid" };
  if (mods.length === 0) return { kind: "error", code: "no-modifier" };
  return { kind: "accel", value: [...mods, key].join("+") };
}

export function SettingsPanel() {
  const t = useT();
  const { lang, setLang } = useLanguage();

  const [accel, setAccel] = useState<string>(DEFAULT_ACCEL);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string>("");
  const recorderRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const current = await invoke<string>("autofill_get_shortcut");
        if (current) setAccel(current);
      } catch {
        /* ignore — fall back to DEFAULT_ACCEL */
      }
    })();
  }, []);

  async function saveAccel(next: string) {
    try {
      await invoke("autofill_set_shortcut", { accelerator: next });
      setAccel(next);
      setError("");
    } catch (e) {
      setError(`${t("settings.shortcut.saveFailed")} ${String(e)}`);
    }
  }

  useEffect(() => {
    if (!recording) return;
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(false);
        setError("");
        return;
      }
      const outcome = captureFromEvent(e);
      if (outcome.kind === "pending") return;
      if (outcome.kind === "error") {
        if (outcome.code === "no-modifier") {
          setError(t("settings.shortcut.needModifier"));
        }
        return;
      }
      setRecording(false);
      void saveAccel(outcome.value);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  function startRecording() {
    setError("");
    setRecording(true);
  }

  function handleReset() {
    void saveAccel(DEFAULT_ACCEL);
  }

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
          {t("settings.title")}
        </h2>
      </div>

      {/* Body */}
      <div style={{ padding: "24px", maxWidth: 620 }}>
        {/* General section */}
        <SectionLabel>{t("settings.section.general")}</SectionLabel>

        {/* Language picker */}
        <Card>
          <IconBadge>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </IconBadge>

          <div style={{ flex: 1, minWidth: 0 }}>
            <RowTitle>{t("settings.language")}</RowTitle>
            <RowHint>{t("settings.languageHint")}</RowHint>
          </div>

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel} — {l.label}
              </option>
            ))}
          </select>
        </Card>

        {/* Shortcut picker */}
        <Card>
          <IconBadge>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
            </svg>
          </IconBadge>

          <div style={{ flex: 1, minWidth: 0 }}>
            <RowTitle>{t("settings.shortcut.label")}</RowTitle>
            <RowHint>{t("settings.shortcut.hint")}</RowHint>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            <button
              ref={recorderRef}
              onClick={startRecording}
              style={{
                ...selectStyle,
                cursor: "pointer",
                textAlign: "center",
                fontFamily: "Consolas, 'Courier New', monospace",
                fontWeight: 600,
                letterSpacing: "0.02em",
                minWidth: 180,
                borderColor: recording ? "var(--color-accent)" : "var(--color-border)",
                boxShadow: recording ? "0 0 0 3px var(--color-accent-glow)" : "none",
                color: recording ? "var(--color-accent-hover)" : "var(--color-text)",
              }}
            >
              {recording ? t("settings.shortcut.recording") : prettyAccel(accel)}
            </button>
            {accel !== DEFAULT_ACCEL && !recording && (
              <button
                onClick={handleReset}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--color-text-subtle)",
                  fontSize: 11,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {t("settings.shortcut.reset")}
              </button>
            )}
          </div>
        </Card>

        {error && (
          <div style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "var(--color-danger-light)",
            border: "1px solid var(--color-danger)",
            borderRadius: 7,
            color: "var(--color-danger)",
            fontSize: 12,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tiny presentational helpers ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "var(--color-text-subtle)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: 9,
        background: "var(--color-accent-light)",
        border: "1px solid var(--color-accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

function RowTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 3 }}>
      {children}
    </div>
  );
}

function RowHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11.5, color: "var(--color-text-subtle)" }}>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: "1.5px solid var(--color-border)",
  borderRadius: 7,
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
  fontSize: 13,
  cursor: "pointer",
  outline: "none",
  minWidth: 160,
  flexShrink: 0,
};
