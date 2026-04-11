"use client";

import { useRouter } from "next/navigation";
import { VaultView } from "@akarpass/ui";
import * as vaultService from "@/lib/vault-service";

export default function VaultPage() {
  const router = useRouter();
  return (
    <VaultView
      vaultService={vaultService}
      navigate={(to) => router.push(to)}
    />
  );
}
