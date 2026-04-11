"use client";

import { useState, type FormEvent } from "react";
import type { VaultEntry } from "@akarpass/core";
import { checkPasswordStrength, generatePassword } from "@akarpass/core";
import { addVaultEntry, updateVaultEntry } from "@/lib/vault-service";
import styles from "./EntryEditor.module.css";

interface Props {
  entry: VaultEntry | null;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

export function EntryEditor({ entry, onSave, onCancel }: Props) {
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

  const strength = checkPasswordStrength(password);

  function generateNewPassword() {
    const p = generatePassword({ length: 20, uppercase: true, lowercase: true, digits: true, symbols: true, excludeAmbiguous: true, customChars: "" });
    setPassword(p);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (entry) {
        await updateVaultEntry(entry.id, {
          title, username, password, url, notes,
          tags: tagArray,
          favourite,
          totpSecret: totpSecret || null,
        });
      } else {
        await addVaultEntry({
          title, username, password, url, notes,
          tags: tagArray,
          favourite,
          totpSecret: totpSecret || null,
          additionalUrls: [],
          folderId: null,
        });
      }
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  const strengthColor = strengthColors[strength.score];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{entry ? "Edit Entry" : "New Entry"}</h2>
        <button className={styles.closeBtn} onClick={onCancel}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <FormField label="Title *">
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. GitHub" />
        </FormField>

        <FormField label="Username / Email">
          <input className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user@example.com" autoComplete="off" />
        </FormField>

        <FormField label="Password *">
          <div className={styles.passwordRow}>
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              style={{ flex: 1 }}
            />
            <button type="button" className={styles.iconBtn} onClick={() => setShowPassword((p) => !p)}>
              {showPassword ? "🙈" : "👁"}
            </button>
            <button type="button" className={styles.iconBtn} onClick={generateNewPassword} title="Generate password">
              ⚡
            </button>
          </div>
          {/* Strength bar */}
          {password && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 3, borderRadius: 2, background: "#334155", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((strength.score + 1) / 5) * 100}%`, background: strengthColor, transition: "width 0.3s" }} />
              </div>
              <p style={{ fontSize: 11, color: strengthColor, marginTop: 3 }}>
                {strength.strength.replace("-", " ")} — cracks in {strength.crackTime}
              </p>
            </div>
          )}
        </FormField>

        <FormField label="URL">
          <input className={styles.input} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </FormField>

        <FormField label="Notes">
          <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional notes..." />
        </FormField>

        <FormField label="Tags (comma-separated)">
          <input className={styles.input} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, social, finance" />
        </FormField>

        <FormField label="TOTP Secret (optional)">
          <input className={styles.input} value={totpSecret} onChange={(e) => setTotpSecret(e.target.value)} placeholder="Base32 TOTP secret" autoComplete="off" />
        </FormField>

        <label className={styles.checkRow}>
          <input type="checkbox" checked={favourite} onChange={(e) => setFavourite(e.target.checked)} />
          <span>Mark as favourite</span>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttons}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? "Saving..." : entry ? "Save changes" : "Add entry"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
