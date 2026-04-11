import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function TitleBar() {
  const win = getCurrentWindow();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    win.isMaximized().then(setMaximized).catch(() => {});
    let cleanup: (() => void) | undefined;
    win
      .listen("tauri://resize", async () => {
        setMaximized(await win.isMaximized());
      })
      .then((unlisten) => { cleanup = unlisten; })
      .catch(() => {});
    return () => cleanup?.();
  }, [win]);

  function minimize() { win.minimize().catch(() => {}); }
  function toggleMax() { win.toggleMaximize().then(() => win.isMaximized().then(setMaximized)).catch(() => {}); }
  function close() { win.close().catch(() => {}); }

  return (
    <div
      style={{
        height: 38,
        minHeight: 38,
        background: "#0a0d1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        userSelect: "none",
        WebkitUserSelect: "none",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        // @ts-expect-error Tauri drag region
        WebkitAppRegion: "drag",
      }}
    >
      {/* Logo + name — draggable */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 12,
          height: "100%",
          flex: 1,
        }}
      >
        <img
          src="/logo.png"
          alt="AkarGuard"
          style={{
            width: 20,
            height: 20,
            objectFit: "contain",
            flexShrink: 0,
            filter: "drop-shadow(0 0 6px rgba(45,212,191,0.4))",
          }}
        />
        <span
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          AkarPass
        </span>
      </div>

      {/* Window controls — NOT draggable */}
      <div
        style={{
          display: "flex",
          height: "100%",
          // @ts-expect-error Tauri drag region
          WebkitAppRegion: "no-drag",
        }}
      >
        <WinBtn onClick={minimize} title="Küçült">
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </WinBtn>
        <WinBtn onClick={toggleMax} title={maximized ? "Geri Yükle" : "Büyüt"}>
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="0" y="2" width="8" height="8" fill="#0a0d1a" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </WinBtn>
        <WinBtn onClick={close} title="Kapat" danger>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </WinBtn>
      </div>
    </div>
  );
}

function WinBtn({
  onClick,
  children,
  title,
  danger = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  danger?: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 46,
        height: "100%",
        background: hover ? (danger ? "#c42b1c" : "rgba(255,255,255,0.08)") : "transparent",
        border: "none",
        color: hover ? "#fff" : "rgba(255,255,255,0.4)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.1s, color 0.1s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
