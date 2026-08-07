import { fetchOutOfStockMap } from "@shared/services/searchService";
import { fetchInventoryRowsByProduct } from "@shared/services/inventoryService";
import { addToCart } from "@shared/services/cartService";

// Minimal chainable stand-in for the Supabase query builder: every filter method returns
// itself, and it resolves to `result` whether awaited directly or via .maybeSingle()/.single().
function makeQuery(result: { data: unknown; error?: unknown }) {
  const query: any = {
    select: () => query,
    eq: () => query,
    is: () => query,
    in: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
    then: (resolve: (r: unknown) => unknown) => resolve(result),
  };
  return query;
}

describe("fetchOutOfStockMap", () => {
  it("sums every tracked row per product, not just the product-level row", async () => {
    const client: any = {
      from: () =>
        makeQuery({
          data: [
            { product_id: "p1", qty_on_hand: 5, qty_reserved: 1 }, // variant row
            { product_id: "p1", qty_on_hand: 3, qty_reserved: 0 }, // sibling variant row
            { product_id: "p2", qty_on_hand: 0, qty_reserved: 0 }, // simple product, no stock
          ],
        }),
    };

    const map = await fetchOutOfStockMap(client, ["p1", "p2"]);

    expect(map.get("p1")).toBe(7); // (5-1) + (3-0)
    expect(map.get("p2")).toBe(0);
  });

  it("returns an empty map without querying when given no product ids", async () => {
    const client: any = { from: jest.fn() };
    const map = await fetchOutOfStockMap(client, []);
    expect(map.size).toBe(0);
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("fetchInventoryRowsByProduct", () => {
  const baseRow = {
    id: "inv-x", party_id: "party-1", product_id: "prod-1", warehouse_id: "wh-1",
    qty_on_hand: 10, qty_reserved: 0, qty_incoming: 0, low_stock_threshold: 5,
    max_threshold: null, track_inventory: true, is_overstock: null,
    created_at: "", updated_at: "",
  };

  it("returns only variant rows when the product has variants, with the variant name attached", async () => {
    const client: any = {
      from: () =>
        makeQuery({
          data: [
            { ...baseRow, id: "inv-product-level", variant_id: null, product_variants: null },
            { ...baseRow, id: "inv-red", variant_id: "v-red", qty_on_hand: 4, product_variants: { name: "Red" } },
            { ...baseRow, id: "inv-blue", variant_id: "v-blue", qty_on_hand: 6, product_variants: { name: "Blue" } },
          ],
        }),
    };

    const rows = await fetchInventoryRowsByProduct(client, "prod-1");

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.variant_name).sort()).toEqual(["Blue", "Red"]);
    expect(rows.every((r) => r.variant_id !== null)).toBe(true);
  });

  it("falls back to the single product-level row when there are no variants", async () => {
    const client: any = {
      from: () =>
        makeQuery({
          data: [{ ...baseRow, id: "inv-product-level", variant_id: null, product_variants: null }],
        }),
    };

    const rows = await fetchInventoryRowsByProduct(client, "prod-1");

    expect(rows).toHaveLength(1);
    expect(rows[0].variant_id).toBeNull();
    expect(rows[0].variant_name).toBeNull();
  });
});

describe("addToCart variant matching", () => {
  function makeCartClient(opts: { availableData: unknown; existingData?: unknown }) {
    const eqCalls: Array<{ table: string; column: string; value: unknown }> = [];
    const isCalls: Array<{ table: string; column: string; value: unknown }> = [];
    let currentTable = "";

    const client: any = {
      from: (table: string) => {
        currentTable = table;
        const isInventoryQuery = table === "inventory_items";
        const query: any = {
          select: () => query,
          eq: (column: string, value: unknown) => {
            eqCalls.push({ table: currentTable, column, value });
            return query;
          },
          is: (column: string, value: unknown) => {
            isCalls.push({ table: currentTable, column, value });
            return query;
          },
          insert: () => Promise.resolve({ error: null }),
          maybeSingle: () =>
            Promise.resolve(isInventoryQuery ? { data: opts.availableData } : { data: opts.existingData ?? null }),
        };
        return query;
      },
    };
    return { client, eqCalls, isCalls };
  }

  it("checks stock by variant_id when a variant is specified, not by variant_id IS NULL", async () => {
    const { client, eqCalls, isCalls } = makeCartClient({
      availableData: { qty_on_hand: 5, qty_reserved: 0, track_inventory: true },
    });

    await addToCart(client, "cart-1", "prod-1", 1, 10, "v-red");

    expect(eqCalls.some((c) => c.table === "inventory_items" && c.column === "variant_id" && c.value === "v-red")).toBe(true);
    expect(isCalls.some((c) => c.table === "inventory_items" && c.column === "variant_id")).toBe(false);
  });

  it("checks stock by variant_id IS NULL when no variant is specified", async () => {
    const { client, isCalls } = makeCartClient({
      availableData: { qty_on_hand: 5, qty_reserved: 0, track_inventory: true },
    });

    await addToCart(client, "cart-1", "prod-1", 1, 10);

    expect(isCalls.some((c) => c.table === "inventory_items" && c.column === "variant_id" && c.value === null)).toBe(true);
  });

  it("rejects a quantity that exceeds the selected variant's available stock", async () => {
    const { client } = makeCartClient({
      availableData: { qty_on_hand: 3, qty_reserved: 0, track_inventory: true },
    });

    const result = await addToCart(client, "cart-1", "prod-1", 5, 10, "v-red");

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toMatch(/3 left in stock/);
  });

  it("allows adding an on-demand item (track_inventory=false) past its qty_on_hand", async () => {
    const { client } = makeCartClient({
      availableData: { qty_on_hand: 0, qty_reserved: 0, track_inventory: false },
    });

    const result = await addToCart(client, "cart-1", "prod-1", 25, 10, "v-red");

    expect(result.error).toBeNull();
  });
});
