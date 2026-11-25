import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  preview: {
    host: "127.0.0.1", // IPv4 explicitly, to match Traefik's target
    port: 4173,
    strictPort: true, // fail instead of silently switching to another port
    allowedHosts: ["app.liu-shu.com"], // accept the Host header coming through Traefik
  },
});
