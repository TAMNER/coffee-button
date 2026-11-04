/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { normaliseBase } from "./src/build/base-path";

// The config runs in Node; the project has no @types/node, so declare the one global used.
declare const process: { env: Record<string, string | undefined> };

// Cut Paper salmon: the launch background and the status bar colour.
const paper = "#F6CDC1";

export default defineConfig({
  // Ticket 22: GitHub Pages builds with BASE_PATH=/coffee-button/; black-box stays at /.
  base: normaliseBase(process.env.BASE_PATH),
  // The info sheet shows this so a stale Home Screen app is easy to spot. deploy.sh sets it to the git hash.
  define: { __BUILD_ID__: JSON.stringify(process.env.BUILD_ID ?? "dev") },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeManifestIcons: false,
      injectRegister: false,
      manifest: {
        name: "Coffee Button",
        short_name: "Coffee",
        description: "Tap the cup when you skip a coffee.",
        display: "standalone",
        start_url: "./",
        scope: "./",
        theme_color: paper,
        background_color: paper,
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,m4a,mp3}"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
