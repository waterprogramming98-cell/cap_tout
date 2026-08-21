import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');
const pharaohHead = require('../assets/lottie/images/pharaoh-head.png');

interface Props {
  navigation: any;
  route: any;
}

const CaptainVehicleTypeSelectionScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const initialLang = route.params?.selectedLanguage ?? 'English';

  const [language, setLanguage] = useState<'English' | 'Arabic'>(
    initialLang === 'Arabic' ? 'Arabic' : 'English'
  );

  const isAR = language === 'Arabic';
  const t = (en: string, ar: string) => (isAR ? ar : en);

  const selectType = (type: 'WithVehicle' | 'WithoutVehicle' | 'Scooter') => {
    // ✅ ROBUST NAVIGATION
    // We pass it directly in params. 
    // If CaptainLogin is nested, React Navigation might wrap this, 
    // so we ensure the object structure is clean.
    navigation.navigate('CaptainLoginScreen', {
      selectedLanguage: language,
      vehicleType: type,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image source={pharaohHead} style={styles.logo} />
      </View>

      <View style={styles.langRow}>
        <TouchableOpacity
          onPress={() => setLanguage('English')}
          style={[styles.langBtn, language === 'English' && styles.langActive]}
        >
          <Text style={[styles.langText, language === 'English' && styles.langTextActive]}>
            EN
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setLanguage('Arabic')}
          style={[styles.langBtn, language === 'Arabic' && styles.langActive]}
        >
          <Text style={[styles.langText, language === 'Arabic' && styles.langTextActive]}>
            AR
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          🚗 {t('Select Vehicle Type', 'اختر نوع المركبة')}
        </Text>

        <TouchableOpacity style={styles.card} onPress={() => selectType('WithVehicle')}>
          <Text style={styles.cardTitle}>🚘 {t('I have a car', 'لدي سيارة')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => selectType('WithoutVehicle')}>
          <Text style={styles.cardTitle}>🧍 {t('No vehicle', 'بدون سيارة')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => selectType('Scooter')}>
          <Text style={styles.cardTitle}>🛵 {t('Scooter', 'سكوتر')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CaptainVehicleTypeSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  logoWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.05,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    resizeMode: 'contain',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  langActive: {
    backgroundColor: '#FFD700',
  },
  langText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  langTextActive: {
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#111',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '700',
  },
});