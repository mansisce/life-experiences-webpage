import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "professional",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App.jsx",
        "./ProfessionalHome": "./src/pages/ProfessionalHome.jsx",
        "./ProfessionalResume": "./src/pages/ProfessionalResume.jsx",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    modulePreload: false,
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5175,
  },
});
