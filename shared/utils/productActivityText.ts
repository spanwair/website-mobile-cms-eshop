import type { AppLanguage } from "../i18n/getT";
import type { getT } from "../i18n/getT";
import type { ProductActivityEvent } from "../types";
import { formatPrice } from "./format";

type T = ReturnType<typeof getT>;

export function activityEventBadgeClass(type: string): string {
  if (type.startsWith("return")) return "badge-pending";
  if (type === "stock_purchase") return "badge-active";
  if (type === "stock_damage") return "badge-error";
  if (type === "stock_sale") return "badge-draft";
  return "badge-inactive";
}

export function activityEventLabel(t: T, type: string): string {
  const labels: Record<string, string> = {
    order_status: t.admin.productsOverview.eventTypeOrderStatus,
    return_completed: t.admin.productsOverview.eventTypeReturnCompleted,
    return_requested: t.admin.productsOverview.eventTypeReturnRequested,
    stock_purchase: t.admin.productsOverview.eventTypeStockPurchase,
    stock_damage: t.admin.productsOverview.eventTypeStockDamage,
    stock_sale: t.admin.productsOverview.eventTypeStockSale,
    stock_return: t.admin.productsOverview.eventTypeStockReturn,
    stock_adjustment: t.admin.productsOverview.eventTypeStockAdjustment,
    stock_transfer: t.admin.productsOverview.eventTypeStockTransfer,
  };
  return labels[type] ?? type.replace(/_/g, " ");
}

export function activityActorName(t: T, e: ProductActivityEvent): string {
  return e.actor_name ?? (e.event_type === "return_requested" ? t.admin.productsOverview.actorCustomer : t.admin.productsOverview.actorSystem);
}

export function activityEventDescription(t: T, lang: AppLanguage, e: ProductActivityEvent): string {
  const po = t.admin.productsOverview;
  const orderStatusLabels: Record<string, string> = {
    pending: t.admin.orders.tabPending, confirmed: t.admin.orders.tabConfirmed, processing: t.admin.orders.tabProcessing,
    shipped: t.admin.orders.tabShipped, delivered: t.admin.orders.tabDelivered, cancelled: t.admin.orders.tabCancelled,
    refunded: t.admin.orders.statusRefunded,
  };
  const orderStatusLabel = (s: string | null) => (s ? orderStatusLabels[s] ?? s : "—");

  const returnReasonLabels: Record<string, string> = {
    wrong_item: t.admin.returns.reasonWrongItem, damaged: t.admin.returns.reasonDamaged, defective: t.admin.returns.reasonDefective,
    not_as_described: t.admin.returns.reasonNotAsDescribed, changed_mind: t.admin.returns.reasonChangedMind,
    quality_issue: t.admin.returns.reasonQualityIssue, size_issue: t.admin.returns.reasonSizeIssue, other: t.admin.returns.reasonOther,
  };

  const stockActionLabels: Record<string, string> = {
    purchase: po.actionPurchase, sale: po.actionSale, adjustment: po.actionAdjustment,
    transfer: po.actionTransfer, return: po.actionReturn, damage: po.actionDamage,
  };

  switch (e.event_type) {
    case "order_status": {
      let desc = po.descOrderStatus
        .replace("{{number}}", e.entity_number ?? "")
        .replace("{{from}}", orderStatusLabel(e.from_status))
        .replace("{{to}}", orderStatusLabel(e.to_status));
      if (e.note) desc += po.descNoteParenSuffix.replace("{{note}}", e.note);
      return desc;
    }
    case "return_completed": {
      let desc = po.descReturnCompleted
        .replace("{{number}}", e.entity_number ?? "")
        .replace("{{amount}}", formatPrice(e.refund_amount ?? 0, lang));
      if (e.refund_method) desc += po.descViaMethodSuffix.replace("{{method}}", e.refund_method);
      return desc;
    }
    case "return_requested":
      return po.descReturnRequested
        .replace("{{number}}", e.entity_number ?? "")
        .replace("{{reason}}", (e.reason && returnReasonLabels[e.reason]) ?? e.reason ?? "");
    default: {
      const action = e.event_type.startsWith("stock_") ? e.event_type.slice("stock_".length) : e.event_type;
      let desc = po.descStockMovement
        .replace("{{action}}", stockActionLabels[action] ?? action)
        .replace("{{product}}", e.product_title ?? "")
        .replace("{{qty}}", String(e.quantity ?? 0))
        .replace("{{unit}}", po.unitsSuffix);
      if (e.note) desc += po.descNoteDashSuffix.replace("{{note}}", e.note);
      return desc;
    }
  }
}

export function activityHref(e: ProductActivityEvent): string | null {
  if (e.order_id) return `/admin/orders/${e.order_id}`;
  if (e.return_id) return `/admin/returns/${e.return_id}`;
  if (e.product_id) return `/admin/products/${e.product_id}`;
  return null;
}
