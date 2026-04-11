import React from "react";
import { TitleBar } from "./TitleBar.js";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      <TitleBar />
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
        }}
      >
        {children}
      </div>
    </div>
  );
}
