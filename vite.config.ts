import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// Match GitHub Pages' directory indexes during local preview.
const infoRoutes: Plugin = {
  name: 'static-info-routes',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = new URL(req.url || '/', 'http://localhost');
      if (['/about/', '/music/', '/comic/', '/portfolio/', '/privacy/', '/recover/'].includes(url.pathname)) {
        req.url = url.pathname + 'index.html' + url.search;
      }
      next();
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: process.env.GITHUB_ACTIONS ? [infoRoutes, react()] : [infoRoutes, inspectAttr(), react()],
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
