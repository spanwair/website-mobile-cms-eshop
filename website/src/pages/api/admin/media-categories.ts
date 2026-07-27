import type { APIContext, APIRoute } from "astro";
import { createSupabase } from "../../../lib/supabase";
import { requireAdminCtx } from "../../../lib/admin";
import { fetchMediaCategories, createMediaCategory, deleteMediaCategory } from "@shared/services/mediaCategoryService";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function requirePartyCtx(context: APIContext) {
  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const activePartyId = context.cookies.get("activePartyId")?.value ?? null;
  const ctx = await requireAdminCtx(supabase, session.user.id, activePartyId);
  if (!ctx || !ctx.partyId) return null;
  return { supabase, partyId: ctx.partyId };
}

export const GET: APIRoute = async (context) => {
  const ctx = await requirePartyCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);
  const categories = await fetchMediaCategories(ctx.supabase, ctx.partyId);
  return json({ categories });
};

export const POST: APIRoute = async (context) => {
  const ctx = await requirePartyCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const body = await context.request.json().catch(() => null);
  const name = body?.name as string | undefined;
  if (!name) return json({ error: "Missing name" }, 400);

  const result = await createMediaCategory(ctx.supabase, ctx.partyId, name);
  if (result.error) return json({ error: result.error.message }, 400);
  return json({ category: result.data });
};

export const DELETE: APIRoute = async (context) => {
  const ctx = await requirePartyCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const id = context.url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const { error } = await deleteMediaCategory(ctx.supabase, ctx.partyId, id);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
};
