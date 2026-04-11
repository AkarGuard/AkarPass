import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: [
    "@akarpass/core",
    "@akarpass/crypto",
    "@akarpass/storage",
    "@akarpass/sync",
    "@akarpass/auth",
    "@akarpass/ui",
  ],

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js inline scripts (nonce-based in production would be better)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // Supabase + Web Crypto API connections
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // Required for WASM (ML-KEM noble library)
              "worker-src 'self' blob:",
            ].join("; "),
          },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS (force HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Permissions policy — deny sensitive APIs we don't use
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // XSS protection (legacy but defence-in-depth)
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },

  // WASM support
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
