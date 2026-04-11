import React, { useState, useCallback } from "react";
import { generatePassword, type PasswordGeneratorOptions } from "@akarpass/core";

interface PasswordGeneratorProps {
  onUse?: (password: string) => void;
  standalone?: boolean;
}

const DEFAULT_OPTIONS: PasswordGeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: true,
  customChars: "",
};

function strengthInfo(pw: string): { label: string; color: string; width: string } {
  const len = pw.length;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const variety = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;

  if (len < 8 || variety < 2) return { label: "Weak", color: "#ef4444", width: "20%" };
  if (len < 12 || variety < 3) return { label: "Fair", color: "#f97316", width: "45%" };
  if (len < 16 || variety < 4) return { label: "Good", color: "#eab308", width: "65%" };
  if (len < 20) return { label: "Strong", color: "#22c55e", width: "80%" };
  return { label: "Very Strong", color: "#10b981", width: "100%" };
}

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
    background: active ? "var(--color-accent)" : "var(--color-bg)",
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
        padding: 24, background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        boxShadow: "var(--shadow)",
      }
    : { width: "100%" };

  return (
    <div style={container}>
      {standalone && (
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 20 }}>
          🔑 Password Generator
        </h2>
      )}

      {/* Generated password display */}
      <div
        style={{
          padding: "14px 16px",
          background: "var(--color-bg)",
          border: "1.5px solid var(--color-border)",
          borderRadius: 10, marginBottom: 8,
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <code
          style={{
            flex: 1, fontSize: 15, fontFamily: "monospace",
            color: "var(--color-text)", wordBreak: "break-all",
            letterSpacing: "0.05em",
          }}
        >
          {password}
        </code>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={copy}
            style={{
              padding: "6px 12px", border: "1px solid var(--color-border)",
              borderRadius: 7, background: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              color: copied ? "var(--color-success)" : "var(--color-text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            onClick={() => regenerate(options)}
            title="Regenerate"
            style={{
              padding: "6px 10px", border: "1px solid var(--color-border)",
              borderRadius: 7, background: "#fff", fontSize: 15,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Strength meter */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: strength.width,
            background: strength.color,
            borderRadius: 2, transition: "all 0.3s",
          }} />
        </div>
        <div style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginTop: 4, textAlign: "right" }}>
          {strength.label}
        </div>
      </div>

      {/* Length slider */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Length</label>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "var(--color-accent)",
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
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Include
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button onClick={() => update("uppercase", !options.uppercase)} style={toggleStyle(options.uppercase)}>ABC</button>
          <button onClick={() => update("lowercase", !options.lowercase)} style={toggleStyle(options.lowercase)}>abc</button>
          <button onClick={() => update("digits", !options.digits)} style={toggleStyle(options.digits)}>123</button>
          <button onClick={() => update("symbols", !options.symbols)} style={toggleStyle(options.symbols)}>!@#</button>
          <button onClick={() => update("excludeAmbiguous", !options.excludeAmbiguous)} style={toggleStyle(options.excludeAmbiguous)}>No l/0/O</button>
        </div>
      </div>

      {/* Actions */}
      {onUse && (
        <button
          onClick={() => onUse(password)}
          style={{
            width: "100%", padding: "10px 0",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Use This Password
        </button>
      )}
    </div>
  );
}
