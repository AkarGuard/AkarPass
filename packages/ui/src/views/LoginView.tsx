import { useState, type FormEvent, type CSSProperties } from "react";
import type { AuthService, VaultService } from "../types.js";

interface Props {
  authService: AuthService;
  vaultService: Pick<VaultService, "createNewVault">;
  navigate: (to: "/vault" | "/unlock") => void;
}

export function LoginView({ authService, vaultService, navigate }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showMaster, setShowMaster] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await authService.signUp(email, password);
        if (result.error) throw new Error(result.error);
        await vaultService.createNewVault(masterPassword, "Personal");
        navigate("/vault");
      } else {
        const result = await authService.signIn(email, password);
        if (result.error) throw new Error(result.error);
        navigate("/unlock");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontSize: 14,
    color: "var(--color-text)",
    background: "var(--color-surface-2)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius)",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2.5" fill="white" fillOpacity="0.9" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill="#6366f1" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.5px" }}>AkarPass</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>Sıfır bilgi. Kuantum sonrası şifreleme.</p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button"
                onClick={() => { setMode(m); setError(null); }}
                style={{
                  flex: 1, padding: "14px 12px", fontSize: 14, fontWeight: 600,
                  border: "none", background: "none", cursor: "pointer",
                  color: mode === m ? "var(--color-accent)" : "var(--color-text-muted)",
                  borderBottom: mode === m ? "2px solid var(--color-accent)" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {m === "signin" ? "Giriş yap" : "Hesap oluştur"}
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="E-posta">
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email" required placeholder="ornek@email.com" />
              </Field>

              <Field label="Hesap şifresi">
                <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"} required
                  placeholder="Supabase hesap şifresi" />
              </Field>

              {mode === "signup" && (
                <Field label="Ana şifre (master password)">
                  <div style={{ position: "relative" }}>
                    <input style={{ ...inputStyle, paddingRight: 60 }}
                      type={showMaster ? "text" : "password"} value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      autoComplete="new-password" required placeholder="Vault şifreleme şifresi" />
                    <button type="button" onClick={() => setShowMaster(p => !p)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      {showMaster ? "Gizle" : "Göster"}
                    </button>
                  </div>
                  <div style={{ marginTop: 8, padding: "10px 12px", background: "var(--color-accent-light)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--color-accent)" }}>
                    <p style={{ fontSize: 12, color: "#4338ca", lineHeight: 1.5 }}>
                      Bu şifre vault'unuzu <strong>sadece cihazınızda</strong> şifreler. Sunucuya gönderilmez. Kaybedilirse verileriniz kurtarılamaz.
                    </p>
                  </div>
                </Field>
              )}

              {error && (
                <div style={{ padding: "10px 14px", background: "var(--color-danger-light)", border: "1px solid #fecaca", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "13px", fontSize: 15, fontWeight: 600,
                  background: loading ? "var(--color-text-subtle)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white", border: "none", borderRadius: "var(--radius)",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
                  transition: "all 0.2s",
                }}>
                {loading ? "Yükleniyor..." : mode === "signup" ? "Hesap ve vault oluştur" : "Giriş yap"}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--color-text-subtle)" }}>
          Tüm veriler uçtan uca şifrelenir
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}
