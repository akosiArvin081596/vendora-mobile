import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../context/AdminContext';
import VendorReviewModal from './VendorReviewModal';

const STATUS_TABS = [
  { id: 'pending', label: 'Pending', icon: 'time-outline' },
  { id: 'approved', label: 'Approved', icon: 'checkmark-circle-outline' },
  { id: 'rejected', label: 'Rejected', icon: 'close-circle-outline' },
];

export default function VendorApprovals() {
  const { vendorApplications, isLoading, refreshData } = useAdmin();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredApplications = useMemo(() => {
    return vendorApplications.filter((app) => app.status === activeTab);
  }, [vendorApplications, activeTab]);

  const pendingCount = vendorApplications.filter((app) => app.status === 'pending').length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Ionicons name="time" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>
            {vendorApplications.filter((a) => a.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10b98120' }]}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.statNumber}>
            {vendorApplications.filter((a) => a.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <Ionicons name="close-circle" size={24} color="#ef4444" />
          <Text style={styles.statNumber}>
            {vendorApplications.filter((a) => a.status === 'rejected').length}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#fff' : '#9ca3af'}
            />
            <Text
              style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
            {tab.id === 'pending' && pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderApplication = ({ item }) => (
    <TouchableOpacity
      style={styles.applicationCard}
      onPress={() => setSelectedApplication(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.businessInfo}>
          <View style={styles.businessAvatar}>
            <Text style={styles.avatarText}>
              {item.businessName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.businessDetails}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.businessName}
            </Text>
            <Text style={styles.ownerName}>{item.ownerName}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color="#9ca3af" />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#9ca3af" />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="pricetag-outline" size={16} color="#9ca3af" />
          <Text style={styles.infoText}>{item.businessType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#9ca3af" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.dateText}>Submitted: {formatDate(item.submittedAt)}</Text>
        </View>
        {item.reviewedAt && (
          <View style={styles.dateRow}>
            <Ionicons name="checkmark-done-outline" size={14} color="#6b7280" />
            <Text style={styles.dateText}>Reviewed: {formatDate(item.reviewedAt)}</Text>
          </View>
        )}
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>Tap to review</Text>
          <Ionicons name="chevron-forward" size={16} color="#a855f7" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={
          activeTab === 'pending'
            ? 'time-outline'
            : activeTab === 'approved'
            ? 'checkmark-circle-outline'
            : 'close-circle-outline'
        }
        size={64}
        color="#4a3660"
      />
      <Text style={styles.emptyTitle}>
        No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Applications
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'pending'
          ? 'All vendor applications have been reviewed'
          : `No applications have been ${activeTab} yet`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredApplications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      />

      {/* Review Modal */}
      <VendorReviewModal
        visible={!!selectedApplication}
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1025',
  },
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    padding: 16,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: '#e5e5e5',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#2d1f3d',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#9333ea',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  applicationCard: {
    backgroundColor: '#2d1f3d',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4a3660',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  businessAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerName: {
    color: '#9ca3af',
    fontSize: 13,
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
  cardBody: {
    padding: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 13,
    flex: 1,
  },
  cardFooter: {
    padding: 12,
    paddingTop: 0,
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: '#6b7280',
    fontSize: 11,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: '#3d2a52',
    borderTopWidth: 1,
    borderTopColor: '#4a3660',
  },
  actionHintText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 48,
    gap: 12,
  },
  emptyTitle: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});
