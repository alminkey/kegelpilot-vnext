<<<<<<< HEAD
// vite.config.ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";

export default defineConfig({
  plugins: [svelte()],

  // Alias za uvoz: "@/..." -> "src/..."
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Dev server – dostupan na lokalnoj mreži
  server: {
    host: true, // 0.0.0.0 (omogući pristup sa drugih uređaja na istoj mreži)
    port: 5173,
    strictPort: true,
    // Ako HMR ne radi na mobitelu, otkomentiraj i upiši IP svog računara:
    // hmr: { host: '192.168.1.23', protocol: 'ws', clientPort: 5173 },
  },

  // Preview (poslije `npm run build`)
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
=======
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
>>>>>>> origin/main
});
