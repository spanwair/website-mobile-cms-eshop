// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'CMS Documentation',
      description: 'Complete guide to the website-mobile-template CMS — for admins, developers, and business owners.',
      social: [],
      sidebar: [
        {
          label: '🚀 Getting Started',
          items: [
            { label: 'Overview', slug: 'getting-started/overview' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Environment Setup', slug: 'getting-started/environment' },
          ],
        },
        {
          label: '🏗️ Architecture',
          items: [
            { label: 'Project Structure', slug: 'architecture/structure' },
            { label: 'Database Schema', slug: 'architecture/database' },
            { label: 'Authentication & Auth Flow', slug: 'architecture/auth' },
          ],
        },
        {
          label: '👥 User Management',
          items: [
            { label: 'Role Hierarchy', slug: 'users/roles' },
            { label: 'Organizations (Parties)', slug: 'users/organizations' },
            { label: 'Permissions System', slug: 'users/permissions' },
          ],
        },
        {
          label: '🛍️ Admin Guide',
          items: [
            { label: 'Dashboard', slug: 'admin/dashboard' },
            { label: 'Products', slug: 'admin/products' },
            { label: 'Categories', slug: 'admin/categories' },
            { label: 'Orders', slug: 'admin/orders' },
            { label: 'Customers', slug: 'admin/customers' },
            { label: 'Inventory', slug: 'admin/inventory' },
            { label: 'Pricing & Coupons', slug: 'admin/pricing' },
            { label: 'Reviews', slug: 'admin/reviews' },
            { label: 'Returns & Refunds', slug: 'admin/returns' },
            { label: 'Notifications', slug: 'admin/notifications' },
          ],
        },
        {
          label: '🗺️ Guides',
          items: [
            { label: 'Complete Customer Journey', slug: 'guides/customer-journey' },
            { label: 'Integrations (Stripe, Email, Shipping)', slug: 'guides/integrations' },
          ],
        },
        {
          label: '🧪 Testing',
          items: [
            { label: 'E2E Test Suite', slug: 'testing/e2e' },
            { label: 'Test Coverage', slug: 'testing/coverage' },
          ],
        },
        {
          label: '📍 Roadmap & Progress',
          items: [
            { label: 'Current Progress', slug: 'roadmap/progress' },
            { label: 'Roadmap', slug: 'roadmap/future' },
          ],
        },
      ],
    }),
  ],
});
