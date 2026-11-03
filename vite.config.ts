/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Cut Paper salmon: the launch background and the status bar colour.
const paper = "#F6CDC1";

export default defineConfig({
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
        globPatterns: ["**/*.{js,css,html,svg,png}"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
