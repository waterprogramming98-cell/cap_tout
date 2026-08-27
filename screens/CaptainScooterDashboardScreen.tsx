import { API_ENDPOINTS } from '../services/api';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  ImageBackground,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const pharaohBg = require('../assets/lottie/images/pharaoh-head.png');
const rnBiometrics = new ReactNativeBiometrics();

const CaptainDashboardScreen: React.FC<any> = ({ navigation, route }) => {
  // ✅ DATA EXTRACTION: Dashboard receives token and captainId from Login
  const { token, captainId } = route.params || {};
  const isFocused = useIsFocused();

  const [language, setLanguage] = useState('English');
  const [isOnline, setIsOnline] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const t = (en: string, ar: string) => (language === 'Arabic' ? ar : en);

  useEffect(() => {
    AsyncStorage.getItem('app_language').then((lang) => { if (lang) setLanguage(lang); });
  }, []);

  useEffect(() => {
    if (!captainId) return;
    AsyncStorage.getItem(`biometric_captain_${captainId}`).then((val) => setBiometricEnabled(!!val));
  }, [captainId]);

  const enableBiometrics = async () => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      if (!available) return Alert.alert(t('Not supported', 'غير مدعوم'));
      const { success } = await rnBiometrics.simplePrompt({ promptMessage: t('Confirm biometrics', 'تأكيد البصمة') });
      if (!success) return;
      await AsyncStorage.setItem(`biometric_captain_${captainId}`, token);
      setBiometricEnabled(true);
      Alert.alert(t('Success', 'تم'), t('Enabled', 'تم التفعيل'));
    } catch (e) { Alert.alert(t('Error', 'خطأ')); }
  };

  const checkActiveBooking = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.CAPTAIN_ACTIVE_BOOKING, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const activeBooking = data?.data?.booking || data?.booking;
        if (activeBooking && (activeBooking.status === 'Accepted' || activeBooking.status === 'EnRoute' || activeBooking.status === 'Arrived')) {
          navigation.replace('TripInProgressScreen', {
            bookingId: activeBooking.booking_id,
            token,
            selectedLanguage: language,
            captainId,
            bookingDetails: activeBooking,
          });
        }
      }
    } catch (e) { console.log('Error checking active booking:', e); }
  }, [token, captainId, language, navigation]);

  const fetchBookings = useCallback(async () => {
    if (!token || !isOnline) { setBookings([]); return; }
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.CAPTAIN_BOOKINGS, { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      const data = text.startsWith('<') ? {} : JSON.parse(text);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.bookings) ? data.bookings : [];
      setBookings(list);
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); setRefreshing(false); }
  }, [token, isOnline]);

  const toggleOnline = async (value: boolean) => {
    try {
      setIsOnline(value);
      const res = await fetch(API_ENDPOINTS.CAPTAIN_ONLINE_STATUS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_online: value }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (value) {
        checkActiveBooking();
        fetchBookings();
      } else {
        setBookings([]);
      }
    } catch (e: any) { setIsOnline(!value); Alert.alert('Error', e.message); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Explicitly request POST_NOTIFICATIONS on Android 13+ (API 33+)
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const permResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log('[NOTIF] POST_NOTIFICATIONS permission result:', permResult);
        }
        await messaging().requestPermission();
        const fcmToken = await messaging().getToken();
        if (fcmToken && token) {
          await fetch(API_ENDPOINTS.CAPTAIN_FCM_TOKEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ fcm_token: fcmToken }),
          });
        }
      } catch {}
    };
    const unsub = messaging().onMessage((remoteMessage) => {
      console.log('[NOTIF] Received FCM', JSON.stringify(remoteMessage));
      fetchBookings();
    });
    init(); return () => unsub();
  }, [token, fetchBookings]);

  useEffect(() => {
    if (isFocused) {
      checkActiveBooking();
      fetchBookings();
    }
  }, [isFocused, checkActiveBooking, fetchBookings]);

  const acceptTrip = async (booking: any) => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.BOOKING_STATUS(booking.booking_id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Accepted' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to accept trip');
      }

      const responseData = await response.json();
      const acceptedBooking = responseData?.booking || responseData?.data?.booking || responseData?.data || booking;

      navigation.replace('TripInProgressScreen', {
        bookingId: booking.booking_id,
        token,
        selectedLanguage: language,
        captainId,
        bookingDetails: acceptedBooking,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NAVIGATION TO RATES: Ensures captainId is passed
  const goToRates = () => {
    if (!captainId) {
      Alert.alert(t('Error', 'خطأ'), t('Captain ID is missing. Please log in again.', 'معرف الكابتن مفقود. يرجى تسجيل الدخول مرة أخرى.'));
      return;
    }
    navigation.navigate('CaptainRateSettingsScreen', { token, captainId, selectedLanguage: language });
  };

  // ✅ NAVIGATION TO HISTORY: FIXED to match navigation.d.ts
  const goToHistory = () => {
    navigation.navigate('CaptainTripHistoryScreen', { token, captainId, selectedLanguage: language });
  };

  const rejectTrip = async (id: number) => {
    try {
      await fetch(API_ENDPOINTS.BOOKING_STATUS(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      fetchBookings();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <ImageBackground source={pharaohBg} style={styles.bg}>
      <View style={styles.overlay}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />}>
          <Text style={styles.title}>{t('Captain Dashboard', 'لوحة الكابتن')}</Text>
          <View style={styles.row}>
            <Text style={styles.text}>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
            <Switch value={isOnline} onValueChange={toggleOnline} />
          </View>
          <TouchableOpacity style={styles.bigBtn} onPress={enableBiometrics}>
            <Text style={styles.bigBtnText}>{biometricEnabled ? t('Biometrics Enabled', 'تم التفعيل') : t('Enable Biometrics', 'تفعيل البصمة')}</Text>
          </TouchableOpacity>
          {loading ? <ActivityIndicator color="gold" /> : bookings.length > 0 ? bookings.map((b) => (
            <View key={b.booking_id} style={styles.card}>
              <Text style={styles.name}>{b.user_name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.reject} onPress={() => rejectTrip(b.booking_id)}><Text style={styles.actionText}>{t('Reject', 'رفض')}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.accept} onPress={() => acceptTrip(b)}><Text style={styles.actionText}>{t('Accept', 'قبول')}</Text></TouchableOpacity>
              </View>
            </View>
          )) : <Text style={styles.noBookingsText}>{t('No bookings', 'لا توجد حجوزات')}</Text>}
          <TouchableOpacity style={styles.bigBtn} onPress={goToRates}>
            <Text style={styles.bigBtnText}>{t('Set My Rates', 'تحديد الأسعار')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bigBtn} onPress={goToHistory}>
            <Text style={styles.bigBtnText}>{t('Trip History', 'سجل الرحلات')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', padding: 15 },
  title: { color: 'gold', fontSize: 22, textAlign: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, alignItems: 'center' },
  text: { color: 'white' },
  card: { backgroundColor: '#222', padding: 10, marginVertical: 5, borderRadius: 8 },
  name: { color: 'gold', fontWeight: 'bold' },
  actions: { flexDirection: 'row', marginTop: 10 },
  reject: { backgroundColor: '#555', flex: 1, padding: 8, marginRight: 5, borderRadius: 5, alignItems: 'center' },
  accept: { backgroundColor: 'gold', flex: 1, padding: 8, marginLeft: 5, borderRadius: 5, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: 'bold' },
  bigBtn: { backgroundColor: 'gold', padding: 12, marginVertical: 8, borderRadius: 10 },
  bigBtnText: { textAlign: 'center', fontWeight: 'bold', color: 'black' },
  noBookingsText: { textAlign: 'center', color: '#aaa', marginTop: 20 },
});

export default CaptainDashboardScreen;