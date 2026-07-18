export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: number;
  created_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "inactive" | "draft";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

export type { AppRole } from "../constants/permissions";

export interface Party {
  id: string;
  name: string;
  slug: string;
  company_name: string | null;
  vat_number: string | null;
  billing_email: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  party_id: string;
  name: string;
  permissions: number;
  is_system: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPartyRole {
  user_id: string;
  party_id: string;
  role_id: string;
  joined_at: string;
  invited_by: string | null;
}

export interface UserWithRoles extends User {
  party_id: string;
  permissions: number;
  roles: Role[];
}

export interface Brand {
  id: string;
  party_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  party_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface Product {
  id: string;
  party_id: string;
  brand_id: string | null;
  title: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  description_rich: unknown;
  seo_title: string | null;
  seo_description: string | null;
  price: number;
  discount_price: number | null;
  tax_rate: number;
  weight: number | null;
  status: "draft" | "active" | "inactive";
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number | null;
  attributes: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductWithDetails extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
  categories: string[];
  tags: string[];
  brand: Brand | null;
}

export interface Customer {
  id: string;
  party_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  type: "shipping" | "billing";
  first_name: string;
  last_name: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  party_id: string;
  customer_id: string;
  order_number: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment_status: "unpaid" | "paid" | "partially_paid" | "refunded" | "failed";
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  internal_notes: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_price: number;
  created_at: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  customer: Customer;
  shipping_address: Address | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface PriceList {
  id: string;
  party_id: string;
  name: string;
  currency: string;
  is_default: boolean;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscountRule {
  id: string;
  party_id: string;
  name: string;
  type: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping";
  value: number;
  min_order_amount: number | null;
  min_quantity: number | null;
  applies_to: string;
  applies_to_ids: string[];
  customer_group: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  party_id: string;
  code: string;
  discount_rule_id: string;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  party_id: string;
  name: string;
  description: string | null;
  banner_image_url: string | null;
  discount_rule_id: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  party_id: string;
  name: string;
  code: string;
  address: Record<string, string>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  party_id: string;
  product_id: string;
  variant_id: string | null;
  warehouse_id: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_incoming: number;
  qty_available: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  party_id: string;
  type: "purchase" | "sale" | "adjustment" | "transfer" | "return" | "damage";
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  party_id: string | null;
  user_id: string | null;
  ip_address: string | null;
  device_info: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export type NotificationType =
  | "low_inventory"
  | "new_order"
  | "failed_payment"
  | "new_registration"
  | "system_alert"
  | "role_invitation";

export interface Notification {
  id: string;
  party_id: string | null;
  type: NotificationType;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserNotification {
  user_id: string;
  notification_id: string;
  read_at: string | null;
}

export interface NotificationWithMeta extends Notification {
  read_at: string | null;
}
