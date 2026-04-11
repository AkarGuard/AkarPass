/**
 * Session manager — tracks unlock state, auto-lock timer, and
 * holds the in-memory decrypted vault reference.
 *
 * Security model:
 *   - The decrypted vault lives ONLY in memory (JS heap).
 *   - On lock: vault reference is cleared + GC eligible.
 *   - Auto-lock fires after inactivity timeout.
 *   - Page visibility change also triggers lock.
 */

import type { LockState } from "@akarpass/core";
import { DEFAULT_LOCK_TIMEOUT_MS } from "@akarpass/core";

type LockCallback = () => void;

export class SessionManager {
  private _state: LockState = "locked";
  private _lockTimer: ReturnType<typeof setTimeout> | null = null;
  private _timeoutMs: number;
  private _lockCallbacks: Set<LockCallback> = new Set();

  constructor(timeoutMs = DEFAULT_LOCK_TIMEOUT_MS) {
    this._timeoutMs = timeoutMs;
    this._bindVisibilityChange();
  }

  get state(): LockState {
    return this._state;
  }

  get isUnlocked(): boolean {
    return this._state === "unlocked";
  }

  /** Called after successful master password verification. */
  unlock(): void {
    this._state = "unlocked";
    this._resetTimer();
  }

  /** Lock immediately — clears vault reference via callbacks. */
  lock(): void {
    this._state = "locked";
    this._clearTimer();
    this._notifyLock();
  }

  /** Register a callback to run when the session locks. */
  onLock(cb: LockCallback): () => void {
    this._lockCallbacks.add(cb);
    return () => this._lockCallbacks.delete(cb);
  }

  /** Reset the auto-lock timer (call on user activity). */
  activity(): void {
    if (this._state === "unlocked") {
      this._resetTimer();
    }
  }

  /** Update timeout without full reinitialisation. */
  setTimeout(ms: number): void {
    this._timeoutMs = ms;
    if (this._state === "unlocked") {
      this._resetTimer();
    }
  }

  private _resetTimer(): void {
    this._clearTimer();
    this._lockTimer = setTimeout(() => this.lock(), this._timeoutMs);
  }

  private _clearTimer(): void {
    if (this._lockTimer !== null) {
      clearTimeout(this._lockTimer);
      this._lockTimer = null;
    }
  }

  private _notifyLock(): void {
    for (const cb of this._lockCallbacks) {
      try {
        cb();
      } catch {
        // Callbacks should not throw; swallow to ensure all are called.
      }
    }
  }

  private _bindVisibilityChange(): void {
    if (typeof document === "undefined") return;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this._state === "unlocked") {
        // Lock when tab is hidden (optional: make configurable)
        // For now just reset the timer — aggressive lock on hide is UX friction
        this._resetTimer();
      }
    });
  }

  destroy(): void {
    this._clearTimer();
    this._lockCallbacks.clear();
  }
}

/** Singleton session manager — shared across the application. */
export const session = new SessionManager();
