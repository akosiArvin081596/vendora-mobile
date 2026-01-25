import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { formatCurrency, formatDateTime } from '../utils/checkoutHelpers';

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  ewallet: 'E-Wallet',
};

const PrintableReceipt = forwardRef(({ receiptData }, ref) => {
  if (!receiptData) return null;

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

  return (
    <ViewShot
      ref={ref}
      options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
    >
      <View
        style={{
          backgroundColor: '#ffffff',
          padding: 20,
          width: 320,
        }}
        collapsable={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 15 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: 4,
            }}
          >
            VENDORA POS
          </Text>
          <Text style={{ fontSize: 12, color: '#22c55e' }}>
            Transaction Successful
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            borderBottomWidth: 2,
            borderBottomColor: '#333',
            borderStyle: 'dashed',
            marginBottom: 15,
          }}
        />

        {/* Transaction Info */}
        <View style={{ marginBottom: 15 }}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Transaction #</Text>
            <Text style={styles.value}>{transactionId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDateTime(timestamp)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{customerName}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dashedDivider} />

        {/* Items */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
            Items
          </Text>
          {items.map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                P {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.dashedDivider} />

        {/* Summary */}
        <View style={{ marginBottom: 10 }}>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>P {formatCurrency(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.label}>
                Discount ({discountLabel || 'Custom'})
                {discountType === 'percentage' ? ` ${discountValue}%` : ''}
              </Text>
              <Text style={{ color: '#22c55e', fontSize: 12 }}>
                - P {formatCurrency(discount)}
              </Text>
            </View>
          )}
          {vatExempt ? (
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Tax (VAT Exempt)</Text>
              <Text style={{ color: '#22c55e', fontSize: 12 }}>P 0.00</Text>
            </View>
          ) : tax > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Tax ({taxRate}%)</Text>
              <Text style={styles.value}>+ P {formatCurrency(tax)}</Text>
            </View>
          ) : null}
        </View>

        {/* Total */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTopWidth: 2,
            borderTopColor: '#333',
            marginBottom: 15,
          }}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>
            TOTAL
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#9333ea' }}>
            P {formatCurrency(total)}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.dashedDivider} />

        {/* Payment Details */}
        <View style={{ marginBottom: 10 }}>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>
              {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
            </Text>
          </View>
          {paymentMethod === 'cash' && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Amount Tendered</Text>
                <Text style={styles.value}>
                  P {formatCurrency(amountTendered)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Change</Text>
                <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 12 }}>
                  P {formatCurrency(change)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {notes && notes.trim() !== '' && (
          <View style={{ marginTop: 10 }}>
            <View style={styles.dashedDivider} />
            <Text style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
              Notes
            </Text>
            <Text style={{ fontSize: 12, color: '#333' }}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View
          style={{
            marginTop: 20,
            paddingTop: 15,
            borderTopWidth: 2,
            borderTopColor: '#333',
            borderStyle: 'dashed',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
            Thank you for your purchase!
          </Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Please come again.</Text>
        </View>
      </View>
    </ViewShot>
  );
});

const styles = {
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#666',
  },
  value: {
    fontSize: 11,
    color: '#333',
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 11,
    color: '#333',
  },
  itemQty: {
    fontSize: 11,
    color: '#666',
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 11,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
};

PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt;
