import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import api from '../api';

export const WalletScreen = () => {
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/bookings');
      // Filter for COMPLETED jobs assigned to this provider
      const finished = res.data.filter((b: any) => b.status === 'COMPLETED');
      
      const total = finished.reduce((sum: number, job: any) => sum + Number(job.totalPrice || 0), 0);
      
      setCompletedJobs(finished);
      setTotalEarnings(total);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to fetch earnings: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Text style={styles.headerSubtitle}>Your earnings & payout history</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEarnings} colors={[Theme.primary]} />}
      >
        {/* Total Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
          <Text style={styles.earningsAmount}>₹{totalEarnings.toLocaleString()}</Text>
          <Text style={styles.earningsSub}>From {completedJobs.length} completed jobs</Text>
        </View>

        <Text style={styles.historyTitle}>Recent Payouts</Text>

        {completedJobs.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No earnings yet.</Text>
            <Text style={styles.emptyStateSub}>Complete jobs to see your balance grow.</Text>
          </View>
        ) : (
          completedJobs.map(job => {
            const bookingDate = job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : 'Unknown Date';
            const serviceName = job.service?.nameTranslations?.en || 'Service Request';

            return (
              <View key={job.id} style={styles.historyItem}>
                <View style={styles.historyIconWrapper}>
                  <Text style={styles.historyIcon}>💸</Text>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyService}>{serviceName}</Text>
                  <Text style={styles.historyDate}>{bookingDate} • #{job.id.slice(-6).toUpperCase()}</Text>
                </View>
                <Text style={styles.historyPrice}>+₹{job.totalPrice}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { padding: 24, backgroundColor: Theme.background },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Theme.primary, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary },
  scrollContent: { padding: 24, paddingTop: 8 },
  
  earningsCard: { backgroundColor: Theme.primary, padding: 32, borderRadius: 24, marginBottom: 32, alignItems: 'center', elevation: 8, shadowColor: Theme.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  earningsLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: 1 },
  earningsAmount: { fontSize: 48, fontWeight: '900', color: Theme.white, marginBottom: 8 },
  earningsSub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  
  historyTitle: { fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 16 },
  
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: Theme.white, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.border, marginTop: 16 },
  emptyStateText: { color: Theme.textSecondary, fontWeight: '700', fontSize: 16 },
  emptyStateSub: { color: Theme.textSecondary, fontWeight: '500', fontSize: 14, marginTop: 8, textAlign: 'center' },
  
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.white, padding: 16, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  historyIconWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: Theme.successLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyIcon: { fontSize: 24 },
  historyDetails: { flex: 1 },
  historyService: { fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 4 },
  historyDate: { fontSize: 13, fontWeight: '600', color: Theme.textSecondary },
  historyPrice: { fontSize: 18, fontWeight: '900', color: Theme.success },
});
