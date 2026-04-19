import React, { useState } from "react";
import type { VaultEntry } from "@akarpass/core";
import { PasswordGenerator } from "./PasswordGenerator.js";
import { useT } from "../lib/i18n/index.js";

type EntryDraft = Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">;

interface EntryEditorProps {
  initial?: VaultEntry | null;
  onSave: (draft: EntryDraft) => Promise<void>;
  onCancel: () => void;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const EYE_D     = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const EYE_OFF_D = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";
const BOLT_D    = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";
const STAR_D    = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function emptyDraft(): EntryDraft {
  return {
    title: "", username: "", password: "", url: "",
    additionalUrls: [], notes: "", tags: [],
    folderId: null, favourite: false, totpSecret: null,
  };
}

export function EntryEditor({ initial, onSave, onCancel }: EntryEditorProps) {
  const t = useT();
  const [draft, setDraft] = useState<EntryDraft>(() =>
    initial
      ? {
          title: initial.title, username: initial.username, password: initial.password,
          url: initial.url, additionalUrls: initial.additionalUrls, notes: initial.notes,
          tags: initial.tags, folderId: initial.folderId, favourite: initial.favourite,
          totpSecret: initial.totpSecret,
        }
      : emptyDraft(),
  );
  const [showPw, setShowPw] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !draft.tags.includes(tag)) set("tags", [...draft.tags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    set("tags", draft.tags.filter((t) => t !== tag));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) { setError(t("entryEditor.error.titleRequired")); return; }
    setError("");
    setSaving(true);
    try {
      await onSave(draft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("entryEditor.error.save"));
    } finally {
      setSaving(false);
    }
  }

  const fieldLabel: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: "var(--color-text-subtle)", letterSpacing: "0.06em",
    textTransform: "uppercase", marginBottom: 6,
  };

  const fieldInput: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: "1.5px solid var(--color-border)",
    borderRadius: 7, background: "var(--color-surface-2)",
    color: "var(--color-text)", fontSize: 13.5,
    outline: "none", transition: "border-color 0.15s",
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = "var(--color-accent)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = "var(--color-border)";
    },
  };

  return (
    <div style={{
      flex: 1, height: "100%",
      display: "flex", flexDirection: "column",
      background: "var(--color-bg)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
            {initial ? t("entryEditor.titleEdit") : t("entryEditor.titleNew")}
          </h2>
        </div>
        <button
          onClick={onCancel}
          style={{
            padding: "6px 14px",
            background: "transparent",
            border: "1.5px solid var(--color-border)",
            borderRadius: 7, color: "var(--color-text-secondary)",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {t("entryEditor.cancel")}
        </button>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            padding: "6px 18px",
            background: saving ? "var(--color-surface-3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: 7, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 2px 8px rgba(99,102,241,0.3)",
            transition: "all 0.15s",
          }}
        >
          {saving ? t("entryEditor.saving") : t("entryEditor.save")}
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSave}
        style={{ flex: 1, overflowY: "auto", padding: "20px 20px", display: "flex", flexDirection: "column", gap: 14 }}
      >
        {error && (
          <div style={{
            padding: "9px 12px",
            background: "var(--color-danger-light)",
            border: "1px solid var(--color-danger)",
            borderRadius: 7, color: "var(--color-danger)", fontSize: 12.5,
          }}>
            {error}
          </div>
        )}

        {/* Favourite toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => set("favourite", !draft.favourite)}
            style={{
              padding: "6px 14px",
              background: draft.favourite ? "rgba(251,191,36,0.12)" : "var(--color-surface-2)",
              border: `1.5px solid ${draft.favourite ? "#fbbf24" : "var(--color-border)"}`,
              borderRadius: 7, fontSize: 13, cursor: "pointer",
              color: draft.favourite ? "#fbbf24" : "var(--color-text-secondary)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}
          >
            <Icon d={STAR_D} size={13} />
            {draft.favourite ? t("entryEditor.isFavourite") : t("entryEditor.addFavourite")}
          </button>
        </div>

        <div>
          <label style={fieldLabel}>{t("entryEditor.field.title")}</label>
          <input type="text" value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={t("entryEditor.field.titlePlaceholder")} required autoFocus
            style={fieldInput} {...focusHandlers} />
        </div>

        <div>
          <label style={fieldLabel}>{t("entryEditor.field.username")}</label>
          <input type="text" value={draft.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder={t("entryEditor.field.usernamePlaceholder")}
            style={fieldInput} {...focusHandlers} />
        </div>

        <div>
          <label style={fieldLabel}>{t("entryEditor.field.password")}</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"} value={draft.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              style={{ ...fieldInput, paddingRight: 72 }}
              {...focusHandlers}
            />
            <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
              <IconBtn onClick={() => setShowPw(!showPw)} title={showPw ? t("entryDetail.hide") : t("entryDetail.show")}>
                <Icon d={showPw ? EYE_OFF_D : EYE_D} size={13} />
              </IconBtn>
              <IconBtn onClick={() => setShowGenerator(!showGenerator)} title={t("entryEditor.generatePw")}>
                <Icon d={BOLT_D} size={13} />
              </IconBtn>
            </div>
          </div>

          {showGenerator && (
            <div style={{ marginTop: 10, padding: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 10 }}>
              <PasswordGenerator
                onUse={(pw) => { set("password", pw); setShowGenerator(false); setShowPw(true); }}
              />
            </div>
          )}
        </div>

        <div>
          <label style={fieldLabel}>{t("entryEditor.field.url")}</label>
          <input type="url" value={draft.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://example.com"
            style={fieldInput} {...focusHandlers} />
        </div>

        <div>
          <label style={fieldLabel}>{t("entryEditor.field.totp")}</label>
          <input type="text" value={draft.totpSecret ?? ""}
            onChange={(e) => set("totpSecret", e.target.value || null)}
            placeholder={t("entryEditor.field.totpPlaceholder")}
            style={{ ...fieldInput, fontFamily: "monospace" }}
            {...focusHandlers} />
        </div>

        <div>
          <label style={fieldLabel}>{t("entryEditor.field.notes")}</label>
          <textarea
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={t("entryEditor.field.notesPlaceholder")}
            rows={4}
            style={{ ...fieldInput, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          />
        </div>

        <div>
          <label style={fieldLabel}>{t("entryEditor.field.tags")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {draft.tags.map((tag) => (
              <span key={tag} style={{
                padding: "3px 10px",
                background: "var(--color-accent-light)",
                color: "var(--color-accent-hover)",
                borderRadius: 20, fontSize: 12, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                #{tag}
                <button
                  type="button" onClick={() => removeTag(tag)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent-hover)", fontSize: 14, padding: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text" value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder={t("entryEditor.field.tagPlaceholder")}
              style={{ ...fieldInput, flex: 1 }}
              {...focusHandlers}
            />
            <button
              type="button" onClick={addTag}
              style={{
                padding: "8px 14px",
                background: "var(--color-accent-light)",
                border: "1px solid var(--color-accent)",
                borderRadius: 7, color: "var(--color-accent-hover)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {t("entryEditor.addTag")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button" onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 26, height: 26, padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hover ? "var(--color-surface-3)" : "transparent",
        border: "1px solid",
        borderColor: hover ? "var(--color-accent)" : "var(--color-border)",
        borderRadius: 5, cursor: "pointer",
        color: hover ? "var(--color-accent)" : "var(--color-text-secondary)",
        transition: "all 0.1s",
      }}
    >
      {children}
    </button>
  );
}
