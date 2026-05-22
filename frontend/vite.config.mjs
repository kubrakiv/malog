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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          const modulePath = id.split("node_modules/")[1] || "";
          const parts = modulePath.split("/");
          const packageName = parts[0]?.startsWith("@")
            ? `${parts[0]}/${parts[1]}`
            : parts[0];

          if (
            [
              "react",
              "react-dom",
              "react-router",
              "react-router-dom",
              "scheduler",
              "react-hot-toast",
              "use-sync-external-store",
            ].includes(packageName)
          ) {
            return "framework";
          }

          if (
            [
              "@reduxjs/toolkit",
              "redux",
              "react-redux",
              "redux-thunk",
              "reselect",
            ].includes(packageName)
          ) {
            return "vendor-redux";
          }

          if (["primereact", "primeicons", "primeflex"].includes(packageName)) {
            return "vendor-prime";
          }

          if (
            ["@react-google-maps/api", "use-places-autocomplete"].includes(
              packageName,
            )
          ) {
            return "vendor-maps";
          }

          if (
            ["jspdf", "html2canvas", "xlsx", "xlsx-style"].includes(packageName)
          ) {
            return `vendor-export-${packageName.replace("@", "").replace("/", "-")}`;
          }

          if (
            [
              "react-icons",
              "react-select",
              "react-datepicker",
              "react-beautiful-dnd",
            ].includes(packageName)
          ) {
            return `vendor-ui-${packageName.replace("@", "").replace("/", "-")}`;
          }

          if (
            [
              "axios",
              "date-fns",
              "transliteration",
              "dompurify",
              "uuid",
            ].includes(packageName)
          ) {
            return `vendor-utils-${packageName.replace("@", "").replace("/", "-")}`;
          }

          // No catch-all — let Rollup handle remaining packages
          // automatically to preserve correct module init order
        },
      },
    },
  },
});
