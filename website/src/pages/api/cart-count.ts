import type { APIRoute } from "astro";
import { createSupabase, createAdminClient } from "../../lib/supabase";
import { peekGuestCartId } from "../../lib/guestCart";
import { fetchCartItemCount, type CartIdentity } from "@shared/services/cartService";

// Client-filled cart badge source. The badge is deliberately NOT rendered server-side so the
// storefront HTML stays identical for every anonymous visitor and can be edge-cached; this tiny
// per-request call resolves the real count for the current identity (logged-in user or guest
// cookie). partyId comes from the nav because path-based /eshop-<slug> requests to /api/* carry
// no slug param and no custom-domain host, so middleware cannot resolve the store here.
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const partyId = url.searchParams.get("partyId");
  if (!partyId) return json({ count: 0 });

  const supabase = createSupabase({ request, cookies });
  const { data: { session } } = await supabase.auth.getSession();

  const identity: CartIdentity | null = session
    ? { userId: session.user.id }
    : (() => {
        const guest = peekGuestCartId(cookies);
        return guest ? { sessionId: guest } : null;
      })();
  if (!identity) return json({ count: 0 });

  const client = session ? supabase : createAdminClient();
  const count = await fetchCartItemCount(client, identity, partyId);
  return json({ count });
};

function json(body: { count: number }): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
}
