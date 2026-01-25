import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../context/AdminContext';

export default function VendorReviewModal({ visible, application, onClose }) {
  const { approveVendor, rejectVendor } = useAdmin();
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!application) return null;

  const isPending = application.status === 'pending';

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async () => {
    Alert.alert(
      'Approve Vendor',
      `Are you sure you want to approve ${application.businessName}? A vendor account will be created for them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await approveVendor(application.id, notes);
              Alert.alert('Success', 'Vendor has been approved successfully');
              onClose();
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectVendor(application.id, rejectionReason.trim());
      Alert.alert('Done', 'Vendor application has been rejected');
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setRejectionReason('');
    setShowRejectForm(false);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Vendor Application</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(application.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(application.status) },
                  ]}
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Business Info */}
            <View style={styles.section}>
              <View style={styles.businessHeader}>
                <View style={styles.businessAvatar}>
                  <Text style={styles.avatarText}>
                    {application.businessName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.businessTitleInfo}>
                  <Text style={styles.businessName}>{application.businessName}</Text>
                  <Text style={styles.businessType}>{application.businessType}</Text>
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={18} color="#a855f7" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Owner</Text>
                    <Text style={styles.infoValue}>{application.ownerName}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={18} color="#a855f7" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{application.email}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={18} color="#a855f7" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{application.phone}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#a855f7" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{application.address}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Description</Text>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{application.description}</Text>
              </View>
            </View>

            {/* Documents */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Submitted Documents</Text>
              <View style={styles.documentsContainer}>
                {application.documents?.map((doc, index) => (
                  <View key={index} style={styles.documentItem}>
                    <Ionicons name="document-text" size={20} color="#a855f7" />
                    <Text style={styles.documentName}>{doc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Submission Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.timelineCard}>
                <View style={styles.timelineRow}>
                  <Ionicons name="calendar" size={16} color="#9ca3af" />
                  <Text style={styles.timelineText}>
                    Submitted: {formatDate(application.submittedAt)}
                  </Text>
                </View>
                {application.reviewedAt && (
                  <View style={styles.timelineRow}>
                    <Ionicons
                      name={
                        application.status === 'approved'
                          ? 'checkmark-circle'
                          : 'close-circle'
                      }
                      size={16}
                      color={getStatusColor(application.status)}
                    />
                    <Text style={styles.timelineText}>
                      Reviewed: {formatDate(application.reviewedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Rejection Reason (if rejected) */}
            {application.status === 'rejected' && application.rejectionReason && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rejection Reason</Text>
                <View style={styles.rejectionCard}>
                  <Text style={styles.rejectionText}>{application.rejectionReason}</Text>
                </View>
              </View>
            )}

            {/* Action Forms (for pending applications) */}
            {isPending && (
              <View style={styles.section}>
                {!showRejectForm ? (
                  <>
                    <Text style={styles.sectionTitle}>Notes (Optional)</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes for approval..."
                      placeholderTextColor="#6b7280"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.sectionTitle}>Rejection Reason *</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Explain why the application is being rejected..."
                      placeholderTextColor="#6b7280"
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      multiline
                      numberOfLines={4}
                    />
                  </>
                )}
              </View>
            )}

            <View style={styles.spacer} />
          </ScrollView>

          {/* Footer Actions */}
          {isPending && (
            <View style={styles.footer}>
              {!showRejectForm ? (
                <>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => setShowRejectForm(true)}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approveButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleApprove}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.approveButtonText}>
                      {isSubmitting ? 'Processing...' : 'Approve'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.cancelRejectButton}
                    onPress={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelRejectText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmRejectButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleReject}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.confirmRejectText}>
                      {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#2d1f3d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#4a3660',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#e5e5e5',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  businessAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessTitleInfo: {
    flex: 1,
  },
  businessName: {
    color: '#e5e5e5',
    fontSize: 20,
    fontWeight: 'bold',
  },
  businessType: {
    color: '#a855f7',
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#3d2a52',
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  infoValue: {
    color: '#e5e5e5',
    fontSize: 15,
    marginTop: 2,
  },
  descriptionCard: {
    backgroundColor: '#3d2a52',
    borderRadius: 12,
    padding: 16,
  },
  descriptionText: {
    color: '#e5e5e5',
    fontSize: 14,
    lineHeight: 22,
  },
  documentsContainer: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d2a52',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  documentName: {
    color: '#e5e5e5',
    fontSize: 14,
  },
  timelineCard: {
    backgroundColor: '#3d2a52',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  rejectionCard: {
    backgroundColor: '#ef444420',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  rejectionText: {
    color: '#ef4444',
    fontSize: 14,
  },
  notesInput: {
    backgroundColor: '#3d2a52',
    borderRadius: 12,
    padding: 14,
    color: '#e5e5e5',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  spacer: {
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#4a3660',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ef444420',
    gap: 6,
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelRejectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3d2a52',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  cancelRejectText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmRejectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmRejectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
