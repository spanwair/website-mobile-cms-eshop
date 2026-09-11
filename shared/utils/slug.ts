export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return (input ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A slug is user-owned when filled and auto-derived from `source` when left empty.
export function resolveSlug(slug: string | null | undefined, source: string): string {
  const trimmed = (slug ?? "").trim();
  return trimmed || slugify(source);
}
