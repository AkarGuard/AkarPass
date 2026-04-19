import React, { useState } from "react";
import type { Vault } from "@akarpass/core";
import { useT } from "../lib/i18n/index.js";

type SidebarView = "all" | "favourites" | "recent" | "passwords" | "notes" | "trash" | string;

interface SidebarProps {
  vault: Vault;
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  onLock: () => void;
  onSync: () => Promise<void>;
  syncing: boolean;
  onSettings: () => void;
}

// ── SVG Icons (no emojis) ────────────────────────────────────────────────────

function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

const ICONS = {
  all: "M2 3h12v2H2zm0 4h12v2H2zm0 4h8v2H2z",
  star: "M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1L2 5.3l4.2-.7z",
  key: "M11 1a4 4 0 100 8 4 4 0 000-8zM1 13l5-5a5.5 5.5 0 001.2 1.2L2.4 14H1v-1zm9-4.5A2.5 2.5 0 1113.5 6 2.5 2.5 0 0110 8.5z",
  note: "M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3v1h8V5H4zm0 3v1h8V8H4zm0 3v1h5v-1H4z",
  clock: "M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 2v4l3 1.5-.7 1.4-3.8-1.9V5h1.5z",
  folder: "M2 4a1 1 0 011-1h4l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z",
  trash: "M6 2h4l1 1h3v1H2V3h3l1-1zm-2 3h8l-.8 8H4.8L4 5zm3 1v6h1V6H7zm2 0v6h1V6H9z",
  cloud: "M12 6.5A3.5 3.5 0 009.5 3 3.5 3.5 0 006 5.5h-.5A2.5 2.5 0 103 10.5h9A2.5 2.5 0 0015 8a2.5 2.5 0 00-3-1.5z",
  lock: "M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm0 2a1 1 0 011 1v2H7V4a1 1 0 011-1zm0 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z",
  sync: "M13.5 6A5.5 5.5 0 002.8 9l-1.3-1.3-.7.7 2 2 .7.7.7-.7 2-2-.7-.7-1.1 1.1A4 4 0 0112 6h1.5zm-11 4A5.5 5.5 0 0013.2 7l1.3 1.3.7-.7-2-2-.7-.7-.7.7-2 2 .7.7 1.1-1.1A4 4 0 014 10H2.5z",
  gear: "M8 5a3 3 0 100 6A3 3 0 008 5zm0 1a2 2 0 110 4 2 2 0 010-4zm0-5a.5.5 0 01.5.5v1.07A5.5 5.5 0 0112.43 4l.75-.75a.5.5 0 01.71.71l-.75.75A5.5 5.5 0 0114.43 8H15.5a.5.5 0 010 1h-1.07a5.5 5.5 0 01-1.5 3.93l.75.75a.5.5 0 01-.71.71l-.75-.75A5.5 5.5 0 018.5 14.93V16a.5.5 0 01-1 0v-1.07A5.5 5.5 0 013.57 13.43l-.75.75a.5.5 0 01-.71-.71l.75-.75A5.5 5.5 0 011.57 9H.5a.5.5 0 010-1h1.07A5.5 5.5 0 013.07 4.57l-.75-.75a.5.5 0 01.71-.71l.75.75A5.5 5.5 0 017.5 2.07V1a.5.5 0 01.5-.5z",
};

// ── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ vault, activeView, onViewChange, onLock, onSync, syncing, onSettings }: SidebarProps) {
  const t = useT();
  const [syncError, setSyncError] = useState(false);

  const activeEntries = vault.entries.filter((e) => !e.deletedAt);
  const favouriteCount = activeEntries.filter((e) => e.favourite).length;
  const trashCount = vault.entries.filter((e) => e.deletedAt).length;

  async function handleSync() {
    setSyncError(false);
    try {
      await onSync();
    } catch {
      setSyncError(true);
    }
  }

  return (
    <div
      style={{
        width: 220,
        minWidth: 220,
        height: "100%",
        background: "var(--sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        userSelect: "none",
      }}
    >
      {/* Vault header */}
      <div
        style={{
          padding: "14px 14px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img
            src="/logo.png"
            alt="AkarGuard"
            style={{
              width: 28,
              height: 28,
              objectFit: "contain",
              flexShrink: 0,
              filter: "drop-shadow(0 0 6px rgba(45,212,191,0.4))",
            }}
          />
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div
              style={{
                color: "var(--sidebar-text)",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {vault.name}
            </div>
            <div
              style={{
                color: "var(--sidebar-text-muted)",
                fontSize: 11,
                marginTop: 1,
              }}
            >
              {activeEntries.length} {activeEntries.length === 1 ? t("sidebar.item.one") : t("sidebar.item.many")}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "8px 6px", flex: 1, overflowY: "auto" }}>
        <SectionLabel>{t("sidebar.section.vault")}</SectionLabel>
        <NavBtn
          icon={ICONS.all}
          label={t("sidebar.allItems")}
          count={activeEntries.length}
          active={activeView === "all"}
          onClick={() => onViewChange("all")}
        />
        <NavBtn
          icon={ICONS.star}
          label={t("sidebar.favourites")}
          {...(favouriteCount > 0 ? { count: favouriteCount } : {})}
          active={activeView === "favourites"}
          onClick={() => onViewChange("favourites")}
        />
        <NavBtn
          icon={ICONS.clock}
          label={t("sidebar.recent")}
          active={activeView === "recent"}
          onClick={() => onViewChange("recent")}
        />

        <div style={{ marginTop: 6 }}>
          <SectionLabel>{t("sidebar.section.categories")}</SectionLabel>
          <NavBtn
            icon={ICONS.key}
            label={t("sidebar.passwords")}
            active={activeView === "passwords"}
            onClick={() => onViewChange("passwords")}
          />
          <NavBtn
            icon={ICONS.note}
            label={t("sidebar.secureNotes")}
            active={activeView === "notes"}
            onClick={() => onViewChange("notes")}
          />
        </div>

        {vault.folders.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <SectionLabel>{t("sidebar.section.folders")}</SectionLabel>
            {vault.folders.map((folder) => (
              <NavBtn
                key={folder.id}
                icon={ICONS.folder}
                label={folder.name}
                active={activeView === `folder:${folder.id}`}
                onClick={() => onViewChange(`folder:${folder.id}`)}
              />
            ))}
          </div>
        )}

        {trashCount > 0 && (
          <div style={{ marginTop: 6 }}>
            <NavBtn
              icon={ICONS.trash}
              label={t("sidebar.trash")}
              count={trashCount}
              active={activeView === "trash"}
              onClick={() => onViewChange("trash")}
            />
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "6px 6px 10px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <FooterBtn
          icon={ICONS.gear}
          label={t("sidebar.settings")}
          active={activeView === "settings"}
          onClick={onSettings}
        />
        <FooterBtn
          icon={ICONS.sync}
          label={syncing ? t("sidebar.syncing") : syncError ? t("sidebar.syncFailed") : t("sidebar.syncNow")}
          spinning={syncing}
          danger={syncError}
          onClick={handleSync}
        />
        <FooterBtn
          icon={ICONS.lock}
          label={t("sidebar.lock")}
          onClick={onLock}
          lockHover
        />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "6px 8px 3px",
        color: "var(--sidebar-text-muted)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function NavBtn({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "6px 8px",
        background: active
          ? "var(--sidebar-active-bg)"
          : hovered
          ? "var(--sidebar-hover)"
          : "transparent",
        border: "none",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: active
          ? "#c4c6f5"
          : hovered
          ? "var(--sidebar-text)"
          : "var(--sidebar-text-muted)",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.1s",
        textAlign: "left",
        marginBottom: 1,
      }}
    >
      <span
        style={{
          color: active ? "var(--sidebar-active-border)" : "inherit",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Icon d={icon} size={13} />
      </span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: active ? "rgba(196,198,245,0.8)" : "var(--sidebar-text-muted)",
            background: active ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)",
            padding: "1px 6px",
            borderRadius: 10,
            flexShrink: 0,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function FooterBtn({
  icon,
  label,
  onClick,
  spinning = false,
  danger = false,
  lockHover = false,
  active = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  spinning?: boolean;
  danger?: boolean;
  lockHover?: boolean;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const dangerHover = lockHover && hovered;
  const color = danger
    ? "#fca5a5"
    : dangerHover
    ? "#fca5a5"
    : active
    ? "#c4c6f5"
    : hovered
    ? "var(--sidebar-text)"
    : "var(--sidebar-text-muted)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "6px 8px",
        background: dangerHover
          ? "rgba(239,68,68,0.1)"
          : active
          ? "var(--sidebar-active-bg)"
          : hovered
          ? "var(--sidebar-hover)"
          : "transparent",
        border: "none",
        borderLeft: active ? "2px solid var(--sidebar-active-border)" : "2px solid transparent",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color,
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        cursor: spinning ? "not-allowed" : "pointer",
        transition: "all 0.1s",
        textAlign: "left",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          animation: spinning ? "spin 1.2s linear infinite" : "none",
        }}
      >
        <Icon d={icon} size={13} />
      </span>
      <span>{label}</span>
    </button>
  );
}
