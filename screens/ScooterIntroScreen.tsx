// screens/ScooterIntroScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface ScooterIntroScreenProps {
  navigation: any;
  route: any;
}

const scooterIcon = require('../assets/scooter-icon.png');
const { width } = Dimensions.get('window');

const ScooterIntroScreen: React.FC<ScooterIntroScreenProps> = ({
  navigation,
  route,
}) => {
  const { selectedLanguage } = route.params || {
    selectedLanguage: 'English',
  };

  const getText = (en: string, ar: string): string =>
    selectedLanguage === 'Arabic' ? ar : en;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={scooterIcon} style={styles.icon} />

        <Text style={styles.title}>
          {getText('Scooter Service', 'خدمة السكوتر')}
        </Text>

        <Text style={styles.subtitle}>
          {getText(
            'Fast, affordable and eco-friendly rides',
            'رحلات سريعة، اقتصادية وصديقة للبيئة'
          )}
        </Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('CaptainAuthSelectionScreen', {
              selectedLanguage,
            })
          }
        >
          <Text style={styles.buttonText}>
            {getText('Continue', 'استمرار')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ScooterIntroScreen;

/* ================= Styles ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 22,
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },

  icon: {
    width: width * 0.45,
    height: width * 0.45,
    resizeMode: 'contain',
    marginBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },

  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 14,
  },

  buttonText: {
    color: '#111',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
