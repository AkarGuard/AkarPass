"use client";

import styles from "./Sidebar.module.css";

interface Props {
  vaultName: string;
  tags: string[];
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onLock: () => void;
  onSync: () => void;
  onGenerator: () => void;
  syncing: boolean;
}

export function Sidebar({
  vaultName,
  tags,
  activeTag,
  onTagSelect,
  onLock,
  onSync,
  onGenerator,
  syncing,
}: Props) {
  return (
    <aside className={styles.sidebar}>
      {/* Vault name */}
      <div className={styles.vaultName}>
        <span style={{ fontSize: 20 }}>🔐</span>
        <span>{vaultName}</span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navItem} ${activeTag === null ? styles.navActive : ""}`}
          onClick={() => onTagSelect(null)}
        >
          <span>🔑</span> All items
        </button>
        <button className={styles.navItem} onClick={onGenerator}>
          <span>⚡</span> Generator
        </button>
      </nav>

      {/* Tags */}
      {tags.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Tags</p>
          {tags.map((tag) => (
            <button
              key={tag}
              className={`${styles.navItem} ${activeTag === tag ? styles.navActive : ""}`}
              onClick={() => onTagSelect(tag)}
            >
              <span>#</span> {tag}
            </button>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className={styles.footer}>
        <button
          className={styles.footerBtn}
          onClick={onSync}
          disabled={syncing}
        >
          {syncing ? "Syncing..." : "⟳ Sync"}
        </button>
        <button className={`${styles.footerBtn} ${styles.lockBtn}`} onClick={onLock}>
          🔒 Lock
        </button>
      </div>
    </aside>
  );
}
