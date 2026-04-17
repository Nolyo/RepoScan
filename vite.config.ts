import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Tauri expects a fixed port in dev, prevent vite from auto-assigning one
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // On WSL, poll is more reliable
      usePolling: true,
    },
  },
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  // Tauri expects built assets at dist/
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
}));
