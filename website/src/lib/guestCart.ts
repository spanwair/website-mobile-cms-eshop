import type { AstroCookies } from "astro";

const COOKIE_NAME = "guest_cart_id";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

// Guest carts are identified by an unguessable id in an httpOnly cookie, matching
// carts.session_id. There is deliberately no anon RLS policy for it — see cartService.ts.
export function getOrCreateGuestCartId(cookies: AstroCookies): string {
  const existing = cookies.get(COOKIE_NAME)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  cookies.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return id;
}

export function peekGuestCartId(cookies: AstroCookies): string | null {
  return cookies.get(COOKIE_NAME)?.value ?? null;
}

export function clearGuestCartId(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: "/" });
}
