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

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const SHIELD_D  = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
const CLOUD_D   = "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";
const BOLT_D    = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";
const LOCK_D    = "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4";

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

const FEATURES = [
  [SHIELD_D, "AES-GCM + ML-KEM şifreleme"],
  [CLOUD_D,  "Şifreli bulut senkronizasyonu"],
  [BOLT_D,   "Tarayıcıda otomatik doldurma"],
  [LOCK_D,   "TOTP / 2FA desteği"],
] as [string, string][];

export function LoginScreen({ authService, vaultService, navigate }: LoginScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [vaultName, setVaultName] = useState("Kişisel");
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
        if (!masterPassword) { setError("Master şifre zorunludur."); return; }
        await vaultService.createNewVault(masterPassword, vaultName || "Kişisel");
        navigate("/vault");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>

      {/* ── Left: brand panel ── */}
      <div style={{
        width: 300, minWidth: 300, height: "100%",
        background: "linear-gradient(160deg, #0f1123 0%, #1a1d3a 60%, #16192a 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "36px 28px",
        borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
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

          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>
            Zero-knowledge<br />şifre yöneticisi
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
            Vault cihazınızda şifrelenir. Sunucu şifrelerinizi asla görmez.
          </p>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            {FEATURES.map(([iconD, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "rgba(139,92,246,0.9)", flexShrink: 0 }}>
                  <Icon d={iconD} size={14} />
                </span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 10.5 }}>v0.2.2 · MIT License</p>
      </div>

      {/* ── Right: form panel ── */}
      <div style={{
        flex: 1, height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--color-bg)", padding: "40px 48px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          {/* Tab switcher */}
          <div style={{
            display: "flex", background: "var(--color-surface-2)",
            borderRadius: 8, padding: 3, marginBottom: 28,
            border: "1px solid var(--color-border)",
          }}>
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "7px 0", border: "none", borderRadius: 6,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  background: mode === m ? "var(--color-surface)" : "transparent",
                  color: mode === m ? "var(--color-text)" : "var(--color-text-subtle)",
                  boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                }}
              >
                {m === "signin" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
            {mode === "signin" ? "Tekrar hoş geldiniz" : "Hesap oluştur"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-subtle)", marginBottom: 24 }}>
            {mode === "signin"
              ? "Vault'unuza erişmek için giriş yapın"
              : "Şifrelerinizi güvenle yönetmeye başlayın"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={LABEL}>E-posta</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="siz@example.com" required autoFocus style={INPUT}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }} />
            </div>

            <div>
              <label style={LABEL}>Hesap Şifresi</label>
              <PasswordInput
                value={password} onChange={setPassword}
                show={showPw} onToggle={() => setShowPw(!showPw)}
                placeholder="••••••••" required
              />
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label style={LABEL}>Master Şifre</label>
                  <PasswordInput
                    value={masterPassword} onChange={setMasterPassword}
                    show={showMPw} onToggle={() => setShowMPw(!showMPw)}
                    placeholder="Vault'u şifreler — sunucuya gönderilmez" required
                  />
                  <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginTop: 5, lineHeight: 1.5 }}>
                    Bu şifreyi kaybederseniz verileriniz kurtarılamaz.
                  </p>
                </div>
                <div>
                  <label style={LABEL}>Vault Adı</label>
                  <input type="text" value={vaultName} onChange={(e) => setVaultName(e.target.value)}
                    placeholder="Kişisel" style={INPUT}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }} />
                </div>
              </>
            )}

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
                border: "none", borderRadius: 8,
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s", marginTop: 4,
                boxShadow: loading ? "none" : "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              {loading ? "Lütfen bekleyin…" : mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  value, onChange, show, onToggle, placeholder, required = false,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  required?: boolean;
}) {
  const EYE_D_     = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
  const EYE_OFF_D_ = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";

  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{
          width: "100%", padding: "9px 38px 9px 12px",
          border: "1.5px solid var(--color-border)",
          borderRadius: 7, background: "var(--color-surface-2)",
          color: "var(--color-text)", fontSize: 13.5,
          outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
          fontFamily: "inherit",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <button type="button" onClick={onToggle}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", color: "var(--color-text-subtle)",
          cursor: "pointer", padding: 0, display: "flex",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={show ? EYE_OFF_D_ : EYE_D_} />
        </svg>
      </button>
    </div>
  );
}
