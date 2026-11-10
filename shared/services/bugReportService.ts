import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { BugReport, BugReportStatus } from "../types";

type Client = SupabaseClient<Database>;

const BUCKET = "bug-reports";

export interface BugReportWithParty extends BugReport {
  party: { name: string } | null;
}

export interface CreateBugReportInput {
  reporterId: string;
  reporterEmail: string;
  partyId: string | null;
  pageUrl: string;
  description: string | null;
  userAgent: string | null;
}

async function uploadBugReportMedia(
  client: Client,
  reporterId: string,
  kind: "screenshot" | "video",
  file: File
): Promise<{ path: string | null; error: Error | null }> {
  const ext = file.name.split(".").pop() || (kind === "video" ? "webm" : "png");
  const path = `${reporterId}/${Date.now()}-${kind}.${ext}`;
  const buf = await file.arrayBuffer();
  // MediaRecorder reports a codec-qualified type (e.g. "video/webm;codecs=vp9") that never
  // matches the bucket's plain allowed_mime_types entries — strip params before uploading.
  const contentType = (file.type || "application/octet-stream").split(";")[0].trim();
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, buf, { contentType });
  return { path: error ? null : path, error: error ? new Error(error.message) : null };
}

// All three inputs (description, screenshot, video) are optional by design — a reporter may
// submit whichever subset they captured. Upload failures are returned rather than thrown so
// the API route can still save the report with whatever media succeeded.
export async function createBugReport(
  client: Client,
  input: CreateBugReportInput,
  media: { screenshot?: File | null; video?: File | null } = {}
): Promise<{ error: Error | null }> {
  let screenshotPath: string | null = null;
  let videoPath: string | null = null;

  if (media.screenshot) {
    const result = await uploadBugReportMedia(client, input.reporterId, "screenshot", media.screenshot);
    if (result.error) return { error: result.error };
    screenshotPath = result.path;
  }
  if (media.video) {
    const result = await uploadBugReportMedia(client, input.reporterId, "video", media.video);
    if (result.error) return { error: result.error };
    videoPath = result.path;
  }

  // No .select() here on purpose: reading the row back after insert would require the
  // SELECT policy too (owner-only), which would make every non-owner reporter's insert
  // fail even though INSERT itself is allowed for any admin-capable role.
  const { error } = await client.from("bug_reports").insert({
    reporter_id: input.reporterId,
    reporter_email: input.reporterEmail,
    party_id: input.partyId,
    page_url: input.pageUrl,
    description: input.description,
    screenshot_path: screenshotPath,
    video_path: videoPath,
    user_agent: input.userAgent,
  });

  return { error: error ? new Error(error.message) : null };
}

// Owner-only (enforced by RLS) — lists reports for one tab (active vs archived), unresolved
// first within that tab ('open' < 'resolved' alphabetically), newest first within each group.
export async function fetchBugReports(client: Client, archived: boolean): Promise<BugReportWithParty[]> {
  const { data, error } = await client
    .from("bug_reports")
    .select("*, party:party_id(name)")
    .eq("archived", archived)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BugReportWithParty[];
}

// Returns the updated row (owner already holds the SELECT policy here, unlike createBugReport's
// reporter-side insert) so the caller can email the reporter without a second round trip.
export async function resolveBugReport(
  client: Client,
  id: string,
  resolutionNote: string
): Promise<{ data: BugReport | null; error: Error | null }> {
  const { data, error } = await client
    .from("bug_reports")
    .update({ status: "resolved" as BugReportStatus, resolution_note: resolutionNote, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  return { data: error ? null : (data as unknown as BugReport), error: error ? new Error(error.message) : null };
}

export async function reopenBugReport(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("bug_reports").update({ status: "open" as BugReportStatus }).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function setBugReportArchived(
  client: Client,
  id: string,
  archived: boolean
): Promise<{ error: Error | null }> {
  const { error } = await client.from("bug_reports").update({ archived }).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

// Media lives in a private bucket — only ever resolved to a time-limited signed URL for the owner.
export async function getBugReportMediaUrl(client: Client, path: string): Promise<string | null> {
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}
