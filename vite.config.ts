// vite.config.ts
import { defineConfig } from "vitest/config";
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
  // ← Vitest konfiguracija
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "src/test/setup.ts",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    reporters: "default",
  },
});
