import type { SectionKey } from "@shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchStoreConfig, updateStoreConfig } from "@shared/services/storeConfigService";
import { fetchHeroSlides, createHeroSlide } from "@shared/services/heroSlideService";
import { fetchBenefitItems, createBenefitItem } from "@shared/services/benefitItemService";
import { fetchBlogPosts, createBlogPost } from "@shared/services/blogService";
import { createCategory } from "@shared/services/categoryService";
import { createProduct } from "@shared/services/productService";

type Client = SupabaseClient<any, any, any>;

// Fills each homepage section in `layout` that currently has NO real content with editable
// placeholder rows, so the published storefront renders exactly like the onboarding preview.
// Only touches empty sections — re-publishing never duplicates. Uses the same services the
// admin CRUD pages use, so every seeded row is fully editable/removable from admin afterwards.
export async function seedPlaceholderContent(
  client: Client, partyId: string, layout: SectionKey[]
): Promise<void> {
  const has = (k: SectionKey) => layout.includes(k);
  const config = await fetchStoreConfig(client, partyId);

  if (has("hero") && !config?.hero_content) {
    const slides = await fetchHeroSlides(client, partyId);
    if (slides.length === 0) {
      await createHeroSlide(client, {
        party_id: partyId, headline: "Váš nadpis úvodního banneru",
        subheadline: "Sem přijde krátký podtitulek, který upoutá zákazníka.",
        cta_text: "Prohlédnout nabídku", cta_link: "#featured-products",
        overlay_opacity: 0.35, sort_order: 0, is_visible: true,
      } as any);
    }
  }

  if (has("subhero") && !config?.subhero_content) {
    await updateStoreConfig(client, partyId, {
      subhero_content: "Krátký uvítací text pod hlavním bannerem. Popište zde, co vás odlišuje.",
      subhero_format: "markdown",
    });
  }

  if (has("buyback_promo") && !config?.buyback_content) {
    await updateStoreConfig(client, partyId, {
      buyback_content: "## Výkup a protiúčet\n\nUkázkový text pro sekci výkupu. Upravíte v administraci.",
      buyback_format: "markdown",
    });
  }

  if (has("benefits")) {
    const items = await fetchBenefitItems(client, partyId);
    if (items.length === 0) {
      const seeds = [
        { icon: "🚚", title: "Doprava zdarma" }, { icon: "🛡️", title: "Záruka kvality" },
        { icon: "💬", title: "Osobní přístup" },
      ];
      for (let i = 0; i < seeds.length; i++) {
        await createBenefitItem(client, {
          party_id: partyId, ...seeds[i], description: "Ukázkový popis výhody",
          sort_order: i, is_visible: true,
        } as any);
      }
    }
  }

  if (has("blog_preview")) {
    const list = await fetchBlogPosts(client, partyId);
    if (list.length === 0) {
      await createBlogPost(client, {
        party_id: partyId, title: "Ukázkový článek", slug: "ukazkovy-clanek",
        excerpt: "Krátký ukázkový popis článku, který si později upravíte v administraci.",
        content: "Sem napíšete obsah svého prvního článku.", content_format: "markdown",
        status: "published", published_at: new Date().toISOString(),
      } as any);
    }
  }

  if (has("categories")) {
    const { count } = await client.from("categories").select("id", { count: "exact", head: true }).eq("party_id", partyId);
    if ((count ?? 0) === 0) {
      for (let i = 1; i <= 3; i++) {
        await createCategory(client, {
          party_id: partyId, name: `Kategorie ${i}`, slug: `ukazkova-kategorie-${i}`,
          sort_order: i, is_visible: true,
        } as any);
      }
    }
  }

  if (has("featured_products")) {
    const { count } = await client.from("products").select("id", { count: "exact", head: true }).eq("party_id", partyId);
    if ((count ?? 0) === 0) {
      await ensureWarehouse(client, partyId);
      for (let i = 1; i <= 4; i++) {
        const { data } = await createProduct(client, {
          party_id: partyId, title: `Ukázkový produkt ${i}`, slug: `ukazkovy-produkt-${i}`,
          price: 499 + i * 100, status: "active", is_visible: true, is_featured: true,
        } as any);
        // The auto-inventory trigger creates a tracked, zero-stock row; make placeholders
        // look purchasable so the storefront preview matches the published result.
        if (data?.id) {
          await client.from("inventory_items").update({ qty_on_hand: 10 }).eq("product_id", data.id);
        }
      }
    }
  }
}

// A product insert requires the party to have its single warehouse (enforced by a DB trigger),
// which a brand-new onboarding org does not yet have. Create the default one on demand.
async function ensureWarehouse(client: Client, partyId: string): Promise<void> {
  const { count } = await client.from("warehouses").select("id", { count: "exact", head: true }).eq("party_id", partyId);
  if ((count ?? 0) === 0) {
    await client.from("warehouses").insert({
      party_id: partyId, code: "MAIN", name: "Hlavní sklad", is_default: true,
    } as any);
  }
}
