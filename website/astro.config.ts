import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import path from "path";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  // Multi-tenant storefronts are resolved by Host header (custom domains / subdomains).
  // Vite's dev server otherwise 403s unrecognized hostnames (DNS-rebinding protection);
  // production runs on the Node adapter's own server, not Vite, so this only affects `astro dev`.
  server: { allowedHosts: true },
  vite: {
    envDir: "..",
    resolve: {
      alias: {
        "@shared": path.resolve("../shared"),
      },
    },
  },
});
