import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';
import api from '../api';

export const JobsScreen = () => {
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionJobId, setCompletionJobId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await api.get('/bookings');
      // Filter for jobs assigned to this provider that are active
      const activeJobs = res.data.filter(
        (b: any) => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS'
      );
      setJobs(activeJobs);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to fetch jobs: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const updateStatus = async (id: string, newStatus: string, otp?: string) => {
    try {
      setLoading(true);
      const payload: any = { status: newStatus };
      if (otp) payload.otp = otp;
      
      await api.patch(`/bookings/${id}/status`, payload);
      await fetchJobs(); // Refresh the list
      
      // Navigate to tracking if starting the job
      if (newStatus === 'IN_PROGRESS') {
        const job = jobs.find(j => j.id === id);
        navigation.navigate('Tracking', { booking: job });
      } else if (newStatus === 'COMPLETED') {
        Alert.alert('Success', 'Job has been marked as completed successfully!');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to update job status');
      setLoading(false);
    }
  };

  const promptForCompletion = (jobId: string) => {
    setCompletionJobId(jobId);
    setOtpInput('');
  };

  const handleConfirmCompletion = () => {
    if (!otpInput || otpInput.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a valid 4-digit PIN.');
      return;
    }
    if (completionJobId) {
      updateStatus(completionJobId, 'COMPLETED', otpInput);
      setCompletionJobId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <Text style={styles.headerSubtitle}>Active and upcoming tasks</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchJobs} colors={[Theme.primary]} />}
      >
        {jobs.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active jobs.</Text>
            <Text style={styles.emptyStateSub}>Accept new requests from the Home tab.</Text>
          </View>
        ) : (
          jobs.map(job => {
            const bookingDate = job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : 'Today';
            const bookingTime = job.scheduledAt ? new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const serviceName = job.service?.nameTranslations?.en || 'Service Request';

            return (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={[styles.badge, job.status === 'IN_PROGRESS' ? styles.badgeInProgress : styles.badgeAccepted]}>
                    <Text style={[styles.badgeText, job.status === 'IN_PROGRESS' ? styles.badgeTextInProgress : styles.badgeTextAccepted]}>
                      {job.status.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.jobId}>#{job.id.slice(-6).toUpperCase()}</Text>
                </View>
                
                <Text style={styles.serviceName}>{serviceName}</Text>
                <Text style={styles.jobTime}>📅 {bookingDate} • {bookingTime}</Text>
                
                {job.client?.fullName && (
                  <Text style={styles.clientName}>👤 {job.client.fullName}</Text>
                )}
                
                <Text style={styles.price}>💰 Total: ₹{job.totalPrice}</Text>
                
                <View style={styles.actionRow}>
                  {job.status === 'ACCEPTED' && (
                    <TouchableOpacity 
                      style={[styles.primaryButton, { backgroundColor: Theme.info }]}
                      onPress={() => navigation.navigate('Tracking', { booking: job })}
                    >
                      <Text style={styles.buttonText}>NAVIGATE</Text>
                    </TouchableOpacity>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <TouchableOpacity 
                      style={[styles.primaryButton, styles.completeButton]}
                      onPress={() => promptForCompletion(job.id)}
                    >
                      <Text style={styles.buttonText}>MARK COMPLETED</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.primaryButton, { backgroundColor: '#F4EDFF', flex: 0, paddingHorizontal: 16 }]}
                    onPress={() => navigation.navigate('Chat', { bookingId: job.id, clientName: job.client?.fullName })}
                  >
                    <Text style={{ fontSize: 20 }}>💬</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* OTP Modal for Android Compatibility */}
      <Modal visible={!!completionJobId} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Client PIN</Text>
            <Text style={styles.modalSubtitle}>Please ask the client for the 4-digit PIN displayed on their app.</Text>
            
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              value={otpInput}
              onChangeText={setOtpInput}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#F1F5F9' }]} onPress={() => setCompletionJobId(null)}>
                <Text style={{ color: Theme.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: Theme.success }]} onPress={handleConfirmCompletion}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { padding: 24, backgroundColor: Theme.background },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Theme.primary, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary },
  scrollContent: { padding: 24, paddingTop: 8 },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: Theme.white, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.border, marginTop: 16 },
  emptyStateText: { color: Theme.textSecondary, fontWeight: '700', fontSize: 16 },
  emptyStateSub: { color: Theme.textSecondary, fontWeight: '500', fontSize: 14, marginTop: 8, textAlign: 'center' },
  jobCard: { backgroundColor: Theme.white, padding: 20, borderRadius: 24, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeAccepted: { backgroundColor: Theme.infoLight },
  badgeInProgress: { backgroundColor: '#FFF3E0' },
  badgeText: { fontWeight: '800', fontSize: 12 },
  badgeTextAccepted: { color: Theme.info },
  badgeTextInProgress: { color: '#E65100' },
  jobId: { color: Theme.textSecondary, fontSize: 12, fontWeight: '700' },
  serviceName: { fontSize: 18, fontWeight: '900', color: Theme.textPrimary, marginBottom: 8 },
  jobTime: { color: Theme.textSecondary, fontWeight: '600', marginBottom: 4, fontSize: 14 },
  clientName: { color: Theme.textSecondary, fontWeight: '600', marginBottom: 4, fontSize: 14 },
  price: { color: Theme.primary, fontWeight: '800', marginBottom: 20, fontSize: 16, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, backgroundColor: Theme.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  completeButton: { backgroundColor: Theme.success },
  inProgressButton: { backgroundColor: '#F59E0B' },
  buttonText: { color: Theme.white, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '85%', padding: 24, borderRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: Theme.textSecondary, marginBottom: 20 },
  otpInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: Theme.border, borderRadius: 12, padding: 16, fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: '900', color: Theme.primary, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
});
