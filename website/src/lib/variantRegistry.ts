import type { ProductCardVariant } from "@shared/types";

export const PRODUCT_CARD_VARIANTS: { value: ProductCardVariant; label: string }[] = [
  { value: "classic", label: "Classic — image, title, price, rating" },
  { value: "minimal", label: "Minimal — image, title, price only" },
  { value: "luxury",  label: "Luxury — large image, heading font, understated price" },
];

export interface ProductCardData {
  id: string;
  title: string;
  slug: string;
  price: number;
  discount_price: number | null;
  is_featured: boolean;
  review_count: number;
  rating_avg: number;
  primaryImage: string | null;
  isOutOfStock: boolean;
  orgName?: string;
  orgHref?: string;
  condition?: { label: string; color_hex: string } | null;
  variants?: { id: string; name: string }[];
}
