/**
 * Extension bundler using esbuild.
 *
 * Bundles all three entry points into single self-contained files
 * that Chrome can load without module resolution.
 *
 * - background/index.ts  → dist/background/index.js  (service worker, no import())
 * - content/index.ts     → dist/content/index.js     (content script, IIFE)
 * - popup/popup.ts       → dist/popup/popup.js        (popup, IIFE)
 *
 * Also copies static assets: manifest.json, popup/index.html, icons/.
 */

import { build } from "esbuild";
import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");

mkdirSync(join(dist, "background"), { recursive: true });
mkdirSync(join(dist, "content"), { recursive: true });
mkdirSync(join(dist, "popup"), { recursive: true });
mkdirSync(join(dist, "icons"), { recursive: true });

const sharedConfig = {
  bundle: true,
  minify: false,
  sourcemap: false,
  target: ["chrome105"],
  // WASM files need to be treated as external or loaded via fetch
  // @noble/post-quantum uses WASM — service worker can't import() WASM directly,
  // so we mark it external and the fallback (AES-only) mode will be used.
  external: [],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "info",
};

async function bundle() {
  console.log("Bundling extension...\n");

  // Background service worker — ESM format (MV3 supports it)
  await build({
    ...sharedConfig,
    entryPoints: [join(root, "src/background/index.ts")],
    outfile: join(dist, "background/index.js"),
    format: "esm",
    platform: "browser",
  });

  // Content script — IIFE (no module system in content scripts)
  await build({
    ...sharedConfig,
    entryPoints: [join(root, "src/content/index.ts")],
    outfile: join(dist, "content/index.js"),
    format: "iife",
    platform: "browser",
  });

  // Popup — IIFE
  await build({
    ...sharedConfig,
    entryPoints: [join(root, "src/popup/popup.ts")],
    outfile: join(dist, "popup/popup.js"),
    format: "iife",
    platform: "browser",
  });

  // Static assets
  copyFileSync(join(root, "manifest.json"), join(dist, "manifest.json"));
  copyFileSync(join(root, "src/popup/index.html"), join(dist, "popup/index.html"));

  // Copy icons if they exist in src
  const srcIcons = join(root, "src/icons");
  if (existsSync(srcIcons)) {
    for (const f of readdirSync(srcIcons)) {
      copyFileSync(join(srcIcons, f), join(dist, "icons", f));
    }
  }

  console.log("\nExtension bundle ready → apps/extension/dist");
}

bundle().catch((e) => { console.error(e); process.exit(1); });
