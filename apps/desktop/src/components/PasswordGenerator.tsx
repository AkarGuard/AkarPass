import React, { useState, useCallback } from "react";
import { generatePassword, type PasswordGeneratorOptions } from "@akarpass/core";

interface PasswordGeneratorProps {
  onUse?: (password: string) => void;
  standalone?: boolean;
}

const DEFAULT_OPTIONS: PasswordGeneratorOptions = {
  length: 20, uppercase: true, lowercase: true,
  digits: true, symbols: true, excludeAmbiguous: true, customChars: "",
};

function strengthInfo(pw: string): { label: string; color: string; width: string } {
  const len = pw.length;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const variety = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;

  if (len < 8 || variety < 2) return { label: "Çok zayıf", color: "#ef4444", width: "20%" };
  if (len < 12 || variety < 3) return { label: "Zayıf",    color: "#f97316", width: "45%" };
  if (len < 16 || variety < 4) return { label: "Orta",     color: "#eab308", width: "65%" };
  if (len < 20)                 return { label: "Güçlü",    color: "#22c55e", width: "80%" };
  return                               { label: "Çok güçlü", color: "#10b981", width: "100%" };
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function Icon({ d, size = 13 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const REFRESH_D = "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15";
const COPY_D    = "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2M8 4h8";
const CHECK_D   = "M20 6L9 17l-5-5";

export function PasswordGenerator({ onUse, standalone = false }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(DEFAULT_OPTIONS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTIONS));
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback((opts: PasswordGeneratorOptions) => {
    setPassword(generatePassword(opts));
    setCopied(false);
  }, []);

  function update<K extends keyof PasswordGeneratorOptions>(key: K, value: PasswordGeneratorOptions[K]) {
    const next = { ...options, [key]: value };
    setOptions(next);
    regenerate(next);
  }

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const strength = strengthInfo(password);

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px",
    background: active ? "var(--color-accent)" : "var(--color-surface-2)",
    border: `1.5px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
    borderRadius: 20,
    color: active ? "#fff" : "var(--color-text-secondary)",
    fontSize: 12, fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.12s",
  });

  const container: React.CSSProperties = standalone
    ? {
        width: "100%", maxWidth: 480, margin: "0 auto",
        padding: 24, background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16, boxShadow: "var(--shadow)",
      }
    : { width: "100%" };

  return (
    <div style={container}>
      {standalone && (
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 20 }}>
          Şifre Üretici
        </h2>
      )}

      {/* Generated password display */}
      <div style={{
        padding: "12px 14px",
        background: "var(--color-surface-2)",
        border: "1.5px solid var(--color-border)",
        borderRadius: 10, marginBottom: 8,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <code style={{
          flex: 1, fontSize: 14, fontFamily: "Consolas, 'Courier New', monospace",
          color: "var(--color-text)", wordBreak: "break-all", letterSpacing: "0.04em",
        }}>
          {password}
        </code>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <SmallBtn onClick={copy} active={copied}>
            <Icon d={copied ? CHECK_D : COPY_D} />
            {copied ? "Kopyalandı" : "Kopyala"}
          </SmallBtn>
          <SmallBtn onClick={() => regenerate(options)}>
            <Icon d={REFRESH_D} />
          </SmallBtn>
        </div>
      </div>

      {/* Strength meter */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: strength.width,
            background: strength.color, borderRadius: 2, transition: "all 0.3s",
          }} />
        </div>
        <div style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginTop: 4, textAlign: "right" }}>
          {strength.label}
        </div>
      </div>

      {/* Length slider */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Uzunluk</label>
          <span style={{
            fontSize: 12, fontWeight: 700, color: "var(--color-accent)",
            background: "var(--color-accent-light)", padding: "1px 8px", borderRadius: 20,
          }}>
            {options.length}
          </span>
        </div>
        <input
          type="range" min={8} max={64} value={options.length}
          onChange={(e) => update("length", parseInt(e.target.value, 10))}
          style={{ width: "100%", accentColor: "var(--color-accent)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-subtle)", marginTop: 2 }}>
          <span>8</span><span>64</span>
        </div>
      </div>

      {/* Character options */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-subtle)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Karakter seti
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button onClick={() => update("uppercase", !options.uppercase)} style={toggleStyle(options.uppercase)}>ABC</button>
          <button onClick={() => update("lowercase", !options.lowercase)} style={toggleStyle(options.lowercase)}>abc</button>
          <button onClick={() => update("digits",    !options.digits)}    style={toggleStyle(options.digits)}>123</button>
          <button onClick={() => update("symbols",   !options.symbols)}   style={toggleStyle(options.symbols)}>!@#</button>
          <button onClick={() => update("excludeAmbiguous", !options.excludeAmbiguous)} style={toggleStyle(options.excludeAmbiguous)}>
            0/O/l hariç
          </button>
        </div>
      </div>

      {/* Use button */}
      {onUse && (
        <button
          onClick={() => onUse(password)}
          style={{
            width: "100%", padding: "9px 0",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Bu şifreyi kullan
        </button>
      )}
    </div>
  );
}

function SmallBtn({
  onClick, children, active = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "5px 10px",
        background: active ? "var(--color-success-light)" : hover ? "var(--color-surface-3)" : "var(--color-surface)",
        border: `1px solid ${active ? "var(--color-success)" : hover ? "var(--color-border-strong)" : "var(--color-border)"}`,
        borderRadius: 6,
        fontSize: 11.5, fontWeight: 600, cursor: "pointer",
        color: active ? "var(--color-success)" : "var(--color-text-secondary)",
        display: "flex", alignItems: "center", gap: 5,
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}
