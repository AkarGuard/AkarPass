import React, { useState } from "react";
import type { VaultEntry } from "@akarpass/core";

interface EntryDetailProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavourite: () => void;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function SvgIcon({ d, size = 13 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const EYE_D     = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const EYE_OFF_D = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";
const COPY_D    = "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2M8 4h8";
const CHECK_D   = "M20 6L9 17l-5-5";
const EDIT_D    = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z";
const TRASH_D   = "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6";
const STAR_D    = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function getDomainColor(seed: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length] ?? "#6366f1";
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (!words[0]) return "?";
  if (words.length === 1) return (words[0][0] ?? "?").toUpperCase();
  return ((words[0][0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

function FieldRow({
  label,
  value,
  secret = false,
  monospace = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
  monospace?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ marginBottom: 1 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: "var(--color-text-subtle)",
        letterSpacing: "0.06em", textTransform: "uppercase",
        marginBottom: 3, padding: "0 4px",
      }}>
        {label}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 10px",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: 7, marginBottom: 10,
      }}>
        <div
          data-selectable
          style={{
            flex: 1, fontSize: 13, color: "var(--color-text)",
            fontFamily: monospace ? "Consolas, 'Courier New', monospace" : "inherit",
            wordBreak: "break-all",
            filter: secret && !revealed ? "blur(5px)" : "none",
            userSelect: secret && !revealed ? "none" : "text",
            WebkitUserSelect: secret && !revealed ? "none" : "text",
            transition: "filter 0.15s",
            pointerEvents: secret && !revealed ? "none" : "auto",
          }}
        >
          {value}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {secret && (
            <IconBtn onClick={() => setRevealed(!revealed)} title={revealed ? "Gizle" : "Göster"}>
              <SvgIcon d={revealed ? EYE_OFF_D : EYE_D} />
            </IconBtn>
          )}
          <IconBtn onClick={copy} title="Kopyala" success={copied}>
            <SvgIcon d={copied ? CHECK_D : COPY_D} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  onClick, title, children, success = false,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  success?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 26, height: 26,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: success ? "var(--color-success-light)" : hover ? "var(--color-surface-3)" : "transparent",
        border: "1px solid",
        borderColor: success ? "var(--color-success)" : hover ? "var(--color-border-strong)" : "var(--color-border)",
        borderRadius: 5, cursor: "pointer",
        color: success ? "var(--color-success)" : "var(--color-text-secondary)",
        transition: "all 0.1s",
      }}
    >
      {children}
    </button>
  );
}

export function EntryDetail({ entry, onEdit, onDelete, onToggleFavourite }: EntryDetailProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const color = getDomainColor(entry.url || entry.title);

  return (
    <div style={{
      flex: 1, height: "100%",
      display: "flex", flexDirection: "column",
      background: "var(--color-bg)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: color + "22", border: `1px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color, fontSize: 13, fontWeight: 700,
        }}>
          {getInitials(entry.title)}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: "var(--color-text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {entry.title}
          </h2>
          {entry.url && (
            <div style={{
              fontSize: 11.5, color: "var(--color-text-subtle)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1,
            }}>
              {entry.url}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <button
            onClick={onToggleFavourite}
            title={entry.favourite ? "Favorilerden çıkar" : "Favoriye ekle"}
            style={{
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              background: entry.favourite ? "rgba(251,191,36,0.12)" : "transparent",
              border: `1px solid ${entry.favourite ? "#fbbf24" : "var(--color-border)"}`,
              borderRadius: 6, cursor: "pointer",
              color: entry.favourite ? "#fbbf24" : "var(--color-text-subtle)",
              transition: "all 0.1s",
            }}
          >
            <SvgIcon d={STAR_D} size={12} />
          </button>

          <button
            onClick={onEdit}
            style={{
              padding: "5px 14px", background: "var(--color-accent)",
              border: "none", borderRadius: 6, color: "#fff",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
          >
            <SvgIcon d={EDIT_D} size={11} />
            Düzenle
          </button>

          {deleteConfirm ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: "var(--color-danger)" }}>Sil?</span>
              <button
                onClick={onDelete}
                style={{
                  padding: "4px 10px", background: "var(--color-danger)",
                  border: "none", borderRadius: 5, color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Evet
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{
                  padding: "4px 10px", background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 5, fontSize: 12, cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
              >
                Hayır
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              title="Sil"
              style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "1px solid var(--color-border)",
                borderRadius: 6, cursor: "pointer", color: "var(--color-danger)",
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-danger-light)"; e.currentTarget.style.borderColor = "var(--color-danger)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
            >
              <SvgIcon d={TRASH_D} size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        <FieldRow label="Kullanıcı / E-posta" value={entry.username} />
        <FieldRow label="Şifre" value={entry.password} secret monospace />
        <FieldRow label="Website" value={entry.url} />
        {entry.totpSecret && (
          <FieldRow label="TOTP Anahtarı" value={entry.totpSecret} secret monospace />
        )}
        {entry.notes && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, color: "var(--color-text-subtle)",
              letterSpacing: "0.06em", textTransform: "uppercase",
              marginBottom: 3, padding: "0 4px",
            }}>
              Notlar
            </div>
            <pre
              data-selectable
              style={{
                fontSize: 12.5, color: "var(--color-text)", whiteSpace: "pre-wrap",
                wordBreak: "break-word", fontFamily: "inherit",
                padding: "8px 10px",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 7, lineHeight: 1.5,
                userSelect: "text", WebkitUserSelect: "text",
              }}
            >
              {entry.notes}
            </pre>
          </div>
        )}

        {entry.tags.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, color: "var(--color-text-subtle)",
              letterSpacing: "0.06em", textTransform: "uppercase",
              marginBottom: 6, padding: "0 4px",
            }}>
              Etiketler
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {entry.tags.map((tag) => (
                <span key={tag} style={{
                  padding: "2px 8px",
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent-hover)",
                  borderRadius: 20, fontSize: 11.5, fontWeight: 500,
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 12, padding: "8px 10px",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: 7, fontSize: 11,
          color: "var(--color-text-subtle)",
          display: "flex", gap: 16,
        }}>
          <span>Oluşturuldu: {new Date(entry.createdAt).toLocaleDateString("tr-TR")}</span>
          <span>Güncellendi: {new Date(entry.updatedAt).toLocaleDateString("tr-TR")}</span>
        </div>
      </div>
    </div>
  );
}
