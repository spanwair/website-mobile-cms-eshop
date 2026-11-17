export interface LedgerOrderRow {
  id: string;
  orderNumber: string;
  date: string;
  gross: number;
  tax: number;
  commission: number;
  net: number;
  withheld: number;
  holdUntil: string;
  computedStatus: "held" | "eligible" | "paid";
  paidAt: string | null;
  payoutReference: string | null;
}
