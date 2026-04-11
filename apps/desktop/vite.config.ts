import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Tauri development server
  server: {
    port: 1420,
    strictPort: true,
    // Security: only accept connections from localhost
    host: "127.0.0.1",
  },
  build: {
    target: "chrome105",
    minify: "esbuild",
    sourcemap: false,
  },
  // Allow WASM for @noble/post-quantum
  optimizeDeps: {
    exclude: ["@noble/post-quantum"],
  },
});
