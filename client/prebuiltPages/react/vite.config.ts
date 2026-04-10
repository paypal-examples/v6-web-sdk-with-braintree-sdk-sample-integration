import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/client/prebuiltPages/react/dist" : "./",
  build: {
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      "/braintree-api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
    },
  },
}));
