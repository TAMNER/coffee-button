/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const cream = "#f6ead7";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        name: "Coffee Button",
        short_name: "Coffee",
        description: "Tap the cup when you skip a coffee.",
        display: "standalone",
        start_url: "./",
        scope: "./",
        theme_color: cream,
        background_color: cream,
        icons: [
          { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" },
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
