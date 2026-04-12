"use client";

import { useRouter } from "next/navigation";
import { LoginView } from "@akarpass/ui";
import { supabase } from "@/lib/supabase";
import * as vaultService from "@/lib/vault-service";

const authService = {
  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ? { error: error.message } : {};
  },
  async signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ? { error: error.message } : {};
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};

export default function LoginPage() {
  const router = useRouter();
  return (
    <LoginView
      authService={authService}
      vaultService={vaultService}
      navigate={(to) => router.push(to)}
    />
  );
}
