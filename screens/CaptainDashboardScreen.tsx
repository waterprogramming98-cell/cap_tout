import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Image,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  Linking,
  AppState,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/theme';
import { API_ENDPOINTS } from '../services/api';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

// Asset Imports (Assuming these exist or will be added to the project)
const toutLogo = require('../assets/images/tout-logo.png');
const bgPattern = require('../assets/images/hieroglyph_pattern.png');
const goldenFrame = require('../assets/images/golden_frame.png');
const pharaohIcon = require('../assets/images/pharaoh_head.png');
const goldenDivider = require('../assets/images/golden_divider.png');

interface CaptainDashboardProps {
  navigation: any;
  route: any;
}

const CaptainDashboard: React.FC<CaptainDashboardProps> = ({ navigation, route }) => {
  const params = route?.params || {};
  const token = params.token || '';
  const captainId = params.captainId || null;
  const vehicleType = params.vehicleType || null;
  const isFreeDriver = vehicleType === 'WithoutVehicle' || vehicleType === 'No vehicle';
  const selectedLanguage = params.selectedLanguage || 'English';
  const isFocused = useIsFocused();
  const locationWatchId = useRef<number | null>(null);

  const [language, setLanguage] = useState(selectedLanguage);
  const [isOnline, setIsOnline] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [captainStats, setCaptainStats] = useState<any>({
    tripsToday: 0,
    earnings: 0,
    rating: 0,
    totalRatings: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [initialOnlineStatusLoaded, setInitialOnlineStatusLoaded] = useState(false);
  const appState = React.useRef(AppState.currentState);
  const [appStateSubscription, setAppStateSubscription] = useState<any>(null);

  const getText = (en: string, ar: string) => (language === 'Arabic' ? ar : en);

  // ================= FIRESTORE LOCATION BROADCASTING =================
  // ToutApp reads Firestore collection 'captains' (project tout-s-routes).
  // CaptoutApp must write to the SAME collection when the captain goes online.

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'CaptoutApp needs your location so passengers can find you.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startLocationBroadcast = useCallback(async () => {
    if (!captainId) return;
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.warn('[LOCATION] Permission denied');
      return;
    }
    // Extract services and governorate from params
    const captainServices = params.services || params.captainData?.services || [];
    const captainGovernorate = params.governorate || params.captainData?.governorate || '';
    const captainName = params.captainData?.name || params.captainData?.full_name || 'Captain';
    // Mark captain online in Firestore immediately
    try {
      await firestore()
        .collection('captains')
        .doc(String(captainId))
        .set(
          {
            is_online: true,
            name: captainName,
            services: captainServices,
            governorate: captainGovernorate,
            vehicleType: vehicleType || '',
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      console.log('[LOCATION] Marked online in Firestore, captainId:', captainId, 'services:', captainServices, 'governorate:', captainGovernorate);
    } catch (e: any) {
      console.error('[LOCATION] Firestore online write failed:', e.message);
    }
    // Start continuous GPS watch
    locationWatchId.current = Geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await firestore()
            .collection('captains')
            .doc(String(captainId))
            .set(
              {
                is_online: true,
                currentLocation: { latitude, longitude },
                services: captainServices,
                governorate: captainGovernorate,
                vehicleType: vehicleType || '',
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          console.log(`[LOCATION] GPS broadcast: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch (e: any) {
          console.error('[LOCATION] Firestore location write failed:', e.message);
        }
      },
      (error) => console.error('[LOCATION] watchPosition error:', error.code, error.message),
      {
        enableHighAccuracy: true,
        distanceFilter: 20,
        interval: 15000,
        fastestInterval: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
    console.log('[LOCATION] watchPosition started, id:', locationWatchId.current);
  }, [captainId, params.services, params.governorate, params.captainData, vehicleType]);

  const stopLocationBroadcast = useCallback(async () => {
    if (locationWatchId.current !== null) {
      Geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
      console.log('[LOCATION] watchPosition stopped');
    }
    if (!captainId) return;
    try {
      await firestore()
        .collection('captains')
        .doc(String(captainId))
        .set({ is_online: false, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
      console.log('[LOCATION] Marked offline in Firestore');
    } catch (e: any) {
      console.error('[LOCATION] Firestore offline write failed:', e.message);
    }
  }, [captainId]);

  // Stop broadcasting on unmount
  useEffect(() => {
    return () => { stopLocationBroadcast(); };
  }, [stopLocationBroadcast]);
  // =====================================================================

  // ================= FETCH CAPTAIN STATS =================
  const fetchCaptainStats = useCallback(async () => {
    if (!token || !captainId) return;
    
    setStatsLoading(true);
    try {
      if (params.captainData) {
        const rating = params.captainData?.rating || params.captainData?.average_rating || 0;
        const totalRatings = params.captainData?.total_ratings || params.captainData?.ratings_count || 0;
        const earnings = params.captainData?.earnings || params.captainData?.total_earnings || 0;
        const tripsToday = params.captainData?.trips_today || 0;
        
        setCaptainStats({
          tripsToday,
          earnings,
          rating: parseFloat(rating).toFixed(1),
          totalRatings,
        });
      }
      
      const statsEndpoint = (API_ENDPOINTS as any)['CAPTAIN_STATS'];
      if (statsEndpoint) {
        const res = await fetch(statsEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const stats = data?.data || data;
          setCaptainStats({
            tripsToday: stats.trips_today || stats.trips || 0,
            earnings: stats.earnings || stats.total_earnings || 0,
            rating: parseFloat(stats.rating || stats.average_rating || 0).toFixed(1),
            totalRatings: stats.total_ratings || stats.ratings_count || 0,
          });
        }
      }
    } catch (e: any) {
      console.log('Error fetching captain stats:', e.message);
    } finally {
      setStatsLoading(false);
    }
  }, [token, captainId, params.captainData]);

  // ================= LOAD LANGUAGE =================
  useEffect(() => {
    AsyncStorage.getItem('app_language').then((lang) => {
      if (lang) setLanguage(lang);
    });
  }, []);

  // ================= LOAD PERSISTENT ONLINE STATUS =================
  useEffect(() => {
    const loadOnlineStatus = async () => {
      try {
        const savedOnlineStatus = await AsyncStorage.getItem('captain_online_status');
        const savedToken = await AsyncStorage.getItem('captain_token');
        const savedCaptainId = await AsyncStorage.getItem('captain_id');

        // If we have saved credentials and were online, restore that state
        if (savedOnlineStatus === 'true' && savedToken && savedCaptainId) {
          console.log('Restoring online status from AsyncStorage');
          setIsOnline(true);
          
          // Re-send online status to server on restore (POST, not GET)
          try {
            await fetch(API_ENDPOINTS.CAPTAIN_ONLINE_STATUS, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token || savedToken}`,
              },
              body: JSON.stringify({ is_online: true }),
            });
            console.log('Restored online status to server');
            startLocationBroadcast();
          } catch (syncError) {
            console.log('Could not restore online status to server:', syncError);
            // Keep the local state if server sync fails
          }
        } else {
          setIsOnline(false);
        }

        setInitialOnlineStatusLoaded(true);
      } catch (error) {
        console.error('Error loading persistent online status:', error);
        setInitialOnlineStatusLoaded(true);
      }
    };

    loadOnlineStatus();
  }, [token]);

  // ================= FETCH BOOKINGS =================
  // ================= HANDLE TRIP ACTIONS =================
  const handleAcceptTrip = async (bookingId: string) => {
    setLoading(true);
    try {
      // Correct endpoint: PATCH /api/bookings/{id}/status  body: { status: 'Accepted' }
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

      // Get the full booking object from the response so we can pass coordinates to TripInProgressScreen
      let acceptedBooking = null;
      try {
        const responseData = await response.clone().json();
        acceptedBooking = responseData?.booking || responseData?.data?.booking || responseData?.data || null;
      } catch (_) {}
      Alert.alert(getText('Success', 'نجاح'), getText('Trip accepted!', 'تم قبول الرحلة!'));
      navigation.replace('TripInProgressScreen', {
        bookingId,
        token,
        selectedLanguage: language,
        captainId,
        bookingDetails: acceptedBooking,
      });
    } catch (error: any) {
      Alert.alert(getText('Error', 'خطأ'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTrip = async (bookingId: string) => {
    setLoading(true);
    try {
      // Correct endpoint: PATCH /api/bookings/{id}/status  body: { status: 'Cancelled' }
      // NOTE: The API does not accept 'Rejected' — 'Cancelled' is the valid rejection value
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
      fetchBookings(); // Refresh bookings to get the next one
    } catch (error: any) {
      Alert.alert(getText('Error', 'خطأ'), error.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= CHECK ACTIVE BOOKING (RESUME) =================
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
          console.log('Found active trip, resuming...', activeBooking.booking_id);
          navigation.replace('TripInProgressScreen', {
            bookingId: activeBooking.booking_id,
            token,
            selectedLanguage: language,
            captainId,
            bookingDetails: activeBooking,
          });
        }
      }
    } catch (e) {
      console.log('Error checking active booking:', e);
    }
  }, [token, captainId, language, navigation]);

  // ================= FETCH BOOKINGS =================
  const fetchBookings = useCallback(async () => {
    if (!token || !isOnline || isFreeDriver) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.CAPTAIN_BOOKINGS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data?.data?.bookings || data?.bookings || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isOnline, isFreeDriver]);

  // ================= ONLINE TOGGLE WITH PERSISTENT STORAGE =================
  const toggleOnline = async (value: boolean) => {
    setIsOnline(value);
    
    try {
      // Save to AsyncStorage immediately for persistence
      await AsyncStorage.setItem('captain_online_status', value ? 'true' : 'false');
      if (token) {
        await AsyncStorage.setItem('captain_token', token);
      }
      if (captainId) {
        await AsyncStorage.setItem('captain_id', captainId.toString());
      }

      // Send to server
      const res = await fetch(API_ENDPOINTS.CAPTAIN_ONLINE_STATUS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_online: value }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      console.log(`Captain online status updated to: ${value}`);

      // Start or stop Firestore location broadcasting
      if (value) {
        startLocationBroadcast();
      } else {
        stopLocationBroadcast();
      }

      // Fetch bookings if going online
      if (value && !isFreeDriver) {
        checkActiveBooking();
        fetchBookings();
      } else {
        setBookings([]);
      }
    } catch (e: any) {
      setIsOnline(!value);
      console.error('Error toggling online status:', e);
      Alert.alert('Error', e.message || 'Failed to update online status');
    }
  };

  // ================= APP STATE LISTENER FOR BACKGROUND/FOREGROUND =================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    setAppStateSubscription(subscription);

    return () => {
      subscription?.remove();
    };
  }, [isOnline, token, captainId]);

  const handleAppStateChange = async (nextAppState: any) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to foreground');
      // Verify online status when app comes to foreground
            if (isOnline) {
        try {
          // Re-send online status when coming back to foreground
          await fetch(API_ENDPOINTS.CAPTAIN_ONLINE_STATUS, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ is_online: true }),
          });
          console.log('Re-sent online status on foreground');
        } catch (error) {
          console.log('Error re-sending online status:', error);
        }
      }
    } else if (nextAppState.match(/inactive|background/)) {
      console.log('App has gone to background');
      // The online status is persisted in AsyncStorage, so it will be restored on app restart
    }

    appState.current = nextAppState;
  };

  // ================= FCM SETUP =================
  useEffect(() => {
    const init = async () => {
      try {
        // Explicitly request POST_NOTIFICATIONS on Android 13+ (API 33+)
        // messaging().requestPermission() alone is insufficient on Android 13+
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
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fcm_token: fcmToken }),
          });
          console.log('FCM token registered:', fcmToken);
        }
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    };

    const unsubscribe = messaging().onMessage((remoteMessage) => {
      console.log('[NOTIF] Received FCM', JSON.stringify(remoteMessage));
      const type = remoteMessage.data?.type || remoteMessage.data?.notification_type;
      
      if (type === 'booking_cancelled' || type === 'BOOKING_CANCELLED') {
        const msgTitle = remoteMessage.data?.title || remoteMessage.notification?.title || getText('Trip Cancelled', 'تم إلغاء الرحلة');
        const msgBody = remoteMessage.data?.body || remoteMessage.notification?.body || getText('The passenger has cancelled the trip.', 'قام المسافر بإلغاء الرحلة.');
        Alert.alert(msgTitle, msgBody);
        fetchBookings();
        checkActiveBooking(); // If they were in a trip, this might trigger navigation back to dashboard
        return;
      }

      // Fetch bookings when a new ride request comes in
      if (isOnline && !isFreeDriver) {
        fetchBookings();
        // Server sends data-only messages; read title/body from data field
        const msgTitle = remoteMessage.data?.title || remoteMessage.notification?.title || getText('New Trip Request!', 'طلب رحلة جديد!');
        const msgBody = remoteMessage.data?.body || remoteMessage.notification?.body || getText('A passenger is waiting for you.', 'مسافر ينتظرك.');
        const bookingId = remoteMessage.data?.booking_id || remoteMessage.data?.ride_id;
        
        Alert.alert(msgTitle, msgBody, [
          { text: getText('View', 'عرض'), style: 'default', onPress: () => {
            if (bookingId) {
              navigation.navigate('CaptainBookingDetailsScreen', {
                bookingId: parseInt(bookingId),
                token,
                selectedLanguage: language,
                captainId,
              });
            }
          }}
        ]);
      }
    });

    // Handle notification when app is launched from background
    const checkInitialNotification = async () => {
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('[NOTIF] App launched from notification:', initialNotification.data);
        const bookingId = initialNotification.data?.booking_id || initialNotification.data?.ride_id;
        if (bookingId && token && captainId) {
          // Delay navigation slightly to ensure screen is mounted
          setTimeout(() => {
            navigation.navigate('CaptainBookingDetailsScreen', {
              bookingId,
              token,
              selectedLanguage: language,
              captainId,
            });
          }, 500);
        }
      }
    };

    init();
    checkInitialNotification();
    return () => unsubscribe();
  }, [token, isOnline, isFreeDriver, fetchBookings, language, captainId, navigation]);

  // ================= FETCH DATA ON FOCUS =================
  useEffect(() => {
    if (isFocused && initialOnlineStatusLoaded) {
      checkActiveBooking();
      fetchBookings();
      fetchCaptainStats();
    }
  }, [isFocused, checkActiveBooking, fetchBookings, fetchCaptainStats, initialOnlineStatusLoaded]);

  // ================= PERIODIC BOOKING POLLING (every 10s when online & not free driver) =================
  useEffect(() => {
    if (!isOnline || isFreeDriver || !initialOnlineStatusLoaded) return;
    const pollInterval = setInterval(() => {
      fetchBookings();
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [isOnline, isFreeDriver, initialOnlineStatusLoaded, fetchBookings]);

  // Fetch stats on component mount
  useEffect(() => {
    if (initialOnlineStatusLoaded) {
      fetchCaptainStats();
    }
  }, [fetchCaptainStats, initialOnlineStatusLoaded]);

  const handleDeleteAccount = () => {
    Alert.alert(
      getText('Delete Account', 'حذف الحساب'),
      getText(
        'Are you sure you want to delete your account? This action cannot be undone.',
        'هل أنت متأكد أنك تريد حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.',
      ),
      [
        { text: getText('Cancel', 'إلغاء'), style: 'cancel' },
        {
          text: getText('Delete', 'حذف'),
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert(
                getText('Success', 'تم بنجاح'),
                getText(
                  'Your account deletion request has been submitted.',
                  'تم تقديم طلب حذف حسابك.',
                ),
                [{ text: 'OK', onPress: () => navigation.navigate('WelcomeScreen') }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  const handleMenuPress = (screen: string) => {
    if (screen === 'Support') {
      const phoneNumber = '+201505595444';
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
      Linking.canOpenURL(whatsappUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(whatsappUrl);
          } else {
            return Linking.openURL(`https://wa.me/${phoneNumber.replace('+', '')}`);
          }
        })
        .catch((err) => console.error('An error occurred', err));
      return;
    }

    if (screen === 'RateSettings') {
      if (!captainId) {
        Alert.alert('Error', 'Missing captain ID');
        return;
      }
      if (vehicleType === 'Scooter') {
        navigation.navigate('CaptainRateSettingsScreen', { 
          token, 
          scooterId: captainId,
          selectedLanguage: language 
        });
      } else if (isFreeDriver) {
        navigation.navigate('CaptainHourlyRateScreen', { 
          token, 
          captainId,
          selectedLanguage: language 
        });
      } else {
        navigation.navigate('CaptainRateSettingsScreen', { 
          token, 
          captainId, 
          vehicleType,
          selectedLanguage: language 
        });
      }
    } else if (screen === 'TripHistory') {
      navigation.navigate('CaptainTripHistoryScreen', { token, captainId, selectedLanguage: language });
    } else if (screen === 'Reviews') {
      navigation.navigate('CaptainReviewsScreen', { 
        token, 
        captainId, 
        selectedLanguage: language,
        reviews: params.captainData?.reviews || []
      });
    } else {
      navigation.navigate(screen, {
        selectedLanguage: language,
        captainData: params.captainData,
        token,
        governorate: params.governorate,
        service: params.service,
      });
    }
  };

  const menuItems = [
    { id: '2', title_en: 'Trip History', title_ar: 'سجل الرحلات', icon: '📋', screen: 'TripHistory' },
    { id: '4', title_en: 'Reviews', title_ar: 'التقييمات', icon: '⭐', screen: 'Reviews' },
    { id: '5', title_en: 'Rate Settings', title_ar: 'إعدادات الأسعار', icon: '⚙️', screen: 'RateSettings' },
    { id: '6', title_en: 'Support', title_ar: 'الدعم', icon: '🎧', screen: 'Support' },
  ];

  const calculateAverageRating = () => {
    if (params.captainData?.reviews && Array.isArray(params.captainData.reviews)) {
      const reviews = params.captainData.reviews;
      if (reviews.length === 0) return 0;
      const sum = reviews.reduce((acc: number, review: any) => acc + (review.rating || 0), 0);
      return (sum / reviews.length).toFixed(1);
    }
    return captainStats.rating;
  };

  if (!initialOnlineStatusLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>{getText('Loading...', 'جاري التحميل...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground source={bgPattern} style={styles.container} imageStyle={styles.bgImage}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBookings();
                fetchCaptainStats();
              }}
              tintColor="#D4AF37"
            />
          }
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Image source={toutLogo} style={styles.toutLogo} />
            <View style={styles.langToggle}>
              <TouchableOpacity
                onPress={() => setLanguage('English')}
                style={[styles.langBtn, language === 'English' && styles.langBtnActive]}
              >
                <Text style={[styles.langText, language === 'English' && styles.langTextActive]}>EN</Text>
              </TouchableOpacity>
              <View style={styles.langDivider} />
              <TouchableOpacity
                onPress={() => setLanguage('Arabic')}
                style={[styles.langBtn, language === 'Arabic' && styles.langBtnActive]}
              >
                <Text style={[styles.langText, language === 'Arabic' && styles.langTextActive]}>AR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Card */}
          <View style={styles.statusCardContainer}>
            <ImageBackground source={goldenFrame} style={styles.statusCard} imageStyle={styles.frameStyle}>
              <View style={styles.statusContent}>
                <Image source={pharaohIcon} style={styles.statusIcon} />
                <View>
                  <Text style={styles.welcomeText}>{getText('Welcome Back,', 'مرحباً بعودتك،')}</Text>
                  <Text style={styles.captainName}>
                    {params.captainData?.fullName || getText('Captain', 'القائد')}
                  </Text>
                </View>
                <View style={[styles.statusIndicator, isOnline ? styles.onlineBg : styles.offlineBg]}>
                  <Text style={styles.statusIndicatorText}>
                    {isOnline ? getText('Online', 'متصل') : getText('Offline', 'غير متصل')}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Main Action Button */}
          <TouchableOpacity 
            style={styles.mainActionBtn} 
            onPress={() => toggleOnline(!isOnline)}
            activeOpacity={0.8}
          >
            <View style={[styles.btnInner, isOnline ? styles.btnOnline : styles.btnOffline]}>
              <Text style={styles.btnText}>
                {isOnline ? getText('Go Offline', 'الخروج') : getText('Go Online', 'اتصل بالإنترنت')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Incoming Trip Request */}
          {bookings.length > 0 && isOnline && !isFreeDriver && (
            <View style={styles.incomingTripCard}>
              <Text style={styles.incomingTripTitle}>{getText("New Trip Request!", "طلب رحلة جديد!")}</Text>
              <Text style={styles.incomingTripText}>{getText("From:", "من:")} {bookings[0].pickup_address || bookings[0].pickup_location || ''}</Text>
              <Text style={styles.incomingTripText}>{getText("To:", "إلى:")} {bookings[0].dropoff_address || bookings[0].dropoff_location || ''}</Text>
              <Text style={styles.incomingTripText}>{getText("Fare:", "الأجرة:")} {bookings[0].estimated_fare || bookings[0].fare || 0} {getText("EGP", "جنيه")}</Text>
              <Text style={styles.incomingTripText}>{getText("Service:", "الخدمة:")} {bookings[0].service_type || ''}</Text>
              <Text style={[styles.incomingTripText, { fontWeight: 'bold', color: bookings[0].payment_method === 'InstaPay' ? '#00CC66' : '#FFD700' }]}>
                {getText("Payment:", "الدفع:")} {bookings[0].payment_method === 'InstaPay' ? '📱 InstaPay' : '💵 ' + getText('Cash', 'نقداً')}
              </Text>
              <View style={styles.tripActionButtons}>
                <TouchableOpacity style={[styles.tripActionButton, styles.acceptButton]} onPress={() => handleAcceptTrip(bookings[0].booking_id || bookings[0].id)}>
                  <Text style={styles.tripActionButtonText}>{getText("Accept", "قبول")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tripActionButton, styles.rejectButton]} onPress={() => handleRejectTrip(bookings[0].booking_id || bookings[0].id)}>
                  <Text style={styles.tripActionButtonText}>{getText("Reject", "رفض")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{getText('Today', 'اليوم')}</Text>
              <Text style={styles.statValue}>{captainStats.tripsToday}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{getText('Earnings', 'الأرباح')}</Text>
              <Text style={styles.statValue}>${captainStats.earnings.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{getText('Rating', 'التقييم')}</Text>
              <Text style={styles.statValue}>{captainStats.rating}</Text>
              {captainStats.totalRatings > 0 && (
                <Text style={styles.ratingCount}>({captainStats.totalRatings})</Text>
              )}
            </View>
          </View>

          <Image source={goldenDivider} style={styles.divider} />

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.screen)}
              >
                <View style={styles.menuIconContainer}>
                  <Text style={styles.menuEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.menuTitle}>{getText(item.title_en, item.title_ar)}</Text>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Premium Banner */}
          <View style={styles.premiumBanner}>
            <Text style={styles.premiumTitle}>{getText('Premium Rides', 'رحلات مميزة')}</Text>
            <Text style={styles.premiumSub}>{getText('Timeless Experience', 'تجربة خالدة')}</Text>
          </View>

          {/* Delete Account Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              marginTop: 30,
              marginBottom: 10,
              alignSelf: 'center',
              padding: 10,
            }}
            onPress={handleDeleteAccount}
          >
            <Text style={{
              color: '#FF4444',
              fontSize: 12,
              textDecorationLine: 'underline',
              opacity: 0.8,
            }}>
              {getText('Delete Account', 'حذف الحساب')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  container: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.05,
    resizeMode: 'repeat',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  toutLogo: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  langBtnActive: {
    backgroundColor: '#D4AF37',
  },
  langText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  langTextActive: {
    color: '#1A1A1A',
  },
  langDivider: {
    width: 1,
    backgroundColor: '#D4AF37',
    marginVertical: 4,
    opacity: 0.3,
  },
  statusCardContainer: {
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusCard: {
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  frameStyle: {
    resizeMode: 'stretch',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  welcomeText: {
    color: '#8B4513',
    fontSize: 14,
    fontFamily: 'serif',
  },
  captainName: {
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  statusIndicator: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  onlineBg: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  offlineBg: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  statusIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  mainActionBtn: {
    marginBottom: 30,
  },
  btnInner: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    elevation: 3,
  },
  btnOnline: {
    backgroundColor: '#F44336',
  },
  btnOffline: {
    backgroundColor: '#4CAF50',
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFF',
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B4513',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  ratingCount: {
    fontSize: 10,
    color: '#8B4513',
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 20,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FDF5E6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'serif',
  },
  chevron: {
    marginLeft: 'auto',
    fontSize: 18,
    color: '#D4AF37',
  },
  premiumBanner: {
    backgroundColor: '#1A1A1A',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  premiumTitle: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
    premiumSub: {
      color: '#FFF',
      fontSize: 12,
      marginTop: 5,
      letterSpacing: 2,
    },
    incomingTripCard: {
      backgroundColor: '#FFF',
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: '#D4AF37',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    incomingTripTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1A1A1A',
      marginBottom: 10,
      textAlign: 'center',
    },
    incomingTripText: {
      fontSize: 16,
      color: '#333',
      marginBottom: 5,
    },
    tripActionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
    },
    tripActionButton: {
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 10,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 5,
    },
    acceptButton: {
      backgroundColor: '#4CAF50',
    },
    rejectButton: {
      backgroundColor: '#F44336',
    },
    tripActionButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default CaptainDashboard;