import type { APIRoute } from "astro";
import { createSupabase } from "@/lib/supabase";

// Server-side proxy for the public ARES registry (ares.gov.cz). Done server-side because
// ARES sends no browser CORS headers, and so we can normalize the (verbose) response to the
// few fields the org form needs. Gated behind a logged-in session so it can't be abused as
// an open relay. GET /api/ares?ico=12345678  (lookup) or  /api/ares?q=<name>  (search).
const ARES_BASE = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export const GET: APIRoute = async (context) => {
  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return json({ error: "unauthorized" }, 401);

  const ico = (context.url.searchParams.get("ico") ?? "").replace(/\s/g, "");
  const q = (context.url.searchParams.get("q") ?? "").trim();

  try {
    if (ico) {
      if (!/^\d{8}$/.test(ico)) return json({ found: false });
      const res = await fetch(`${ARES_BASE}/${ico}`, { headers: { accept: "application/json" } });
      if (res.status === 404) return json({ found: false });
      if (!res.ok) return json({ error: "ares_error" }, 502);
      const d = (await res.json()) as any;
      const s = d.sidlo ?? {};
      return json({
        found: true,
        ico: d.ico ?? ico,
        name: d.obchodniJmeno ?? "",
        dic: d.dic ?? "",
        address: { line: s.textovaAdresa ?? "", city: s.nazevObce ?? "", zip: s.psc != null ? String(s.psc) : "" },
      });
    }

    if (q) {
      if (q.length < 2) return json({ results: [] });
      const res = await fetch(`${ARES_BASE}/vyhledat`, {
        method: "POST",
        headers: { accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ obchodniJmeno: q, pocet: 8, start: 0 }),
      });
      if (!res.ok) return json({ error: "ares_error" }, 502);
      const d = (await res.json()) as any;
      const results = ((d.ekonomickeSubjekty ?? []) as any[]).map((x) => ({
        ico: x.ico,
        name: x.obchodniJmeno ?? "",
        dic: x.dic ?? "",
        city: (x.sidlo ?? {}).nazevObce ?? "",
      }));
      return json({ results });
    }

    return json({ error: "missing_param" }, 400);
  } catch {
    return json({ error: "ares_unreachable" }, 502);
  }
};
