import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        personalOS: "http://localhost:5174/remoteEntry.js",
        professional: "http://localhost:5175/remoteEntry.js",
        rewardSystem: "http://localhost:3000/remoteEntry.js",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    outDir: "dist",
    modulePreload: false,
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
  },
});
