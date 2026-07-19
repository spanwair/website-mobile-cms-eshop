// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

export default defineConfig({
  integrations: [
    starlight({
      title: 'CMS Documentation',
      description: 'Complete guide to the website-mobile-template CMS — for admins, developers, and business owners.',
      social: [],
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
            { label: 'Multi-Tenant Architecture', slug: 'architecture/multi-tenancy' },
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
            { label: 'Setup (First Login)', slug: 'admin/setup' },
            { label: 'Dashboard', slug: 'admin/dashboard' },
            { label: 'Organizations', slug: 'admin/parties' },
            { label: 'Users', slug: 'admin/users' },
            { label: 'Roles', slug: 'admin/roles' },
            { label: 'Products', slug: 'admin/products' },
            { label: 'Categories', slug: 'admin/categories' },
            { label: 'Orders', slug: 'admin/orders' },
            { label: 'Returns & Refunds', slug: 'admin/returns' },
            { label: 'Customers', slug: 'admin/customers' },
            { label: 'Inventory', slug: 'admin/inventory' },
            { label: 'Pricing & Coupons', slug: 'admin/pricing' },
            { label: 'Reviews', slug: 'admin/reviews' },
            { label: 'Reports', slug: 'admin/reports' },
            { label: 'Audit Log', slug: 'admin/audit' },
            { label: 'Notifications', slug: 'admin/notifications' },
          ],
        },
        {
          label: '🔌 API Integration',
          items: [
            { label: 'API Overview', slug: 'api/overview' },
            ...openAPISidebarGroups,
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
