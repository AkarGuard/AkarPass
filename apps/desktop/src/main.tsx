import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { supabase } from "./lib/supabase.js";
import * as vaultService from "./lib/vault-service.js";
import { AppShell } from "./components/AppShell.js";
import { LoginScreen } from "./components/LoginScreen.js";
import { UnlockScreen } from "./components/UnlockScreen.js";
import { VaultScreen } from "./components/VaultScreen.js";
import { PickerApp } from "./components/PickerApp.js";
import { LanguageProvider } from "./lib/i18n/index.js";
import "./globals.css";

const authService = {
  async signIn(email: string, password: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },
  async signUp(email: string, password: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};

function LoginPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <LoginScreen
        authService={authService}
        vaultService={vaultService}
        navigate={(to) => navigate(to)}
      />
    </AppShell>
  );
}

function UnlockPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <UnlockScreen
        authService={authService}
        vaultService={vaultService}
        navigate={(to) => navigate(to)}
      />
    </AppShell>
  );
}

function VaultPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <VaultScreen vaultService={vaultService} navigate={(to) => navigate(to)} />
    </AppShell>
  );
}

function RootRedirect() {
  const hasSession = Object.keys(localStorage).some(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
  );
  return <Navigate to={hasSession ? "/vault" : "/login"} replace />;
}

// This bundle is loaded by BOTH the main and picker windows. Branch on window
// label so the picker doesn't drag in the full vault app, and no picker UI
// ever mounts inside the main window.
const windowLabel: string = (() => {
  try { return getCurrentWindow().label; } catch { return "main"; }
})();

const root = ReactDOM.createRoot(document.getElementById("root")!);

if (windowLabel === "picker") {
  root.render(
    <React.StrictMode>
      <LanguageProvider>
        <PickerApp />
      </LanguageProvider>
    </React.StrictMode>,
  );
} else {
  root.render(
    <React.StrictMode>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unlock" element={<UnlockPage />} />
            <Route path="/vault" element={<VaultPage />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </React.StrictMode>,
  );
}
