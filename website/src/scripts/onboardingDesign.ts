import type { ColorGroup } from "@/lib/colorGroups";

const COLOR_FIELDS = [
  "color_primary", "color_secondary", "color_background", "color_surface",
  "color_text_primary", "color_text_secondary", "color_border",
] as const;

// Each editor colour maps to the storefront CSS custom properties it drives (see buildThemeCss).
const COLOR_TO_VARS: Record<string, string[]> = {
  color_primary: ["--accent-primary", "--primary"],
  color_secondary: ["--accent-secondary", "--secondary"],
  color_background: ["--bg-page"],
  color_surface: ["--bg-surface", "--bg-subtle"],
  color_text_primary: ["--text-primary"],
  color_text_secondary: ["--text-secondary", "--text-muted"],
  color_border: ["--border", "--border-default", "--border-color"],
};

const val = (id: string) => (document.getElementById(id) as HTMLInputElement).value;

export function initOnboardingDesign() {
  const root = document.getElementById("design-root");
  const frame = document.getElementById("pb-frame") as HTMLIFrameElement | null;
  if (!root || !frame) return;

  const groups: ColorGroup[] = JSON.parse(root.dataset.groups || "[]");
  const nextUrl = root.dataset.next!;
  const saveState = document.getElementById("save-state");
  let latestOrder: string[] | null = null;
  let saveTimer: number | undefined;

  function themeVars(): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const f of COLOR_FIELDS) for (const v of COLOR_TO_VARS[f]) vars[v] = val(`in_${f}`);
    vars["--font-heading"] = `"${val("in_font_heading")}", system-ui, sans-serif`;
    vars["--font-body"] = `"${val("in_font_body")}", system-ui, sans-serif`;
    return vars;
  }
  function pushTheme() {
    frame!.contentWindow?.postMessage({ type: "vars", vars: themeVars() }, "*");
  }

  function payload(extra: Record<string, unknown> = {}) {
    const p: Record<string, unknown> = { ...extra };
    for (const f of COLOR_FIELDS) p[f] = val(`in_${f}`);
    p.font_heading = val("in_font_heading");
    p.font_body = val("in_font_body");
    if (latestOrder) p.homepage_layout = latestOrder;
    return p;
  }
  async function save(extra: Record<string, unknown> = {}) {
    if (saveState) { saveState.textContent = saveState.dataset.saving!; }
    try {
      await fetch("/api/admin/store-config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(extra)),
      });
      if (saveState) saveState.textContent = saveState.dataset.saved!;
    } catch { /* keep last state */ }
  }
  function scheduleSave() {
    if (saveState) saveState.textContent = saveState.dataset.saving!;
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => save(), 600);
  }

  function applyColor(field: string, value: string) {
    (document.getElementById(`in_${field}`) as HTMLInputElement).value = value;
    const sw = document.querySelector<HTMLInputElement>(`.cc-swatch[data-target="${field}"]`);
    if (sw) sw.value = value;
  }

  // Palette presets
  document.querySelectorAll<HTMLButtonElement>(".group").forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = groups.find((x) => x.key === btn.dataset.key);
      if (!g) return;
      COLOR_FIELDS.forEach((f) => applyColor(f, (g as any)[f]));
      document.querySelectorAll(".group").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      pushTheme(); scheduleSave();
    });
  });

  // Custom colour pickers
  document.querySelectorAll<HTMLInputElement>(".cc-swatch").forEach((sw) => {
    sw.addEventListener("input", () => {
      applyColor(sw.dataset.target!, sw.value);
      document.querySelectorAll(".group").forEach((b) => b.classList.remove("active"));
      pushTheme(); scheduleSave();
    });
  });

  // Fonts
  function bindFont(selId: string, inputId: string) {
    const sel = document.getElementById(selId) as HTMLSelectElement | null;
    sel?.addEventListener("change", () => {
      (document.getElementById(inputId) as HTMLInputElement).value = sel.value;
      loadFont(sel.value); pushTheme(); scheduleSave();
    });
  }
  bindFont("sel_font_heading", "in_font_heading");
  bindFont("sel_font_body", "in_font_body");

  // Layout changes reported by the iframe
  window.addEventListener("message", (e) => {
    const m = e.data;
    if (!m || m.source !== "pb" || m.type !== "layout") return;
    latestOrder = m.order;
    scheduleSave();
  });

  // Publish → seed placeholder content, then advance to the catalogue step
  document.getElementById("publish-btn")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    await save({ publish: true });
    window.location.href = nextUrl;
  });

  // Load the two chosen fonts into the editor chrome (parent) as well
  [val("in_font_heading"), val("in_font_body")].forEach(loadFont);

  // Mark the active preset if current colours match one exactly
  const match = groups.find((g) => COLOR_FIELDS.every((f) => (g as any)[f].toLowerCase() === val(`in_${f}`).toLowerCase()));
  if (match) document.querySelector(`.group[data-key="${match.key}"]`)?.classList.add("active");

  // Size the iframe to its content so it never scrolls internally — leaving a single
  // page-level scrollbar. Preview is same-origin, so measure it directly and observe changes.
  function fitFrame() {
    const doc = frame!.contentDocument;
    if (!doc?.body) return;
    // Measure the body (true content height). documentElement.scrollHeight is clamped to the
    // iframe viewport, so using it ratchets the height ever larger and never shrinks.
    const h = Math.ceil(doc.body.scrollHeight);
    if (Math.abs(frame!.clientHeight - h) > 1) frame!.style.height = `${h}px`;
  }

  // Push the initial theme + start auto-sizing once the iframe is ready
  frame.addEventListener("load", () => {
    pushTheme();
    fitFrame();
    const doc = frame!.contentDocument;
    if (doc) new ResizeObserver(fitFrame).observe(doc.documentElement);
  });
}

const loadedFonts = new Set<string>();
function loadFont(family: string) {
  if (!family || family === "Inter" || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}
