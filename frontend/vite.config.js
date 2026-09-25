import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import os from "os";

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __LOCAL_IP__: JSON.stringify(getLocalIP()),
  },
  build: {
    // Warn if any chunk exceeds 700 KB after code splitting
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Give chunks readable names for easier network-tab debugging
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    host: true,
    proxy: {
      "/socket.io": {
        target: "http://127.0.0.1:3003",
        ws: true,
      },
    },
  },
});

