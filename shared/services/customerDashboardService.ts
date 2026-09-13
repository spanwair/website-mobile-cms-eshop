import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Order } from "../types";
import type { ReturnRequest } from "./returnService";

type Client = SupabaseClient<Database>;

export interface DeliveryShipment {
  order_id: string;
  provider: string | null;
  tracking_number: string | null;
  status: string | null;
  pickup_point_name: string | null;
}

export interface CustomerAccount {
  customerIds: string[];
  orders: Order[];
  returns: ReturnRequest[];
  deliveries: Order[];
  shipments: Record<string, DeliveryShipment>;
  kpis: {
    totalSpent: number;
    orderCount: number;
    inTransit: number;
    returnCount: number;
    currency: string;
  };
}

const EMPTY: CustomerAccount = {
  customerIds: [],
  orders: [],
  returns: [],
  deliveries: [],
  shipments: {},
  kpis: { totalSpent: 0, orderCount: 0, inTransit: 0, returnCount: 0, currency: "CZK" },
};

// A logged-in customer never has read access to orders/returns under RLS (those are admin/party
// scoped). This runs with the service-role client and enforces ownership at the app layer: only
// rows whose customer belongs to THIS user (linked auth id or matching email) in THEIR home eshop.
export async function fetchCustomerAccount(
  client: Client,
  args: { userId: string; email: string; partyId: string }
): Promise<CustomerAccount> {
  const { userId, email, partyId } = args;

  const { data: custRows } = await client
    .from("customers")
    .select("id")
    .eq("party_id", partyId)
    .or(`user_id.eq.${userId},email.eq.${email}`);
  const customerIds = (custRows ?? []).map((c) => c.id);
  if (customerIds.length === 0) return { ...EMPTY };

  const { data: orderRows } = await client
    .from("orders")
    .select("*")
    .eq("party_id", partyId)
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false });
  const orders = (orderRows ?? []) as Order[];

  const { data: returnRows } = await client
    .from("return_requests")
    .select("*, order:orders(order_number)")
    .eq("party_id", partyId)
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false });
  const returns = (returnRows ?? []) as unknown as ReturnRequest[];

  const deliveries = orders.filter((o) => o.status === "shipped" && !o.delivered_at);
  const shipments: Record<string, DeliveryShipment> = {};
  const deliveryIds = deliveries.map((o) => o.id);
  if (deliveryIds.length > 0) {
    const { data: shipRows } = await client
      .from("order_shipments")
      .select("order_id, provider, tracking_number, status, pickup_point_name")
      .in("order_id", deliveryIds);
    for (const s of shipRows ?? []) shipments[s.order_id] = s as DeliveryShipment;
  }

  const totalSpent = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return {
    customerIds,
    orders,
    returns,
    deliveries,
    shipments,
    kpis: {
      totalSpent,
      orderCount: orders.length,
      inTransit: deliveries.length,
      returnCount: returns.length,
      currency: orders[0]?.currency ?? "CZK",
    },
  };
}
