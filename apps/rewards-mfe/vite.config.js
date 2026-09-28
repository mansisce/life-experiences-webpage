import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

// Remote: builds dist/assets/remoteEntry.js, which the host shell loads at runtime.
// @originjs/vite-plugin-federation only emits remoteEntry.js from a *build*, so the
// federated version is served with `npm run serve:remote` (build + preview on :5180).
// `npm run dev` (:5181) runs the MFE standalone for fast UI work.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "rewardsMfe",
      filename: "remoteEntry.js",
      exposes: {
        "./RewardsApp": "./src/RewardsApp.jsx",
      },
      // One React for the whole page: the host provides it, the remote reuses it.
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    target: "esnext", // federation runtime uses top-level await
    modulePreload: false,
    minify: true,
    cssCodeSplit: false,
  },
  server: { port: 5181, strictPort: true },
  preview: { port: 5180, strictPort: true, cors: true },
});
