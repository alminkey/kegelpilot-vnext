import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true, // omogućava pristup s telefona (LAN)
    port: 5173,
    strictPort: false,
    hmr: { protocol: "ws" },
  },
});
