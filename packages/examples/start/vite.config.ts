import { defineConfig } from "vite-plus";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [tanstackStart(), nitro({ preset: "node-server" }), react()],
  server: { port: 3001 },
});
