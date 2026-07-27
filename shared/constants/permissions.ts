// SINGLE SOURCE OF TRUTH for roles and permissions.
// Every check across website, mobile, and DB must use these constants.
// Never use raw bit numbers or role numbers outside this file.

export const PERMISSIONS = {
  VIEW_DASHBOARD:    1,
  MANAGE_USERS:      2,
  MANAGE_ROLES:      4,
  MANAGE_PRODUCTS:   8,
  MANAGE_CATEGORIES: 16,
  MANAGE_ORDERS:     32,
  MANAGE_INVENTORY:  64,
  MANAGE_PRICING:    128,
  MANAGE_CUSTOMERS:  256,
  MANAGE_REPORTS:    512,
  MANAGE_SETTINGS:   1024,
  MANAGE_CMS:        2048,
  MANAGE_AUDIT:      4096,
} as const;

// Granted to owner and admin — they bypass per-party permission checks.
export const ALL_PERMISSIONS = 0xffff;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role hierarchy. Higher number = more privilege.
export const ROLE = {
  USER:        1,   // customer only — no admin panel access
  ESHOP_ADMIN: 2,   // manages one org — access gated by PERMISSIONS bits
  ADMIN:       4,   // manages assigned orgs — full permissions, can assign eshop_admin
  OWNER:       8,   // global access — creates orgs, assigns admins, no party restriction
} as const;

export type AppRole = typeof ROLE[keyof typeof ROLE];

export const ROLE_LABEL: Record<AppRole, string> = {
  [ROLE.USER]:        'user',
  [ROLE.ESHOP_ADMIN]: 'eshop_admin',
  [ROLE.ADMIN]:       'admin',
  [ROLE.OWNER]:       'owner',
};

export const ROLE_FROM_LABEL: Record<string, AppRole> = {
  user:        ROLE.USER,
  eshop_admin: ROLE.ESHOP_ADMIN,
  admin:       ROLE.ADMIN,
  owner:       ROLE.OWNER,
};

// Human-readable labels for each permission bit — import this for UI, do not redefine locally.
export const PERMISSION_LABELS: Record<keyof typeof PERMISSIONS, string> = {
  VIEW_DASHBOARD:    'Dashboard',
  MANAGE_USERS:      'Users & Parties',
  MANAGE_ROLES:      'Roles',
  MANAGE_PRODUCTS:   'Products',
  MANAGE_CATEGORIES: 'Categories',
  MANAGE_ORDERS:     'Orders',
  MANAGE_INVENTORY:  'Inventory',
  MANAGE_PRICING:    'Pricing',
  MANAGE_CUSTOMERS:  'Customers',
  MANAGE_REPORTS:    'Reports',
  MANAGE_SETTINGS:   'Store Settings',
  MANAGE_CMS:        'Content (Pages, Blog, Nav)',
  MANAGE_AUDIT:      'Audit Log',
};

export function hasPermission(userPermissions: number, permission: number): boolean {
  return (userPermissions & permission) !== 0;
}

export function combinePermissions(...permissions: number[]): number {
  return permissions.reduce((acc, p) => acc | p, 0);
}

// True when `assignerRole` may assign `targetRole`.
// Owner: everyone including other owners. Admin: up to and including admin (peer). Others: strictly below.
export function canAssignRole(assignerRole: number, targetRole: number): boolean {
  if (assignerRole >= ROLE.OWNER) return true;
  if (assignerRole >= ROLE.ADMIN) return targetRole <= ROLE.ADMIN;
  return targetRole < assignerRole;
}

// Returns the roles that `myRole` is allowed to assign.
export function assignableRoles(myRole: number): AppRole[] {
  return (Object.values(ROLE) as AppRole[]).filter(r => canAssignRole(myRole, r));
}
