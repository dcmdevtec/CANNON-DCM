import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      // Proxy actual para api.jsoncargo.com
      "/api": {
        target: "http://api.jsoncargo.com",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              "->",
              proxyReq.path
            );
          });
        },
      },
      // Proxy para GeoNames
      "/geonames": {
        target: "http://api.geonames.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/geonames/, ""),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
