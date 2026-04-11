import React, { useState, useEffect } from "react";

interface VaultServiceLike {
  listLocalVaults(): Promise<{ id: string; name: string }[]>;
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
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 7,
  background: "#fff",
  color: "#1e2433",
  fontSize: 13.5,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  fontFamily: "inherit",
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 5,
};

export function UnlockScreen({ authService, vaultService, navigate }: UnlockScreenProps) {
  const [vaults, setVaults] = useState<{ id: string; name: string }[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    vaultService
      .listLocalVaults()
      .then((list) => {
        setVaults(list);
        if (list.length > 0 && list[0]) setSelectedVaultId(list[0].id);
      })
      .catch(() => {});
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
        setError("Incorrect master password.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unlock vault.");
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
      <div
        style={{
          width: 320,
          minWidth: 320,
          height: "100%",
          background: "linear-gradient(160deg, #0f1123 0%, #1a1d3a 60%, #16192a 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 32px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <img
              src="/logo.png"
              alt="AkarGuard"
              style={{
                width: 36,
                height: 36,
                objectFit: "contain",
                flexShrink: 0,
                filter: "drop-shadow(0 0 10px rgba(45,212,191,0.5))",
              }}
            />
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>AkarPass</span>
          </div>

          {/* Logo large */}
          <div style={{ marginBottom: 20 }}>
            <img
              src="/logo.png"
              alt="AkarGuard"
              style={{
                width: 72,
                height: 72,
                objectFit: "contain",
                filter: "drop-shadow(0 0 20px rgba(45,212,191,0.4))",
              }}
            />
          </div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Vault Locked
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
            {activeVault
              ? `Enter your master password to unlock "${activeVault.name}"`
              : "Enter your master password to continue"}
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>v0.1.0 · MIT License</p>
      </div>

      {/* ── Right: form panel ── */}
      <div
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "40px 48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 340 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e2433", marginBottom: 6 }}>
            Unlock your vault
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
            Only your master password can decrypt it
          </p>

          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {vaults.length > 1 && (
              <div>
                <label style={LABEL}>Select Vault</label>
                <select
                  value={selectedVaultId}
                  onChange={(e) => setSelectedVaultId(e.target.value)}
                  style={{ ...INPUT, appearance: "none", cursor: "pointer" }}
                >
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {vaults.length === 1 && activeVault && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>🗂️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2433" }}>
                    {activeVault.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Selected vault</div>
                </div>
              </div>
            )}

            <div>
              <label style={LABEL}>Master Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  style={{ ...INPUT, paddingRight: 38 }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 15,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "9px 12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 7,
                  color: "#ef4444",
                  fontSize: 12.5,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 0",
                background: loading ? "#a5b4fc" : "#6366f1",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                marginTop: 4,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#4f46e5"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#6366f1"; }}
            >
              {loading ? "Unlocking…" : "Unlock Vault"}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              style={{
                width: "100%",
                padding: "8px 0",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#94a3b8",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#64748b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#94a3b8";
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
