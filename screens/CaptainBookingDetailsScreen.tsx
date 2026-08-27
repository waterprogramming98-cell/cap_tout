import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { API_ENDPOINTS } from '../services/api';

const CaptainBookingDetailsScreen: React.FC<any> = ({ navigation, route }) => {
  const { bookingId, token, selectedLanguage, captainId } = route.params || {};
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const getText = (en: string, ar: string) =>
    selectedLanguage === 'Arabic' ? ar : en;

  // Fetch booking details from API
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const bookingData = data?.booking || data?.data?.booking || data?.data || data;
          setBooking(bookingData);
        } else {
          Alert.alert(getText('Error', 'خطأ'), getText('Failed to load booking details', 'فشل تحميل تفاصيل الحجز'));
        }
      } catch (e: any) {
        Alert.alert(getText('Error', 'خطأ'), e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, token]);

  const handleAcceptTrip = async () => {
    if (!bookingId || !token) return;
    setActionLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.BOOKING_STATUS(bookingId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Accepted' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to accept trip');
      }

      const responseData = await response.json();
      const acceptedBooking = responseData?.booking || responseData?.data?.booking || responseData?.data || booking;
      
      Alert.alert(getText('Success', 'نجاح'), getText('Trip accepted!', 'تم قبول الرحلة!'));
      navigation.replace('TripInProgressScreen', {
        bookingId,
        token,
        selectedLanguage,
        captainId,
        bookingDetails: acceptedBooking,
      });
    } catch (error: any) {
      Alert.alert(getText('Error', 'خطأ'), error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTrip = async () => {
    if (!bookingId || !token) return;
    setActionLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.BOOKING_STATUS(bookingId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Cancelled' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to reject trip');
      }

      Alert.alert(getText('Success', 'نجاح'), getText('Trip rejected!', 'تم رفض الرحلة!'));
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(getText('Error', 'خطأ'), error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#001F3F" />
          <Text style={styles.loadingText}>{getText('Loading booking details...', 'جاري تحميل تفاصيل الحجز...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getText('Trip Request', 'طلب رحلة')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{getText('No booking details available', 'لا توجد تفاصيل حجز متاحة')}</Text>
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.goBack()}>
            <Text style={styles.mainButtonText}>{getText('GO BACK', 'العودة')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getText('Trip Request', 'طلب رحلة')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Trip Card */}
        <View style={styles.tripCard}>
          <Text style={styles.cardTitle}>{getText('Trip Details', 'تفاصيل الرحلة')}</Text>

          {/* Passenger Info */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>{getText('Passenger Name:', 'اسم المسافر:')}</Text>
            <Text style={styles.value}>{booking.passenger_name || booking.user_name || getText('N/A', 'غير متاح')}</Text>
          </View>

          {/* Pickup Location */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>{getText('Pickup:', 'الالتقاط:')}</Text>
            <Text style={styles.value}>{booking.pickup_address || booking.pickup_location || getText('N/A', 'غير متاح')}</Text>
          </View>

          {/* Dropoff Location */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>{getText('Dropoff:', 'الإنزال:')}</Text>
            <Text style={styles.value}>{booking.dropoff_address || booking.dropoff_location || getText('N/A', 'غير متاح')}</Text>
          </View>

          {/* Distance */}
          {booking.distance_km && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>{getText('Distance:', 'المسافة:')}</Text>
              <Text style={styles.value}>{booking.distance_km} km</Text>
            </View>
          )}

          {/* Fare */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>{getText('Estimated Fare:', 'الأجرة المتوقعة:')}</Text>
            <Text style={[styles.value, styles.fareValue]}>
              {booking.estimated_fare || booking.fare || 0} {getText('EGP', 'جنيه')}
            </Text>
          </View>

          {/* Payment Method */}
          {booking.payment_method && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>{getText('Payment:', 'الدفع:')}</Text>
              <Text style={styles.value}>
                {booking.payment_method === 'InstaPay' ? '📱 InstaPay' : '💵 ' + getText('Cash', 'نقداً')}
              </Text>
            </View>
          )}

          {/* Service Type */}
          {booking.service_type && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>{getText('Service:', 'الخدمة:')}</Text>
              <Text style={styles.value}>{booking.service_type}</Text>
            </View>
          )}

          {/* Status */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>{getText('Status:', 'الحالة:')}</Text>
            <Text style={[styles.value, styles.statusValue]}>
              {booking.status || getText('Pending', 'قيد الانتظار')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]} 
            onPress={handleAcceptTrip}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{getText('ACCEPT', 'قبول')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.rejectButton]} 
            onPress={handleRejectTrip}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{getText('REJECT', 'رفض')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#001F3F' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#001F3F' },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#001F3F', marginTop: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#D32F2F', textAlign: 'center', marginBottom: 20 },
  tripCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#001F3F', marginBottom: 15 },
  detailRow: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  value: { fontSize: 16, color: '#001F3F', fontWeight: '500' },
  fareValue: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37' },
  statusValue: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  acceptButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#D32F2F' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  mainButton: {
    backgroundColor: '#001F3F',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default CaptainBookingDetailsScreen;
