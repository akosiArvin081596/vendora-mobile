import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency } from '../utils/checkoutHelpers';

const PRINTER_STORAGE_KEY = '@vendora_last_printer';
const CHAR_WIDTH = 32;

let BluetoothManager = null;
let BluetoothEscposPrinter = null;

/**
 * Lazily load the bluetooth printer module.
 * Returns false if the native module is unavailable (e.g. Expo Go).
 */
function loadPrinterModule() {
  if (BluetoothManager !== null) {
    return true;
  }
  try {
    const mod = require('react-native-bluetooth-escpos-printer');
    BluetoothManager = mod.BluetoothManager;
    BluetoothEscposPrinter = mod.BluetoothEscposPrinter;
    return true;
  } catch {
    return false;
  }
}

/**
 * Thermal Printer Service
 * Handles Bluetooth ESC/POS thermal printing for 58mm printers (32 char width).
 */
const thermalPrinterService = {
  /**
   * Request Bluetooth permissions on Android 12+
   */
  requestPermissions: async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every(
        (v) => v === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch {
      return false;
    }
  },

  /**
   * Check if the native printer module is available
   */
  isAvailable: () => {
    return loadPrinterModule();
  },

  /**
   * Enable Bluetooth adapter
   */
  enableBluetooth: async () => {
    if (!loadPrinterModule()) {
      throw new Error('Bluetooth printer module not available. Use a development build.');
    }
    await BluetoothManager.enableBluetooth();
  },

  /**
   * Get paired/bonded Bluetooth devices (already paired via phone settings)
   * @returns {Promise<Array<{name: string, address: string}>>}
   */
  getPairedDevices: async () => {
    if (!loadPrinterModule()) {
      throw new Error('Bluetooth printer module not available.');
    }
    await thermalPrinterService.requestPermissions();

    const result = await BluetoothManager.enableBluetooth();
    const devices = [];
    if (Array.isArray(result)) {
      result.forEach((item) => {
        try {
          const parsed = typeof item === 'string' ? JSON.parse(item) : item;
          if (parsed.address) {
            devices.push(parsed);
          }
        } catch {
          // skip unparseable entries
        }
      });
    }
    return devices;
  },

  /**
   * Connect to a printer by Bluetooth address
   * @param {string} address
   */
  connect: async (address) => {
    if (!loadPrinterModule()) {
      throw new Error('Bluetooth printer module not available.');
    }
    await BluetoothManager.connect(address);
    await thermalPrinterService.saveLastPrinter(address);
  },

  /**
   * Disconnect from the current printer
   */
  disconnect: async () => {
    if (!loadPrinterModule()) {
      return;
    }
    try {
      await BluetoothManager.disconnect();
    } catch {
      // ignore disconnect errors
    }
  },

  /**
   * Save last connected printer address
   */
  saveLastPrinter: async (address) => {
    try {
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, address);
    } catch {
      // ignore storage errors
    }
  },

  /**
   * Get last connected printer address
   * @returns {Promise<string|null>}
   */
  getLastPrinter: async () => {
    try {
      return await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Pad/align a left-right pair to fill CHAR_WIDTH
   */
  formatLine: (left, right) => {
    const maxLeft = CHAR_WIDTH - right.length - 1;
    const trimmedLeft = left.length > maxLeft ? left.substring(0, maxLeft) : left;
    const spaces = CHAR_WIDTH - trimmedLeft.length - right.length;
    return trimmedLeft + ' '.repeat(Math.max(spaces, 1)) + right;
  },

  /**
   * Center a string within CHAR_WIDTH
   */
  centerText: (text) => {
    if (text.length >= CHAR_WIDTH) {
      return text.substring(0, CHAR_WIDTH);
    }
    const pad = Math.floor((CHAR_WIDTH - text.length) / 2);
    return ' '.repeat(pad) + text;
  },

  /**
   * Build receipt text lines from receipt data
   * @param {Object} data - Receipt data from checkout
   * @returns {string}
   */
  buildReceiptText: (data) => {
    const {
      items,
      subtotal,
      discount,
      discountType,
      discountValue,
      discountLabel,
      vatExempt,
      tax,
      taxRate,
      total,
      paymentMethod,
      amountTendered,
      change,
      customerName,
      transactionId,
      timestamp,
    } = data;

    const PAYMENT_LABELS = { cash: 'Cash', card: 'Card', ewallet: 'E-Wallet' };
    const divider = '='.repeat(CHAR_WIDTH);
    const thinDivider = '-'.repeat(CHAR_WIDTH);
    const fmt = thermalPrinterService.formatLine;
    const center = thermalPrinterService.centerText;

    const dateStr = timestamp
      ? new Date(timestamp).toLocaleString('en-PH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    const lines = [
      divider,
      center('VENDORA POS'),
      center('Transaction Successful'),
      divider,
      fmt('Transaction #', transactionId || ''),
      fmt('Date', dateStr),
      fmt('Customer', customerName || 'Walk-in'),
      thinDivider,
      'Items',
    ];

    items.forEach((item) => {
      const name = `${item.name} x${item.quantity}`;
      const price = `P ${formatCurrency(item.price * item.quantity)}`;
      lines.push(fmt(name, price));
    });

    lines.push(thinDivider);
    lines.push(fmt('Subtotal', `P ${formatCurrency(subtotal)}`));

    if (discount > 0) {
      const label = discountLabel || 'Discount';
      const discDesc =
        discountType === 'percentage' ? `${label} (${discountValue}%)` : label;
      lines.push(fmt(discDesc, `- P ${formatCurrency(discount)}`));
    }

    if (vatExempt) {
      lines.push(fmt('Tax (VAT Exempt)', 'P 0.00'));
    } else if (tax > 0) {
      lines.push(fmt(`Tax (${taxRate}%)`, `+ P ${formatCurrency(tax)}`));
    }

    lines.push(divider);
    lines.push(fmt('TOTAL', `P ${formatCurrency(total)}`));
    lines.push(divider);
    lines.push(fmt('Payment Method', PAYMENT_LABELS[paymentMethod] || paymentMethod));

    if (paymentMethod === 'cash') {
      lines.push(fmt('Amount Tendered', `P ${formatCurrency(amountTendered)}`));
      lines.push(fmt('Change', `P ${formatCurrency(change)}`));
    }

    lines.push(thinDivider);
    lines.push(center('Thank you for your purchase!'));
    lines.push(center('Please come again.'));
    lines.push(divider);
    lines.push(''); // feed

    return lines.join('\n');
  },

  /**
   * Open the cash drawer connected via RJ11 to the printer
   * @param {number} pin - Drawer kick pin (0 = pin 2, 1 = pin 5). Default 0.
   */
  openCashDrawer: async (pin = 0) => {
    if (!loadPrinterModule()) {
      throw new Error('Bluetooth printer module not available.');
    }
    await BluetoothEscposPrinter.openCashDrawer(pin);
  },

  /**
   * Print a receipt on the connected thermal printer
   * @param {Object} receiptData - Receipt data from checkout
   */
  printReceipt: async (receiptData) => {
    if (!loadPrinterModule()) {
      throw new Error('Bluetooth printer module not available. Use a development build.');
    }

    const text = thermalPrinterService.buildReceiptText(receiptData);

    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerLeftSpace(0);
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(text, { encoding: 'GBK', codepage: 0 });
    await BluetoothEscposPrinter.printText('\n\n\n', {});
    // Open cash drawer after printing if payment is cash
    if (receiptData.paymentMethod === 'cash') {
      try {
        await BluetoothEscposPrinter.openCashDrawer(0);
      } catch {
        // ignore if cash drawer not connected
      }
    }
  },
};

export default thermalPrinterService;
