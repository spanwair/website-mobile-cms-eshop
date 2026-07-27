import type { APIContext, APIRoute } from "astro";
import { createSupabase } from "../../../lib/supabase";
import { requireAdminCtx } from "../../../lib/admin";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import { createColorPreset, deleteColorPreset, type ColorPresetColors } from "@shared/services/colorPresetService";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function requireSettingsCtx(context: APIContext) {
  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const activePartyId = context.cookies.get("activePartyId")?.value ?? null;
  const ctx = await requireAdminCtx(supabase, session.user.id, activePartyId);
  if (!ctx || !ctx.partyId || !hasPermission(ctx.permissions, PERMISSIONS.MANAGE_SETTINGS)) return null;
  return { supabase, partyId: ctx.partyId, userId: session.user.id };
}

const COLOR_FIELDS = [
  "color_primary", "color_secondary", "color_background", "color_surface",
  "color_text_primary", "color_text_secondary", "color_border",
] as const;

export const POST: APIRoute = async (context) => {
  const ctx = await requireSettingsCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const body = await context.request.json().catch(() => null);
  const name = body?.name as string | undefined;
  if (!name) return json({ error: "Missing name" }, 400);

  const colors = {} as ColorPresetColors;
  for (const field of COLOR_FIELDS) {
    const v = body?.[field];
    if (typeof v !== "string") return json({ error: `Missing ${field}` }, 400);
    colors[field] = v;
  }

  const result = await createColorPreset(ctx.supabase, ctx.partyId, ctx.userId, name, colors);
  if (result.error) return json({ error: result.error.message }, 400);
  return json({ preset: result.data });
};

export const DELETE: APIRoute = async (context) => {
  const ctx = await requireSettingsCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const id = context.url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const { error } = await deleteColorPreset(ctx.supabase, ctx.partyId, id);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
};
