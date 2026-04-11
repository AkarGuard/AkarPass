import { useState, type CSSProperties } from "react";
import type { VaultEntry } from "@akarpass/core";
import { generateTotp, totpTimeRemaining } from "@akarpass/core";

interface Props {
  entry: VaultEntry;
  onEdit: () => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onClose: () => void;
}

function FieldBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-subtle)", marginBottom: 6 }}>{label}</p>
      {children}
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)", padding: "10px 14px",
};

const iconBtnStyle: CSSProperties = {
  background: "none", border: "none", cursor: "pointer", fontSize: 16,
  padding: "4px 8px", color: "var(--color-text-muted)", flexShrink: 0,
  borderRadius: "var(--radius-sm)", transition: "background 0.15s",
};

export function EntryDetail({ entry, onEdit, onDeleteEntry, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState<string | null>(null);
  const [totpRemaining, setTotpRemaining] = useState(30);
  const [deleting, setDeleting] = useState(false);

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => navigator.clipboard.writeText(""), 30_000);
    setTimeout(() => setCopied(null), 2000);
  }

  async function loadTotp() {
    if (!entry.totpSecret) return;
    const code = await generateTotp(entry.totpSecret);
    setTotpCode(code);
    setTotpRemaining(Math.round(totpTimeRemaining() / 1000));
    const interval = setInterval(async () => {
      const c = await generateTotp(entry.totpSecret!);
      setTotpCode(c);
      setTotpRemaining(Math.round(totpTimeRemaining() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }

  async function handleDelete() {
    if (!confirm("Bu girişi çöp kutusuna taşımak istediğinizden emin misiniz?")) return;
    setDeleting(true);
    try { await onDeleteEntry(entry.id); } finally { setDeleting(false); }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 620 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</h2>
          {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--color-accent)", textDecoration: "none" }}>{entry.url}</a>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onEdit}
            style={{ padding: "7px 16px", borderRadius: "var(--radius)", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Düzenle
          </button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ padding: "7px 16px", borderRadius: "var(--radius)", border: "1.5px solid #fecaca", background: "var(--color-danger-light)", color: "var(--color-danger)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {deleting ? "..." : "Sil"}
          </button>
          <button onClick={onClose}
            style={{ padding: "7px 10px", borderRadius: "var(--radius)", border: "1.5px solid var(--color-border)", background: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 16 }}>
            ✕
          </button>
        </div>
      </div>

      {/* Fields */}
      <FieldBox label="Kullanıcı adı">
        <div style={rowStyle}>
          <span style={{ flex: 1, fontSize: 14, color: entry.username ? "var(--color-text)" : "var(--color-text-subtle)" }}>{entry.username || "—"}</span>
          {entry.username && <button style={iconBtnStyle} onClick={() => copy(entry.username, "username")} title="Kopyala">{copied === "username" ? "✅" : "📋"}</button>}
        </div>
      </FieldBox>

      <FieldBox label="Şifre">
        <div style={rowStyle}>
          <span style={{ flex: 1, fontSize: 14, fontFamily: "monospace", letterSpacing: showPassword ? "normal" : "2px" }}>
            {showPassword ? entry.password : "•".repeat(Math.min(entry.password.length, 16))}
          </span>
          <button style={iconBtnStyle} onClick={() => setShowPassword(p => !p)}>{showPassword ? "🙈" : "👁️"}</button>
          <button style={iconBtnStyle} onClick={() => copy(entry.password, "password")}>{copied === "password" ? "✅" : "📋"}</button>
        </div>
      </FieldBox>

      {entry.url && (
        <FieldBox label="URL">
          <div style={rowStyle}>
            <span style={{ flex: 1, fontSize: 14, color: "var(--color-accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.url}</span>
            <button style={iconBtnStyle} onClick={() => copy(entry.url, "url")}>{copied === "url" ? "✅" : "📋"}</button>
          </div>
        </FieldBox>
      )}

      {entry.totpSecret && (
        <FieldBox label="2FA Kodu">
          {totpCode ? (
            <div style={rowStyle}>
              <span style={{ flex: 1, fontFamily: "monospace", fontSize: 28, fontWeight: 700, letterSpacing: 6, color: totpRemaining <= 5 ? "var(--color-danger)" : "var(--color-success)" }}>{totpCode}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>{totpRemaining}s</span>
                <div style={{ width: 32, height: 3, background: "var(--color-border)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(totpRemaining / 30) * 100}%`, background: totpRemaining <= 5 ? "var(--color-danger)" : "var(--color-success)", transition: "width 1s linear" }} />
                </div>
              </div>
              <button style={iconBtnStyle} onClick={() => copy(totpCode, "totp")}>{copied === "totp" ? "✅" : "📋"}</button>
            </div>
          ) : (
            <button onClick={loadTotp}
              style={{ padding: "10px 16px", background: "var(--color-surface-2)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
              Kod üret
            </button>
          )}
        </FieldBox>
      )}

      {entry.notes && (
        <FieldBox label="Notlar">
          <div style={{ ...rowStyle, alignItems: "flex-start" }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", flex: 1 }}>{entry.notes}</p>
          </div>
        </FieldBox>
      )}

      {entry.tags.length > 0 && (
        <FieldBox label="Etiketler">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {entry.tags.map((t) => (
              <span key={t} style={{ fontSize: 12, padding: "4px 12px", background: "var(--color-accent-light)", color: "var(--color-accent)", borderRadius: 100, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </FieldBox>
      )}

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--color-border)", display: "flex", gap: 20 }}>
        <span style={{ fontSize: 12, color: "var(--color-text-subtle)" }}>Oluşturuldu: {new Date(entry.createdAt).toLocaleDateString("tr-TR")}</span>
        <span style={{ fontSize: 12, color: "var(--color-text-subtle)" }}>Güncellendi: {new Date(entry.updatedAt).toLocaleDateString("tr-TR")}</span>
      </div>
    </div>
  );
}
