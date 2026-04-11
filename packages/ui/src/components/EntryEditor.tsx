import { useState, type FormEvent, type CSSProperties } from "react";
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

const inputStyle: CSSProperties = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  color: "var(--color-text)", background: "var(--color-surface-2)",
  border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)",
  outline: "none",
};

export function EntryEditor({ entry, vaultService, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [username, setUsername] = useState(entry?.username ?? "");
  const [password, setPassword] = useState(entry?.password ?? "");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [tags, setTags] = useState(entry?.tags.join(", ") ?? "");
  const [totpSecret, setTotpSecret] = useState(entry?.totpSecret ?? "");
  const [favourite, setFavourite] = useState(entry?.favourite ?? false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTarget, setSaveTarget] = useState<"local" | "cloud">("cloud");

  const strength = checkPasswordStrength(password);
  const strengthColor = STRENGTH_COLORS[strength.score] ?? "#94a3b8";
  const strengthLabel = STRENGTH_LABELS[strength.score] ?? "";

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
      if (saveTarget === "cloud") {
        await vaultService.syncActiveVault();
      }
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 580 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)" }}>
          {entry ? "Girişi düzenle" : "Yeni giriş"}
        </h2>
        <button onClick={onCancel}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: 20, padding: "4px 8px", borderRadius: "var(--radius-sm)" }}>✕</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormField label="Başlık *">
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="ör. GitHub" />
        </FormField>

        <FormField label="Kullanıcı adı / E-posta">
          <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="kullanici@email.com" autoComplete="off" />
        </FormField>

        <FormField label="Şifre *">
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password" placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              style={{ padding: "10px 12px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)", background: "var(--color-surface-2)", cursor: "pointer", fontSize: 14, color: "var(--color-text-muted)", flexShrink: 0 }}>
              {showPassword ? "🙈" : "👁️"}
            </button>
            <button type="button" onClick={() => setPassword(generatePassword({ length: 20, uppercase: true, lowercase: true, digits: true, symbols: true, excludeAmbiguous: true, customChars: "" }))}
              title="Şifre üret"
              style={{ padding: "10px 12px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)", background: "var(--color-surface-2)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
              ⚡
            </button>
          </div>
          {password && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 4, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((strength.score + 1) / 5) * 100}%`, background: strengthColor, borderRadius: 4, transition: "width 0.3s, background 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-subtle)" }}>Kırılma süresi: {strength.crackTime}</span>
              </div>
            </div>
          )}
        </FormField>

        <FormField label="URL">
          <input style={inputStyle} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </FormField>

        <FormField label="Notlar">
          <textarea style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", minHeight: 80 }}
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Ek notlar..." />
        </FormField>

        <FormField label="Etiketler (virgülle ayırın)">
          <input style={inputStyle} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="iş, sosyal, finans" />
        </FormField>

        <FormField label="TOTP Gizli Anahtarı (opsiyonel)">
          <input style={inputStyle} value={totpSecret} onChange={(e) => setTotpSecret(e.target.value)} placeholder="Base32 TOTP anahtarı" autoComplete="off" />
        </FormField>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", background: "var(--color-surface-2)", borderRadius: "var(--radius)", border: "1.5px solid var(--color-border)" }}>
          <input type="checkbox" checked={favourite} onChange={(e) => setFavourite(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>⭐ Favorilere ekle</span>
        </label>

        {/* Kayıt hedefi */}
        <div style={{ padding: 16, background: "var(--color-accent-light)", borderRadius: "var(--radius)", border: "1.5px solid #c7d2fe" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#4338ca", marginBottom: 10 }}>Nereye kaydedilsin?</p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["cloud", "local"] as const).map((target) => (
              <button key={target} type="button" onClick={() => setSaveTarget(target)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: "var(--radius)",
                  border: `2px solid ${saveTarget === target ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: saveTarget === target ? "var(--color-accent)" : "var(--color-surface)",
                  color: saveTarget === target ? "white" : "var(--color-text-muted)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                }}>
                {target === "cloud" ? "☁️ Bulut + Yerel" : "💾 Sadece Yerel"}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#6366f1", marginTop: 8 }}>
            {saveTarget === "cloud" ? "Kaydettikten sonra otomatik olarak Supabase'e senkronize edilir." : "Sadece bu cihaza kaydedilir. Manuel olarak senkronize edebilirsiniz."}
          </p>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--color-danger-light)", border: "1px solid #fecaca", borderRadius: "var(--radius)" }}>
            <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
          <button type="button" onClick={onCancel}
            style={{ padding: "11px 20px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)", background: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            İptal
          </button>
          <button type="submit" disabled={saving}
            style={{
              padding: "11px 24px", border: "none", borderRadius: "var(--radius)",
              background: saving ? "var(--color-text-subtle)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white", cursor: saving ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, boxShadow: saving ? "none" : "0 4px 12px rgba(99,102,241,0.3)",
            }}>
            {saving ? "Kaydediliyor..." : saveTarget === "cloud" ? "Kaydet ve senkronize et" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {children}
    </div>
  );
}
