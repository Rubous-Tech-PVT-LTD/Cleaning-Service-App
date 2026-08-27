import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Theme } from '../theme';
import api from '../api';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

export const JobsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionJobId, setCompletionJobId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [sosLoadingJobId, setSosLoadingJobId] = useState<string | null>(null);

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

  const handleTriggerSos = async (job: any) => {
    if (sosLoadingJobId) return;

    Alert.alert(
      t('provider.sos_alert'),
      t('provider.sos_confirm'),
      [
        { text: t('provider.cancel'), style: 'cancel' },
        {
          text: t('provider.yes_trigger_sos'),
          style: 'destructive',
          onPress: async () => {
            try {
              setSosLoadingJobId(job.id);

              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(t('provider.permission_denied'), t('provider.location_permission_required'));
                return;
              }

              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              const payload = {
                bookingId: job.id,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              };

              await api.post('/sos', payload);

              Alert.alert(
                t('provider.sos_sent'),
                t('provider.sos_sent_message')
              );
            } catch (err: any) {
              const msg = err?.response?.data?.message || err.message || 'Failed to send SOS. Please try again.';
              Alert.alert(t('provider.sos_failed'), msg);
            } finally {
              setSosLoadingJobId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('provider.my_jobs')}</Text>
        <Text style={styles.headerSubtitle}>{t('provider.active_upcoming_tasks')}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchJobs} colors={[Theme.primary]} />}
      >
        {jobs.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('provider.no_active_jobs')}</Text>
            <Text style={styles.emptyStateSub}>{t('provider.accept_new_requests')}</Text>
          </View>
        ) : (
          jobs.map(job => {
            const bookingDate = job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : 
                               job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : 'Today';
            const bookingTime = job.scheduledAt ? new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                                job.scheduled_at ? new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            
            // Handle service name from different possible data structures
            let serviceName = 'Service Request';
            
            // Check language preference for Hindi
            const isHindi = i18n.language === 'hi';
            
            // First try to get from service object with language support
            if (job.service) {
              // Try sync API format first (snake_case)
              if (isHindi && job.service.name_hi) {
                serviceName = job.service.name_hi;
              } else if (job.service.name_en) {
                serviceName = job.service.name_en;
              }
              // Try regular API format (camelCase with JSON object)
              else if (typeof job.service.nameTranslations === 'object' && job.service.nameTranslations.hi && isHindi) {
                serviceName = job.service.nameTranslations.hi;
              } else if (typeof job.service.nameTranslations === 'object' && job.service.nameTranslations.en) {
                serviceName = job.service.nameTranslations.en;
              }
              // Try if nameTranslations is a stringified JSON
              else if (typeof job.service.nameTranslations === 'string') {
                try {
                  const parsed = JSON.parse(job.service.nameTranslations);
                  if (isHindi && parsed.hi) {
                    serviceName = parsed.hi;
                  } else {
                    serviceName = parsed.en || job.service.nameTranslations;
                  }
                } catch {
                  serviceName = job.service.nameTranslations;
                }
              }
              // Fallback to name field
              else if (job.service.name) {
                serviceName = job.service.name;
              }
            }
            // Then try to get from items array (this is what the API currently returns)
            else if (job.items && Array.isArray(job.items) && job.items.length > 0) {
              const firstItem = job.items[0];
              if (firstItem.title) {
                serviceName = firstItem.title;
              }
            }

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
                
                <Text style={styles.price}>💰 {t('provider.total')}: ₹{job.totalPrice}</Text>
                
                <View style={styles.actionRow}>
                  {job.status === 'ACCEPTED' && (
                    <TouchableOpacity 
                      style={[styles.primaryButton, { backgroundColor: Theme.info }]}
                      onPress={() => navigation.navigate('Tracking', { booking: job })}
                    >
                      <Text style={styles.buttonText}>{t('provider.navigate')}</Text>
                    </TouchableOpacity>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <TouchableOpacity 
                      style={[styles.primaryButton, styles.completeButton]}
                      onPress={() => promptForCompletion(job.id)}
                    >
                      <Text style={styles.buttonText}>{t('provider.mark_completed')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: '#F4EDFF', flex: 0, paddingHorizontal: 16 }]}
                    onPress={() => navigation.navigate('Chat', { bookingId: job.id, clientName: job.client?.fullName, clientId: job.clientId })}
                  >
                    <Text style={{ fontSize: 20 }}>💬</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleTriggerSos(job)}
                  disabled={sosLoadingJobId === job.id}
                  style={[styles.sosButton, sosLoadingJobId === job.id && { opacity: 0.6 }]}
                >
                  {sosLoadingJobId === job.id ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.sosEmoji}>🚨</Text>
                      <Text style={styles.sosButtonText}>{t('provider.emergency_sos')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* OTP Modal for Android Compatibility */}
      <Modal visible={!!completionJobId} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('provider.enter_client_pin')}</Text>
            <Text style={styles.modalSubtitle}>{t('provider.ask_client_pin')}</Text>
            
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
                <Text style={{ color: Theme.textSecondary, fontWeight: '700' }}>{t('provider.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: Theme.success }]} onPress={handleConfirmCompletion}>
                <Text style={{ color: 'white', fontWeight: '700' }}>{t('provider.verify')}</Text>
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
  sosButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexDirection: 'row',
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  sosEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
