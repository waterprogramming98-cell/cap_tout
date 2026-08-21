import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { API_ENDPOINTS } from '../services/api';

const { width } = Dimensions.get('window');

type Coordinate = { latitude: number; longitude: number };
type RouteTarget = { latitude: number; longitude: number; label: string };

const COLORS = {
  PRIMARY_DARK: '#121212',
  ACCENT_GOLD: '#D4AF37',
  ACCENT_GREEN: '#2E7D32',
};

const CAPTAIN_CANCELLATION_REASONS = [
  'Passenger did not arrive',
  'Vehicle issue',
  'I cannot reach the pickup point',
  'Passenger asked to cancel',
  'Other',
];

const isValidCoordinate = (latitude: unknown, longitude: unknown): boolean => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
};

const toCoordinate = (latitude: unknown, longitude: unknown): Coordinate | null => {
  if (!isValidCoordinate(latitude, longitude)) return null;
  return { latitude: Number(latitude), longitude: Number(longitude) };
};

const distanceMetres = (from: Coordinate, to: Coordinate): number => {
  const earthRadius = 6371e3;
  const latitudeDifference = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDifference = ((to.longitude - from.longitude) * Math.PI) / 180;
  const latitudeFrom = (from.latitude * Math.PI) / 180;
  const latitudeTo = (to.latitude * Math.PI) / 180;
  const a = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(latitudeFrom) * Math.cos(latitudeTo) * Math.sin(longitudeDifference / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatInstruction = (step: any, isArabic: boolean): string => {
  const maneuver = step?.maneuver || {};
  const roadName = step?.name ? ` ${isArabic ? 'إلى' : 'onto'} ${step.name}` : '';
  const modifier = String(maneuver.modifier || '').replace('_', ' ');
  const type = maneuver.type || 'continue';

  if (isArabic) {
    if (type === 'arrive') return 'لقد وصلت إلى الوجهة';
    if (type === 'depart') return `اتجه ${modifier || 'للأمام'}${roadName}`;
    if (type === 'turn') return `انعطف ${modifier || 'الآن'}${roadName}`;
    if (type === 'uturn') return 'قم بعمل دوران للخلف';
    if (type === 'merge') return `اندَمِج ${modifier || 'مع الطريق'}${roadName}`;
    if (type === 'fork') return `التزم ${modifier || 'بالمسار'}${roadName}`;
    if (type === 'roundabout' || type === 'rotary') return `ادخل الدوار${roadName}`;
    if (type === 'end of road') return `في نهاية الطريق انعطف ${modifier || ''}${roadName}`.trim();
    return `استمر ${modifier || 'للأمام'}${roadName}`;
  }

  if (type === 'arrive') return 'You have arrived at the destination';
  if (type === 'depart') return `Head ${modifier || 'straight'}${roadName}`;
  if (type === 'turn') return `Turn ${modifier || 'now'}${roadName}`;
  if (type === 'uturn') return 'Make a U-turn';
  if (type === 'merge') return `Merge ${modifier || 'onto the road'}${roadName}`;
  if (type === 'fork') return `Keep ${modifier || 'on the road'}${roadName}`;
  if (type === 'roundabout' || type === 'rotary') return `Enter the roundabout${roadName}`;
  if (type === 'end of road') return `At the end of the road, turn ${modifier || ''}${roadName}`.trim();
  return `Continue ${modifier || 'straight'}${roadName}`;
};

const TripInProgressScreen = ({ route, navigation }: any) => {
  const { bookingId, bookingDetails, token, captainId, selectedLanguage } = route.params || {};
  const isArabic = selectedLanguage === 'Arabic';
  const getText = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

  const [booking, setBooking] = useState<any>(bookingDetails || null);
  const [captainLocation, setCaptainLocation] = useState<Coordinate | null>(null);
  const [routePolyline, setRoutePolyline] = useState<Coordinate[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [eta, setEta] = useState(getText('Calculating…', 'جارٍ الحساب…'));
  const [distanceRemaining, setDistanceRemaining] = useState('');
  const [tripStarted, setTripStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancellationReason, setSelectedCancellationReason] = useState('');
  const [otherCancellationReason, setOtherCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [debugLines, setDebugLines] = useState<string[]>(['Trip screen started.']);

  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);
  const stepsRef = useRef<any[]>([]);
  const currentStepRef = useRef(0);
  const targetRef = useRef<RouteTarget | null>(null);
  const lastRerouteTimeRef = useRef(0);
  const lastServerLogTimeRef = useRef(0);
  const lastArrivalTargetRef = useRef<string | null>(null);

  const pickup = useMemo(
    () => toCoordinate(booking?.pickup_location_lat, booking?.pickup_location_lon),
    [booking?.pickup_location_lat, booking?.pickup_location_lon],
  );
  const dropoff = useMemo(
    () => toCoordinate(booking?.dropoff_location_lat, booking?.dropoff_location_lon),
    [booking?.dropoff_location_lat, booking?.dropoff_location_lon],
  );

  const appendDebug = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLines(previous => [...previous.slice(-17), `[${timestamp}] ${message}`]);
  }, []);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    currentStepRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    const target = tripStarted
      ? (dropoff ? { ...dropoff, label: 'dropoff' } : null)
      : (pickup ? { ...pickup, label: 'pickup' } : null);
    targetRef.current = target;
  }, [tripStarted, pickup, dropoff]);

  useEffect(() => {
    appendDebug(`Trip ID: ${bookingId ?? 'missing'}`);
    appendDebug(`Pickup: ${pickup ? `${pickup.latitude.toFixed(6)}, ${pickup.longitude.toFixed(6)}` : 'MISSING'}`);
    appendDebug(`Dropoff: ${dropoff ? `${dropoff.latitude.toFixed(6)}, ${dropoff.longitude.toFixed(6)}` : 'MISSING'}`);
  }, [appendDebug, bookingId, pickup, dropoff]);

  useEffect(() => {
    let cancelled = false;
    const loadBookingDetails = async () => {
      if (pickup || !bookingId) return;
      appendDebug('Pickup coordinates missing from navigation payload; fetching booking details…');
      try {
        const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
        const resolvedBooking = body?.booking || body?.data?.booking || body?.data || body;
        if (!cancelled) {
          setBooking(resolvedBooking);
          appendDebug(`Booking details loaded. Pickup valid: ${isValidCoordinate(resolvedBooking?.pickup_location_lat, resolvedBooking?.pickup_location_lon)}`);
        }
      } catch (error: any) {
        appendDebug(`Booking detail fetch failed: ${error?.message || String(error)}`);
      }
    };
    loadBookingDetails();
    return () => { cancelled = true; };
  }, [appendDebug, bookingId, pickup, token]);

  const fetchDirections = useCallback(async (start: Coordinate, destination: RouteTarget) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;
      appendDebug(`OSRM request → ${destination.label}: ${start.latitude.toFixed(5)},${start.longitude.toFixed(5)} → ${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}`);
      const response = await fetch(url);
      appendDebug(`OSRM HTTP status: ${response.status}`);
      if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
      const data = await response.json();
      const routeData = data?.code === 'Ok' ? data?.routes?.[0] : null;
      if (!routeData?.geometry?.coordinates?.length) {
        throw new Error(data?.message || data?.code || 'OSRM returned no route geometry');
      }

      const coordinates = routeData.geometry.coordinates.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude }));
      const routeSteps = routeData?.legs?.[0]?.steps || [];
      setRoutePolyline(coordinates);
      setSteps(routeSteps);
      setCurrentStepIndex(0);
      setEta(`${Math.max(1, Math.ceil(Number(routeData.duration || 0) / 60))} ${getText('min', 'دقيقة')}`);
      setDistanceRemaining(`${(Number(routeData.distance || 0) / 1000).toFixed(1)} ${getText('km', 'كم')}`);
      appendDebug(`OSRM success: ${coordinates.length} route points, ${routeSteps.length} navigation steps; route rendered.`);

      if (mapRef.current && coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 110, right: 45, bottom: 250, left: 45 },
          animated: true,
        });
      }
    } catch (error: any) {
      setRoutePolyline([]);
      setSteps([]);
      appendDebug(`OSRM failure: ${error?.message || String(error)}`);
    }
  }, [appendDebug, getText]);

  const sendCaptainLocation = useCallback(async (location: Coordinate) => {
    if (!bookingId || !token) {
      appendDebug('GPS not sent: booking ID or captain token is missing.');
      return;
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude: location.latitude, longitude: location.longitude }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || `HTTP ${response.status}`);
      const now = Date.now();
      if (now - lastServerLogTimeRef.current > 10000) {
        appendDebug(`GPS sent to backend: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)} (HTTP ${response.status}).`);
        lastServerLogTimeRef.current = now;
      }
    } catch (error: any) {
      appendDebug(`GPS backend update failed: ${error?.message || String(error)}`);
    }
  }, [appendDebug, bookingId, token]);

  const updateNavigation = useCallback((location: Coordinate) => {
    const target = targetRef.current;
    if (!target) return;

    const destinationDistance = distanceMetres(location, target);
    setDistanceRemaining(destinationDistance >= 1000
      ? `${(destinationDistance / 1000).toFixed(1)} ${getText('km remaining', 'كم متبقي')}`
      : `${Math.round(destinationDistance)} ${getText('m remaining', 'م متبقي')}`);

    const activeSteps = stepsRef.current;
    const stepIndex = currentStepRef.current;
    if (activeSteps.length > 0 && stepIndex < activeSteps.length) {
      const activeStep = activeSteps[stepIndex];
      const maneuverLocation = activeStep?.maneuver?.location;
      if (Array.isArray(maneuverLocation) && maneuverLocation.length === 2) {
        const maneuverDistance = distanceMetres(location, { latitude: maneuverLocation[1], longitude: maneuverLocation[0] });
        if (maneuverDistance < 25 && stepIndex < activeSteps.length - 1) {
          const nextStepIndex = stepIndex + 1;
          currentStepRef.current = nextStepIndex;
          setCurrentStepIndex(nextStepIndex);
          appendDebug(`Navigation step advanced to ${nextStepIndex + 1}/${activeSteps.length}.`);
        }
      }
    }

    if (destinationDistance < 30 && lastArrivalTargetRef.current !== target.label) {
      lastArrivalTargetRef.current = target.label;
      Alert.alert(getText('Arrival', 'الوصول'), target.label === 'pickup'
        ? getText('You have arrived at the passenger pickup point.', 'لقد وصلت إلى موقع استلام الراكب.')
        : getText('You have arrived at the dropoff point.', 'لقد وصلت إلى موقع الوصول.'));
      appendDebug(`Arrival detected at ${target.label}.`);
    }

    const now = Date.now();
    if (activeSteps.length > 0 && now - lastRerouteTimeRef.current > 30000) {
      const activeStep = activeSteps[Math.min(currentStepRef.current, activeSteps.length - 1)];
      const maneuverLocation = activeStep?.maneuver?.location;
      if (Array.isArray(maneuverLocation) && maneuverLocation.length === 2) {
        const distanceFromRouteStep = distanceMetres(location, { latitude: maneuverLocation[1], longitude: maneuverLocation[0] });
        if (distanceFromRouteStep > 150) {
          appendDebug(`Off-route distance ${Math.round(distanceFromRouteStep)}m; requesting a new route.`);
          lastRerouteTimeRef.current = now;
          fetchDirections(location, target);
        }
      }
    }
  }, [appendDebug, fetchDirections, getText]);

  useEffect(() => {
    let mounted = true;
    
    const checkBookingStatus = async () => {
      if (!mounted) return;
      try {
        const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const latestBooking = data?.booking || data?.data?.booking || data?.data || data;
        
        if (latestBooking && latestBooking.status === 'Cancelled') {
          const cancelledBy = String(latestBooking.cancelled_by || '').toLowerCase();
          if (cancelledBy === 'user') {
            Alert.alert(
              getText('Trip Cancelled', 'تم إلغاء الرحلة'),
              getText('The passenger has cancelled this trip.', 'قام المسافر بإلغاء هذه الرحلة.'),
              [{ text: 'OK', onPress: () => navigation.replace('CaptainDashboardScreen', { selectedLanguage, token, captainId }) }]
            );
            mounted = false;
          }
        }
      } catch (e) {
        console.log('Status poll error:', e);
      }
    };

    const statusInterval = setInterval(checkBookingStatus, 10000);

    const startTracking = async () => {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          appendDebug('GPS permission was denied. Navigation cannot start.');
          return;
        }
      }

      Geolocation.getCurrentPosition(
        position => {
          if (!mounted) return;
          const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCaptainLocation(location);
          appendDebug(`Initial GPS: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}.`);
          sendCaptainLocation(location);
          if (targetRef.current) fetchDirections(location, targetRef.current);
          else appendDebug('Route waiting: pickup coordinates are not available yet.');
        },
        error => appendDebug(`Initial GPS error ${error.code}: ${error.message}`),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
      );

      watchIdRef.current = Geolocation.watchPosition(
        position => {
          const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCaptainLocation(location);
          updateNavigation(location);
          sendCaptainLocation(location);
        },
        error => appendDebug(`GPS watcher error ${error.code}: ${error.message}`),
        { enableHighAccuracy: true, distanceFilter: 5, interval: 5000, fastestInterval: 2000, showLocationDialog: true },
      );
      appendDebug('Live GPS watcher started.');
    };

    startTracking();
    return () => {
      mounted = false;
      clearInterval(statusInterval);
      if (watchIdRef.current !== null) Geolocation.clearWatch(watchIdRef.current);
    };
  }, [appendDebug, fetchDirections, sendCaptainLocation, updateNavigation]);

  useEffect(() => {
    if (captainLocation && targetRef.current && routePolyline.length === 0) {
      fetchDirections(captainLocation, targetRef.current);
    }
  }, [captainLocation, fetchDirections, pickup, dropoff, routePolyline.length, tripStarted]);

  const handleStartTrip = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'EnRoute' }),
      });
      if (!response.ok) throw new Error('Status update failed');
      setTripStarted(true);
      lastArrivalTargetRef.current = null;
      appendDebug('Trip started. Routing target changed to dropoff.');
      if (captainLocation && dropoff) fetchDirections(captainLocation, { ...dropoff, label: 'dropoff' });
    } catch (error: any) {
      Alert.alert(getText('Error', 'خطأ'), error?.message || 'Status update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Completed' }),
      });
      if (!response.ok) throw new Error('Status update failed');
      navigation.replace('CaptainDashboardScreen', { selectedLanguage, token, captainId });
    } catch (error: any) {
      Alert.alert(getText('Error', 'خطأ'), error?.message || 'Status update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    navigation.navigate('CaptainTripChatScreen', {
      bookingId,
      selectedLanguage,
      token,
      passengerName: booking?.user_name,
    });
  };

  const handleCancelTrip = async () => {
    const reason = selectedCancellationReason === 'Other'
      ? otherCancellationReason.trim()
      : selectedCancellationReason;
    if (!reason) {
      Alert.alert(getText('Cancellation reason', 'سبب الإلغاء'), getText('Please select or write a cancellation reason.', 'يرجى اختيار أو كتابة سبب الإلغاء.'));
      return;
    }
    setIsCancelling(true);
    try {
      const response = await fetch(API_ENDPOINTS.CAPTAIN_CANCEL_BOOKING(bookingId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Cancellation failed');
      setShowCancelModal(false);
      Alert.alert(getText('Trip Cancelled', 'تم إلغاء الرحلة'), getText('The cancellation reason has been recorded.', 'تم تسجيل سبب الإلغاء.'), [
        { text: 'OK', onPress: () => navigation.replace('CaptainDashboardScreen', { selectedLanguage, token, captainId }) },
      ]);
    } catch (error: any) {
      Alert.alert(getText('Cancellation failed', 'تعذر الإلغاء'), error?.message || getText('Please try again.', 'يرجى المحاولة مرة أخرى.'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExternalNavigation = () => {
    const target = targetRef.current;
    if (!target) return;
    const latLng = `${target.latitude},${target.longitude}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${target.label}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${target.label})`,
    });
    if (url) Linking.openURL(url);
  };

  const currentStep = steps[currentStepIndex];
  const instruction = currentStep
    ? formatInstruction(currentStep, isArabic)
    : (pickup ? getText('Head to the passenger pickup point', 'توجه إلى موقع استلام الراكب') : getText('Waiting for pickup location', 'جارٍ انتظار موقع الاستلام'));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{instruction}</Text>
          <Text style={styles.subInstructionText}>{currentStep ? `${Math.round(currentStep.distance || 0)}m • ` : ''}{distanceRemaining || eta}</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Open external map" style={styles.googleMapsButton} onPress={handleExternalNavigation}>
          <Image source={require('../assets/images/google-maps-icon.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: captainLocation?.latitude || pickup?.latitude || 30.0444,
            longitude: captainLocation?.longitude || pickup?.longitude || 31.2357,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {routePolyline.length > 0 && <Polyline coordinates={routePolyline} strokeColor={COLORS.ACCENT_GOLD} strokeWidth={6} />}
          {captainLocation && (
            <Marker coordinate={captainLocation} flat anchor={{ x: 0.5, y: 0.5 }} title={getText('Captain', 'الكابتن')}>
              <Image source={require('../assets/images/car-icon-gold.png')} style={styles.carIcon} />
            </Marker>
          )}
          {pickup && !tripStarted && <Marker coordinate={pickup} pinColor="green" title={getText('Passenger pickup', 'موقع استلام الراكب')} />}
          {dropoff && tripStarted && <Marker coordinate={dropoff} pinColor="red" title={getText('Dropoff', 'موقع الوصول')} />}
        </MapView>

        <TouchableOpacity style={styles.debugToggle} onPress={() => setShowDebug(value => !value)}>
          <Text style={styles.debugToggleText}>{showDebug ? getText('Hide Debug', 'إخفاء التشخيص') : getText('Show Debug', 'عرض التشخيص')}</Text>
        </TouchableOpacity>

        {showDebug && (
          <View style={styles.debugBox}>
            <ScrollView style={styles.debugScroll}>
              <Text style={styles.debugText}>{debugLines.join('\n')}</Text>
            </ScrollView>
          </View>
        )}

        <View style={styles.etaCard}>
          <Text style={styles.etaText}>{eta}</Text>
          <Text style={styles.distanceText}>{distanceRemaining}</Text>
        </View>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{booking?.user_name || getText('Passenger', 'الراكب')}</Text>
          <Text style={styles.addressText}>{tripStarted ? booking?.dropoff_address : booking?.pickup_address}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.callButton} onPress={() => booking?.user_phone && Linking.openURL(`tel:${booking.user_phone}`)}>
            <Text style={styles.callButtonText}>{getText('Call', 'اتصال')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
            <Text style={styles.chatButtonText}>{getText('Chat', 'محادثة')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => { setSelectedCancellationReason(''); setOtherCancellationReason(''); setShowCancelModal(true); }}>
            <Text style={styles.cancelButtonText}>{getText('Cancel', 'إلغاء')}</Text>
          </TouchableOpacity>
          {!tripStarted ? (
            <TouchableOpacity disabled={loading} style={[styles.actionButton, styles.startButton]} onPress={handleStartTrip}>
              <Text style={styles.buttonText}>{loading ? getText('Starting…', 'جارٍ البدء…') : getText('Start', 'بدء')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity disabled={loading} style={[styles.actionButton, styles.endButton]} onPress={handleEndTrip}>
              <Text style={styles.buttonText}>{loading ? getText('Ending…', 'جارٍ الإنهاء…') : getText('End', 'إنهاء')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getText('Cancel this trip?', 'إلغاء هذه الرحلة؟')}</Text>
            <Text style={styles.modalSubtitle}>{getText('Choose the cancellation reason. It will be saved with this trip.', 'اختر سبب الإلغاء. سيتم حفظه مع هذه الرحلة.')}</Text>
            {CAPTAIN_CANCELLATION_REASONS.map(reason => (
              <TouchableOpacity key={reason} style={styles.reasonOption} onPress={() => setSelectedCancellationReason(reason)}>
                <View style={styles.radioButton}>{selectedCancellationReason === reason && <View style={styles.radioButtonInner} />}</View>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
            {selectedCancellationReason === 'Other' && (
              <TextInput style={styles.otherReasonInput} value={otherCancellationReason} onChangeText={setOtherCancellationReason} placeholder={getText('Write the reason', 'اكتب السبب')} multiline />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowCancelModal(false)} disabled={isCancelling}><Text style={styles.closeModalText}>{getText('Close', 'إغلاق')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmCancelButton, isCancelling && styles.disabledButton]} onPress={handleCancelTrip} disabled={isCancelling}><Text style={styles.confirmCancelText}>{isCancelling ? getText('Cancelling…', 'جارٍ الإلغاء…') : getText('Confirm cancellation', 'تأكيد الإلغاء')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.PRIMARY_DARK },
  navHeader: { flexDirection: 'row', backgroundColor: COLORS.ACCENT_GOLD, padding: 15, alignItems: 'center', elevation: 5, zIndex: 10 },
  instructionContainer: { flex: 1 },
  instructionText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subInstructionText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 },
  googleMapsButton: { backgroundColor: 'white', padding: 8, borderRadius: 10, marginLeft: 10 },
  navIcon: { width: 30, height: 30 },
  mapContainer: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  carIcon: { width: 40, height: 40, resizeMode: 'contain' },
  debugToggle: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, zIndex: 20 },
  debugToggleText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  debugBox: { position: 'absolute', top: 50, right: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.88)', padding: 10, borderRadius: 8, zIndex: 20, borderWidth: 1, borderColor: COLORS.ACCENT_GOLD },
  debugScroll: { maxHeight: 140 },
  debugText: { color: '#00FF00', fontSize: 10.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  etaCard: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'white', padding: 12, borderRadius: 12, elevation: 4, alignItems: 'center', minWidth: width * 0.22 },
  etaText: { fontSize: 18, fontWeight: 'bold', color: COLORS.ACCENT_GOLD },
  distanceText: { fontSize: 14, color: '#666', marginTop: 2 },
  bottomPanel: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20 },
  passengerInfo: { marginBottom: 15 },
  passengerName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addressText: { fontSize: 14, color: '#666', marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 6 },
  callButton: { flex: 1, backgroundColor: '#eee', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  callButtonText: { color: '#333', fontWeight: 'bold', fontSize: 12 },
  chatButton: { flex: 1, backgroundColor: '#D4AF37', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  chatButtonText: { color: '#121212', fontWeight: 'bold', fontSize: 12 },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: '#D04B4B', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelButtonText: { color: '#C33B3B', fontWeight: 'bold', fontSize: 12 },
  actionButton: { flex: 1.15, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  startButton: { backgroundColor: COLORS.ACCENT_GOLD },
  endButton: { backgroundColor: COLORS.ACCENT_GREEN },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#1C2535', fontSize: 20, fontWeight: '800' },
  modalSubtitle: { color: '#657082', fontSize: 13, marginTop: 5, marginBottom: 16 },
  reasonOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.ACCENT_GOLD, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  radioButtonInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.ACCENT_GOLD },
  reasonText: { color: '#283246', fontSize: 15 },
  otherReasonInput: { borderWidth: 1, borderColor: '#D6DAE0', borderRadius: 8, minHeight: 70, padding: 10, marginTop: 5, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 18 },
  closeModalButton: { paddingVertical: 11, paddingHorizontal: 12 },
  closeModalText: { color: '#657082', fontWeight: '700' },
  confirmCancelButton: { backgroundColor: '#C73D3D', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 13 },
  confirmCancelText: { color: 'white', fontWeight: '800', fontSize: 13 },
  disabledButton: { opacity: 0.6 },
});

export default TripInProgressScreen;
