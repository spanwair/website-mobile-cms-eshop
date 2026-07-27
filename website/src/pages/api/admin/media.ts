import type { APIContext, APIRoute } from "astro";
import { createSupabase } from "../../../lib/supabase";
import { requireAdminCtx } from "../../../lib/admin";
import { fetchStoreMedia, uploadStoreMedia, deleteStoreMedia } from "@shared/services/storeMediaService";
import { fetchMediaCategoryAssignments, setMediaCategories } from "@shared/services/mediaCategoryService";

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
  const [media, assignments] = await Promise.all([
    fetchStoreMedia(ctx.supabase, ctx.partyId),
    fetchMediaCategoryAssignments(ctx.supabase, ctx.partyId),
  ]);
  const withCategories = media.map((m) => ({ ...m, category_ids: assignments[m.id] ?? [] }));
  return json({ media: withCategories });
};

export const PATCH: APIRoute = async (context) => {
  const ctx = await requirePartyCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const body = await context.request.json().catch(() => null);
  const mediaId = body?.id as string | undefined;
  const categoryIds = body?.categoryIds as string[] | undefined;
  if (!mediaId || !Array.isArray(categoryIds)) return json({ error: "Missing id or categoryIds" }, 400);

  const { error } = await setMediaCategories(ctx.supabase, mediaId, categoryIds);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
};

export const POST: APIRoute = async (context) => {
  const ctx = await requirePartyCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const form = await context.request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return json({ error: "No files provided" }, 400);

  const uploaded = [];
  for (const file of files) {
    const result = await uploadStoreMedia(ctx.supabase, ctx.partyId, file, {});
    if (result.error) return json({ error: result.error.message, media: uploaded }, 400);
    uploaded.push(result.data);
  }
  return json({ media: uploaded });
};

export const DELETE: APIRoute = async (context) => {
  const ctx = await requirePartyCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const id = context.url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const { error } = await deleteStoreMedia(ctx.supabase, ctx.partyId, id);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
};
