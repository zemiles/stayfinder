import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api/v1/corp": "http://localhost:8082",
      "/api/v1/room": "http://localhost:8082",
      "/api/v1/reservation": "http://localhost:8082",
      "/api/v1/search": "http://localhost:8082",
      "/api/v1/batch": "http://localhost:8083",
      "/api": "http://localhost:8081"
    }
  }
});
