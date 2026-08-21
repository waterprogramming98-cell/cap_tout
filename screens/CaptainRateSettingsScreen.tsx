import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/theme';

// ---------------- TYPES ----------------
type CategoryKey =
  | 'Economy'
  | 'Family'
  | 'Medical'
  | 'Luxury'
  | 'School Trips';

type Props = {
  route: any;
  navigation: any;
};

const CaptainRateSettingsScreen = ({ route, navigation }: Props) => {
  const params = route?.params || {};

  const token = params.token ?? '';
  const captainId = params.captainId ?? null;
  const vehicleType = params.vehicleType ?? '';

  const isFreeDriver = vehicleType === 'WithoutVehicle';

  const [language, setLanguage] = useState(
    params.selectedLanguage || 'English'
  );

  const isAR = language === 'Arabic';
  const t = (en: string, ar: string) => (isAR ? ar : en);

  const [activeServices, setActiveServices] = useState<CategoryKey[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({
    Economy: 4,
    Family: 7,
    Medical: 8,
    Luxury: 14,
    'School Trips': 6,
  });

  const [minimumFare, setMinimumFare] = useState(15);
  const [waitingTime, setWaitingTime] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---------------- NAMES & RANGES ----------------
  const categoryNames: Record<CategoryKey, { en: string; ar: string }> = {
    Economy: { en: 'Economy', ar: 'علي قد الإيد' },
    Family: { en: 'Family', ar: 'عائلية' },
    Medical: { en: 'Medical', ar: 'خدمة طبية' },
    Luxury: { en: 'Luxury', ar: 'درجة رجال الأعمال' },
    'School Trips': { en: 'School Trips', ar: 'رحلات مدارس' },
  };

  const ranges: Record<CategoryKey, { min: number; max: number }> = {
    Economy: { min: 3, max: 20 },
    Family: { min: 5, max: 25 },
    Medical: { min: 6, max: 30 },
    Luxury: { min: 10, max: 40 },
    'School Trips': { min: 4, max: 20 },
  };

  // ---------------- LANGUAGE ----------------
  useEffect(() => {
    AsyncStorage.getItem('app_language').then((lang) => {
      if (lang) setLanguage(lang);
    });
  }, []);

  const toggleLanguage = async () => {
    const newLang = language === 'English' ? 'Arabic' : 'English';
    setLanguage(newLang);
    await AsyncStorage.setItem('app_language', newLang);
  };

  // ================= LOAD RATES & SERVICES =================
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Captain Info to get active services
        const meRes = await fetch('https://toutsroutes.com/api/captains/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meJson = await meRes.json();
        
        if (meJson.success && meJson.data.services) {
          const mappedServices = meJson.data.services.map((s: string) => 
            s === 'School_Trips' ? 'School Trips' : s
          ) as CategoryKey[];
          setActiveServices(mappedServices);
        }

        // 2. Fetch Rates
        const res = await fetch(
          'https://toutsroutes.com/api/captains/me/rates',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = await res.json();

        if (!json.success) {
          setLoading(false);
          return;
        }

        const rates = json.data.rates || [];
        
        const newPricing: any = {};
        let newMinFare = 15;
        let newWaiting = 1;
        let newHourly = 50;

        rates.forEach((r: any) => {
          const key = r.service_type === 'School_Trips' ? 'School Trips' : r.service_type;
          if (categoryNames[key as CategoryKey]) {
            newPricing[key] = r.rate_per_km;
          }

          if (r.service_type === 'WithoutVehicle') {
            newHourly = r.hourly_rate || 50;
          }

          newMinFare = r.minimum_fare || newMinFare;
          newWaiting = r.waiting_time_rate || newWaiting;
        });

        setPricing((prev) => ({ ...prev, ...newPricing }));
        setMinimumFare(newMinFare);
        setWaitingTime(newWaiting);
        setHourlyRate(newHourly);

      } catch (err) {
        console.log('Load rates error', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // ---------------- SAVE ----------------
  const handleSave = async () => {
    if (!token) {
      Alert.alert(t('Error', 'خطأ'), t('Missing token', 'التوكن مفقود'));
      return;
    }

    setSaving(true);

    try {
      const body: any = {
        minimum_fare: minimumFare,
        waiting_time_rate: waitingTime,
      };

      if (!isFreeDriver) {
        // Map current pricing to backend expected fields
        body.economy_rate = pricing.Economy;
        body.family_rate = pricing.Family;
        body.medical_rate = pricing.Medical;
        body.luxury_rate = pricing.Luxury;
        body.school_trips_rate = pricing['School Trips'];
      } else {
        body.hourly_rate = hourlyRate;
      }

      const res = await fetch(
        'https://toutsroutes.com/api/captains/me/rates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Save failed');
      }

      Alert.alert(
        t('Success', 'تم'),
        t('Saved successfully', 'تم الحفظ بنجاح')
      );

      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('Error', 'خطأ'), e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.ACCENT_GOLD} />
      </View>
    );
  }

  if (!captainId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {t('Captain ID missing', 'معرف الكابتن مفقود')}
        </Text>
      </View>
    );
  }

  // ---------------- UI ----------------
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Image 
          source={require('../assets/images/tout-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
          <Text style={styles.langToggleText}>
            {language === 'English' ? 'العربية' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('Rate Settings', 'إعدادات الأسعار')}
          </Text>
          <Text style={styles.subtitle}>
            {t('Set your preferred rates per kilometer', 'حدد أسعارك المفضلة لكل كيلومتر')}
          </Text>
        </View>

        {/* Dynamic Service Rates */}
        {!isFreeDriver && activeServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Service Rates', 'أسعار الخدمات')}</Text>
            {activeServices.map((key) => (
              <View key={key} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.category}>
                    {t(categoryNames[key].en, categoryNames[key].ar)}
                  </Text>
                  <Text style={styles.priceValue}>
                    {pricing[key]} <Text style={styles.unit}>EGP/km</Text>
                  </Text>
                </View>

                <Slider
                  style={styles.slider}
                  minimumValue={ranges[key].min}
                  maximumValue={ranges[key].max}
                  step={0.5}
                  value={pricing[key]}
                  minimumTrackTintColor={COLORS.ACCENT_GOLD}
                  maximumTrackTintColor={COLORS.PRIMARY_MEDIUM}
                  thumbTintColor={COLORS.ACCENT_GOLD}
                  onValueChange={(val) =>
                    setPricing((p) => ({ ...p, [key]: val }))
                  }
                />
                <View style={styles.rangeLabels}>
                  <Text style={styles.rangeText}>{ranges[key].min}</Text>
                  <Text style={styles.rangeText}>{ranges[key].max}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Hourly Rate for Free Drivers */}
        {isFreeDriver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Hourly Rate', 'سعر الساعة')}</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{t('Base Rate', 'السعر الأساسي')}</Text>
                <Text style={styles.priceValue}>{hourlyRate} <Text style={styles.unit}>EGP</Text></Text>
              </View>

              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={1000}
                step={5}
                value={hourlyRate}
                minimumTrackTintColor={COLORS.ACCENT_GOLD}
                maximumTrackTintColor={COLORS.PRIMARY_MEDIUM}
                thumbTintColor={COLORS.ACCENT_GOLD}
                onValueChange={setHourlyRate}
              />
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeText}>50</Text>
                <Text style={styles.rangeText}>1000</Text>
              </View>
            </View>
          </View>
        )}

        {/* Common Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('General Settings', 'إعدادات عامة')}</Text>
          
          {/* Minimum Fare */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{t('Minimum Fare', 'أقل قيمة للرحلة')}</Text>
              <Text style={styles.priceValue}>{minimumFare} <Text style={styles.unit}>EGP</Text></Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={200}
              step={1}
              value={minimumFare}
              minimumTrackTintColor={COLORS.ACCENT_GOLD}
              maximumTrackTintColor={COLORS.PRIMARY_MEDIUM}
              thumbTintColor={COLORS.ACCENT_GOLD}
              onValueChange={setMinimumFare}
            />
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeText}>10</Text>
              <Text style={styles.rangeText}>200</Text>
            </View>
          </View>

          {/* Waiting Time */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{t('Waiting Time Rate', 'سعر دقيقة الانتظار')}</Text>
              <Text style={styles.priceValue}>{waitingTime} <Text style={styles.unit}>EGP/min</Text></Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={5}
              step={0.5}
              value={waitingTime}
              minimumTrackTintColor={COLORS.ACCENT_GOLD}
              maximumTrackTintColor={COLORS.PRIMARY_MEDIUM}
              thumbTintColor={COLORS.ACCENT_GOLD}
              onValueChange={setWaitingTime}
            />
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeText}>0.5</Text>
              <Text style={styles.rangeText}>5</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.PRIMARY_DARK} />
          ) : (
            <Text style={styles.saveButtonText}>{t('Save Settings', 'حفظ الإعدادات')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CaptainRateSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  errorText: {
    color: 'red',
    fontSize: TYPOGRAPHY.SIZE_BODY,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.MD,
  },
  logo: {
    width: 100,
    height: 40,
  },
  langToggle: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_GOLD,
  },
  langToggleText: {
    color: COLORS.ACCENT_GOLD,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.SIZE_SMALL,
  },
  content: {
    padding: SPACING.LG,
    paddingBottom: SPACING.XXL,
  },
  header: {
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_H2,
    fontWeight: '700',
    color: COLORS.PRIMARY_LIGHT,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: COLORS.NEUTRAL_LIGHT,
    opacity: 0.8,
  },
  section: {
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_H4,
    fontWeight: '600',
    color: COLORS.ACCENT_GOLD,
    marginBottom: SPACING.MD,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT + '10',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  category: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: '600',
    color: COLORS.PRIMARY_LIGHT,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.SIZE_H4,
    fontWeight: '700',
    color: COLORS.ACCENT_GOLD,
  },
  unit: {
    fontSize: TYPOGRAPHY.SIZE_SMALL,
    fontWeight: '400',
    color: COLORS.NEUTRAL_LIGHT,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -SPACING.XS,
  },
  rangeText: {
    fontSize: 10,
    color: COLORS.NEUTRAL_MEDIUM,
  },
  saveButton: {
    backgroundColor: COLORS.ACCENT_GOLD,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.LG,
    shadowColor: COLORS.ACCENT_GOLD,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.SIZE_H4,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
});