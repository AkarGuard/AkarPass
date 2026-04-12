import { useState, useEffect } from "react";
import type { VaultEntry } from "@akarpass/core";
import { generateTotp, totpTimeRemaining } from "@akarpass/core";

interface Props {
  entry:         VaultEntry;
  onEdit:        () => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onClose:       () => void;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const I = {
  copy:    "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4v0a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v0M8 4h8",
  check:   "M20 6L9 17l-5-5",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff:  "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  close:   "M18 6L6 18M6 6l12 12",
  link:    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

// ── Helper ────────────────────────────────────────────────────────────────────

function getFavicon(url: string): string {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=48`; }
  catch { return ""; }
}

const PALETTE = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#06b6d4"];
function pickColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EntryDetail({ entry, onEdit, onDeleteEntry, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied]             = useState<string | null>(null);
  const [totpCode, setTotpCode]         = useState<string | null>(null);
  const [totpRemaining, setTotpRemaining] = useState(30);
  const [deleting, setDeleting]         = useState(false);

  // Reset state when entry changes
  useEffect(() => {
    setShowPassword(false);
    setCopied(null);
    setTotpCode(null);
  }, [entry.id]);

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => navigator.clipboard.writeText("").catch(() => {}), 30_000);
    setTimeout(() => setCopied(null), 2000);
  }

  useEffect(() => {
    if (!entry.totpSecret) return;
    let interval: ReturnType<typeof setInterval>;

    async function tick() {
      const code = await generateTotp(entry.totpSecret!);
      setTotpCode(code);
      setTotpRemaining(Math.round(totpTimeRemaining() / 1000));
    }

    tick();
    interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [entry.totpSecret]);

  async function handleDelete() {
    if (!confirm(`"${entry.title}" çöp kutusuna taşınsın mı?`)) return;
    setDeleting(true);
    try { await onDeleteEntry(entry.id); } finally { setDeleting(false); }
  }

  const color   = pickColor(entry.title);
  const favicon = entry.url ? getFavicon(entry.url) : "";

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "var(--color-bg)", overflow: "hidden",
    }}>
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          {/* Entry icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: color + "20",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {favicon ? (
              <img src={favicon} alt="" width={24} height={24} style={{ objectFit: "contain" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const p = e.currentTarget.parentElement;
                  if (p) p.innerHTML = `<span style="font-size:20px;font-weight:700;color:${color}">${entry.title.charAt(0).toUpperCase()}</span>`;
                }}
              />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 700, color }}>{entry.title.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entry.title}
            </h2>
            {entry.url && (
              <a href={entry.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Icon d={I.link} size={11} />
                {new URL(entry.url).hostname.replace(/^www\./, "")}
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <ActionBtn onClick={onEdit} title="Düzenle">
            <Icon d={I.edit} />
            <span>Düzenle</span>
          </ActionBtn>
          <ActionBtn onClick={handleDelete} disabled={deleting} danger title="Sil">
            <Icon d={I.trash} />
          </ActionBtn>
          <ActionBtn onClick={onClose} title="Kapat">
            <Icon d={I.close} />
          </ActionBtn>
        </div>
      </div>

      {/* ── Fields ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* Username */}
        {entry.username && (
          <Field label="Kullanıcı adı">
            <FieldRow>
              <span style={{ flex: 1, fontSize: 14, color: "var(--color-text)", fontFamily: "inherit" }}>
                {entry.username}
              </span>
              <CopyBtn onClick={() => copy(entry.username, "username")} copied={copied === "username"} />
            </FieldRow>
          </Field>
        )}

        {/* Password */}
        <Field label="Şifre">
          <FieldRow>
            <span style={{ flex: 1, fontSize: 14, fontFamily: "monospace", letterSpacing: showPassword ? 1 : 3, color: "var(--color-text)" }}>
              {showPassword ? entry.password : "•".repeat(Math.min(entry.password.length, 20))}
            </span>
            <IconBtn onClick={() => setShowPassword(p => !p)} title={showPassword ? "Gizle" : "Göster"}>
              <Icon d={showPassword ? I.eyeOff : I.eye} />
            </IconBtn>
            <CopyBtn onClick={() => copy(entry.password, "password")} copied={copied === "password"} />
          </FieldRow>
        </Field>

        {/* URL */}
        {entry.url && (
          <Field label="URL">
            <FieldRow>
              <a href={entry.url} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, fontSize: 13, color: "var(--color-accent)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.url}
              </a>
              <CopyBtn onClick={() => copy(entry.url, "url")} copied={copied === "url"} />
            </FieldRow>
          </Field>
        )}

        {/* TOTP */}
        {entry.totpSecret && (
          <Field label="2FA Kodu">
            <FieldRow>
              {totpCode ? (
                <>
                  <span style={{
                    flex: 1, fontFamily: "monospace", fontSize: 28, fontWeight: 700,
                    letterSpacing: 8, color: totpRemaining <= 5 ? "var(--color-danger)" : "var(--color-success)",
                  }}>
                    {totpCode}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginRight: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: totpRemaining <= 5 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                      {totpRemaining}s
                    </span>
                    <div style={{ width: 36, height: 3, background: "var(--color-border)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", transition: "width 1s linear",
                        width: `${(totpRemaining / 30) * 100}%`,
                        background: totpRemaining <= 5 ? "var(--color-danger)" : "var(--color-success)",
                      }} />
                    </div>
                  </div>
                  <CopyBtn onClick={() => copy(totpCode, "totp")} copied={copied === "totp"} />
                </>
              ) : (
                <span style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Yükleniyor...</span>
              )}
            </FieldRow>
          </Field>
        )}

        {/* Notes */}
        {entry.notes && (
          <Field label="Notlar">
            <div style={{
              padding: "12px 14px",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)", fontSize: 14, lineHeight: 1.65,
              color: "var(--color-text)", whiteSpace: "pre-wrap",
            }}>
              {entry.notes}
            </div>
          </Field>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <Field label="Etiketler">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {entry.tags.map((t) => (
                <span key={t} style={{
                  fontSize: 12, padding: "4px 12px",
                  background: "var(--color-accent-light)", color: "var(--color-accent-hover)",
                  borderRadius: 100, fontWeight: 600,
                }}>
                  #{t}
                </span>
              ))}
            </div>
          </Field>
        )}

        {/* Meta */}
        <div style={{
          marginTop: 24, paddingTop: 16,
          borderTop: "1px solid var(--color-border)",
          display: "flex", gap: 20,
        }}>
          <MetaItem label="Oluşturuldu" value={new Date(entry.createdAt).toLocaleDateString("tr-TR")} />
          <MetaItem label="Güncellendi" value={new Date(entry.updatedAt).toLocaleDateString("tr-TR")} />
          {entry.favourite && (
            <span style={{ fontSize: 12, color: "#fbbf24", marginLeft: "auto" }}>★ Favori</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{
        fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.07em", color: "var(--color-text-subtle)", marginBottom: 7,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius)", padding: "10px 14px",
    }}>
      {children}
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
      color: "var(--color-text-muted)", borderRadius: "var(--radius-sm)",
      display: "flex", alignItems: "center", transition: "color 0.12s, background 0.12s",
      flexShrink: 0,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.color = "var(--color-text)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
    >
      {children}
    </button>
  );
}

function CopyBtn({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button onClick={onClick} title="Kopyala" style={{
      background: copied ? "var(--color-success-light)" : "none",
      border: "none", cursor: "pointer", padding: "4px 6px",
      color: copied ? "var(--color-success)" : "var(--color-text-muted)",
      borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center",
      transition: "all 0.12s", flexShrink: 0,
    }}>
      <Icon d={copied ? I.check : I.copy} size={14} />
    </button>
  );
}

function ActionBtn({ onClick, disabled, danger, title, children }: {
  onClick: () => void; disabled?: boolean; danger?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
      borderRadius: "var(--radius)", border: `1px solid ${danger ? "var(--color-danger-light)" : "var(--color-border)"}`,
      background: danger ? "var(--color-danger-light)" : "var(--color-surface-2)",
      color: danger ? "var(--color-danger)" : "var(--color-text-muted)",
      cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500,
      opacity: disabled ? 0.5 : 1, transition: "all 0.12s",
    }}>
      {children}
    </button>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: 10, color: "var(--color-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{value}</div>
    </div>
  );
}
