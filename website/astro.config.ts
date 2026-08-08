import { defineConfig, passthroughImageService } from "astro/config";
import node from "@astrojs/node";
import path from "path";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  // No astro:assets/<Image> usage anywhere in this project — all image handling goes through
  // the custom ImagePicker + Supabase Storage — so sharp (unsupported by the node adapter here
  // and not even installed) is dead weight; the passthrough service silences the warning.
  image: { service: passthroughImageService() },
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
