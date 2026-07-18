---
title: Overview
description: What this platform is and how it fits together.
---

## What you get out of the box

This platform is a **ready-to-use e-commerce backend** built for small-to-medium businesses. It comes with:

- A **web admin panel** to manage your entire shop from a browser
- A **React Native mobile app** your customers can install on Android or iOS
- A **PostgreSQL database** (hosted on Supabase) for all your data
- **Role-based access control** so your team only sees what they need to
- **Automated E2E tests** that verify everything works before you deploy

## The three parts

### 1. Admin Website (`/website`)
Built with [Astro 5](https://astro.build/) in SSR mode. This is where you manage everything:
- Add and edit products
- Process orders
- Manage customers
- Set up discount rules and coupons
- Control who has access to what

The admin panel lives at `/admin` and is protected — only users with the right role can access it.

### 2. Mobile App (`/mobile`)
Built with React Native 0.83 + Expo 55. Your customers use this to browse your shop, place orders, and manage their account. Builds to an Android APK and iOS app.

### 3. Shared Code (`/shared`)
Logic that runs on both the website and the mobile app lives here — things like:
- Database service functions (fetching products, updating orders…)
- TypeScript types
- Translation strings (Czech + English)
- Permission checking utilities

This means you only write it once and it works everywhere.

## Technology stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Website | Astro 5 SSR | Fast, server-rendered, minimal JS |
| Mobile | React Native + Expo | One codebase for Android + iOS |
| Database | Supabase (PostgreSQL) | Managed hosting, built-in auth, RLS |
| Auth | Magic link + Google OAuth | Passwordless option available |
| Package manager | pnpm | Fast, disk-efficient |
| Types | TypeScript strict mode | Catch errors before they hit production |
| Tests | Playwright (E2E) + Jest | Full coverage from browser to unit |
