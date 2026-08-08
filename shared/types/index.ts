export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: number;
  admin_assigned_by: string | null;
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

export type SellerMode = 'own_company' | 'smalljobs_commission';

export interface Party {
  id: string;
  name: string;
  slug: string;
  company_name: string | null;
  vat_number: string | null;
  billing_email: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  status: 'active' | 'inactive' | 'closed';
  seller_mode: SellerMode;
  created_at: string;
  updated_at: string;
}

// One accepted komisionářská smlouva per party — required before seller_mode can be
// switched to 'smalljobs_commission'. See shared/constants/sellerMode.ts.
export interface CommissionaireAgreement {
  id: string;
  party_id: string;
  legal_full_name: string;
  address_line1: string;
  address_city: string;
  address_postal_code: string;
  address_country_code: string;
  bank_account: string;
  personal_id_note: string | null;
  terms_version: string;
  accepted_at: string;
  accepted_by: string;
  status: 'active' | 'revoked';
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

// Per-order commission split, recorded once at payment time for smalljobs_commission parties.
export interface OrderCommissionLedgerEntry {
  id: string;
  order_id: string;
  party_id: string;
  gross_amount: number;
  tax_rate: number;
  tax_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_payable: number;
  currency: string;
  hold_until: string;
  status: 'held' | 'paid' | 'reversed';
  paid_at: string | null;
  paid_by: string | null;
  payout_reference: string | null;
  reversed_at: string | null;
  reversed_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductCardVariant = 'classic' | 'minimal' | 'luxury';
export type RadiusScale = 'sharp' | 'default' | 'soft';
export type SectionKey =
  | 'hero' | 'subhero' | 'categories' | 'featured_products' | 'newsletter'
  | 'benefits' | 'buyback_promo' | 'condition_explainer' | 'blog_preview';
export type ContentFormat = 'markdown' | 'html';

export interface StoreConfig {
  id: string;
  party_id: string;
  brand_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_surface: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_border: string;
  font_heading: string;
  font_body: string;
  radius_scale: RadiusScale;
  product_card_variant: ProductCardVariant;
  homepage_layout: SectionKey[];
  enable_reviews: boolean;
  enable_wishlists: boolean;
  hero_content: string | null;
  hero_format: ContentFormat;
  subhero_content: string | null;
  subhero_format: ContentFormat;
  footer_content: string | null;
  footer_format: ContentFormat;
  contact_phone: string | null;
  contact_email: string | null;
  business_hours: string | null;
  currency_code: string;
  buyback_content: string | null;
  buyback_format: ContentFormat;
  store_address: string | null;
  store_map_url: string | null;
  store_photo_url: string | null;
  footer_theme: 'light' | 'dark';
  footer_newsletter_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreDomain {
  id: string;
  party_id: string;
  domain: string;
  verified: boolean;
  verification_token: string;
  created_at: string;
}

export type StoreMediaType = 'image' | 'video';

export interface StoreMedia {
  id: string;
  party_id: string;
  slug: string;
  media_type: StoreMediaType;
  url: string;
  alt: string | null;
  created_at: string;
}

export interface PartyColorPreset {
  id: string;
  party_id: string;
  name: string;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_surface: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_border: string;
  created_by: string | null;
  created_at: string;
}

export interface MediaCategory {
  id: string;
  party_id: string;
  name: string;
  created_at: string;
}

export interface Role {
  id: string;
  party_id: string | null;
  name: string;
  permissions: number;
  is_system: boolean;
  description: string | null;
  created_by: string | null;
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
  show_in_nav: boolean;
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
  cost_price: number;
  discount_price: number | null;
  tax_rate: number;
  weight: number | null;
  status: "draft" | "active" | "inactive";
  is_featured: boolean;
  is_visible: boolean;
  stock: number | null;
  condition_id: string | null;
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
  condition_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCondition {
  id: string;
  party_id: string;
  code: string;
  label: string;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  media_type: "image" | "video";
  created_at: string;
}
export interface ProductWithDetails extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
  categories: string[];
  tags: string[];
  brand: Brand | null;
}

export interface SearchResultCategory extends Pick<Category, "id" | "name" | "slug" | "icon"> {}

export interface SearchResultProduct extends Pick<Product, "id" | "title" | "slug" | "price" | "discount_price"> {
  primaryImage: string | null;
  isOutOfStock: boolean;
  categoryName: string | null;
}

export interface StorefrontSearchResult {
  categories: SearchResultCategory[];
  products: SearchResultProduct[];
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
  paid_at: string | null;
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
  max_threshold: number | null;
  track_inventory: boolean;
  is_overstock: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemWithVariant extends InventoryItem {
  variant_name: string | null;
}

export type StockMovementType = "purchase" | "sale" | "adjustment" | "transfer" | "return" | "damage";

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  party_id: string;
  type: StockMovementType;
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

export interface ProductOverviewStats {
  stage_counts: { draft: number; active: number; inactive: number; total: number };
  lifecycle: {
    purchased_qty: number;
    sold_qty: number;
    delivered_qty: number;
    refunded_qty: number;
    damaged_qty: number;
  };
  financials: {
    gross_revenue: number;
    cogs: number;
    refunded_amount: number;
    damaged_loss: number;
    purchase_cost: number;
    net_profit: number;
  };
  timeseries: Array<{
    date: string;
    orders: number;
    revenue: number;
    refunds: number;
    refund_amount: number;
  }>;
  top_products: Array<{
    id: string;
    title: string;
    qty_sold: number;
    revenue: number;
    profit: number;
  }>;
}

export interface ProductActivityEvent {
  event_time: string;
  event_type: string;
  entity_number: string | null;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  product_title: string | null;
  quantity: number | null;
  refund_amount: number | null;
  refund_method: string | null;
  reason: string | null;
  actor_name: string | null;
  actor_id: string | null;
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

export interface NavItem {
  id: string;
  party_id: string;
  parent_id: string | null;
  label: string;
  url: string | null;
  category_id: string | null;
  column_label: string | null;
  is_mega: boolean;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface NavItemWithChildren extends NavItem {
  children: NavItem[];
}

// A store can also define its own footer column name beyond the system ones below,
// so this is intentionally a plain string rather than a closed union.
export type FooterColumnKey = string;

export interface FooterLink {
  id: string;
  party_id: string;
  column_key: FooterColumnKey;
  label: string;
  url: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroSlide {
  id: string;
  party_id: string;
  image_url: string | null;
  headline: string;
  subheadline: string | null;
  cta_text: string | null;
  cta_link: string | null;
  overlay_opacity: number;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface BenefitItem {
  id: string;
  party_id: string;
  icon: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type ContentPageTemplate = 'default' | 'about' | 'contact' | 'faq';

export interface ContentPage {
  id: string;
  party_id: string;
  slug: string;
  title: string;
  template: ContentPageTemplate;
  body: string | null;
  body_format: ContentFormat;
  seo_title: string | null;
  seo_description: string | null;
  show_in_footer_column: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  id: string;
  party_id: string;
  question: string;
  answer: string;
  context: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  party_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  content_format: ContentFormat;
  featured_image_url: string | null;
  author_name: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  party_id: string;
  name: string;
  position: string | null;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FooterBadgeKind = 'shipping' | 'payment' | 'social' | 'store_feature';

export interface FooterBadge {
  id: string;
  party_id: string;
  kind: FooterBadgeKind;
  label: string;
  icon: string | null;
  url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  party_id: string;
  email: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
}
