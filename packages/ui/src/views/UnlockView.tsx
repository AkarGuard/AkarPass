import { useState, useEffect, type FormEvent, type CSSProperties } from "react";
import type { AuthService, VaultService } from "../types.js";

interface Props {
  authService: Pick<AuthService, "signOut">;
  vaultService: Pick<VaultService, "listLocalVaults" | "pullVaultsFromCloud" | "unlockVault">;
  navigate: (to: "/vault" | "/login") => void;
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  fontSize: 15,
  color: "var(--color-text)",
  background: "var(--color-surface-2)",
  border: "1.5px solid var(--color-border)",
  borderRadius: "var(--radius)",
  outline: "none",
};

export function UnlockView({ authService, vaultService, navigate }: Props) {
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [vaultName, setVaultName] = useState("Personal");

  useEffect(() => {
    (async () => {
      let vaults = await vaultService.listLocalVaults();
      if (vaults.length === 0) {
        await vaultService.pullVaultsFromCloud();
        vaults = await vaultService.listLocalVaults();
      }
      if (vaults.length > 0) {
        setVaultId(vaults[0]!.id);
        setVaultName(vaults[0]!.name);
      } else {
        navigate("/login");
      }
    })();
  }, [vaultService, navigate]);

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    if (!vaultId) return;
    setError(null);
    setLoading(true);
    try {
      const success = await vaultService.unlockVault(vaultId, masterPassword);
      if (success) navigate("/vault");
      else setError("Yanlış master password. Lütfen tekrar deneyin.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vault açılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
          }}>
            <span style={{ fontSize: 36 }}>🔒</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.4px" }}>Vault Kilitli</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6 }}>
            <strong style={{ color: "var(--color-text)" }}>{vaultName}</strong> vault'unu açmak için master password'ünüzü girin
          </p>
        </div>

        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--color-border)", padding: 28 }}>
          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="password"
              placeholder="Master password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              autoFocus required autoComplete="current-password"
              style={inputStyle}
            />

            {error && (
              <div style={{ padding: "10px 14px", background: "var(--color-danger-light)", border: "1px solid #fecaca", borderRadius: "var(--radius-sm)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>⚠️</span>
                <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !vaultId}
              style={{
                padding: "13px", fontSize: 15, fontWeight: 600,
                background: loading ? "var(--color-text-subtle)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white", border: "none", borderRadius: "var(--radius)",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
              }}>
              {loading ? "Şifre çözülüyor..." : "Vault'u Aç"}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--color-border)", textAlign: "center" }}>
            <button onClick={async () => { await authService.signOut(); navigate("/login"); }}
              style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 13, padding: "6px 12px", borderRadius: "var(--radius-sm)" }}>
              Çıkış yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
