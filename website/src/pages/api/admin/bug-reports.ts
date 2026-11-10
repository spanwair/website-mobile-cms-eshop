import type { APIContext, APIRoute } from "astro";
import { createSupabase } from "@/lib/supabase";
import { requireAdminCtx } from "@/lib/admin";
import { createBugReport } from "@shared/services/bugReportService";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Any admin-capable role (eshop_admin/admin/owner) may file a report — the widget mounts on
// every /admin page regardless of permission bits, same precedent as /admin/notifications.
export const POST: APIRoute = async (context: APIContext) => {
  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return json({ error: "Unauthorized" }, 401);

  const activePartyId = context.cookies.get("activePartyId")?.value ?? null;
  const ctx = await requireAdminCtx(supabase, session.user.id, activePartyId);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const form = await context.request.formData().catch(() => null);
  if (!form) return json({ error: "Invalid form data" }, 400);

  const description = (form.get("description") as string | null)?.trim() || null;
  const pageUrl = (form.get("pageUrl") as string | null) || context.request.headers.get("referer") || "";
  const userAgent = (form.get("userAgent") as string | null) || context.request.headers.get("user-agent");
  const screenshot = form.get("screenshot");
  const video = form.get("video");

  const { error } = await createBugReport(
    supabase,
    {
      reporterId: session.user.id,
      reporterEmail: session.user.email ?? "",
      partyId: ctx.partyId,
      pageUrl,
      description,
      userAgent,
    },
    {
      screenshot: screenshot instanceof File && screenshot.size > 0 ? screenshot : null,
      video: video instanceof File && video.size > 0 ? video : null,
    }
  );

  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
};
