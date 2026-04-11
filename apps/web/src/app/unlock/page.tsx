"use client";

import { useRouter } from "next/navigation";
import { UnlockView } from "@akarpass/ui";
import { supabase } from "@/lib/supabase";
import * as vaultService from "@/lib/vault-service";

const authService = {
  async signOut() {
    await supabase.auth.signOut();
  },
};

export default function UnlockPage() {
  const router = useRouter();
  return (
    <UnlockView
      authService={authService}
      vaultService={vaultService}
      navigate={(to) => router.push(to)}
    />
  );
}
