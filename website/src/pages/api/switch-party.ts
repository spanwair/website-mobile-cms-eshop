import type { APIRoute } from "astro";
import { createSupabase } from "../../lib/supabase";
import { requireAdminCtx } from "../../lib/admin";

export const POST: APIRoute = async (context) => {
  const { request, cookies, redirect } = context;
  const supabase = createSupabase({ request, cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const form = await request.formData();
  const partyId = form.get("partyId") as string;
  const redirectTo = (form.get("redirect") as string) || "/admin";

  const ctx = await requireAdminCtx(supabase, session.user.id);
  if (!ctx) return redirect("/");

  const validPartyId = ctx.parties.find((p) => p.id === partyId)?.id ?? null;
  if (validPartyId) {
    cookies.set("activePartyId", validPartyId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return redirect(redirectTo);
};
