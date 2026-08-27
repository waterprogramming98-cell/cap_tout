/**
 * WelcomeScreen — CaptoutApp (Captain-only)
 *
 * Shows the CapTout splash image for 1 second while checking for a remembered
 * captain session (biometric). Navigates to:
 *   - CaptainDashboardScreen  (biometric success, captain remembered)
 *   - CaptainAuthSelectionScreen  (no remembered session or biometric failed)
 *
 * NO User paths exist in this screen.
 */
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';

const REMEMBER_ME_KEY = 'remember_me_user';
const CAPTAIN_KEYCHAIN_SERVICE = 'captain_bio';

const WelcomeScreen = ({ navigation }: any) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkRememberedCaptain();
  }, []);

  const goToAuthSelection = () => {
    setChecking(false);
    navigation.replace('CaptainAuthSelectionScreen', { selectedLanguage: 'English' });
  };

  const checkRememberedCaptain = async () => {
    try {
      const rememberedData = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (!rememberedData) {
        // No remembered session — show splash for 1 second then go to auth selection
        setTimeout(goToAuthSelection, 1000);
        return;
      }

      const { userType, selectedLanguage } = JSON.parse(rememberedData);

      // Only handle captain sessions in this app
      if (userType !== 'captain') {
        setTimeout(goToAuthSelection, 1000);
        return;
      }

      // Try biometric authentication for the remembered captain
      const rnBiometrics = new ReactNativeBiometrics();
      const { available } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        setTimeout(goToAuthSelection, 1000);
        return;
      }

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage:
          selectedLanguage === 'Arabic'
            ? 'استخدم البصمة لتسجيل الدخول'
            : 'Use biometrics to log in',
        cancelButtonText: selectedLanguage === 'Arabic' ? 'إلغاء' : 'Cancel',
      });

      if (!success) {
        goToAuthSelection();
        return;
      }

      const credentials = await Keychain.getGenericPassword({
        service: CAPTAIN_KEYCHAIN_SERVICE,
      });
      if (!credentials) {
        goToAuthSelection();
        return;
      }

      const token = credentials.password;
      // Biometric success — go directly to captain dashboard
      navigation.replace('CaptainDashboardScreen', {
        selectedLanguage: selectedLanguage || 'English',
        captainData: { authenticatedViaBiometric: true },
        token,
      });
    } catch (error) {
      console.log('WelcomeScreen biometric check error:', error);
      setTimeout(goToAuthSelection, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/welcome-bg.webp')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      {checking && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      )}
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
});
