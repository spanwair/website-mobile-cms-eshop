import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import path from "path";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    // No astro:assets/<Image> usage anywhere in this project — all image handling goes through
    // the custom ImagePicker + Supabase Storage — so sharp (unsupported on Workers anyway)
    // is dead weight; the passthrough service silences the warning.
    imageService: "passthrough",
    platformProxy: { enabled: true },
  }),
  // Multi-tenant storefronts are resolved by Host header (custom domains / subdomains).
  // Vite's dev server otherwise 403s unrecognized hostnames (DNS-rebinding protection);
  // production runs on Cloudflare's own edge runtime, not Vite, so this only affects `astro dev`.
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
