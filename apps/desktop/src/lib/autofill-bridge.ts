/**
 * Native autofill bridge.
 *
 * Listens for the `autofill:triggered` event emitted by the Rust hotkey
 * handler, looks up matching entries in the unlocked vault, and asks Rust to
 * type the credentials into whichever window has focus.
 *
 * Phase 1: single-press mode only (always types the top match; no picker).
 * The user is expected to have the vault unlocked — when it is locked we
 * surface a toast instructing them to unlock and try again.
 */

import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { activeEntries, type Vault, type VaultEntry } from "@akarpass/core";
import * as vaultService from "./vault-service.js";

interface AutofillTarget {
  url: string | null;
  appName: string;
  windowTitle: string;
}

export type AutofillStatus =
  | { kind: "idle" }
  | { kind: "typed"; entry: VaultEntry; target: AutofillTarget }
  | { kind: "no-match"; target: AutofillTarget }
  | { kind: "locked" }
  | { kind: "error"; message: string };

export type AutofillNotify = (status: AutofillStatus) => void;

function safeDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function rootDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  // Cheap 2-label heuristic — good enough for the common case and avoids
  // shipping a public-suffix list. A country-code TLD like `co.uk` will match
  // any subdomain of the same eTLD, which is acceptable for autofill.
  return parts.slice(-2).join(".");
}

function findMatches(vault: Vault, target: AutofillTarget): VaultEntry[] {
  const entries = activeEntries(vault);

  const targetHost = safeDomain(target.url);
  if (targetHost) {
    const targetRoot = rootDomain(targetHost);
    const urlMatches = entries.filter((e) => {
      const entryHost = safeDomain(e.url);
      return entryHost !== null && rootDomain(entryHost) === targetRoot;
    });
    if (urlMatches.length > 0) return urlMatches;
  }

  const appKey = target.appName.toLowerCase().replace(/\.exe$/, "").trim();
  if (appKey.length >= 3) {
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(appKey) ||
        e.url.toLowerCase().includes(appKey),
    );
  }

  return [];
}

export async function mountAutofillBridge(notify: AutofillNotify): Promise<UnlistenFn> {
  return listen<AutofillTarget | null>("autofill:triggered", async (evt) => {
    const target = evt.payload;
    if (!target) {
      notify({ kind: "error", message: "Aktif pencere okunamadı." });
      return;
    }

    const vault = vaultService.getActiveVault();
    if (!vault) {
      notify({ kind: "locked" });
      return;
    }

    const matches = findMatches(vault, target);
    if (matches.length === 0) {
      notify({ kind: "no-match", target });
      return;
    }

    const entry = matches[0]!;
    try {
      await invoke("autofill_type_credentials", {
        username: entry.username,
        password: entry.password,
        pressEnter: false,
      });
      notify({ kind: "typed", entry, target });
    } catch (e) {
      notify({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  });
}

/**
 * React hook: mount the bridge for the lifetime of the component.
 */
export function useAutofillBridge(notify: AutofillNotify): void {
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    let cancelled = false;

    mountAutofillBridge((status) => notifyRef.current(status))
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((e) => {
        console.error("autofill bridge mount failed", e);
      });

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);
}
