import { useState, type FormEvent } from "react";
import type { VaultEntry } from "@akarpass/core";
import { checkPasswordStrength, generatePassword } from "@akarpass/core";
import type { VaultService } from "../types.js";

interface Props {
  entry: VaultEntry | null;
  vaultService: Pick<VaultService, "addVaultEntry" | "updateVaultEntry" | "syncActiveVault">;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const STRENGTH_LABELS = ["Çok zayıf", "Zayıf", "Orta", "Güçlü", "Çok güçlü"];
const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const EYE     = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const EYE_OFF = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";
const BOLT    = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";
const CLOSE   = "M18 6L6 18M6 6l12 12";

export function EntryEditor({ entry, vaultService, onSave, onCancel }: Props) {
  const [title,       setTitle]       = useState(entry?.title ?? "");
  const [username,    setUsername]    = useState(entry?.username ?? "");
  const [password,    setPassword]    = useState(entry?.password ?? "");
  const [url,         setUrl]         = useState(entry?.url ?? "");
  const [notes,       setNotes]       = useState(entry?.notes ?? "");
  const [tags,        setTags]        = useState(entry?.tags.join(", ") ?? "");
  const [totpSecret,  setTotpSecret]  = useState(entry?.totpSecret ?? "");
  const [favourite,   setFavourite]   = useState(entry?.favourite ?? false);
  const [showPwd,     setShowPwd]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [saveTarget,  setSaveTarget]  = useState<"cloud" | "local">("cloud");

  const strength      = checkPasswordStrength(password);
  const strengthColor = STRENGTH_COLORS[strength.score] ?? "#94a3b8";
  const strengthLabel = STRENGTH_LABELS[strength.score] ?? "";

  function genPassword() {
    setPassword(generatePassword({
      length: 20, uppercase: true, lowercase: true,
      digits: true, symbols: true, excludeAmbiguous: true, customChars: "",
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      if (entry) {
        await vaultService.updateVaultEntry(entry.id, {
          title, username, password, url, notes,
          tags: tagArray, favourite, totpSecret: totpSecret || null,
        });
      } else {
        await vaultService.addVaultEntry({
          title, username, password, url, notes,
          tags: tagArray, favourite, totpSecret: totpSecret || null,
          additionalUrls: [], folderId: null,
        });
      }
      if (saveTarget === "cloud") await vaultService.syncActiveVault();
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--color-bg)" }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)", flexShrink: 0,
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
          {entry ? "Girişi düzenle" : "Yeni giriş"}
        </h2>
        <button onClick={onCancel} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--color-text-muted)", padding: "6px", borderRadius: "var(--radius-sm)",
          display: "flex",
        }}>
          <Icon d={CLOSE} size={16} />
        </button>
      </div>

      {/* ── Form ───────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>

          <FormField label="Başlık *">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              required placeholder="örn. GitHub, Netflix..."
              style={inputS} />
          </FormField>

          <FormField label="Kullanıcı adı / E-posta">
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="kullanici@email.com" autoComplete="off"
              style={inputS} />
          </FormField>

          <FormField label="Şifre *">
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showPwd ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="new-password" placeholder="••••••••"
                style={{ ...inputS, flex: 1 }}
              />
              <IconButton onClick={() => setShowPwd(p => !p)} title={showPwd ? "Gizle" : "Göster"}>
                <Icon d={showPwd ? EYE_OFF : EYE} />
              </IconButton>
              <IconButton onClick={genPassword} title="Güvenli şifre üret">
                <Icon d={BOLT} />
              </IconButton>
            </div>
            {password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 3, borderRadius: 3, background: "var(--color-border)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3, transition: "width 0.3s, background 0.3s",
                    width: `${((strength.score + 1) / 5) * 100}%`,
                    background: strengthColor,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                  <span style={{ fontSize: 12, color: "var(--color-text-subtle)" }}>Kırılma: {strength.crackTime}</span>
                </div>
              </div>
            )}
          </FormField>

          <FormField label="URL">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com" style={inputS} />
          </FormField>

          <FormField label="Notlar">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Ek notlar..."
              style={{ ...inputS, resize: "vertical", fontFamily: "inherit", minHeight: 72 }} />
          </FormField>

          <FormField label="Etiketler (virgülle ayır)">
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="iş, sosyal, finans" style={inputS} />
          </FormField>

          <FormField label="TOTP Anahtarı (opsiyonel)">
            <input value={totpSecret} onChange={(e) => setTotpSecret(e.target.value)}
              placeholder="Base32 TOTP anahtarı" autoComplete="off" style={inputS} />
          </FormField>

          {/* Favourite */}
          <label style={{
            display: "flex", alignItems: "center", gap: 10,
            cursor: "pointer", padding: "10px 14px",
            background: "var(--color-surface-2)", borderRadius: "var(--radius)",
            border: "1.5px solid var(--color-border)",
          }}>
            <input type="checkbox" checked={favourite} onChange={(e) => setFavourite(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--color-accent)", cursor: "pointer" }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>★ Favorilere ekle</span>
          </label>

          {/* Save target */}
          <div style={{
            padding: 14, background: "var(--color-surface-2)",
            borderRadius: "var(--radius)", border: "1px solid var(--color-border)",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Nereye kaydedilsin?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["cloud", "local"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setSaveTarget(t)}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: "var(--radius)",
                    border: `1.5px solid ${saveTarget === t ? "var(--color-accent)" : "var(--color-border)"}`,
                    background: saveTarget === t ? "var(--color-accent-light)" : "none",
                    color: saveTarget === t ? "var(--color-accent-hover)" : "var(--color-text-muted)",
                    cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                  }}>
                  {t === "cloud" ? "☁️ Bulut + Yerel" : "💾 Sadece Yerel"}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginTop: 8 }}>
              {saveTarget === "cloud"
                ? "Kaydettikten sonra otomatik olarak buluta senkronize edilir."
                : "Sadece bu cihaza kaydedilir."}
            </p>
          </div>

          {error && (
            <div style={{
              padding: "10px 14px",
              background: "var(--color-danger-light)",
              border: "1px solid var(--color-danger)",
              borderRadius: "var(--radius)",
            }}>
              <p style={{ fontSize: 13, color: "var(--color-danger)" }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onCancel}
              style={{
                padding: "10px 20px", border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius)", background: "none",
                color: "var(--color-text-muted)", cursor: "pointer",
                fontSize: 14, fontWeight: 500,
              }}>
              İptal
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding: "10px 24px", border: "none", borderRadius: "var(--radius)",
                background: saving ? "var(--color-surface-3)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white", cursor: saving ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600,
                boxShadow: saving ? "none" : "0 4px 12px rgba(99,102,241,0.3)",
                transition: "all 0.15s",
              }}>
              {saving ? "Kaydediliyor..." : saveTarget === "cloud" ? "Kaydet & Senkronize et" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        color: "var(--color-text-subtle)", marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function IconButton({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      style={{
        padding: "0 12px", border: "1.5px solid var(--color-border)",
        borderRadius: "var(--radius)", background: "var(--color-surface-2)",
        color: "var(--color-text-muted)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, height: "auto", transition: "all 0.12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
    >
      {children}
    </button>
  );
}

const inputS = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  color: "var(--color-text)", background: "var(--color-surface-2)",
  border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)",
  outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
} as const;
