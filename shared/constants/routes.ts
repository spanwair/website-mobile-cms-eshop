export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ITEMS: "/items",
  ITEM_DETAIL: "/items/:id",
  PROFILE: "/profile",
  ADMIN: "/admin",
  ADMIN_ITEMS: "/admin/items",
  ADMIN_USERS: "/admin/users",
} as const;

export const AUTH_REDIRECT = {
  mobileDev: "template://auth/callback",
  mobileProd: "https://YOUR_DOMAIN/auth/callback",
  websiteProd: "https://YOUR_DOMAIN",
} as const;
