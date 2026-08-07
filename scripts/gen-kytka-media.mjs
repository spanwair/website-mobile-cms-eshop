#!/usr/bin/env node
// Generates original, locally-drawn SVG placeholder images for the "Kytka z Beskyd" demo
// store (supabase/seed/kytka_store_catalog.sql). Pure geometric silhouettes + text, no
// network calls and no third-party photos — same approach as gen-demo-media.mjs, avoids
// any image-licensing question entirely. Real product photography can be uploaded later
// through the admin media library once the org owner confirms usage rights.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../website/public/kytka-media");
mkdirSync(OUT_DIR, { recursive: true });

const SHAPES = {
  // Ring wreath made of small leaf/petal marks around a circle.
  wreath: (c, accent) => {
    let leaves = "";
    const n = 16;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const cx = 200 + Math.cos(angle) * 110;
      const cy = 210 + Math.sin(angle) * 110;
      const rot = (angle * 180) / Math.PI + 90;
      leaves += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="22" ry="10" fill="${i % 3 === 0 ? accent : c}" opacity="0.85" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
    }
    return `<circle cx="200" cy="210" r="70" fill="none" stroke="${c}" stroke-width="2" opacity="0.25"/>${leaves}`;
  },
  // Upright bouquet: stems fanning from a base wrap, small flower heads on top.
  bouquet: (c, accent) => {
    let stems = "";
    let heads = "";
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const topX = 120 + t * 160;
      const topY = 90 + Math.abs(t - 0.5) * 60;
      stems += `<line x1="200" y1="300" x2="${topX.toFixed(1)}" y2="${topY.toFixed(1)}" stroke="${c}" stroke-width="4" opacity="0.7"/>`;
      heads += `<circle cx="${topX.toFixed(1)}" cy="${topY.toFixed(1)}" r="16" fill="${i % 2 === 0 ? accent : c}" opacity="0.9"/>`;
    }
    return `<path d="M170 300 L230 300 L215 330 L185 330 Z" fill="${c}" opacity="0.4"/>${stems}${heads}`;
  },
  // Single dried-flower spray in a small vase.
  spray: (c, accent) => `
    <path d="M160 260 L240 260 L232 320 L168 320 Z" fill="none" stroke="${c}" stroke-width="5"/>
    <line x1="200" y1="260" x2="200" y2="120" stroke="${c}" stroke-width="4"/>
    <line x1="200" y1="200" x2="150" y2="150" stroke="${c}" stroke-width="3"/>
    <line x1="200" y1="180" x2="250" y2="130" stroke="${c}" stroke-width="3"/>
    <circle cx="200" cy="110" r="14" fill="${accent}" opacity="0.9"/>
    <circle cx="146" cy="144" r="10" fill="${accent}" opacity="0.75"/>
    <circle cx="254" cy="124" r="10" fill="${accent}" opacity="0.75"/>`,
  // Funeral wreath — larger ring, ribbon detail, muted tones handled via palette.
  funeral: (c, accent) => {
    let leaves = "";
    const n = 20;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const cx = 200 + Math.cos(angle) * 120;
      const cy = 190 + Math.sin(angle) * 120;
      const rot = (angle * 180) / Math.PI + 90;
      leaves += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="24" ry="11" fill="${i % 4 === 0 ? accent : c}" opacity="0.85" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
    }
    return `${leaves}<path d="M180 300 L220 300 L235 340 L165 340 Z" fill="${accent}" opacity="0.5"/>`;
  },
};

function renderSvg({ shape, title, bg, c, accent }) {
  const draw = (SHAPES[shape] ?? SHAPES.spray)(c, accent);
  const esc = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg}"/>
  <g>${draw}</g>
  <text x="200" y="372" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="700" fill="${c}">${esc}</text>
</svg>`;
}

const CREAM_PURPLE = { bg: "#FBF7F2", c: "#6E4A8E", accent: "#C97B4A" };
const CREAM_ORANGE = { bg: "#FDF6EE", c: "#B4652E", accent: "#8B5FBF" };
const SAGE = { bg: "#F5F3EC", c: "#5B6B4C", accent: "#B4652E" };

const IMAGES = [
  ["podzimni-venec-bukove-listi", "wreath", "Podzimní věnec", CREAM_ORANGE],
  ["venec-eukalyptus-susene-kvety", "wreath", "Věnec eukalyptus", CREAM_PURPLE],
  ["celorocni-venec-levandule", "wreath", "Věnec levandule", CREAM_PURPLE],
  ["venec-slamenka-slunecnice", "wreath", "Věnec slaměnky", CREAM_ORANGE],
  ["svatebni-kytice-susene-ruze", "bouquet", "Svatební kytice", CREAM_PURPLE],
  ["svatebni-kytice-boho", "bouquet", "Kytice boho", CREAM_ORANGE],
  ["korsaz-a-butonnierka-set", "spray", "Korzáž a knoflíková kytička", SAGE],
  ["smutecni-venec-bile-chryzantemy", "funeral", "Smuteční věnec bílý", SAGE],
  ["smutecni-kytice-fialova", "funeral", "Smuteční kytice", SAGE],
  ["susena-kytice-do-vazy", "spray", "Sušená kytice do vázy", CREAM_PURPLE],
  ["mini-susena-dekorace-stul", "spray", "Stolní dekorace", CREAM_ORANGE],
  ["darkovy-set-mini-venecek", "wreath", "Dárkový mini věneček", SAGE],
];

for (const [slug, shape, title, palette] of IMAGES) {
  writeFileSync(join(OUT_DIR, `${slug}.svg`), renderSvg({ shape, title, ...palette }), "utf8");
}

console.log(`Generated ${IMAGES.length} placeholder SVGs in ${OUT_DIR}`);
