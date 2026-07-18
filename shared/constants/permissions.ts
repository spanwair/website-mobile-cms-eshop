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
  VIEW_REPORTS:      512,
  MANAGE_CMS:        1024,
  MANAGE_FILES:      2048,
  MANAGE_SETTINGS:   4096,
  BILLING:           8192,
  API_MANAGEMENT:    16384,
  FULL_ACCESS:       32768,
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export function hasPermission(userPermissions: number, permission: number): boolean {
  return (userPermissions & permission) !== 0;
}

export function combinePermissions(...permissions: number[]): number {
  return permissions.reduce((acc, p) => acc | p, 0);
}

// Role hierarchy — higher value means higher privilege.
// owner=8 > admin=4 > eshop_admin=2 > user=1
// A user may only assign roles with a value strictly lower than their own.
export const ROLE = {
  USER:        1,
  ESHOP_ADMIN: 2,
  ADMIN:       4,
  OWNER:       8,
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

/** Returns all roles a user with `myRole` can assign (strictly lower than their own). */
export function assignableRoles(myRole: number): AppRole[] {
  return (Object.values(ROLE) as AppRole[]).filter(r => r < myRole);
}
