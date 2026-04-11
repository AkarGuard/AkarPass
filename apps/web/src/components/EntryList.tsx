"use client";

import type { VaultEntry } from "@akarpass/core";
import styles from "./EntryList.module.css";

interface Props {
  entries: VaultEntry[];
  onSelect: (entry: VaultEntry) => void;
  query: string;
}

function getFavicon(url: string): string {
  try {
    const { origin } = new URL(url);
    return `${origin}/favicon.ico`;
  } catch {
    return "";
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function EntryList({ entries, onSelect, query }: Props) {
  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        {query ? (
          <>
            <span style={{ fontSize: 40 }}>🔍</span>
            <p>No results for &ldquo;{query}&rdquo;</p>
          </>
        ) : (
          <>
            <span style={{ fontSize: 40 }}>🔑</span>
            <p>No entries yet. Click &ldquo;+ New Entry&rdquo; to add one.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {entries.map((entry) => (
        <button
          key={entry.id}
          className={styles.item}
          onClick={() => onSelect(entry)}
        >
          <div className={styles.icon}>
            {entry.url ? (
              <img
                src={getFavicon(entry.url)}
                alt=""
                width={20}
                height={20}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span>🔑</span>
            )}
          </div>
          <div className={styles.info}>
            <span className={styles.title}>{entry.title}</span>
            <span className={styles.sub}>
              {entry.username || getDomain(entry.url)}
            </span>
          </div>
          {entry.favourite && <span className={styles.fav}>★</span>}
          <div className={styles.tags}>
            {entry.tags.slice(0, 3).map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
