import React, { useState } from "react";

interface AuthService {
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signUp(email: string, password: string): Promise<{ error?: string }>;
}

interface VaultServiceLike {
  createNewVault(masterPassword: string, name?: string): Promise<string>;
  listLocalVaults(): Promise<{ id: string; name: string }[]>;
}

interface LoginScreenProps {
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

export function LoginScreen({ authService, vaultService, navigate }: LoginScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [vaultName, setVaultName] = useState("Personal");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showMPw, setShowMPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: authErr } = await authService.signIn(email, password);
        if (authErr) { setError(authErr); return; }
        const vaults = await vaultService.listLocalVaults();
        navigate(vaults.length > 0 ? "/unlock" : "/vault");
      } else {
        const { error: authErr } = await authService.signUp(email, password);
        if (authErr) { setError(authErr); return; }
        if (!masterPassword) { setError("Master password is required."); return; }
        await vaultService.createNewVault(masterPassword, vaultName || "Personal");
        navigate("/vault");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      {/* ── Left: brand panel ── */}
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
        {/* Logo */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
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

          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
            Zero-knowledge<br />password manager
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13.5, lineHeight: 1.6 }}>
            Your vault is encrypted on your device. The server never sees your passwords.
          </p>

          {/* Feature list */}
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["🔑", "AES-GCM + ML-KEM encryption"],
              ["☁️", "Encrypted cloud sync"],
              ["⚡", "Auto-fill in any browser"],
              ["🔐", "TOTP / 2FA support"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5 }}>{text}</span>
              </div>
            ))}
          </div>
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
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              background: "#e2e8f0",
              borderRadius: 8,
              padding: 3,
              marginBottom: 28,
            }}
          >
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: mode === m ? "#fff" : "transparent",
                  color: mode === m ? "#1e2433" : "#94a3b8",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                }}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e2433", marginBottom: 6 }}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
            {mode === "signin"
              ? "Sign in to access your vault"
              : "Start managing your passwords securely"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={LABEL}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                style={INPUT}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={LABEL}>Account Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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

            {mode === "signup" && (
              <>
                <div>
                  <label style={LABEL}>Master Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showMPw ? "text" : "password"}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Encrypts your vault — never sent to server"
                      required
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
                      onClick={() => setShowMPw(!showMPw)}
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
                      {showMPw ? "🙈" : "👁"}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 5, lineHeight: 1.5 }}>
                    If you lose this, your data cannot be recovered.
                  </p>
                </div>
                <div>
                  <label style={LABEL}>Vault Name</label>
                  <input
                    type="text"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    placeholder="Personal"
                    style={INPUT}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </>
            )}

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
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
