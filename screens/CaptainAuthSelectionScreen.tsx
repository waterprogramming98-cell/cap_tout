import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'CaptainAuthSelection'>;

const CaptainAuthSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route?.params || {};

  const [language, setLanguage] = useState(
    params.selectedLanguage || 'English'
  );

  const [mode, setMode] = useState<'existing' | 'new' | null>(null);

  const isArabic = language === 'Arabic';
  const t = (en: string, ar: string) => (isArabic ? ar : en);

  // ================= LOAD LANGUAGE =================
  useEffect(() => {
    AsyncStorage.getItem('app_language').then((lang) => {
      if (lang) setLanguage(lang as 'English' | 'Arabic');
    });
  }, []);

  // ================= CHANGE LANGUAGE =================
  const changeLanguage = async (lang: 'English' | 'Arabic') => {
    setLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  // ================= NAVIGATION =================
  const handleVehicleSelect = (
    uiType: 'WithVehicle' | 'Scooter' | 'WithoutVehicle'
  ) => {
    // ✅ MAP UI TYPE TO BACKEND EXPECTED VALUES
    // Based on your error: "This account is registered for Car. You cannot log in as WithVehicle."
    let backendVehicleType: string;
    
    switch (uiType) {
      case 'WithVehicle':
        backendVehicleType = 'WithVehicle'; // Corrected based on backend expectation
        break;
      case 'WithoutVehicle':
        backendVehicleType = 'No vehicle';
        break;
      case 'Scooter':
        backendVehicleType = 'Scooter';
        break;
      default:
        backendVehicleType = uiType;
    }

    if (mode === 'existing') {
      navigation.navigate('CaptainLoginScreen', {
        selectedLanguage: language,
        vehicleType: backendVehicleType as any,
      });
    } else {
      navigation.navigate('CaptainServiceSelectionScreen', {
        selectedLanguage: language as 'English' | 'Arabic',
        vehicleType: backendVehicleType as any,
        pricing: {
          Economy: 0,
          Family: 0,
          Medical: 0,
          Luxury: 0,
          'School Trips': 0,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ================= LANGUAGE SWITCH ================= */}
        <View style={styles.langRow}>
          <View style={styles.langToggleContainer}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'English' && styles.activeLang,
              ]}
              onPress={() => changeLanguage('English')}
            >
              <Text style={[styles.langText, language === 'English' && styles.activeLangText]}>EN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'Arabic' && styles.activeLang,
              ]}
              onPress={() => changeLanguage('Arabic')}
            >
              <Text style={[styles.langText, language === 'Arabic' && styles.activeLangText]}>AR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ================= LOGO ================= */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/tout-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* ================= DIVIDER ================= */}
          <Image
            source={require('../assets/images/golden_divider.png')}
            style={styles.divider}
            resizeMode="contain"
          />

          {!mode ? (
            <>
              <Text style={styles.title}>
                {t('CAPTAIN AUTHENTICATION SELECTION', 'اختيار توثيق الكابتن')}
              </Text>

              <View style={styles.selectionRow}>
                {/* EXISTING */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => setMode('existing')}
                >
                  <View style={styles.cardInner}>
                    <Image
                      source={require('../assets/images/pharaoh_head.png')}
                      style={styles.cardIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.cardTitle}>
                      {t('EXISTING CAPTAIN', 'كابتن حالي')}
                    </Text>
                    <Image
                      source={require('../assets/images/golden_lotus.png')}
                      style={styles.lotusIcon}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* NEW */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => setMode('new')}
                >
                  <View style={styles.cardInner}>
                    <Image
                      source={require('../assets/images/pharaoh_mask.png')}
                      style={styles.cardIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.cardTitle}>
                      {t('NEW CAPTAIN', 'كابتن جديد')}
                    </Text>
                    <Image
                      source={require('../assets/images/golden_lotus.png')}
                      style={styles.lotusIcon}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                {t('CHOOSE YOUR VEHICLE TYPE', 'اختر نوع المركبة')}
              </Text>

              <View style={styles.vehicleRow}>
                {/* CAR */}
                <TouchableOpacity
                  style={styles.vehicleCard}
                  onPress={() => handleVehicleSelect('WithVehicle')}
                >
                  <View style={styles.cardInner}>
                    <Image
                      source={require('../assets/images/golden_car.png')}
                      style={styles.vehicleIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.cardTitle}>{t('CAR', 'سيارة')}</Text>
                    <Image
                      source={require('../assets/images/golden_lotus.png')}
                      style={styles.lotusIcon}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* SCOOTER */}
                <TouchableOpacity
                  style={styles.vehicleCard}
                  onPress={() => handleVehicleSelect('Scooter')}
                >
                  <View style={styles.cardInner}>
                    <Image
                      source={require('../assets/images/golden_scooter.png')}
                      style={styles.vehicleIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.cardTitle}>{t('SCOOTER', 'سكوتر')}</Text>
                    <Image
                      source={require('../assets/images/golden_lotus.png')}
                      style={styles.lotusIcon}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* FREE DRIVER */}
                <TouchableOpacity
                  style={styles.vehicleCard}
                  onPress={() => handleVehicleSelect('WithoutVehicle')}
                >
                  <View style={styles.cardInner}>
                    <Image
                      source={require('../assets/images/golden_driver.png')}
                      style={styles.vehicleIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.cardTitle}>
                      {t('FREE DRIVER', 'سائق حر')}
                    </Text>
                    <Image
                      source={require('../assets/images/golden_lotus.png')}
                      style={styles.lotusIcon}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* BACK */}
              <TouchableOpacity onPress={() => setMode(null)} style={styles.backBtn}>
                <Text style={styles.backText}>{t('BACK', 'رجوع')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ================= FOOTER ================= */}
          <View style={styles.footer}>
            <Image
              source={require('../assets/images/golden_divider.png')}
              style={[styles.divider, { transform: [{ rotate: '180deg' }] }]}
              resizeMode="contain"
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CaptainAuthSelectionScreen;

// ================= STYLES =================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFBF0',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 10,
  },
  langToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 25,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  langBtn: {
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeLang: {
    backgroundColor: '#D4AF37',
  },
  langText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeLangText: {
    color: '#1A1A1A',
  },
  logoContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.7,
    height: 120,
  },
  divider: {
    width: '100%',
    height: 40,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginVertical: 20,
    letterSpacing: 1,
    fontFamily: 'serif',
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  card: {
    width: '48%',
    backgroundColor: '#FDFBF0',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#D4AF37',
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardInner: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 160,
  },
  cardIcon: {
    width: 80,
    height: 80,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  lotusIcon: {
    width: 20,
    height: 20,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  vehicleCard: {
    width: '31%',
    backgroundColor: '#FDFBF0',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleIcon: {
    width: '100%',
    height: 60,
  },
  backBtn: {
    marginTop: 30,
    padding: 10,
  },
  backText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontFamily: 'serif',
  },
  footer: {
    marginTop: 40,
    width: '100%',
  },
});