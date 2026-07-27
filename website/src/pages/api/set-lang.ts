import type { APIRoute } from "astro";

// Cookie-only, no session required — the storefront nav language switcher must work for
// anonymous visitors. Signed-in users who want their choice remembered on their profile
// still use /settings (which also updates profiles.lang), this is just the "lang" cookie
// that getLang() reads on every request.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const lang = form.get("lang") === "en" ? "en" : "cs";
  const requested = form.get("redirect") as string;
  // Anonymous-accessible endpoint — only allow same-site relative paths, never an absolute
  // or protocol-relative URL, or this becomes an open redirect.
  const redirectTo = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  cookies.set("lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return redirect(redirectTo);
};
