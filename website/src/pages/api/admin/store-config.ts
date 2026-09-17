import type { APIContext, APIRoute } from "astro";
import { createSupabase } from "@/lib/supabase";
import { requireAdminCtx } from "@/lib/admin";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import { updateStoreConfig } from "@shared/services/storeConfigService";
import { sanitizeLayout } from "@/lib/pageComposer";
import { seedPlaceholderContent } from "@/lib/onboardingSeed";

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
  return { supabase, partyId: ctx.partyId };
}

const COLOR_FIELDS = [
  "color_primary", "color_secondary", "color_background", "color_surface",
  "color_text_primary", "color_text_secondary", "color_border",
] as const;
const STR_FIELDS = ["font_heading", "font_body"] as const;

// Autosave endpoint for the onboarding homepage editor. Accepts a partial theme/layout patch and
// persists it immediately so a half-finished storefront resumes exactly where the owner left off.
// `publish:true` additionally seeds placeholder content into the layout's empty sections.
export const POST: APIRoute = async (context) => {
  const ctx = await requireSettingsCtx(context);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const body = await context.request.json().catch(() => null);
  if (!body) return json({ error: "Bad request" }, 400);

  const patch: Record<string, unknown> = {};
  if (Array.isArray(body.homepage_layout)) patch.homepage_layout = sanitizeLayout(body.homepage_layout);
  for (const f of COLOR_FIELDS) if (typeof body[f] === "string") patch[f] = body[f];
  for (const f of STR_FIELDS) if (typeof body[f] === "string") patch[f] = body[f];

  if (Object.keys(patch).length > 0) {
    const result = await updateStoreConfig(ctx.supabase, ctx.partyId, patch);
    if (result.error) return json({ error: result.error.message }, 400);
  }

  if (body.publish === true) {
    const layout = (patch.homepage_layout as any) ?? sanitizeLayout(body.homepage_layout);
    await seedPlaceholderContent(ctx.supabase, ctx.partyId, layout);
  }

  return json({ ok: true });
};
