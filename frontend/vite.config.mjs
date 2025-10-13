import { defineConfig } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import react from "@vitejs/plugin-react";
import envCompatible from "vite-plugin-env-compatible";

export default defineConfig({
  envPrefix: "REACT_APP_",
  plugins: [
    react(),
    svgrPlugin({
      svgrOptions: {
        icon: true,
      },
    }),
    envCompatible(),
  ],
  // server: {
  //   port: 3000,
  //   open: true,
  //   proxy: {
  //     "/api": {
  //       target: "http://127.0.0.1:8000",
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
  server: {
    port: 3000,
    open: true,
    proxy: {
      "/api/fm-track": {
        target: "https://api.fm-track.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/fm-track/, ""),
      },
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "build",
  },
});
