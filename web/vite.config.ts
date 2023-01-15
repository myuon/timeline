import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginRewriteAll from "vite-plugin-rewrite-all";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/web",
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
    pluginRewriteAll(),
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
