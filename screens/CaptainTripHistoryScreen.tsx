import { API_ENDPOINTS } from '../services/api';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
} from 'react-native';

const pharaohBg = require('../assets/lottie/images/pharaoh-head.png');

const CaptainTripHistoryScreen: React.FC<any> = ({ navigation, route }) => {
  const params = route?.params || {};

  const selectedLanguage = params.selectedLanguage || 'English';
  const token = params.token || '';

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = (en: string, ar: string) =>
    selectedLanguage === 'Arabic' ? ar : en;

  // ================= FETCH =================
  const fetchTrips = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.CAPTAIN_BOOKING_HISTORY, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      // ✅ FIX: detect HTML error pages
      if (text.trim().startsWith('<')) {
        throw new Error(t('Server error', 'خطأ في السيرفر'));
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(t('Parse error', 'خطأ في البيانات'));
      }

      if (!res.ok) {
        throw new Error(data?.message || 'Error');
      }

      const list =
        Array.isArray(data)
          ? data
          : data?.data?.bookings || data?.bookings || [];

      if (!Array.isArray(list)) {
        setTrips([]);
        return;
      }

      // ✅ SORT SAFE
      const sorted = list.sort((a: any, b: any) => {
        const d1 = new Date(b?.booking_time || 0).getTime();
        const d2 = new Date(a?.booking_time || 0).getTime();
        return d1 - d2;
      });

      setTrips(sorted);

    } catch (e: any) {
      Alert.alert(t('Error', 'خطأ'), e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, selectedLanguage]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  // ================= STATUS =================
  const getStatus = (status: string) => {
    const s = (status || '').toLowerCase();

    if (s === 'completed')
      return { text: t('Completed', 'مكتمل'), color: '#2ecc71' };

    if (s === 'cancelled')
      return { text: t('Cancelled', 'ملغي'), color: '#e74c3c' };

    return { text: status || '---', color: '#999' };
  };

  // ================= ITEM =================
  const renderItem = ({ item }: { item: any }) => {
    const status = getStatus(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {item.user_name || '---'}
          </Text>

          <View style={[styles.badge, { backgroundColor: status.color }]}>
            <Text style={styles.badgeText}>
              {status.text}
            </Text>
          </View>
        </View>

        <Text style={styles.text}>
          {t('From', 'من')}: {item.pickup_address || '---'}
        </Text>

        <Text style={styles.text}>
          {t('To', 'إلى')}: {item.dropoff_address || '---'}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.date}>
            {item.booking_time
              ? new Date(item.booking_time).toLocaleDateString()
              : '---'}
          </Text>

          <Text style={styles.price}>
            {item.captain_earning || item.estimated_fare || 0} EGP
          </Text>
        </View>
      </View>
    );
  };

  // ================= UI =================
  return (
    <ImageBackground source={pharaohBg} style={styles.bg}>
      <View style={styles.overlay}>

        {/* HEADER */}
        <View style={styles.top}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {t('Trip History', 'سجل الرحلات')}
          </Text>

          <View style={{ width: 30 }} />
        </View>

        {/* CONTENT */}
        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : trips.length === 0 ? (
          <Text style={styles.empty}>
            {t('No trips', 'لا توجد رحلات')}
          </Text>
        ) : (
          <FlatList
            data={trips}
            renderItem={renderItem}
            keyExtractor={(item) =>
              (item.booking_id || Math.random()).toString()
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
              />
            }
          />
        )}

      </View>
    </ImageBackground>
  );
};

export default CaptainTripHistoryScreen;

// ================= STYLES =================
const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 15,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  back: {
    color: '#FFD700',
    fontSize: 24,
  },
  title: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#141B2D',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
  },
  text: {
    color: '#ddd',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  date: {
    color: '#aaa',
  },
  price: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
});