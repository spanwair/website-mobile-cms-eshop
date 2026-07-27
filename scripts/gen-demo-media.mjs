#!/usr/bin/env node
// Generates original, locally-drawn SVG placeholder images for the "Repasado" demo store
// (supabase/seed/demo_store_catalog.sql). Pure geometric silhouettes + text, no network
// calls and no third-party photos — avoids any image-licensing question entirely.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../website/public/demo-media");
mkdirSync(OUT_DIR, { recursive: true });

const SHAPES = {
  phone: (c) => `<rect x="130" y="40" width="140" height="280" rx="24" fill="none" stroke="${c}" stroke-width="6"/>
    <rect x="150" y="70" width="100" height="200" rx="4" fill="${c}" opacity="0.12"/>
    <circle cx="200" cy="300" r="8" fill="${c}"/>`,
  tablet: (c) => `<rect x="90" y="50" width="220" height="260" rx="18" fill="none" stroke="${c}" stroke-width="6"/>
    <rect x="110" y="70" width="180" height="200" rx="4" fill="${c}" opacity="0.12"/>`,
  laptop: (c) => `<rect x="70" y="90" width="260" height="160" rx="8" fill="none" stroke="${c}" stroke-width="6"/>
    <rect x="88" y="105" width="224" height="130" fill="${c}" opacity="0.12"/>
    <path d="M50 250 L350 250 L330 275 L70 275 Z" fill="none" stroke="${c}" stroke-width="6"/>`,
  watch: (c) => `<rect x="150" y="70" width="100" height="140" rx="22" fill="none" stroke="${c}" stroke-width="6"/>
    <rect x="165" y="30" width="70" height="40" rx="10" fill="${c}" opacity="0.2"/>
    <rect x="165" y="210" width="70" height="40" rx="10" fill="${c}" opacity="0.2"/>`,
  earbuds: (c) => `<circle cx="160" cy="150" r="34" fill="none" stroke="${c}" stroke-width="6"/>
    <circle cx="240" cy="150" r="34" fill="none" stroke="${c}" stroke-width="6"/>
    <path d="M160 184 L150 230" stroke="${c}" stroke-width="6" fill="none"/>
    <path d="M240 184 L250 230" stroke="${c}" stroke-width="6" fill="none"/>`,
  accessory: (c) => `<rect x="120" y="80" width="160" height="200" rx="30" fill="none" stroke="${c}" stroke-width="6"/>
    <circle cx="200" cy="180" r="40" fill="${c}" opacity="0.15"/>`,
  storefront: (c) => `<rect x="60" y="140" width="280" height="150" fill="none" stroke="${c}" stroke-width="6"/>
    <path d="M50 140 L200 60 L350 140 Z" fill="none" stroke="${c}" stroke-width="6"/>
    <rect x="100" y="170" width="70" height="120" fill="${c}" opacity="0.12"/>
    <rect x="230" y="170" width="70" height="120" fill="${c}" opacity="0.12"/>
    <rect x="185" y="230" width="30" height="60" fill="${c}" opacity="0.25"/>`,
};

function renderSvg({ shape, title, bg, accent }) {
  const draw = (SHAPES[shape] ?? SHAPES.accessory)(accent);
  const esc = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg}"/>
  <g>${draw}</g>
  <text x="200" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${accent}">${esc}</text>
</svg>`;
}

const GREEN = { bg: "#F1F6EE", accent: "#5B9A3B" };
const GRAY = { bg: "#F3F4F6", accent: "#4B5563" };

const IMAGES = [
  ["iphone-13", "phone", "iPhone 13", GREEN],
  ["iphone-14", "phone", "iPhone 14", GREEN],
  ["iphone-15", "phone", "iPhone 15", GREEN],
  ["iphone-15-pro", "phone", "iPhone 15 Pro", GREEN],
  ["ipad-10-gen", "tablet", "iPad 10.gen", GREEN],
  ["ipad-air-m1", "tablet", "iPad Air M1", GREEN],
  ["ipad-pro-11-m2", "tablet", "iPad Pro 11″", GREEN],
  ["macbook-air-m1", "laptop", "MacBook Air M1", GRAY],
  ["macbook-air-m2", "laptop", "MacBook Air M2", GRAY],
  ["macbook-pro-14-m2pro", "laptop", "MacBook Pro 14″", GRAY],
  ["apple-watch-se", "watch", "Watch SE", GREEN],
  ["apple-watch-series-8", "watch", "Watch S8", GREEN],
  ["airpods-pro-2", "earbuds", "AirPods Pro 2", GRAY],
  ["airpods-3", "earbuds", "AirPods 3", GRAY],
  ["kryt-iphone-15-silikon", "accessory", "Kryt iPhone 15", GREEN],
  ["kryt-ipad-pro-11", "accessory", "Kryt iPad Pro", GREEN],
  ["sklo-iphone-15", "accessory", "Sklo iPhone 15", GRAY],
  ["nabijecka-magsafe", "accessory", "MagSafe nabíječka", GRAY],
  ["iphone", "phone", "iPhone", GREEN],
  ["ipad", "tablet", "iPad", GREEN],
  ["mac", "laptop", "Mac", GRAY],
  ["watch", "watch", "Watch", GREEN],
  ["audio", "earbuds", "Audio", GRAY],
  ["prislusenstvi", "accessory", "Příslušenství", GREEN],
  ["prodejna-repasado", "storefront", "Prodejna Repasado", GREEN],
];

for (const [slug, shape, title, palette] of IMAGES) {
  writeFileSync(join(OUT_DIR, `${slug}.svg`), renderSvg({ shape, title, ...palette }), "utf8");
}

console.log(`Generated ${IMAGES.length} placeholder SVGs in ${OUT_DIR}`);
