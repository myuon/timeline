import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginRewriteAll from "vite-plugin-rewrite-all";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/web",
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
    pluginRewriteAll(),
    VitePWA({
      includeAssets: [
        "favicon.svg",
        "android-chrome-96x96.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "timeline",
        short_name: "timeline",
        description: "timeline",
        theme_color: "#f43f5e",
        background_color: "#242424",
        icons: [
          {
            src: "/android-chrome-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "114x114",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // cf: https://github.com/NekR/offline-plugin/issues/412
        navigateFallbackDenylist: [/\/__\/auth/],
      },
    }),
  ],
  build: {
    outDir: "../dist/web",
  },
  // adhoc configuration for integrated dev server
  server: {
    port: 5173,
    hmr: {
      port: 5173,
    },
  },
});
