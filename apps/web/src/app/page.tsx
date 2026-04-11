"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page: redirect to /vault if authenticated, otherwise /login.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for Supabase session in localStorage (set by Supabase client)
    const hasSession =
      typeof window !== "undefined" &&
      Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));

    router.replace(hasSession ? "/vault" : "/login");
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
        Loading AkarPass...
      </div>
    </div>
  );
}
