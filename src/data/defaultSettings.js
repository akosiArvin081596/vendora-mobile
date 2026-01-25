// Default system settings for Vendora POS
export const defaultSettings = {
  business: {
    name: 'Vendora Store',
    address: '123 Main Street, City, Country',
    phone: '+1 234 567 8900',
    email: 'contact@vendora.com',
    tin: '',
    logo: null,
  },
  tax: {
    enabled: true,
    rate: 12, // 12% VAT
    seniorDiscount: 20, // 20% discount
    pwdDiscount: 20, // 20% discount
  },
  payments: {
    cashEnabled: true,
    cardEnabled: true,
    ewalletEnabled: true,
  },
  pos: {
    requireCustomer: false,
    lowStockThreshold: 10,
    allowNegativeStock: false,
  },
};

// Default admin account
export const defaultAdminUser = {
  id: 'admin-001',
  email: 'admin@vendora.com',
  password: 'admin123', // In production, this would be hashed
  name: 'System Administrator',
  role: 'admin',
  status: 'active',
  phone: '+1 234 567 8900',
  avatar: null,
  createdAt: new Date().toISOString(),
  lastLoginAt: null,
};

// Sample vendor applications for demo
export const sampleVendorApplications = [
  {
    id: 'vendor-app-001',
    businessName: 'Fresh Produce Co.',
    ownerName: 'Maria Santos',
    email: 'maria@freshproduce.com',
    phone: '+1 555 123 4567',
    businessType: 'Food & Groceries',
    description: 'We supply fresh fruits and vegetables from local farms.',
    address: '456 Market Street, City',
    documents: ['business_permit.pdf', 'tax_cert.pdf'],
    status: 'pending',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'vendor-app-002',
    businessName: 'Tech Gadgets Hub',
    ownerName: 'John Cruz',
    email: 'john@techgadgets.com',
    phone: '+1 555 987 6543',
    businessType: 'Electronics',
    description: 'Retailer of smartphones, accessories, and electronics.',
    address: '789 Tech Ave, City',
    documents: ['business_permit.pdf'],
    status: 'pending',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// AsyncStorage keys
export const STORAGE_KEYS = {
  AUTH_USER: '@vendora_auth_user',
  USERS: '@vendora_users',
  VENDOR_APPS: '@vendora_vendor_apps',
  SETTINGS: '@vendora_settings',
  ACTIVITY_LOGS: '@vendora_activity_logs',
};
