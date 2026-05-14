import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In Docker, use backend service name; locally use localhost
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8081";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": apiProxyTarget,
      "/oauth2": apiProxyTarget,
      "/auth": "http://localhost:3000",
      "/user": "http://localhost:3000",
      "/logout": "http://localhost:3000",
    },
  },
});
