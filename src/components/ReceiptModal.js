import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDateTime } from '../utils/checkoutHelpers';
import {
  generateReceiptHTML,
  printReceipt,
  generatePDF,
  shareFile,
  captureReceiptAsImage,
} from '../utils/receiptHelpers';
import ActionSheet from './ActionSheet';
import PrintableReceipt from './PrintableReceipt';
import BluetoothPrinterModal from './BluetoothPrinterModal';
import thermalPrinterService from '../services/thermalPrinterService';

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  ewallet: 'E-Wallet',
};

export default function ReceiptModal({
  visible,
  onClose,
  receiptData,
  onNewTransaction,
}) {
  const isVisible = Boolean(visible);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const printableReceiptRef = useRef(null);

  if (!receiptData) return null;

  const {
    items,
    subtotal,
    discount,
    discountType,
    discountValue,
    discountPreset,
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

  const handlePrint = () => {
    setShowPrintOptions(true);
  };

  const handleShare = () => {
    setShowShareOptions(true);
  };

  const handleSaveAsPDF = async () => {
    setShowPrintOptions(false);
    setIsProcessing(true);
    try {
      const html = generateReceiptHTML(receiptData);
      await printReceipt(html);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
      console.error('PDF generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThermalPrinter = async () => {
    setShowPrintOptions(false);

    if (!thermalPrinterService.isAvailable()) {
      Alert.alert(
        'Not Available',
        'Bluetooth printer module is not available. Please use a development build instead of Expo Go.'
      );
      return;
    }

    const lastPrinter = await thermalPrinterService.getLastPrinter();
    if (!lastPrinter) {
      setShowPrinterModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      await thermalPrinterService.connect(lastPrinter);
      await thermalPrinterService.printReceipt(receiptData);
      Alert.alert('Success', 'Receipt printed successfully.');
    } catch (error) {
      Alert.alert('Print Error', error.message || 'Failed to print. Try reconnecting the printer.');
      setShowPrinterModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrinterConnected = async () => {
    setShowPrinterModal(false);
    setIsProcessing(true);
    try {
      await thermalPrinterService.printReceipt(receiptData);
      Alert.alert('Success', 'Receipt printed successfully.');
    } catch (error) {
      Alert.alert('Print Error', error.message || 'Failed to print receipt.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareAsImage = async () => {
    setShowShareOptions(false);
    setIsProcessing(true);
    try {
      const uri = await captureReceiptAsImage(printableReceiptRef);
      await shareFile(uri, 'Receipt');
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt image. Please try again.');
      console.error('Image share error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareAsPDF = async () => {
    setShowShareOptions(false);
    setIsProcessing(true);
    try {
      const html = generateReceiptHTML(receiptData);
      const uri = await generatePDF(html);
      await shareFile(uri, 'Receipt');
    } catch (error) {
      Alert.alert('Error', 'Failed to share PDF. Please try again.');
      console.error('PDF share error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    onNewTransaction();
    onClose();
  };

  const printOptions = [
    {
      id: 'pdf',
      label: 'Save as PDF',
      icon: 'document-outline',
      subtitle: 'Generate and save receipt as PDF',
      onPress: handleSaveAsPDF,
    },
    {
      id: 'thermal',
      label: 'Thermal Printer',
      icon: 'print-outline',
      subtitle: 'Print via Bluetooth printer',
      onPress: handleThermalPrinter,
    },
  ];

  const shareOptions = [
    {
      id: 'image',
      label: 'Share as Image',
      icon: 'image-outline',
      subtitle: 'Share receipt as PNG image',
      onPress: handleShareAsImage,
    },
    {
      id: 'pdf',
      label: 'Share as PDF',
      icon: 'document-outline',
      subtitle: 'Share receipt as PDF document',
      onPress: handleShareAsPDF,
    },
  ];

  return (
    <>
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/70 items-center justify-center px-4">
          <View className="bg-vendora-card rounded-3xl w-full max-w-md overflow-hidden">
            {/* Success Header */}
            <View className="bg-vendora-purple/20 items-center py-6">
              <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-3">
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
              </View>
              <Text className="text-vendora-text font-bold text-xl">
                Transaction Successful!
              </Text>
              <Text className="text-vendora-text-muted text-sm mt-1">
                VENDORA POS
              </Text>
            </View>

            {/* Transaction Info */}
            <View className="px-5 py-4 border-b border-vendora-border">
              <View className="flex-row justify-between mb-1">
                <Text className="text-vendora-text-muted text-sm">
                  Transaction #
                </Text>
                <Text className="text-vendora-text text-sm font-medium">
                  {transactionId}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-vendora-text-muted text-sm">Date</Text>
                <Text className="text-vendora-text text-sm">
                  {formatDateTime(timestamp)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-vendora-text-muted text-sm">Customer</Text>
                <Text className="text-vendora-text text-sm">{customerName}</Text>
              </View>
            </View>

            {/* Items List */}
            <ScrollView className="max-h-40 px-5 py-3 border-b border-vendora-border">
              <Text className="text-vendora-text font-semibold mb-2">Items</Text>
              {items.map((item, index) => (
                <View
                  key={item.id || index}
                  className="flex-row justify-between py-1"
                >
                  <View className="flex-1 flex-row">
                    <Text className="text-vendora-text-muted text-sm">
                      {item.name}
                    </Text>
                    <Text className="text-vendora-text-muted text-sm ml-2">
                      x{item.quantity}
                    </Text>
                  </View>
                  <Text className="text-vendora-text text-sm">
                    ₱ {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Totals */}
            <View className="px-5 py-3 border-b border-vendora-border">
              <View className="flex-row justify-between py-1">
                <Text className="text-vendora-text-muted">Subtotal</Text>
                <Text className="text-vendora-text">
                  ₱ {formatCurrency(subtotal)}
                </Text>
              </View>
              {discount > 0 && (
                <View className="flex-row justify-between py-1">
                  <Text className="text-vendora-text-muted">
                    Discount ({discountLabel || 'Custom'})
                    {discountType === 'percentage' && ` ${discountValue}%`}
                  </Text>
                  <Text className="text-green-400">
                    - ₱ {formatCurrency(discount)}
                  </Text>
                </View>
              )}
              {vatExempt ? (
                <View className="flex-row justify-between py-1">
                  <Text className="text-vendora-text-muted">Tax (VAT Exempt)</Text>
                  <Text className="text-green-400">₱ 0.00</Text>
                </View>
              ) : tax > 0 ? (
                <View className="flex-row justify-between py-1">
                  <Text className="text-vendora-text-muted">Tax ({taxRate}%)</Text>
                  <Text className="text-vendora-text">
                    + ₱ {formatCurrency(tax)}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row justify-between py-2 mt-1 border-t border-vendora-border">
                <Text className="text-vendora-text font-bold text-lg">Total</Text>
                <Text className="text-vendora-purple-light font-bold text-lg">
                  ₱ {formatCurrency(total)}
                </Text>
              </View>
            </View>

            {/* Payment Details */}
            <View className="px-5 py-3 border-b border-vendora-border">
              <View className="flex-row justify-between py-1">
                <Text className="text-vendora-text-muted">Payment Method</Text>
                <Text className="text-vendora-text font-medium">
                  {PAYMENT_METHOD_LABELS[paymentMethod]}
                </Text>
              </View>
              {paymentMethod === 'cash' && (
                <>
                  <View className="flex-row justify-between py-1">
                    <Text className="text-vendora-text-muted">
                      Amount Tendered
                    </Text>
                    <Text className="text-vendora-text">
                      ₱ {formatCurrency(amountTendered)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-1">
                    <Text className="text-vendora-text-muted">Change</Text>
                    <Text className="text-green-400 font-medium">
                      ₱ {formatCurrency(change)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Notes */}
            {notes && notes.trim() !== '' && (
              <View className="px-5 py-3 border-b border-vendora-border">
                <Text className="text-vendora-text-muted text-sm mb-1">Notes</Text>
                <Text className="text-vendora-text text-sm">{notes}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="p-5">
              <TouchableOpacity
                className="bg-vendora-purple py-4 rounded-2xl mb-3"
                onPress={handleNewTransaction}
                style={
                  Platform.OS === 'web'
                    ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                    : { elevation: 8 }
                }
              >
                <Text className="text-white font-semibold text-center text-lg">
                  New Transaction
                </Text>
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-vendora-input py-3 rounded-xl flex-row items-center justify-center gap-2"
                  onPress={handlePrint}
                >
                  <Ionicons name="print-outline" size={18} color="#e5e5e5" />
                  <Text className="text-vendora-text font-medium">Print</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-vendora-input py-3 rounded-xl flex-row items-center justify-center gap-2"
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={18} color="#e5e5e5" />
                  <Text className="text-vendora-text font-medium">Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Loading Overlay */}
          {isProcessing && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <View className="bg-vendora-card p-6 rounded-2xl items-center">
                <ActivityIndicator size="large" color="#9333ea" />
                <Text className="text-vendora-text mt-3">Processing...</Text>
              </View>
            </View>
          )}

          {/* Print Options ActionSheet */}
          <ActionSheet
            visible={showPrintOptions}
            onClose={() => setShowPrintOptions(false)}
            title="Print Receipt"
            options={printOptions}
          />

          {/* Share Options ActionSheet */}
          <ActionSheet
            visible={showShareOptions}
            onClose={() => setShowShareOptions(false)}
            title="Share Receipt"
            options={shareOptions}
          />
        </View>
      </Modal>

      {/* Bluetooth Printer Modal */}
      <BluetoothPrinterModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onConnected={handlePrinterConnected}
      />

      {/* Hidden Printable Receipt for Image Capture */}
      <View style={{ position: 'absolute', left: -1000, top: -1000 }}>
        <PrintableReceipt ref={printableReceiptRef} receiptData={receiptData} />
      </View>
    </>
  );
}
