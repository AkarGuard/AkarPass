import React, { useState } from "react";
import type { VaultEntry } from "@akarpass/core";
import { PasswordGenerator } from "./PasswordGenerator.js";

type EntryDraft = Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">;

interface EntryEditorProps {
  initial?: VaultEntry | null;
  onSave: (draft: EntryDraft) => Promise<void>;
  onCancel: () => void;
}

function emptyDraft(): EntryDraft {
  return {
    title: "",
    username: "",
    password: "",
    url: "",
    additionalUrls: [],
    notes: "",
    tags: [],
    folderId: null,
    favourite: false,
    totpSecret: null,
  };
}

export function EntryEditor({ initial, onSave, onCancel }: EntryEditorProps) {
  const [draft, setDraft] = useState<EntryDraft>(() =>
    initial
      ? {
          title: initial.title,
          username: initial.username,
          password: initial.password,
          url: initial.url,
          additionalUrls: initial.additionalUrls,
          notes: initial.notes,
          tags: initial.tags,
          folderId: initial.folderId,
          favourite: initial.favourite,
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
    if (tag && !draft.tags.includes(tag)) {
      set("tags", [...draft.tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    set("tags", draft.tags.filter((t) => t !== tag));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) { setError("Title is required."); return; }
    setError("");
    setSaving(true);
    try {
      await onSave(draft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const fieldLabel: React.CSSProperties = {
    display: "block",
    fontSize: 12, fontWeight: 600,
    color: "var(--color-text-secondary)",
    letterSpacing: "0.05em", textTransform: "uppercase",
    marginBottom: 6,
  };

  const fieldInput: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    border: "1.5px solid var(--color-border)",
    borderRadius: 8, background: "#fff",
    color: "var(--color-text)", fontSize: 14,
    outline: "none", transition: "border-color 0.15s",
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "var(--color-accent)"; },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "var(--color-border)"; },
  };

  return (
    <div
      style={{
        flex: 1, height: "100%",
        display: "flex", flexDirection: "column",
        background: "var(--color-bg)", overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          background: "#fff",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
            {initial ? "Edit Item" : "New Item"}
          </h2>
        </div>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: 8, color: "var(--color-text-secondary)",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "7px 20px",
            background: saving ? "rgba(99,102,241,0.4)" : "var(--color-accent)",
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSave}
        style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
      >
        {error && (
          <div style={{
            padding: "10px 14px",
            background: "var(--color-danger-light)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, color: "var(--color-danger)", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Favourite toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => set("favourite", !draft.favourite)}
            style={{
              padding: "6px 14px",
              background: draft.favourite ? "#fef9c3" : "#fff",
              border: `1.5px solid ${draft.favourite ? "#fde047" : "var(--color-border)"}`,
              borderRadius: 8, fontSize: 13, cursor: "pointer",
              color: draft.favourite ? "#92400e" : "var(--color-text-secondary)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}
          >
            {draft.favourite ? "⭐" : "☆"} {draft.favourite ? "Favourite" : "Add to Favourites"}
          </button>
        </div>

        <div>
          <label style={fieldLabel}>Title *</label>
          <input
            type="text" value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Gmail" required autoFocus
            style={fieldInput} {...focusHandlers}
          />
        </div>

        <div>
          <label style={fieldLabel}>Username / Email</label>
          <input
            type="text" value={draft.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="username@example.com"
            style={fieldInput} {...focusHandlers}
          />
        </div>

        <div>
          <label style={fieldLabel}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"} value={draft.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              style={{ ...fieldInput, paddingRight: 90, fontFamily: showPw ? "inherit" : "monospace" }}
              {...focusHandlers}
            />
            <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
              <button
                type="button" onClick={() => setShowPw(!showPw)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, opacity: 0.5 }}
              >
                {showPw ? "🙈" : "👁"}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                title="Generate password"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: 0.6 }}
              >
                🎲
              </button>
            </div>
          </div>

          {showGenerator && (
            <div style={{ marginTop: 10, padding: 16, background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10 }}>
              <PasswordGenerator
                onUse={(pw) => { set("password", pw); setShowGenerator(false); setShowPw(true); }}
              />
            </div>
          )}
        </div>

        <div>
          <label style={fieldLabel}>Website URL</label>
          <input
            type="url" value={draft.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://example.com"
            style={fieldInput} {...focusHandlers}
          />
        </div>

        <div>
          <label style={fieldLabel}>TOTP Secret (2FA)</label>
          <input
            type="text" value={draft.totpSecret ?? ""}
            onChange={(e) => set("totpSecret", e.target.value || null)}
            placeholder="Base32 secret (optional)"
            style={{ ...fieldInput, fontFamily: "monospace" }}
            {...focusHandlers}
          />
        </div>

        <div>
          <label style={fieldLabel}>Notes</label>
          <textarea
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any additional notes…"
            rows={4}
            style={{
              ...fieldInput,
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          />
        </div>

        <div>
          <label style={fieldLabel}>Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {draft.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "3px 10px",
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                  borderRadius: 20, fontSize: 12, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {tag}
                <button
                  type="button" onClick={() => removeTag(tag)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent)", fontSize: 14, padding: 0, lineHeight: 1 }}
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
              placeholder="Add tag…"
              style={{ ...fieldInput, flex: 1 }}
              {...focusHandlers}
            />
            <button
              type="button" onClick={addTag}
              style={{
                padding: "8px 14px",
                background: "var(--color-accent-light)",
                border: "1px solid var(--color-accent)",
                borderRadius: 8, color: "var(--color-accent)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
