/**
 * Checkout helper functions for Vendora POS
 * UI-only calculations (no backend integration)
 */

/**
 * Discount preset options
 */
export const DISCOUNT_PRESETS = [
  { id: 'none', label: 'None', shortLabel: 'None', percentage: 0, vatExempt: false },
  { id: 'senior', label: 'Senior Citizen', shortLabel: 'SC', percentage: 20, vatExempt: true },
  { id: 'pwd', label: 'PWD', shortLabel: 'PWD', percentage: 20, vatExempt: true },
  { id: 'employee', label: 'Employee', shortLabel: 'Emp', percentage: 10, vatExempt: false },
  { id: 'promo', label: 'Promo Code', shortLabel: 'Promo', percentage: null, vatExempt: false },
  { id: 'custom', label: 'Custom', shortLabel: 'Custom', percentage: null, vatExempt: false },
];

/**
 * Get discount preset by ID
 */
export function getDiscountPreset(presetId) {
  return DISCOUNT_PRESETS.find((p) => p.id === presetId) || DISCOUNT_PRESETS[0];
}

/**
 * Calculate discount amount based on type
 * @param {number} subtotal - Cart subtotal
 * @param {string} discountType - 'amount' or 'percentage'
 * @param {number} discountValue - Discount value
 * @returns {number} - Discount amount in currency
 */
export function calculateDiscount(subtotal, discountType, discountValue) {
  if (!discountValue || discountValue <= 0) return 0;

  if (discountType === 'percentage') {
    const percentage = Math.min(discountValue, 100);
    return (subtotal * percentage) / 100;
  }

  return Math.min(discountValue, subtotal);
}

/**
 * Calculate tax amount
 * @param {number} amountAfterDiscount - Amount after discount applied
 * @param {number} taxRate - Tax percentage (e.g., 12 for 12%)
 * @returns {number} - Tax amount
 */
export function calculateTax(amountAfterDiscount, taxRate) {
  if (!taxRate || taxRate <= 0) return 0;
  return (amountAfterDiscount * taxRate) / 100;
}

/**
 * Calculate final total
 * @param {number} subtotal - Cart subtotal
 * @param {number} discount - Discount amount
 * @param {number} tax - Tax amount
 * @returns {number} - Final total
 */
export function calculateTotal(subtotal, discount, tax) {
  return Math.max(0, subtotal - discount + tax);
}

/**
 * Calculate change for cash payments
 * @param {number} amountTendered - Amount given by customer
 * @param {number} total - Total to pay
 * @returns {number} - Change to return (0 if insufficient)
 */
export function calculateChange(amountTendered, total) {
  if (amountTendered < total) return 0;
  return amountTendered - total;
}

/**
 * Generate unique transaction ID
 * @returns {string} - Transaction ID like "TXN-20260115-A1B2"
 */
export function generateTransactionId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${dateStr}-${random}`;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted string like "1,500.00"
 */
export function formatCurrency(amount) {
  return amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date/time for receipt
 * @param {Date} date - Date object
 * @returns {string} - Formatted string like "Jan 15, 2026 10:30 AM"
 */
export function formatDateTime(date) {
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Validate checkout data before processing
 * @param {Object} checkoutData - Checkout configuration
 * @param {number} total - Total amount
 * @param {number} cartLength - Number of items in cart
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCheckout(checkoutData, total, cartLength) {
  if (cartLength === 0) {
    return { valid: false, error: 'Cart is empty' };
  }

  if (checkoutData.paymentMethod === 'cash') {
    if (checkoutData.amountTendered < total) {
      return { valid: false, error: 'Insufficient amount tendered' };
    }
  }

  return { valid: true };
}
