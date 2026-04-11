import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase.js";
import * as vaultService from "./lib/vault-service.js";
import { AppShell } from "./components/AppShell.js";
import { LoginScreen } from "./components/LoginScreen.js";
import { UnlockScreen } from "./components/UnlockScreen.js";
import { VaultScreen } from "./components/VaultScreen.js";
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unlock" element={<UnlockPage />} />
        <Route path="/vault" element={<VaultPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
