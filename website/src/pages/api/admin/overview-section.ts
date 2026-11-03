import type { APIRoute } from "astro";
import { createSupabase } from "../../../lib/supabase";
import { requireAdminCtx } from "../../../lib/admin";
import { getLang, useT } from "../../../lib/i18n";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import { formatPrice } from "@shared/utils/format";
import { fetchOrders } from "@shared/services/orderService";
import { fetchProductActivityLog, fetchTopProductsPaged } from "@shared/services/productOverviewService";
import {
  activityActorName, activityEventBadgeClass, activityEventDescription, activityEventLabel, activityHref,
} from "@shared/utils/productActivityText";

type Cell = { text: string; badge?: string };
type Row = { href: string | null; cells: Cell[] };

const SECTIONS = ["top-products", "activity", "orders"] as const;
type Section = (typeof SECTIONS)[number];

function rangeFrom(range: string): string | null {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "1d": return new Date(now - day).toISOString();
    case "7d": return new Date(now - 7 * day).toISOString();
    case "1m": { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    default: return null;
  }
}

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: "badge-pending", confirmed: "badge-active", processing: "badge-draft",
  shipped: "badge-active", delivered: "badge-active", cancelled: "badge-error",
};

export const GET: APIRoute = async (context) => {
  const { request, cookies, url } = context;
  const supabase = createSupabase({ request, cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return json({ error: "unauthorized" }, 401);

  const activePartyId = cookies.get("activePartyId")?.value ?? null;
  const ctx = await requireAdminCtx(supabase, session.user.id, activePartyId);
  if (!ctx || !ctx.partyId) return json({ error: "forbidden" }, 403);

  const section = url.searchParams.get("section") as Section;
  if (!SECTIONS.includes(section)) return json({ error: "bad_section" }, 400);

  const range = url.searchParams.get("range") ?? "all";
  const from = rangeFrom(range);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "10", 10) || 10));
  const offset = (page - 1) * pageSize;

  const t = useT({ cookies });
  const lang = getLang({ cookies });
  const po = t.admin.productsOverview;
  const dateLocale = lang === "en" ? "en-US" : "cs-CZ";

  let columns: string[];
  let rows: Row[];
  let total: number;

  if (section === "top-products") {
    if (!hasPermission(ctx.permissions, PERMISSIONS.MANAGE_PRODUCTS)) return json({ error: "forbidden" }, 403);
    const res = await fetchTopProductsPaged(supabase, ctx.partyId, { from, limit: pageSize, offset });
    total = res.total;
    columns = [po.colProduct, po.colQtySold, po.colRevenue, po.colProfit];
    rows = res.data.map((p) => ({
      href: `/admin/products/${p.id}`,
      cells: [
        { text: p.title },
        { text: String(p.qty_sold) },
        { text: formatPrice(p.revenue, lang) },
        { text: formatPrice(p.profit, lang) },
      ],
    }));
  } else if (section === "activity") {
    if (!hasPermission(ctx.permissions, PERMISSIONS.MANAGE_PRODUCTS)) return json({ error: "forbidden" }, 403);
    const res = await fetchProductActivityLog(supabase, ctx.partyId, { from, limit: pageSize, offset });
    total = res.total;
    columns = [po.colTime, po.colEvent, po.colDescription, po.colActor];
    rows = res.data.map((e) => ({
      href: activityHref(e),
      cells: [
        { text: new Date(e.event_time).toLocaleString(dateLocale) },
        { text: activityEventLabel(t, e.event_type), badge: activityEventBadgeClass(e.event_type) },
        { text: activityEventDescription(t, lang, e) },
        { text: activityActorName(t, e) },
      ],
    }));
  } else {
    if (!hasPermission(ctx.permissions, PERMISSIONS.MANAGE_ORDERS)) return json({ error: "forbidden" }, 403);
    const res = await fetchOrders(supabase, ctx.partyId, { from: from ?? undefined, page, pageSize });
    total = res.total;
    const statusLabels: Record<string, string> = {
      pending: t.admin.orders.tabPending, confirmed: t.admin.orders.tabConfirmed, processing: t.admin.orders.tabProcessing,
      shipped: t.admin.orders.tabShipped, delivered: t.admin.orders.tabDelivered, cancelled: t.admin.orders.tabCancelled,
      refunded: t.admin.orders.statusRefunded,
    };
    columns = [t.admin.orders.colNumber, t.admin.orders.colStatus, t.admin.orders.colTotal, t.admin.orders.colDate];
    rows = res.data.map((o) => ({
      href: `/admin/orders/${o.id}`,
      cells: [
        { text: o.order_number },
        { text: statusLabels[o.status] ?? o.status, badge: ORDER_STATUS_BADGE[o.status] ?? "badge-inactive" },
        { text: formatPrice(o.total_amount, lang) },
        { text: new Date(o.created_at).toLocaleDateString(dateLocale) },
      ],
    }));
  }

  return json({ total, page, pageSize, columns, rows });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
