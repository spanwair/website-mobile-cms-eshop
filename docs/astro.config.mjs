// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

export default defineConfig({
  // Served as static assets under /docs by the main website (Cloudflare Workers). The base
  // prefixes every internal link and asset URL so the site works from /docs, not the root.
  base: '/docs',
  integrations: [
    starlight({
      title: 'CMS Documentation',
      description: 'Complete guide to the website-mobile-template CMS - for admins, developers, and business owners.',
      social: [],
      defaultLocale: 'root',
      locales: {
        root: { label: 'Čeština', lang: 'cs' },
        en: { label: 'English', lang: 'en' },
      },
      plugins: [
        starlightOpenAPI([
          {
            base: 'api/reference',
            label: 'API Reference',
            schema: './public/openapi.yaml',
          },
        ]),
      ],
      sidebar: [
        {
          label: '🚀 Getting Started', translations: { cs: '🚀 Začínáme' },
          items: [
            { label: 'Overview', translations: { cs: 'Přehled' }, slug: 'getting-started/overview' },
            { label: 'Installation', translations: { cs: 'Instalace' }, slug: 'getting-started/installation' },
            { label: 'Environment Setup', translations: { cs: 'Nastavení prostředí' }, slug: 'getting-started/environment' },
          ],
        },
        {
          label: '🏗️ Architecture', translations: { cs: '🏗️ Architektura' },
          items: [
            { label: 'Project Structure', translations: { cs: 'Struktura projektu' }, slug: 'architecture/structure' },
            { label: 'Database Schema', translations: { cs: 'Schéma databáze' }, slug: 'architecture/database' },
            { label: 'Authentication & Auth Flow', translations: { cs: 'Autentizace a tok ověřování' }, slug: 'architecture/auth' },
            { label: 'Multi-Tenant Architecture', translations: { cs: 'Multi-tenant architektura' }, slug: 'architecture/multi-tenancy' },
          ],
        },
        {
          label: '👥 User Management', translations: { cs: '👥 Správa uživatelů' },
          items: [
            { label: 'Role Hierarchy', translations: { cs: 'Hierarchie rolí' }, slug: 'users/roles' },
            { label: 'Organizations (Parties)', translations: { cs: 'Organizace (Parties)' }, slug: 'users/organizations' },
            { label: 'Permissions System', translations: { cs: 'Systém oprávnění' }, slug: 'users/permissions' },
          ],
        },
        {
          label: '🛍️ Admin: Getting Started', translations: { cs: '🛍️ Administrace: Začínáme' },
          items: [
            { label: 'Setup (First Login)', translations: { cs: 'Nastavení (První přihlášení)' }, slug: 'admin/setup' },
            { label: 'Onboarding & Tutorial', translations: { cs: 'Onboarding a průvodce' }, slug: 'admin/onboarding' },
            { label: 'Dashboard', translations: { cs: 'Nástěnka' }, slug: 'admin/dashboard' },
            { label: 'Notifications', translations: { cs: 'Oznámení' }, slug: 'admin/notifications' },
          ],
        },
        {
          label: '🏢 Organization & Access', translations: { cs: '🏢 Organizace a přístup' },
          items: [
            { label: 'Organizations', translations: { cs: 'Organizace' }, slug: 'admin/parties' },
            { label: 'Users', translations: { cs: 'Uživatelé' }, slug: 'admin/users' },
            { label: 'Roles', translations: { cs: 'Role' }, slug: 'admin/roles' },
            { label: 'Billing', translations: { cs: 'Fakturace' }, slug: 'admin/billing' },
            { label: 'Payouts', translations: { cs: 'Výplaty' }, slug: 'admin/payouts' },
          ],
        },
        {
          label: '📦 Catalog', translations: { cs: '📦 Katalog' },
          items: [
            { label: 'Products', translations: { cs: 'Produkty' }, slug: 'admin/products' },
            { label: 'Product Conditions', translations: { cs: 'Podmínky produktu' }, slug: 'admin/product-conditions' },
            { label: 'Categories', translations: { cs: 'Kategorie' }, slug: 'admin/categories' },
            { label: 'Inventory', translations: { cs: 'Skladové zásoby' }, slug: 'admin/inventory' },
            { label: 'Reviews', translations: { cs: 'Recenze' }, slug: 'admin/reviews' },
          ],
        },
        {
          label: '🛒 Sales', translations: { cs: '🛒 Prodej' },
          items: [
            { label: 'Orders', translations: { cs: 'Objednávky' }, slug: 'admin/orders' },
            { label: 'Returns & Refunds', translations: { cs: 'Vrácení a vrácení peněz' }, slug: 'admin/returns' },
            { label: 'Customers', translations: { cs: 'Zákazníci' }, slug: 'admin/customers' },
            { label: 'Pricing', translations: { cs: 'Ceny' }, slug: 'admin/pricing' },
            { label: 'Coupons', translations: { cs: 'Kupóny' }, slug: 'admin/pricing-coupons' },
            { label: 'Discount Rules', translations: { cs: 'Pravidla slev' }, slug: 'admin/pricing-discounts' },
            { label: 'Price Lists', translations: { cs: 'Ceníky' }, slug: 'admin/pricing-pricelists' },
          ],
        },
        {
          label: '📝 Content (CMS)', translations: { cs: '📝 Obsah (CMS)' },
          items: [
            { label: 'Navigation', translations: { cs: 'Navigace' }, slug: 'admin/cms-navigation' },
            { label: 'Pages', translations: { cs: 'Stránky' }, slug: 'admin/cms-pages' },
            { label: 'Blog', translations: { cs: 'Blog' }, slug: 'admin/cms-blog' },
            { label: 'Team', translations: { cs: 'Tým' }, slug: 'admin/cms-team' },
            { label: 'FAQ', translations: { cs: 'FAQ' }, slug: 'admin/cms-faq' },
            { label: 'Legal Pages', translations: { cs: 'Právní stránky' }, slug: 'admin/cms-legal' },
          ],
        },
        {
          label: '🎨 Store Settings', translations: { cs: '🎨 Nastavení obchodu' },
          items: [
            { label: 'Branding & Theme', translations: { cs: 'Vzhled značky a téma' }, slug: 'admin/settings-branding' },
            { label: 'Homepage Layout', translations: { cs: 'Rozvržení domovské stránky' }, slug: 'admin/settings-layout' },
            { label: 'Homepage Content', translations: { cs: 'Obsah domovské stránky' }, slug: 'admin/settings-content' },
            { label: 'Benefits', translations: { cs: 'Výhody' }, slug: 'admin/settings-benefits' },
            { label: 'Footer', translations: { cs: 'Zápatí' }, slug: 'admin/settings-footer' },
            { label: 'Badges', translations: { cs: 'Odznaky' }, slug: 'admin/settings-badges' },
            { label: 'Domains', translations: { cs: 'Domény' }, slug: 'admin/settings-domains' },
            { label: 'Newsletter', translations: { cs: 'Newsletter' }, slug: 'admin/settings-newsletter' },
            { label: 'Shipping', translations: { cs: 'Doprava' }, slug: 'admin/settings-shipping' },
          ],
        },
        {
          label: '📊 Insights', translations: { cs: '📊 Přehledy' },
          items: [
            { label: 'Reports', translations: { cs: 'Reporty' }, slug: 'admin/reports' },
            { label: 'Audit Log', translations: { cs: 'Protokol auditu' }, slug: 'admin/audit' },
          ],
        },
        {
          label: '🔌 API Integration', translations: { cs: '🔌 Integrace API' },
          items: [
            { label: 'API Overview', translations: { cs: 'Přehled API' }, slug: 'api/overview' },
            ...openAPISidebarGroups,
          ],
        },
        {
          label: '🗺️ Guides', translations: { cs: '🗺️ Průvodci' },
          items: [
            { label: 'Complete Customer Journey', translations: { cs: 'Kompletní cesta zákazníka' }, slug: 'guides/customer-journey' },
            { label: 'Integrations (Stripe, Email, Shipping)', translations: { cs: 'Integrace (Stripe, Email, Shipping)' }, slug: 'guides/integrations' },
          ],
        },
        {
          label: '🧪 Testing', translations: { cs: '🧪 Testování' },
          items: [
            { label: 'E2E Test Suite', translations: { cs: 'E2E Test Suite' }, slug: 'testing/e2e' },
            { label: 'Test Coverage', translations: { cs: 'Pokrytí testy' }, slug: 'testing/coverage' },
          ],
        },
        {
          label: '📍 Roadmap & Progress', translations: { cs: '📍 Plán a pokrok' },
          items: [
            { label: 'Current Progress', translations: { cs: 'Aktuální pokrok' }, slug: 'roadmap/progress' },
            { label: 'Roadmap', translations: { cs: 'Plán vývoje' }, slug: 'roadmap/future' },
          ],
        },
      ],
    }),
  ],
});
