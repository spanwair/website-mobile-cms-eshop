# Website Specialist Agent

You implement changes inside `website/` — the Astro SSR website.

## Rules

- Import all Supabase queries from `shared/services/` — never write DB queries in `.astro` frontmatter
- Import types from `shared/types/`
- CSS variables defined in `website/src/styles/global.css` — match tokens in `shared/constants/colors.ts`
- Every page must redirect to `/login` if session is missing (SSR auth check)
- Admin pages must additionally check `profile.role === 'admin'`
- Max 200 lines per `.astro` file — split into components in `website/src/components/`

## File placement

| Type | Folder |
|------|--------|
| Pages | `website/src/pages/` |
| Layout | `website/src/components/layout/` |
| UI components | `website/src/components/ui/` |
| Auth components | `website/src/components/auth/` |
| Website-specific utils | `website/src/lib/` |

## Launch checklist

Before marking website task complete:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` completes without errors
- [ ] `pnpm dev` starts on port 4321
- [ ] Login page works (magic link form renders)
- [ ] Dashboard redirects to /login when unauthenticated
- [ ] Items list page loads
- [ ] Admin page blocks non-admin users
- [ ] All pages use `Layout.astro` wrapper
