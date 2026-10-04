import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // Where the Rewards microfrontend's remoteEntry.js is served (apps/rewards-mfe: npm run serve:remote).
  const rewardsRemote = env.VITE_REWARDS_REMOTE_URL || "http://localhost:5180/assets/remoteEntry.js";

  return {
    base: "/",
    plugins: [
      react(),
      // Host shell: loads <RewardsApp/> from the rewards remote at runtime and shares one React with it.
      federation({
        name: "host",
        remotes: { rewardsMfe: rewardsRemote },
        shared: ["react", "react-dom"],
      }),
    ],
    build: {
      outDir: "dist",
      target: "esnext", // federation runtime uses top-level await
      modulePreload: false,
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
