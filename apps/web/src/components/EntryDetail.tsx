"use client";

import { useState } from "react";
import type { VaultEntry } from "@akarpass/core";
import { generateTotp, totpTimeRemaining } from "@akarpass/core";
import { deleteVaultEntry } from "@/lib/vault-service";
import styles from "./EntryDetail.module.css";

interface Props {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function EntryDetail({ entry, onEdit, onDelete, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState<string | null>(null);
  const [totpRemaining, setTotpRemaining] = useState(30);
  const [deleting, setDeleting] = useState(false);

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    // Auto-clear clipboard after 30s
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText("");
      } catch { /* ignore */ }
    }, 30_000);
    setTimeout(() => setCopied(null), 2000);
  }

  async function loadTotp() {
    if (!entry.totpSecret) return;
    const code = await generateTotp(entry.totpSecret);
    const remaining = Math.round(totpTimeRemaining() / 1000);
    setTotpCode(code);
    setTotpRemaining(remaining);
    const interval = setInterval(async () => {
      const newCode = await generateTotp(entry.totpSecret!);
      const rem = Math.round(totpTimeRemaining() / 1000);
      setTotpCode(newCode);
      setTotpRemaining(rem);
    }, 1000);
    return () => clearInterval(interval);
  }

  async function handleDelete() {
    if (!confirm("Move this entry to trash?")) return;
    setDeleting(true);
    try {
      await deleteVaultEntry(entry.id);
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{entry.title}</h2>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={onEdit}>Edit</button>
          <button
            className={`${styles.btn} ${styles.danger}`}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "..." : "Trash"}
          </button>
          <button className={styles.btn} onClick={onClose}>✕</button>
        </div>
      </div>

      <div className={styles.fields}>
        {/* Username */}
        <Field label="Username">
          <div className={styles.fieldRow}>
            <span className={styles.value}>{entry.username || "—"}</span>
            {entry.username && (
              <CopyBtn onClick={() => copyToClipboard(entry.username, "username")} copied={copied === "username"} />
            )}
          </div>
        </Field>

        {/* Password */}
        <Field label="Password">
          <div className={styles.fieldRow}>
            <span className={styles.value}>
              {showPassword ? entry.password : "••••••••••••"}
            </span>
            <button
              className={styles.iconBtn}
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
            <CopyBtn onClick={() => copyToClipboard(entry.password, "password")} copied={copied === "password"} />
          </div>
        </Field>

        {/* URL */}
        {entry.url && (
          <Field label="URL">
            <div className={styles.fieldRow}>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {entry.url}
              </a>
              <CopyBtn onClick={() => copyToClipboard(entry.url, "url")} copied={copied === "url"} />
            </div>
          </Field>
        )}

        {/* TOTP */}
        {entry.totpSecret && (
          <Field label="2FA Code">
            {totpCode ? (
              <div className={styles.fieldRow}>
                <span className={styles.totp}>{totpCode}</span>
                <span className={styles.totpTimer}>{totpRemaining}s</span>
                <CopyBtn onClick={() => copyToClipboard(totpCode, "totp")} copied={copied === "totp"} />
              </div>
            ) : (
              <button className={styles.btn} onClick={loadTotp}>
                Generate code
              </button>
            )}
          </Field>
        )}

        {/* Notes */}
        {entry.notes && (
          <Field label="Notes">
            <p className={styles.notes}>{entry.notes}</p>
          </Field>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <Field label="Tags">
            <div className={styles.tagRow}>
              {entry.tags.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          </Field>
        )}

        {/* Metadata */}
        <div className={styles.meta}>
          <span>Created {new Date(entry.createdAt).toLocaleDateString()}</span>
          <span>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: 6 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function CopyBtn({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button className={styles.iconBtn} onClick={onClick} title="Copy to clipboard">
      {copied ? "✓" : "📋"}
    </button>
  );
}
