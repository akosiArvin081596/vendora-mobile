// Role constants
export const ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
};

// Permission constants
export const PERMISSIONS = {
  ADMIN_PANEL_ACCESS: 'admin_panel_access',
  USER_MANAGEMENT: 'user_management',
  USER_ACTIVATE: 'user_activate',
  VENDOR_APPROVALS: 'vendor_approvals',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_ACTIVITY_LOGS: 'view_activity_logs',
  POS_ACCESS: 'pos_access',
  DASHBOARD_ACCESS: 'dashboard_access',
  SALES_ACCESS: 'sales_access',
  INVENTORY_ACCESS: 'inventory_access',
  PRODUCTS_ACCESS: 'products_access',
  ORDERS_ACCESS: 'orders_access',
  REPORTS_ACCESS: 'reports_access',
  SETTINGS_ACCESS: 'settings_access',
  STORE_ACCESS: 'store_access',
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.ADMIN_PANEL_ACCESS,
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.USER_ACTIVATE,
    PERMISSIONS.VENDOR_APPROVALS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_ACTIVITY_LOGS,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.DASHBOARD_ACCESS,
    PERMISSIONS.SALES_ACCESS,
    PERMISSIONS.INVENTORY_ACCESS,
    PERMISSIONS.PRODUCTS_ACCESS,
    PERMISSIONS.ORDERS_ACCESS,
    PERMISSIONS.REPORTS_ACCESS,
    PERMISSIONS.SETTINGS_ACCESS,
    PERMISSIONS.STORE_ACCESS,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.ADMIN_PANEL_ACCESS,
    PERMISSIONS.USER_ACTIVATE, // Can only manage Cashiers/Customers
    PERMISSIONS.VENDOR_APPROVALS,
    PERMISSIONS.VIEW_ACTIVITY_LOGS,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.DASHBOARD_ACCESS,
    PERMISSIONS.SALES_ACCESS,
    PERMISSIONS.INVENTORY_ACCESS,
    PERMISSIONS.PRODUCTS_ACCESS,
    PERMISSIONS.ORDERS_ACCESS,
    PERMISSIONS.REPORTS_ACCESS,
    PERMISSIONS.SETTINGS_ACCESS,
    PERMISSIONS.STORE_ACCESS,
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.SALES_ACCESS,
    PERMISSIONS.ORDERS_ACCESS,
    PERMISSIONS.SETTINGS_ACCESS,
  ],
  [ROLES.VENDOR]: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.DASHBOARD_ACCESS,
    PERMISSIONS.SALES_ACCESS,
    PERMISSIONS.INVENTORY_ACCESS,
    PERMISSIONS.PRODUCTS_ACCESS,
    PERMISSIONS.SETTINGS_ACCESS,
  ],
  [ROLES.CUSTOMER]: [
    PERMISSIONS.STORE_ACCESS,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Get all permissions for a role
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if user can manage another user (role hierarchy)
export function canManageUser(currentUserRole, targetUserRole) {
  if (currentUserRole === ROLES.ADMIN) {
    return true; // Admin can manage all
  }
  if (currentUserRole === ROLES.MANAGER) {
    // Manager can only manage Cashiers and Customers
    return [ROLES.CASHIER, ROLES.CUSTOMER].includes(targetUserRole);
  }
  return false;
}

// Get role display name
export function getRoleDisplayName(role) {
  const displayNames = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.VENDOR]: 'Vendor',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.CASHIER]: 'Cashier',
    [ROLES.CUSTOMER]: 'Customer',
  };
  return displayNames[role] || role;
}

// Get role color for UI
export function getRoleColor(role) {
  const colors = {
    [ROLES.ADMIN]: '#ef4444', // Red
    [ROLES.VENDOR]: '#8b5cf6', // Purple
    [ROLES.MANAGER]: '#f59e0b', // Amber
    [ROLES.CASHIER]: '#10b981', // Green
    [ROLES.CUSTOMER]: '#6366f1', // Indigo
  };
  return colors[role] || '#9ca3af';
}

// Activity log action types
export const ACTIVITY_ACTIONS = {
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  USER_SUSPEND: 'USER_SUSPEND',
  VENDOR_APPROVE: 'VENDOR_APPROVE',
  VENDOR_REJECT: 'VENDOR_REJECT',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

// Get action display name
export function getActionDisplayName(action) {
  const displayNames = {
    [ACTIVITY_ACTIONS.USER_CREATE]: 'Created User',
    [ACTIVITY_ACTIONS.USER_UPDATE]: 'Updated User',
    [ACTIVITY_ACTIONS.USER_DELETE]: 'Deleted User',
    [ACTIVITY_ACTIONS.USER_ACTIVATE]: 'Activated User',
    [ACTIVITY_ACTIONS.USER_DEACTIVATE]: 'Deactivated User',
    [ACTIVITY_ACTIONS.USER_SUSPEND]: 'Suspended User',
    [ACTIVITY_ACTIONS.VENDOR_APPROVE]: 'Approved Vendor',
    [ACTIVITY_ACTIONS.VENDOR_REJECT]: 'Rejected Vendor',
    [ACTIVITY_ACTIONS.SETTINGS_UPDATE]: 'Updated Settings',
    [ACTIVITY_ACTIONS.LOGIN]: 'Logged In',
    [ACTIVITY_ACTIONS.LOGOUT]: 'Logged Out',
  };
  return displayNames[action] || action;
}

// Get action color for UI
export function getActionColor(action) {
  const colors = {
    [ACTIVITY_ACTIONS.USER_CREATE]: '#10b981',
    [ACTIVITY_ACTIONS.USER_UPDATE]: '#3b82f6',
    [ACTIVITY_ACTIONS.USER_DELETE]: '#ef4444',
    [ACTIVITY_ACTIONS.USER_ACTIVATE]: '#10b981',
    [ACTIVITY_ACTIONS.USER_DEACTIVATE]: '#f59e0b',
    [ACTIVITY_ACTIONS.USER_SUSPEND]: '#ef4444',
    [ACTIVITY_ACTIONS.VENDOR_APPROVE]: '#10b981',
    [ACTIVITY_ACTIONS.VENDOR_REJECT]: '#ef4444',
    [ACTIVITY_ACTIONS.SETTINGS_UPDATE]: '#8b5cf6',
    [ACTIVITY_ACTIONS.LOGIN]: '#6366f1',
    [ACTIVITY_ACTIONS.LOGOUT]: '#9ca3af',
  };
  return colors[action] || '#9ca3af';
}
