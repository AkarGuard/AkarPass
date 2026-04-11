import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
  staticFile,
} from "remotion";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function o(frame: number, from: number, to: number, start: number, end: number) {
  return interpolate(frame, [start, end], [from, to], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function io(frame: number, from: number, to: number, start: number, end: number) {
  return interpolate(frame, [start, end], [from, to], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function sp(frame: number, fps: number, delay = 0) {
  return spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 16, stiffness: 80 } });
}

function useFadeOut(fadeFrames = 18) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - fadeFrames, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function Grid({ opacity = 1 }: { opacity?: number }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "linear-gradient(rgba(45,212,191,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.04) 1px, transparent 1px)",
      backgroundSize: "80px 80px",
      opacity,
    }} />
  );
}

function Glow({ color = "rgba(45,212,191,0.15)", size = 600, opacity = 1 }: { color?: string; size?: number; opacity?: number }) {
  return (
    <div style={{
      position: "absolute",
      width: size, height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity,
    }} />
  );
}

const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const TEAL = "#2dd4bf";
const INDIGO = "#6366f1";
const BG = "#050710";
const DARK = "linear-gradient(135deg, #050710 0%, #0d1028 55%, #060a1a 100%)";

// ─── Scene 1: Logo Cinematic Reveal (0–120f / 4s) ────────────────────────────

function S1_Logo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const logoScale = sp(frame, fps);
  const logoOpacity = o(frame, 0, 1, 0, 25);
  const glowScale = o(frame, 0.3, 1.2, 0, 80);
  const glowOpacity = o(frame, 0, 0.8, 10, 60);
  const titleOpacity = o(frame, 0, 1, 40, 75);
  const titleY = o(frame, 50, 0, 40, 75);
  const tagOpacity = o(frame, 0, 1, 65, 95);
  const ringScale = o(frame, 0.5, 1.4, 0, 100);
  const ringOpacity = o(frame, 0.6, 0, 20, 100);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <Grid />

      {/* Glow */}
      <div style={{
        position: "absolute",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(45,212,191,0.2) 0%, transparent 70%)`,
        transform: `scale(${glowScale})`,
        opacity: glowOpacity,
      }} />

      {/* Logo */}
      <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, marginBottom: 44, zIndex: 2, position: "relative" }}>
        <img
          src={staticFile("logo.png")}
          style={{ width: 170, height: 170, objectFit: "contain", filter: "drop-shadow(0 0 40px rgba(45,212,191,0.7))" }}
        />
      </div>

      {/* Title */}
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 2, position: "relative" }}>
        <h1 style={{ fontFamily: FONT, fontSize: 120, fontWeight: 800, color: "#fff", letterSpacing: "-3px", margin: 0, lineHeight: 1 }}>
          Akar<span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Guard</span>
        </h1>
      </div>

      {/* Tagline */}
      <p style={{
        opacity: tagOpacity, fontFamily: FONT, fontSize: 28,
        color: "rgba(255,255,255,0.4)", marginTop: 18,
        letterSpacing: "0.06em", fontWeight: 300, zIndex: 2, position: "relative",
      }}>
        Zero-knowledge · Post-quantum · Cross-platform
      </p>

      {/* Impact on logo reveal */}
      <Audio src={staticFile("impact.mp3")} startFrom={0} endAt={40} volume={0.7} />
    </AbsoluteFill>
  );
}

// ─── Scene 2: The Problem (120–230f / 3.7s) ──────────────────────────────────

const THREATS = [
  { icon: "🔓", title: "Zayıf Şifreler", desc: "İnsanların %65'i her yerde aynı şifreyi kullanır.", color: "#ef4444" },
  { icon: "🕵️", title: "Veri İhlalleri", desc: "2023'te 8 milyardan fazla hesap bilgisi sızdırıldı.", color: "#f97316" },
  { icon: "💻", title: "Phishing Saldırıları", desc: "Her 11 saniyede bir siber saldırı gerçekleşiyor.", color: "#eab308" },
];

function S2_Problem() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const titleY = o(frame, 40, 0, 0, 30);
  const titleOp = o(frame, 0, 1, 0, 30);
  const subOp = o(frame, 0, 1, 20, 45);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 50, opacity: fadeOut }}>
      <Grid />
      <Glow color="rgba(239,68,68,0.12)" size={700} />

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 1 }}>
        <p style={{ fontFamily: FONT, fontSize: 20, color: "#ef4444", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: 0, marginBottom: 14 }}>
          Problem Nedir?
        </p>
        <h2 style={{ fontFamily: FONT, fontSize: 72, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: "-1px" }}>
          Şifreleriniz <span style={{ color: "#ef4444" }}>tehlikede.</span>
        </h2>
      </div>

      <div style={{ display: "flex", gap: 28, zIndex: 1 }}>
        {THREATS.map((t, i) => {
          const cardScale = sp(frame, fps, 25 + i * 12);
          const cardOp = o(frame, 0, 1, 25 + i * 12, 45 + i * 12);
          return (
            <div key={t.title} style={{
              opacity: cardOp,
              transform: `scale(${cardScale})`,
              width: 360,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${t.color}33`,
              borderRadius: 20,
              padding: "32px 28px",
            }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>{t.icon}</div>
              <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 12 }}>{t.title}</div>
              <div style={{ fontFamily: FONT, fontSize: 19, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{t.desc}</div>
              <div style={{ marginTop: 16, height: 2, background: `linear-gradient(90deg, ${t.color}, transparent)`, borderRadius: 1 }} />
            </div>
          );
        })}
      </div>

    </AbsoluteFill>
  );
}

// ─── Scene 3: Our Encryption (230–370f / 4.7s) ───────────────────────────────

const TECH = [
  {
    step: "01",
    name: "Argon2id",
    desc: "Master şifreniz GPU saldırılarına karşı dayanıklı Argon2id ile türetilir. 64 MB bellek, 3 iterasyon.",
    color: TEAL,
    icon: "🔑",
  },
  {
    step: "02",
    name: "ML-KEM-768",
    desc: "Post-quantum Key Encapsulation. NIST FIPS 203 standardı. Kuantum bilgisayarlar kıramaz.",
    color: "#818cf8",
    icon: "⚛️",
  },
  {
    step: "03",
    name: "AES-256-GCM",
    desc: "Veri şifreleme. Her operasyonda rastgele IV. Kimlik doğrulama etiketi ile kurcalama tespiti.",
    color: "#34d399",
    icon: "🛡️",
  },
  {
    step: "04",
    name: "Zero-Knowledge",
    desc: "Sunucu sadece şifreli blob görür. Master şifreniz hiçbir zaman ağdan geçmez.",
    color: "#f59e0b",
    icon: "👁️‍🗨️",
  },
];

function FlowArrow({ opacity }: { opacity: number }) {
  return (
    <div style={{ opacity, display: "flex", alignItems: "center", color: "rgba(255,255,255,0.2)", fontSize: 24 }}>→</div>
  );
}

function S3_Encryption() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const titleOp = o(frame, 0, 1, 0, 25);
  const titleY = o(frame, 35, 0, 0, 25);

  // Flow diagram at bottom
  const flowItems = ["masterPassword", "Argon2id → masterKey", "ML-KEM encapsulate", "AES-GCM(DEK)", "encrypted_payload ☁️"];
  const flowOp = o(frame, 0, 1, 80, 110);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, opacity: fadeOut }}>
      <Grid />
      <Glow color="rgba(99,102,241,0.12)" size={800} />

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 1 }}>
        <p style={{ fontFamily: FONT, fontSize: 20, color: INDIGO, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: 0, marginBottom: 12 }}>
          Nasıl Korunuyorsunuz?
        </p>
        <h2 style={{ fontFamily: FONT, fontSize: 66, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1px" }}>
          4 Katmanlı <span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Şifreleme</span>
        </h2>
      </div>

      <div style={{ display: "flex", gap: 20, zIndex: 1 }}>
        {TECH.map((t, i) => {
          const cardScale = sp(frame, fps, 20 + i * 10);
          const cardOp = o(frame, 0, 1, 20 + i * 10, 40 + i * 10);
          return (
            <div key={t.name} style={{
              opacity: cardOp,
              transform: `scale(${cardScale})`,
              width: 280,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${t.color}33`,
              borderRadius: 18,
              padding: "26px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${t.color}22`, border: `1px solid ${t.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {t.icon}
                </div>
                <span style={{ fontFamily: FONT, fontSize: 13, color: t.color, fontWeight: 700, letterSpacing: "0.1em" }}>STEP {t.step}</span>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{t.name}</div>
              <div style={{ fontFamily: FONT, fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{t.desc}</div>
              <div style={{ marginTop: 14, height: 2, background: `linear-gradient(90deg, ${t.color}, transparent)`, borderRadius: 1 }} />
            </div>
          );
        })}
      </div>

      {/* Encryption flow */}
      <div style={{ opacity: flowOp, display: "flex", alignItems: "center", gap: 8, zIndex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 24px" }}>
        {flowItems.map((item, i) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 16, color: i === 0 ? "#ef4444" : i === flowItems.length - 1 ? TEAL : "rgba(255,255,255,0.55)" }}>
              {item}
            </span>
            {i < flowItems.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 18 }}>→</span>}
          </div>
        ))}
      </div>

      <Audio src={staticFile("lock.mp3")} startFrom={110} endAt={155} volume={0.55} />
    </AbsoluteFill>
  );
}

// ─── Scene 4: App Showcase (370–490f / 4s) ───────────────────────────────────

const ENTRIES = [
  { title: "Gmail", user: "user@gmail.com", color: "#ef4444", initials: "G", active: true },
  { title: "GitHub", user: "akarguard", color: "#6366f1", initials: "GH" },
  { title: "Netflix", user: "user@gmail.com", color: "#dc2626", initials: "N" },
  { title: "Spotify", user: "akarguard", color: "#22c55e", initials: "S" },
  { title: "Discord", user: "akarguard_", color: "#5865f2", initials: "D" },
];

function AppMockup() {
  const frame = useCurrentFrame();
  return (
    <div style={{
      width: 960, height: 600,
      borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
      boxShadow: "0 50px 150px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)",
      fontFamily: FONT,
    }}>
      {/* Title bar */}
      <div style={{ height: 38, background: "#0a0d1a", display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={staticFile("logo.png")} style={{ width: 16, height: 16, objectFit: "contain", filter: "drop-shadow(0 0 4px rgba(45,212,191,0.5))" }} />
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600 }}>AkarPass</span>
        </div>
        <div style={{ display: "flex", height: "100%" }}>
          {["─", "□", "✕"].map((icon) => (
            <div key={icon} style={{ width: 46, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{icon}</div>
          ))}
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: "#12152b", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.04)", padding: "12px 6px", gap: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 8px 14px" }}>
            <img src={staticFile("logo.png")} style={{ width: 26, height: 26, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(45,212,191,0.4))" }} />
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>My Vault</div>
              <div style={{ color: "#7c82a0", fontSize: 10 }}>5 şifre</div>
            </div>
          </div>
          {[
            { label: "Tüm Öğeler", active: true },
            { label: "Favoriler", active: false },
            { label: "Şifreler", active: false },
            { label: "Güvenli Notlar", active: false },
          ].map((item) => (
            <div key={item.label} style={{
              padding: "7px 8px", borderRadius: 6,
              background: item.active ? "rgba(99,102,241,0.15)" : "transparent",
              borderLeft: `2px solid ${item.active ? INDIGO : "transparent"}`,
              color: item.active ? "#c4c6f5" : "#7c82a0",
              fontSize: 12, fontWeight: item.active ? 600 : 400,
            }}>{item.label}</div>
          ))}
          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
            {["☁️  Sync", "🔒  Kilitle"].map((item) => (
              <div key={item} style={{ padding: "6px 8px", borderRadius: 6, color: "#7c82a0", fontSize: 11 }}>{item}</div>
            ))}
          </div>
        </div>
        {/* Entry list */}
        <div style={{ width: 260, background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: "#f1f3f8", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: "#94a3b8" }}>🔍 Ara…</div>
            <div style={{ width: 30, height: 30, background: INDIGO, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>+</div>
          </div>
          {ENTRIES.map((entry, i) => {
            const entryOp = o(frame, 0, 1, 10 + i * 5, 25 + i * 5);
            const entryX = o(frame, -10, 0, 10 + i * 5, 25 + i * 5);
            return (
              <div key={entry.title} style={{
                padding: "9px 10px", display: "flex", alignItems: "center", gap: 10,
                background: (entry as { active?: boolean }).active ? "#eef2ff" : "transparent",
                borderLeft: `2px solid ${(entry as { active?: boolean }).active ? INDIGO : "transparent"}`,
                borderBottom: "1px solid #e2e8f0",
                opacity: entryOp, transform: `translateX(${entryX}px)`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: entry.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {entry.initials}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: (entry as { active?: boolean }).active ? 600 : 500, color: (entry as { active?: boolean }).active ? INDIGO : "#1e2433" }}>{entry.title}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.user}</div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Detail */}
        <div style={{ flex: 1, background: "#f1f3f8", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>G</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2433" }}>Gmail</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>mail.google.com</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 20, color: "#eab308" }}>★</div>
              <div style={{ padding: "5px 16px", background: INDIGO, borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 600 }}>Düzenle</div>
            </div>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "KULLANICI ADI", value: "user@gmail.com", secret: false },
              { label: "ŞİFRE", value: "••••••••••••••••", secret: true },
              { label: "WEBSİTE", value: "mail.google.com", secret: false },
            ].map((field) => (
              <div key={field.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{field.label}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#1e2433", fontFamily: field.secret ? "monospace" : FONT }}>{field.value}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {field.secret && <div style={{ width: 24, height: 24, background: "#f1f3f8", border: "1px solid #e2e8f0", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>👁</div>}
                    <div style={{ width: 24, height: 24, background: "#f1f3f8", border: "1px solid #e2e8f0", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>📋</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function S4_App() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const scale = spring({ frame, fps, config: { damping: 18, stiffness: 55 }, durationInFrames: 60 });
  const opacity = o(frame, 0, 1, 0, 20);
  const labelOp = o(frame, 0, 1, 5, 30);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: fadeOut }}>
      <Grid />
      <Glow color="rgba(99,102,241,0.1)" size={900} />

      <div style={{ opacity: labelOp, zIndex: 1, textAlign: "center" }}>
        <p style={{ fontFamily: FONT, fontSize: 16, color: TEAL, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: 0 }}>
          Masaüstü Uygulaması
        </p>
      </div>

      <div style={{ opacity, transform: `scale(${scale})`, zIndex: 1 }}>
        <AppMockup />
      </div>

      <Audio src={staticFile("click.mp3")} startFrom={15} endAt={40} volume={0.4} />
    </AbsoluteFill>
  );
}

// ─── Scene 5: Autofill (490–600f / 3.7s) ─────────────────────────────────────

function AutofillMockup() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const popupScale = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 16, stiffness: 90 } });
  const popupOp = o(frame, 0, 1, 25, 40);
  const fillOp = o(frame, 0, 1, 55, 68);
  const checkOp = o(frame, 0, 1, 70, 85);

  return (
    <div style={{ position: "relative", width: 700, fontFamily: FONT }}>
      {/* Browser */}
      <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)" }}>
        <div style={{ background: "#1e2433", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
            🔒  mail.google.com
          </div>
        </div>
        <div style={{ background: "#fff", padding: "52px 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#1e2433", marginBottom: 4 }}>Gmail'e Giriş Yap</div>
          <div style={{ width: 340 }}>
            <div style={{
              border: `2px solid ${fillOp > 0.5 ? INDIGO : "#e2e8f0"}`,
              borderRadius: 8, padding: "11px 14px", fontSize: 14,
              color: fillOp > 0.5 ? "#1e2433" : "#94a3b8",
              background: fillOp > 0.5 ? "#eef2ff" : "#fff",
              transition: "all 0.2s",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{fillOp > 0.5 ? "user@gmail.com" : "E-posta"}</span>
              {fillOp > 0.5 && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
            </div>
          </div>
          <div style={{ width: 340 }}>
            <div style={{
              border: `2px solid ${fillOp > 0.5 ? INDIGO : "#e2e8f0"}`,
              borderRadius: 8, padding: "11px 14px", fontSize: 14,
              color: fillOp > 0.5 ? "#1e2433" : "#94a3b8",
              background: fillOp > 0.5 ? "#eef2ff" : "#fff",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{fillOp > 0.5 ? "••••••••••••••" : "Şifre"}</span>
              {fillOp > 0.5 && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
            </div>
          </div>
          <div style={{ width: 340, padding: "12px 0", background: "#4285f4", borderRadius: 8, textAlign: "center", color: "#fff", fontSize: 14, fontWeight: 600 }}>
            İleri
          </div>
        </div>
      </div>

      {/* Extension popup */}
      <div style={{
        position: "absolute", top: 56, right: -20, width: 270,
        background: "#12152b", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 24px 70px rgba(0,0,0,0.7)",
        opacity: popupOp, transform: `scale(${popupScale})`,
        transformOrigin: "top right",
      }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          <img src={staticFile("logo.png")} style={{ width: 18, height: 18, objectFit: "contain", filter: "drop-shadow(0 0 4px rgba(45,212,191,0.5))" }} />
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>AkarPass</span>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 10, color: "#7c82a0", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 6px", fontWeight: 600 }}>
            Bu site için önerilen
          </div>
          <div style={{
            padding: "9px 10px", borderRadius: 8,
            background: "rgba(99,102,241,0.15)",
            display: "flex", alignItems: "center", gap: 10, marginTop: 4,
          }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>G</div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Gmail</div>
              <div style={{ color: "#7c82a0", fontSize: 11 }}>user@gmail.com</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div style={{
                padding: "4px 10px", background: INDIGO, borderRadius: 6,
                color: "#fff", fontSize: 11, fontWeight: 600,
                opacity: fillOp < 0.5 ? 1 : 0,
              }}>
                Doldur ↵
              </div>
              {fillOp > 0.5 && <span style={{ color: "#22c55e", fontSize: 18 }}>✓</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function S5_Autofill() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const scale = spring({ frame, fps, config: { damping: 18, stiffness: 55 }, durationInFrames: 55 });
  const opacity = o(frame, 0, 1, 0, 18);
  const labelOp = o(frame, 0, 1, 5, 28);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: fadeOut }}>
      <Grid />
      <Glow color="rgba(45,212,191,0.1)" size={800} />

      <div style={{ opacity: labelOp, zIndex: 1, textAlign: "center" }}>
        <p style={{ fontFamily: FONT, fontSize: 16, color: TEAL, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: 0 }}>
          Chrome Eklentisi · Otomatik Doldurma
        </p>
      </div>

      <div style={{ opacity, transform: `scale(${scale})`, zIndex: 1 }}>
        <AutofillMockup />
      </div>

      <Audio src={staticFile("success.mp3")} startFrom={75} endAt={120} volume={0.7} />
    </AbsoluteFill>
  );
}

// ─── Scene 6: Stats (600–690f / 3s) ──────────────────────────────────────────

const STATS = [
  { value: "256-bit", label: "AES Şifreleme", sub: "Askeri düzey güvenlik", color: TEAL },
  { value: "0", label: "Plaintext Sunucu'ya", sub: "Zero-knowledge mimari", color: INDIGO },
  { value: "ML-KEM", label: "Post-Quantum", sub: "NIST FIPS 203 Standardı", color: "#a78bfa" },
  { value: "∞", label: "Platform Desteği", sub: "Windows · Web · Chrome", color: "#34d399" },
];

function S6_Stats() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const titleOp = o(frame, 0, 1, 0, 25);
  const titleY = o(frame, 30, 0, 0, 25);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 50, opacity: fadeOut }}>
      <Grid />
      <Glow color="rgba(167,139,250,0.12)" size={700} />

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 1 }}>
        <h2 style={{ fontFamily: FONT, fontSize: 52, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1px" }}>
          Rakamlarla <span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AkarGuard</span>
        </h2>
      </div>

      <div style={{ display: "flex", gap: 32, zIndex: 1 }}>
        {STATS.map((stat, i) => {
          const scale = sp(frame, fps, 20 + i * 10);
          const sOp = o(frame, 0, 1, 20 + i * 10, 40 + i * 10);
          return (
            <div key={stat.label} style={{
              opacity: sOp, transform: `scale(${scale})`,
              width: 260, textAlign: "center",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${stat.color}33`,
              borderRadius: 20, padding: "32px 20px",
            }}>
              <div style={{
                fontFamily: FONT, fontSize: 56, fontWeight: 900, marginBottom: 10,
                background: `linear-gradient(135deg, ${stat.color}, white)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 15, color: "rgba(255,255,255,0.4)" }}>{stat.sub}</div>
            </div>
          );
        })}
      </div>

      <Audio src={staticFile("unlock.mp3")} startFrom={5} endAt={45} volume={0.55} />
    </AbsoluteFill>
  );
}

// ─── Scene 7: CTA (690–750f / 2s) ────────────────────────────────────────────

function S7_CTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = sp(frame, fps);
  const logoOp = o(frame, 0, 1, 0, 22);
  const textOp = o(frame, 0, 1, 18, 45);
  const textY = o(frame, 40, 0, 18, 45);
  const badgeScale = sp(frame, fps, 40);
  const badgeOp = o(frame, 0, 1, 40, 58);
  const domainOp = o(frame, 0, 1, 55, 72);
  const glow = interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
      <Grid />
      <div style={{
        position: "absolute", width: 800, height: 800, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)`,
        opacity: glow,
      }} />

      <div style={{ opacity: logoOp, transform: `scale(${logoScale})`, zIndex: 1 }}>
        <img src={staticFile("logo.png")} style={{ width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 32px rgba(45,212,191,0.6))" }} />
      </div>

      <div style={{ opacity: textOp, transform: `translateY(${textY}px)`, textAlign: "center", zIndex: 1 }}>
        <h2 style={{ fontFamily: FONT, fontSize: 88, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.05, letterSpacing: "-2px" }}>
          Şifreleriniz artık<br />
          <span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            güvende.
          </span>
        </h2>
      </div>

      <div style={{ opacity: badgeOp, transform: `scale(${badgeScale})`, display: "flex", gap: 20, zIndex: 1 }}>
        {["akarguard.net"].map((domain) => (
          <div key={domain} style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.1), rgba(99,102,241,0.1))",
            border: "1px solid rgba(45,212,191,0.35)",
            borderRadius: 100, padding: "14px 42px",
          }}>
            <span style={{ fontFamily: FONT, fontSize: 26, fontWeight: 600, color: TEAL, letterSpacing: "0.02em" }}>{domain}</span>
          </div>
        ))}
      </div>

      <p style={{ opacity: domainOp, fontFamily: FONT, fontSize: 18, color: "rgba(255,255,255,0.22)", letterSpacing: "0.06em", zIndex: 1, margin: 0 }}>
        Ücretsiz başlayın · Kredi kartı gerekmez
      </p>

      {/* Final logo hit + chime */}
      <Audio src={staticFile("impact.mp3")} startFrom={0} endAt={30} volume={0.55} />
      <Audio src={staticFile("chime.mp3")} startFrom={22} endAt={70} volume={0.75} />
    </AbsoluteFill>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function Intro() {
  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Soft cinematic background music throughout — bg.mp3, not tech.mp3 */}
      <Audio src={staticFile("bg.mp3")} startFrom={0} volume={0.07} />

      {/* S1: Logo reveal          0  – 120 */}
      <Sequence from={0}   durationInFrames={120}><S1_Logo /></Sequence>

      {/* S2: The Problem          110 – 230 */}
      <Sequence from={110} durationInFrames={120}><S2_Problem /></Sequence>

      {/* S3: Encryption tech      220 – 375 */}
      <Sequence from={220} durationInFrames={155}><S3_Encryption /></Sequence>

      {/* S4: App mockup           365 – 490 */}
      <Sequence from={365} durationInFrames={125}><S4_App /></Sequence>

      {/* S5: Autofill             480 – 600 */}
      <Sequence from={480} durationInFrames={120}><S5_Autofill /></Sequence>

      {/* S6: Stats                590 – 690 */}
      <Sequence from={590} durationInFrames={100}><S6_Stats /></Sequence>

      {/* S7: CTA                  680 – 860 */}
      <Sequence from={680} durationInFrames={180}><S7_CTA /></Sequence>
    </AbsoluteFill>
  );
}
