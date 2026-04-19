import React, { useState, useEffect } from "react";
import { useT } from "../lib/i18n/index.js";

interface VaultServiceLike {
  listLocalVaults(): Promise<{ id: string; name: string }[]>;
  pullVaultsFromCloud(): Promise<number>;
  unlockVault(vaultId: string, masterPassword: string): Promise<boolean>;
}

interface AuthService {
  signOut(): Promise<void>;
}

interface UnlockScreenProps {
  authService: AuthService;
  vaultService: VaultServiceLike;
  navigate: (to: string) => void;
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1.5px solid var(--color-border)",
  borderRadius: 7, background: "var(--color-surface-2)",
  color: "var(--color-text)", fontSize: 13.5,
  outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
  fontFamily: "inherit",
};

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "var(--color-text-subtle)", marginBottom: 5,
  textTransform: "uppercase", letterSpacing: "0.06em",
};

export function UnlockScreen({ authService, vaultService, navigate }: UnlockScreenProps) {
  const t = useT();
  const [vaults, setVaults] = useState<{ id: string; name: string }[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const EYE_D     = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
  const EYE_OFF_D = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";

  useEffect(() => {
    (async () => {
      try {
        let list = await vaultService.listLocalVaults();
        if (list.length === 0) {
          await vaultService.pullVaultsFromCloud();
          list = await vaultService.listLocalVaults();
        }
        setVaults(list);
        if (list.length > 0 && list[0]) setSelectedVaultId(list[0].id);
      } catch {
        /* ignore — user can still sign out */
      }
    })();
  }, [vaultService]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await vaultService.unlockVault(selectedVaultId, masterPassword);
      if (ok) {
        navigate("/vault");
      } else {
        setError(t("unlock.error.wrongPassword"));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("unlock.error.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await authService.signOut();
    navigate("/login");
  }

  const activeVault = vaults.find((v) => v.id === selectedVaultId);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>

      {/* ── Left: dark panel ── */}
      <div style={{
        width: 300, minWidth: 300, height: "100%",
        background: "linear-gradient(160deg, #0f1123 0%, #1a1d3a 60%, #16192a 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "36px 28px",
        borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(99,102,241,0.4)",
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2.5" fill="white" fillOpacity="0.92" />
                <path d="M8 11V7a4 4 0 018 0v4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>AkarPass</span>
          </div>

          {/* Large lock icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 20, marginBottom: 20,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2.5" fill="none" stroke="rgba(139,92,246,0.9)" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="rgba(139,92,246,0.9)" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill="rgba(139,92,246,0.9)" />
            </svg>
          </div>

          <h1 style={{ color: "#fff", fontSize: 21, fontWeight: 700, marginBottom: 8 }}>
            {t("unlock.title")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
            {activeVault
              ? t("unlock.heroSubtitle", { name: activeVault.name })
              : t("unlock.heroSubtitleNoVault")}
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 10.5 }}>v0.3.0 · MIT License</p>
      </div>

      {/* ── Right: form panel ── */}
      <div style={{
        flex: 1, height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--color-bg)", padding: "40px 48px",
      }}>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
            {t("unlock.formTitle")}
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-subtle)", marginBottom: 28 }}>
            {t("unlock.formSubtitle")}
          </p>

          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {vaults.length > 1 && (
              <div>
                <label style={LABEL}>{t("unlock.selectVault")}</label>
                <select
                  value={selectedVaultId}
                  onChange={(e) => setSelectedVaultId(e.target.value)}
                  style={{ ...INPUT, cursor: "pointer" }}
                >
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}

            {vaults.length === 1 && activeVault && (
              <div style={{
                padding: "10px 12px",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 7, display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "var(--color-accent-light)", border: "1px solid var(--color-accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="2.5" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" />
                    <path d="M8 11V7a4 4 0 018 0v4" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                    {activeVault.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>{t("unlock.selectedVault")}</div>
                </div>
              </div>
            )}

            <div>
              <label style={LABEL}>{t("unlock.field.masterPassword")}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="••••••••"
                  required autoFocus
                  style={{ ...INPUT, paddingRight: 38 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--color-text-subtle)",
                    cursor: "pointer", padding: 0, display: "flex",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={showPw ? EYE_OFF_D : EYE_D} />
                  </svg>
                </button>
              </div>
            </div>

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

            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "10px 0",
                background: loading
                  ? "var(--color-surface-3)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", borderRadius: 8, color: "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s", marginTop: 4,
                boxShadow: loading ? "none" : "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              {loading ? t("unlock.unlocking") : t("unlock.submit")}
            </button>

            <button type="button" onClick={handleSignOut}
              style={{
                width: "100%", padding: "8px 0",
                background: "transparent",
                border: "1.5px solid var(--color-border)",
                borderRadius: 8, color: "var(--color-text-subtle)",
                fontSize: 13, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-subtle)"; }}
            >
              {t("unlock.signOut")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
