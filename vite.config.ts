import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import unocss from "unocss/vite";
// import vueDevTools from "vite-plugin-vue-devtools";
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  css: { preprocessorOptions: { scss: { api: "modern-compiler" } } },
  plugins: [vue(), unocss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // 1. 防止灰尘掩盖生锈的错误
  clearScreen: false,
  // 2. Tauri期望一个固定的端口，如果该端口不可用则失败
  server: {
    port: 1430,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
