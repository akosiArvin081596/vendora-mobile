import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency, formatDateTime } from './checkoutHelpers';

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  ewallet: 'E-Wallet',
};

/**
 * Generate HTML string for PDF receipt
 */
export function generateReceiptHTML(receiptData) {
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
    notes,
  } = receiptData;

  const itemsHTML = items
    .map(
      (item) => `
      <div class="item-row">
        <span class="item-name">${item.name}</span>
        <span class="item-qty">x${item.quantity}</span>
        <span class="item-price">P ${formatCurrency(item.price * item.quantity)}</span>
      </div>
    `
    )
    .join('');

  const discountHTML =
    discount > 0
      ? `
      <div class="summary-row">
        <span>Discount (${discountLabel || 'Custom'})${discountType === 'percentage' ? ` ${discountValue}%` : ''}</span>
        <span class="discount">- P ${formatCurrency(discount)}</span>
      </div>
    `
      : '';

  const taxHTML = vatExempt
    ? `
      <div class="summary-row">
        <span>Tax (VAT Exempt)</span>
        <span class="discount">P 0.00</span>
      </div>
    `
    : tax > 0
      ? `
      <div class="summary-row">
        <span>Tax (${taxRate}%)</span>
        <span>+ P ${formatCurrency(tax)}</span>
      </div>
    `
      : '';

  const cashPaymentHTML =
    paymentMethod === 'cash'
      ? `
      <div class="payment-row">
        <span>Amount Tendered</span>
        <span>P ${formatCurrency(amountTendered)}</span>
      </div>
      <div class="payment-row">
        <span>Change</span>
        <span class="change">P ${formatCurrency(change)}</span>
      </div>
    `
      : '';

  const notesHTML =
    notes && notes.trim()
      ? `
      <div class="notes-section">
        <div class="notes-label">Notes</div>
        <div class="notes-text">${notes}</div>
      </div>
    `
      : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #333;
          padding: 20px;
          max-width: 300px;
          margin: 0 auto;
          background: #fff;
        }
        .header {
          text-align: center;
          padding-bottom: 15px;
          border-bottom: 2px dashed #333;
          margin-bottom: 15px;
        }
        .store-name {
          font-size: 20px;
          font-weight: bold;
          color: #9333ea;
          margin-bottom: 5px;
        }
        .success-text {
          color: #22c55e;
          font-size: 11px;
        }
        .info-section {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px dashed #ccc;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 11px;
        }
        .info-label {
          color: #666;
        }
        .items-section {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px dashed #ccc;
        }
        .items-header {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 11px;
        }
        .item-name {
          flex: 1;
          padding-right: 10px;
        }
        .item-qty {
          color: #666;
          margin-right: 10px;
        }
        .summary-section {
          margin-bottom: 15px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 11px;
        }
        .discount {
          color: #22c55e;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: bold;
          padding-top: 10px;
          margin-top: 10px;
          border-top: 2px solid #333;
        }
        .total-amount {
          color: #9333ea;
        }
        .payment-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 11px;
        }
        .change {
          color: #22c55e;
          font-weight: bold;
        }
        .notes-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
        }
        .notes-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 4px;
        }
        .notes-text {
          font-size: 11px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px dashed #333;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">VENDORA POS</div>
        <div class="success-text">Transaction Successful</div>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Transaction #</span>
          <span>${transactionId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span>${formatDateTime(timestamp)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Customer</span>
          <span>${customerName}</span>
        </div>
      </div>

      <div class="items-section">
        <div class="items-header">Items</div>
        ${itemsHTML}
      </div>

      <div class="summary-section">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>P ${formatCurrency(subtotal)}</span>
        </div>
        ${discountHTML}
        ${taxHTML}
        <div class="total-row">
          <span>TOTAL</span>
          <span class="total-amount">P ${formatCurrency(total)}</span>
        </div>
      </div>

      <div class="payment-section">
        <div class="payment-row">
          <span>Payment Method</span>
          <span>${PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}</span>
        </div>
        ${cashPaymentHTML}
      </div>

      ${notesHTML}

      <div class="footer">
        Thank you for your purchase!<br>
        Please come again.
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate PDF from HTML and return file URI
 */
export async function generatePDF(html) {
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  return uri;
}

/**
 * Open system print dialog with receipt
 */
export async function printReceipt(html) {
  await Print.printAsync({ html });
}

/**
 * Share a file using native share sheet
 */
export async function shareFile(uri, title = 'Receipt') {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  const mimeType = uri.endsWith('.pdf') ? 'application/pdf' : 'image/png';
  const UTI = uri.endsWith('.pdf') ? 'com.adobe.pdf' : 'public.png';

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: title,
    UTI,
  });
}

/**
 * Capture a view as an image using react-native-view-shot
 */
export async function captureReceiptAsImage(viewRef) {
  if (!viewRef?.current?.capture) {
    throw new Error('Invalid view reference');
  }
  const uri = await viewRef.current.capture();
  return uri;
}
