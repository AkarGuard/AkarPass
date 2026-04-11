import { useState, useCallback, type CSSProperties } from "react";
import { generatePassword, generatePassphrase, checkPasswordStrength } from "@akarpass/core";
import type { PasswordGeneratorOptions } from "@akarpass/core";

interface Props { onClose: () => void; }

const DEFAULT_OPTS: PasswordGeneratorOptions = {
  length: 20, uppercase: true, lowercase: true, digits: true,
  symbols: true, excludeAmbiguous: true, customChars: "",
};

const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
const STRENGTH_LABELS = ["Çok zayıf", "Zayıf", "Orta", "Güçlü", "Çok güçlü"];

export function PasswordGenerator({ onClose }: Props) {
  const [opts, setOpts] = useState<PasswordGeneratorOptions>(DEFAULT_OPTS);
  const [mode, setMode] = useState<"random" | "passphrase">("random");
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTS));
  const [copied, setCopied] = useState(false);

  const regen = useCallback(() => {
    setPassword(mode === "passphrase" ? generatePassphrase(4) : generatePassword(opts));
    setCopied(false);
  }, [opts, mode]);

  function toggle(key: keyof PasswordGeneratorOptions) {
    setOpts((o) => {
      const updated = { ...o, [key]: !o[key as keyof typeof o] };
      setPassword(generatePassword(updated));
      return updated;
    });
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => navigator.clipboard.writeText(""), 30_000);
  }

  const strength = checkPasswordStrength(password);
  const strengthColor = STRENGTH_COLORS[strength.score] ?? "#94a3b8";
  const strengthLabel = STRENGTH_LABELS[strength.score] ?? "";

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1, padding: "9px 12px", border: "none",
    background: active ? "var(--color-surface)" : "none",
    borderRadius: "var(--radius-sm)",
    color: active ? "var(--color-text)" : "var(--color-text-muted)",
    cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
    boxShadow: active ? "var(--shadow-sm)" : "none",
    transition: "all 0.15s",
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 540 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)" }}>Şifre Üretici</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: 20 }}>✕</button>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--color-surface-2)", borderRadius: "var(--radius)", padding: 4, marginBottom: 20, border: "1px solid var(--color-border)" }}>
        <button style={tabStyle(mode === "random")} onClick={() => { setMode("random"); setPassword(generatePassword(opts)); }}>Rastgele</button>
        <button style={tabStyle(mode === "passphrase")} onClick={() => { setMode("passphrase"); setPassword(generatePassphrase(4)); }}>Parola öbeği</button>
      </div>

      {/* Output */}
      <div style={{ background: "var(--color-surface-2)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <code style={{ flex: 1, fontSize: 15, fontFamily: "monospace", wordBreak: "break-all", color: "var(--color-text)", lineHeight: 1.5 }}>{password}</code>
        <button onClick={regen} title="Yenile"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "var(--color-text-muted)", padding: "4px 8px", flexShrink: 0 }}>⟳</button>
        <button onClick={copyPassword}
          style={{ padding: "8px 16px", background: copied ? "var(--color-success)" : "var(--color-accent)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
          {copied ? "✓ Kopyalandı" : "Kopyala"}
        </button>
      </div>

      {/* Strength */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 6, borderRadius: 6, background: "var(--color-border)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((strength.score + 1) / 5) * 100}%`, background: strengthColor, transition: "all 0.3s", borderRadius: 6 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 13, color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span>
          <span style={{ fontSize: 12, color: "var(--color-text-subtle)" }}>Kırılma süresi: {strength.crackTime}</span>
        </div>
      </div>

      {mode === "random" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16, background: "var(--color-surface-2)", borderRadius: "var(--radius)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)", whiteSpace: "nowrap", minWidth: 110 }}>Uzunluk: <strong style={{ color: "var(--color-text)" }}>{opts.length}</strong></label>
            <input type="range" min={8} max={128} value={opts.length}
              onChange={(e) => { const updated = { ...opts, length: Number(e.target.value) }; setOpts(updated); setPassword(generatePassword(updated)); }}
              style={{ flex: 1, accentColor: "var(--color-accent)" }} />
          </div>

          {([ ["uppercase", "Büyük harf (A-Z)"], ["lowercase", "Küçük harf (a-z)"], ["digits", "Sayılar (0-9)"], ["symbols", "Semboller (!@#...)"], ["excludeAmbiguous", "Benzer karakterleri hariç tut (0Oll1I)"] ] as [keyof PasswordGeneratorOptions, string][]).map(([key, label]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={opts[key] as boolean} onChange={() => toggle(key)}
                style={{ width: 16, height: 16, accentColor: "var(--color-accent)", cursor: "pointer" }} />
              <span style={{ fontSize: 14, color: "var(--color-text)" }}>{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
