import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { ContentFormat, StoreMedia } from "@shared/types";

const MEDIA_TOKEN_RE = /\{\{media:([a-z0-9-]+)\}\}/g;
const SINGLE_MEDIA_TOKEN_RE = /^\{\{media:([a-z0-9-]+)\}\}$/;

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// The one place an admin picks media "by slug" for a content field: paste this token, and it
// expands to the right tag before markdown/HTML parsing runs. Unknown slugs vanish silently —
// a broken reference shouldn't crash the storefront render.
function expandMediaTokens(raw: string, media: StoreMedia[]): string {
  const bySlug = new Map(media.map((m) => [m.slug, m]));
  return raw.replace(MEDIA_TOKEN_RE, (match, slug) => {
    const m = bySlug.get(slug);
    if (!m) return "";
    const alt = escapeAttr(m.alt ?? "");
    const src = escapeAttr(m.url);
    return m.media_type === "video"
      ? `<video src="${src}" controls aria-label="${alt}"></video>`
      : `<img src="${src}" alt="${alt}">`;
  });
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
    "strong", "em", "b", "i", "u", "a", "ul", "ol", "li", "blockquote",
    "img", "video", "source", "div", "span", "figure", "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "width", "height", "loading"],
    video: ["src", "controls", "autoplay", "muted", "loop", "poster", "width", "height"],
    source: ["src", "type"],
    div: ["class"], span: ["class"], figure: ["class"],
  },
  // Admins authoring raw HTML content can opt a link into one of the site's existing button
  // skins (see .btn family in global.css) instead of the section's default link styling.
  // Any other class is dropped — this isn't a general style-injection surface.
  allowedClasses: {
    a: ["btn", "btn-primary", "btn-secondary", "btn-ghost"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
  },
};

// Single render path for hero/subhero/footer custom content — markdown goes through `marked`
// first, raw HTML skips straight to sanitization. Either way, sanitizeHtml is the last step
// before this ever reaches a `set:html` in a component, so nothing (script/iframe/on*/style)
// outside the allowlist above can survive into the rendered page.
export function renderContent(content: string | null, format: ContentFormat, media: StoreMedia[]): string {
  if (!content) return "";
  const expanded = expandMediaTokens(content, media);
  const html = format === "markdown" ? (marked.parse(expanded, { async: false }) as string) : expanded;
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

// For single-URL fields (hero slide image, team photo, blog featured image — anything fed
// straight into `src=`/`background-image` rather than through renderContent's markdown/HTML
// pipeline). The Media Library's only copy affordance is the {{media:slug}} token (see
// MediaLibrary.astro — there is no raw-URL copy button), so any admin pasting that token into
// one of these plain URL fields needs it resolved here, not just passed through. A value that
// isn't the token form (a real https:// URL, or empty) is returned unchanged.
export function resolveMediaUrl(value: string | null, media: StoreMedia[]): string | null {
  if (!value) return value;
  const match = value.match(SINGLE_MEDIA_TOKEN_RE);
  if (!match) return value;
  const found = media.find((m) => m.slug === match[1]);
  return found?.url ?? null;
}
