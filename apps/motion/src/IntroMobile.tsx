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

// ─── Helpers (same as Intro.tsx) ──────────────────────────────────────────────

function o(frame: number, from: number, to: number, start: number, end: number) {
  return interpolate(frame, [start, end], [from, to], {
    easing: Easing.out(Easing.cubic),
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
      backgroundSize: "60px 60px",
      opacity,
    }} />
  );
}

const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const TEAL = "#2dd4bf";
const INDIGO = "#6366f1";
const BG = "#050710";
const DARK = "linear-gradient(135deg, #050710 0%, #0d1028 55%, #060a1a 100%)";

// ─── Scene 1: Logo (0–120f) ───────────────────────────────────────────────────

function S1_Logo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const logoScale = sp(frame, fps);
  const logoOpacity = o(frame, 0, 1, 0, 25);
  const glowScale = o(frame, 0.3, 1.2, 0, 80);
  const glowOpacity = o(frame, 0, 0.8, 10, 60);
  const titleOpacity = o(frame, 0, 1, 40, 75);
  const titleY = o(frame, 60, 0, 40, 75);
  const tagOpacity = o(frame, 0, 1, 65, 95);
  const ringScale = o(frame, 0.5, 1.4, 0, 100);
  const ringOpacity = o(frame, 0.6, 0, 20, 100);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <Grid />

      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%)`, transform: `scale(${glowScale})`, opacity: glowOpacity }} />

      <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, marginBottom: 56, zIndex: 2, position: "relative" }}>
        <img src={staticFile("logo.png")} style={{ width: 220, height: 220, objectFit: "contain", filter: "drop-shadow(0 0 50px rgba(45,212,191,0.7))" }} />
      </div>

      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 2, position: "relative", padding: "0 60px" }}>
        <h1 style={{ fontFamily: FONT, fontSize: 110, fontWeight: 800, color: "#fff", letterSpacing: "-3px", margin: 0, lineHeight: 1 }}>
          Akar<span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Guard</span>
        </h1>
      </div>

      <p style={{ opacity: tagOpacity, fontFamily: FONT, fontSize: 34, color: "rgba(255,255,255,0.4)", marginTop: 24, letterSpacing: "0.04em", fontWeight: 300, zIndex: 2, position: "relative", textAlign: "center", padding: "0 60px" }}>
        Zero-knowledge · Post-quantum
      </p>

      <Audio src={staticFile("impact.mp3")} startFrom={0} endAt={40} volume={0.7} />
    </AbsoluteFill>
  );
}

// ─── Scene 2: Problem (110–230f) ──────────────────────────────────────────────

const THREATS = [
  { icon: "🔓", title: "Zayıf Şifreler", desc: "İnsanların %65'i her yerde aynı şifreyi kullanır.", color: "#ef4444" },
  { icon: "🕵️", title: "Veri İhlalleri", desc: "2023'te 8 milyar hesap bilgisi sızdırıldı.", color: "#f97316" },
  { icon: "💻", title: "Phishing Saldırıları", desc: "Her 11 saniyede bir siber saldırı gerçekleşiyor.", color: "#eab308" },
];

function S2_Problem() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const titleY = o(frame, 50, 0, 0, 30);
  const titleOp = o(frame, 0, 1, 0, 30);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, padding: "0 60px", opacity: fadeOut }}>
      <Grid />
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)" }} />

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 1 }}>
        <p style={{ fontFamily: FONT, fontSize: 24, color: "#ef4444", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: 0, marginBottom: 16 }}>
          Problem Nedir?
        </p>
        <h2 style={{ fontFamily: FONT, fontSize: 76, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: "-1px" }}>
          Şifreleriniz <span style={{ color: "#ef4444" }}>tehlikede.</span>
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, zIndex: 1, width: "100%" }}>
        {THREATS.map((t, i) => {
          const cardScale = sp(frame, fps, 25 + i * 12);
          const cardOp = o(frame, 0, 1, 25 + i * 12, 45 + i * 12);
          return (
            <div key={t.title} style={{
              opacity: cardOp, transform: `scale(${cardScale})`,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${t.color}33`,
              borderRadius: 24, padding: "32px 36px",
              display: "flex", alignItems: "center", gap: 28,
            }}>
              <div style={{ fontSize: 56, flexShrink: 0 }}>{t.icon}</div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{t.title}</div>
                <div style={{ fontFamily: FONT, fontSize: 22, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 3: Encryption (220–375f) ──────────────────────────────────────────

const TECH = [
  { step: "01", icon: "🔑", name: "Argon2id", desc: "64 MiB bellek ile şifre türetme. Brute-force'a karşı dayanıklı.", color: TEAL },
  { step: "02", icon: "🔐", name: "ML-KEM-768", desc: "Kuantum bilgisayarlara karşı NIST FIPS 203 post-quantum şifreleme.", color: INDIGO },
  { step: "03", icon: "🛡️", name: "AES-256-GCM", desc: "Kimlik doğrulama etiketiyle şifrelenmiş kasa verisi.", color: "#a78bfa" },
  { step: "04", icon: "🚫", name: "Zero-Knowledge", desc: "Sunucu hiçbir zaman düz metin görmez. Sadece şifreli blob.", color: "#34d399" },
];

function S3_Encryption() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();

  const titleOp = o(frame, 0, 1, 0, 25);
  const titleY = o(frame, 50, 0, 0, 25);
  const flowOp = o(frame, 0, 1, 110, 140);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, padding: "0 60px", opacity: fadeOut }}>
      <Grid />
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 1 }}>
        <p style={{ fontFamily: FONT, fontSize: 24, color: INDIGO, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: 0, marginBottom: 12 }}>
          Nasıl Korunuyorsunuz?
        </p>
        <h2 style={{ fontFamily: FONT, fontSize: 68, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1px" }}>
          4 Katmanlı <span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Şifreleme</span>
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 1, width: "100%" }}>
        {TECH.map((t, i) => {
          const cardScale = sp(frame, fps, 20 + i * 10);
          const cardOp = o(frame, 0, 1, 20 + i * 10, 40 + i * 10);
          return (
            <div key={t.name} style={{
              opacity: cardOp, transform: `scale(${cardScale})`,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${t.color}33`,
              borderRadius: 20, padding: "24px 30px",
              display: "flex", alignItems: "center", gap: 24,
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: `${t.color}22`, border: `1px solid ${t.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                {t.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 14, color: t.color, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>STEP {t.step}</div>
                <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 18, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ opacity: flowOp, zIndex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 28px", width: "100%" }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 18, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.8 }}>
          <span style={{ color: "#ef4444" }}>masterPassword</span> → Argon2id → <span style={{ color: TEAL }}>masterKey</span>
          {" → "}<span style={{ color: INDIGO }}>ML-KEM</span> → DEK → <span style={{ color: "#34d399" }}>EncryptedVault</span>
        </div>
      </div>

      <Audio src={staticFile("lock.mp3")} startFrom={110} endAt={155} volume={0.55} />
    </AbsoluteFill>
  );
}

// ─── Scene 4: Stats (365–490f) ────────────────────────────────────────────────

const STATS = [
  { value: "256-bit", label: "AES Şifreleme", sub: "Askeri düzey güvenlik", color: TEAL },
  { value: "0", label: "Plaintext Sunucu'ya", sub: "Zero-knowledge mimari", color: INDIGO },
  { value: "ML-KEM", label: "Post-Quantum", sub: "NIST FIPS 203", color: "#a78bfa" },
  { value: "∞", label: "Platform Desteği", sub: "Windows · Web · Chrome", color: "#34d399" },
];

function S4_Stats() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();
  const titleOp = o(frame, 0, 1, 0, 25);
  const titleY = o(frame, 50, 0, 0, 25);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, padding: "0 60px", opacity: fadeOut }}>
      <Grid />
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)" }} />

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 1 }}>
        <h2 style={{ fontFamily: FONT, fontSize: 68, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1px" }}>
          Rakamlarla <span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AkarGuard</span>
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, zIndex: 1, width: "100%" }}>
        {STATS.map((stat, i) => {
          const sOp = o(frame, 0, 1, 20 + i * 10, 40 + i * 10);
          const scale = sp(frame, fps, 20 + i * 10);
          return (
            <div key={stat.value} style={{
              opacity: sOp, transform: `scale(${scale})`,
              textAlign: "center", background: "rgba(255,255,255,0.03)",
              border: `1px solid ${stat.color}33`, borderRadius: 24, padding: "40px 24px",
            }}>
              <div style={{ fontFamily: FONT, fontSize: 60, fontWeight: 900, marginBottom: 10, background: `linear-gradient(135deg, ${stat.color}, white)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 17, color: "rgba(255,255,255,0.4)" }}>{stat.sub}</div>
            </div>
          );
        })}
      </div>

      <Audio src={staticFile("unlock.mp3")} startFrom={5} endAt={45} volume={0.55} />
    </AbsoluteFill>
  );
}

// ─── Scene 5: Autofill (480–600f) ─────────────────────────────────────────────

function S5_Autofill() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = useFadeOut();
  const op = o(frame, 0, 1, 0, 20);
  const scale = sp(frame, fps);
  const labelOp = o(frame, 0, 1, 0, 20);
  const fillOp = o(frame, 0, 1, 50, 80);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, padding: "80px 60px", opacity: fadeOut }}>
      <Grid />
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)" }} />

      <div style={{ opacity: labelOp, zIndex: 1, textAlign: "center" }}>
        <p style={{ fontFamily: FONT, fontSize: 22, color: TEAL, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: 0, marginBottom: 8 }}>
          Chrome Eklentisi
        </p>
        <h2 style={{ fontFamily: FONT, fontSize: 62, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1px" }}>
          Otomatik <span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Doldurma</span>
        </h2>
      </div>

      {/* Login form mockup — compact for mobile */}
      <div style={{ opacity: op, transform: `scale(${scale})`, zIndex: 1, width: "100%", background: "#fff", borderRadius: 28, padding: "30px 36px", boxShadow: "0 0 60px rgba(45,212,191,0.15)" }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#1e2433", marginBottom: 24 }}>Gmail'e Giriş Yap</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>E-posta</div>
          <div style={{ border: "2px solid #e2e8f0", borderRadius: 12, padding: "15px 18px", fontSize: 22, color: fillOp > 0.5 ? "#1e2433" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{fillOp > 0.5 ? "user@gmail.com" : "E-posta adresiniz"}</span>
            {fillOp > 0.5 && <span style={{ color: "#22c55e", fontSize: 24 }}>✓</span>}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>Şifre</div>
          <div style={{ border: "2px solid #e2e8f0", borderRadius: 12, padding: "15px 18px", fontSize: 22, color: fillOp > 0.5 ? "#1e2433" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{fillOp > 0.5 ? "••••••••••••" : "Şifreniz"}</span>
            {fillOp > 0.5 && <span style={{ color: "#22c55e", fontSize: 24 }}>✓</span>}
          </div>
        </div>

        <div style={{ background: "#4285f4", borderRadius: 14, padding: "16px 0", textAlign: "center", color: "#fff", fontSize: 22, fontWeight: 600 }}>
          Giriş Yap
        </div>

        {/* AkarPass badge */}
        <div style={{ opacity: fillOp, marginTop: 20, display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: "#eef2ff", borderRadius: 14 }}>
          <img src={staticFile("logo.png")} style={{ width: 28, height: 28, objectFit: "contain" }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: INDIGO }}>AkarPass tarafından dolduruldu</span>
        </div>
      </div>

      <Audio src={staticFile("success.mp3")} startFrom={75} endAt={120} volume={0.7} />
    </AbsoluteFill>
  );
}

// ─── Scene 6: CTA (590–750f) ──────────────────────────────────────────────────

function S6_CTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = sp(frame, fps);
  const logoOp = o(frame, 0, 1, 0, 22);
  const textOp = o(frame, 0, 1, 18, 45);
  const textY = o(frame, 60, 0, 18, 45);
  const badgeOp = o(frame, 0, 1, 45, 65);
  const badgeScale = sp(frame, fps, 45);
  const subOp = o(frame, 0, 1, 65, 85);
  const glow = interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, padding: "0 70px" }}>
      <Grid />
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, rgba(45,212,191,0.14) 0%, transparent 70%)`, opacity: glow }} />

      <div style={{ opacity: logoOp, transform: `scale(${logoScale})`, zIndex: 1 }}>
        <img src={staticFile("logo.png")} style={{ width: 200, height: 200, objectFit: "contain", filter: "drop-shadow(0 0 50px rgba(45,212,191,0.6))" }} />
      </div>

      <div style={{ opacity: textOp, transform: `translateY(${textY}px)`, textAlign: "center", zIndex: 1 }}>
        <h2 style={{ fontFamily: FONT, fontSize: 92, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.05, letterSpacing: "-2px" }}>
          Şifreleriniz<br />artık<br />
          <span style={{ background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            güvende.
          </span>
        </h2>
      </div>

      <div style={{ opacity: badgeOp, transform: `scale(${badgeScale})`, display: "flex", flexDirection: "column", gap: 20, zIndex: 1, width: "100%" }}>
        {["akarguard.net"].map((domain) => (
          <div key={domain} style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.1), rgba(99,102,241,0.1))", border: "1px solid rgba(45,212,191,0.35)", borderRadius: 100, padding: "22px 0", textAlign: "center" }}>
            <span style={{ fontFamily: FONT, fontSize: 36, fontWeight: 600, color: TEAL }}>{domain}</span>
          </div>
        ))}
      </div>

      <p style={{ opacity: subOp, fontFamily: FONT, fontSize: 26, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em", zIndex: 1, margin: 0, textAlign: "center" }}>
        Ücretsiz başlayın · Kredi kartı gerekmez
      </p>

      <Audio src={staticFile("impact.mp3")} startFrom={0} endAt={30} volume={0.55} />
      <Audio src={staticFile("chime.mp3")} startFrom={22} endAt={70} volume={0.75} />
    </AbsoluteFill>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function IntroMobile() {
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Audio src={staticFile("bg.mp3")} startFrom={0} volume={0.07} />

      {/* S1: Logo reveal          0  – 120 */}
      <Sequence from={0}   durationInFrames={120}><S1_Logo /></Sequence>

      {/* S2: The Problem          110 – 230 */}
      <Sequence from={110} durationInFrames={120}><S2_Problem /></Sequence>

      {/* S3: Encryption tech      220 – 375 */}
      <Sequence from={220} durationInFrames={155}><S3_Encryption /></Sequence>

      {/* S4: Stats                365 – 490 */}
      <Sequence from={365} durationInFrames={125}><S4_Stats /></Sequence>

      {/* S5: Autofill             480 – 600 */}
      <Sequence from={480} durationInFrames={120}><S5_Autofill /></Sequence>

      {/* S6: CTA                  590 – 860 */}
      <Sequence from={590} durationInFrames={270}><S6_CTA /></Sequence>
    </AbsoluteFill>
  );
}
