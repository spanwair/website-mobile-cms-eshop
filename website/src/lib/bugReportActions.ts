import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import type { AppLanguage } from "@shared/i18n/getT";
import { resolveBugReport, reopenBugReport, setBugReportArchived } from "@shared/services/bugReportService";
import { fetchProfile } from "@shared/services/profileService";
import { sendBugReportResolved } from "./integrations/email";

export async function processBugReportAction(supabase: SupabaseClient<Database>, form: FormData): Promise<void> {
  const id = form.get("id") as string | null;
  const action = form.get("action") as string | null;
  if (!id || !action) return;

  if (action === "resolve") {
    const note = (form.get("resolution_note") as string | null)?.trim();
    if (!note) return;
    const { data } = await resolveBugReport(supabase, id, note);
    if (!data) return;
    const profile = data.reporter_id ? await fetchProfile(supabase, data.reporter_id, data.reporter_email) : null;
    const lang: AppLanguage = profile?.lang === "en" ? "en" : "cs";
    await sendBugReportResolved({
      to: data.reporter_email,
      pageUrl: data.page_url,
      description: data.description,
      resolutionNote: note,
      lang,
    });
    return;
  }
  if (action === "reopen") return void (await reopenBugReport(supabase, id));
  if (action === "archive") return void (await setBugReportArchived(supabase, id, true));
  if (action === "unarchive") return void (await setBugReportArchived(supabase, id, false));
}
