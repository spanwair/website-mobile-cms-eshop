---
title: Authentication & Auth Flow
description: How login, session management, and access control work.
---

## How authentication works

The platform uses **Supabase Auth** for authentication. Supabase Auth handles:
- User accounts and passwords
- Session tokens (JWT)
- OAuth (Google Sign-In)
- Magic links (passwordless email login)

## Login flow

1. User goes to `/login`
2. Enters email + password (or uses Google/magic link)
3. Supabase validates credentials and returns a JWT session
4. The session is stored in a cookie (SSR) or local storage (mobile)
5. On the next request, the server reads the cookie, validates the JWT with Supabase, and loads the user's profile
6. If the profile's `role >= ESHOP_ADMIN (2)`, the user can access `/admin`
7. If the role is `USER (1)` or lower, they are redirected to `/dashboard`

## Server-side auth guard

Every admin page starts with:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) return Astro.redirect("/login");

const ctx = await requireAdminCtx(supabase, session.user.id);
if (!ctx) return Astro.redirect("/dashboard");
```

`requireAdminCtx()` checks:
1. The user's `role` in the `profiles` table
2. Which party (organization) the user belongs to
3. Their permissions for that party

## Supabase client in SSR

The website uses a **service-role client** for SSR operations, which bypasses Row Level Security. The access control is enforced at the application layer (the admin guard and scoped queries).

The mobile app uses an **anon-key client** with the user's JWT — RLS applies there.

## Session persistence

On the website, sessions are stored in cookies that expire in 7 days. On the mobile app, sessions are stored with MMKV (encrypted local storage) and persist until the user logs out.

## Logging out

Call `supabase.auth.signOut()`. This clears the session cookie and redirects to `/login`.

## Magic links

Supabase supports **magic link** login — the user enters their email and receives a link that logs them in without a password. Enable this in the Supabase Auth settings.

## Google OAuth

Google Sign-In is pre-configured. Set up your OAuth credentials in the Supabase Auth settings and add your redirect URLs. Works on both web and mobile.
