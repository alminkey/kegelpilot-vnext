import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // @ → src
    },
  },
  server: {
    host: true, // omogući pristup sa mobitela na LAN-u
  },
});
