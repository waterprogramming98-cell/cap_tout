import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import { loginCaptain } from '../services/api';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const { width } = Dimensions.get('window');
const KEYCHAIN_SERVICE = 'captain_bio';
const REMEMBER_ME_KEY = 'captain_remember_me';

interface CaptainLoginScreenProps {
  navigation: any;
  route: any;
}

const CaptainLoginScreen: React.FC<CaptainLoginScreenProps> = ({
  navigation,
  route,
}) => {
  // 1. Get Language
  const selectedLanguage = route?.params?.selectedLanguage || 'English';

  // 2. Get Vehicle Type (ROBUST EXTRACTION)
  // Check direct params, then check nested params (common in some navigation setups)
  const selectedVehicleType = route?.params?.vehicleType || route?.params?.params?.vehicleType;

  // DEBUG ALERT - This will pop up on your screen to show exactly what is received
  useEffect(() => {
    if (!selectedVehicleType) {
      Alert.alert(
        "DEBUG INFO",
        `route.params is: ${JSON.stringify(route?.params)}\n\nvehicleType is missing!`
      );
    }
  }, [route?.params, selectedVehicleType]);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const t = (en: string, ar: string) =>
    selectedLanguage === 'Arabic' ? ar : en;

  // ================= FCM =================
  const saveFcmToken = async (token: string) => {
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

      if (fcmToken) {
        await fetch('https://toutsroutes.com/api/captains/me/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fcm_token: fcmToken }),
        });
      }
    } catch (err) {
      console.log('FCM error:', err);
    }
  };

  // ================= BIOMETRIC ENROLLMENT =================
  const enrollBiometrics = async (phone: string, token: string): Promise<void> => {
    return new Promise((resolve) => {
      const rnBiometrics = new ReactNativeBiometrics();
      rnBiometrics.isSensorAvailable().then(({ available, biometryType }) => {
        if (
          available &&
          (biometryType === BiometryTypes.TouchID ||
            biometryType === BiometryTypes.FaceID ||
            biometryType === BiometryTypes.Biometrics)
        ) {
          rnBiometrics
            .simplePrompt({
              promptMessage: t(
                'Authenticate to enable biometric login',
                'المصادقة لتفعيل تسجيل الدخول بالبصمة'
              ),
              cancelButtonText: t('Skip', 'تخطي'),
            })
            .then(async ({ success }) => {
              if (success) {
                try {
                  await AsyncStorage.setItem(
                    REMEMBER_ME_KEY,
                    JSON.stringify({ selectedLanguage })
                  );
                  await Keychain.setGenericPassword(phone, token, {
                    service: KEYCHAIN_SERVICE,
                    accessControl:
                      Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
                  });
                  Alert.alert(
                    t('Biometric Enabled', 'تم تفعيل البصمة'),
                    t(
                      'You can now log in using biometrics next time.',
                      'يمكنك الآن تسجيل الدخول بالبصمة في المرة القادمة.'
                    )
                  );
                } catch (e) {
                  console.log('Keychain save error:', e);
                }
              }
              resolve();
            })
            .catch(() => resolve());
        } else {
          Alert.alert(
            t('Biometric Not Available', 'البصمة غير متاحة'),
            t(
              'Your device does not support biometrics.',
              'جهازك لا يدعم البصمة.'
            )
          );
          resolve();
        }
      });
    });
  };

  // ================= BIOMETRIC LOGIN =================
  const handleBiometricLogin = async () => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
        authenticationPrompt: {
          title: t('Biometric Login', 'تسجيل الدخول بالبصمة'),
          subtitle: t('Verify your identity', 'تحقق من هويتك'),
          description: t('Use fingerprint to continue', 'استخدم البصمة للمتابعة'),
          cancel: t('Cancel', 'إلغاء'),
        },
      });

      if (!creds) {
        Alert.alert(t('Error', 'خطأ'), t('No biometric session found', 'لم يتم العثور على جلسة بصمة'));
        return;
      }

      const token = creds.password;

      const res = await fetch('https://toutsroutes.com/api/captains/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(t('Session expired', 'انتهت الجلسة'));

      const data = await res.json();

      // Try to find the captain object in common locations
      const captain = data?.data?.captain || data?.captain || data?.data || data;

      // Extract captainId from all possible locations
      const captainId =
        captain?.captain_id || 
        captain?.user_id || 
        captain?.id || 
        data?.captain_id || 
        data?.id || 
        data?.user_id;

      if (!captainId) {
        throw new Error(t('Captain ID missing', 'معرف الكابتن مفقود'));
      }

      // ✅ SAFE CHECK
      if (
        selectedVehicleType &&
        captain?.vehicle_type !== selectedVehicleType
      ) {
        throw new Error(
          t(
            `Wrong vehicle type (${captain.vehicle_type})`,
            `نوع المركبة غير صحيح (${captain.vehicle_type})`
          )
        );
      }

      navigation.replace('CaptainDashboardScreen', {
        selectedLanguage,
        token,
        captainId,
        vehicleType: captain?.vehicle_type,
        services: captain?.services || [],
        governorate: captain?.governorate || '',
        captainData: captain,
      });
    } catch (e: any) {
      Alert.alert(t('Error', 'خطأ'), e.message);
    }
  };

  // ================= LOGIN =================
  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert(t('Error', 'خطأ'), t('Fill all fields', 'املأ كل الحقول'));
      return;
    }

    // ✅ CRITICAL VALIDATION
    if (!selectedVehicleType) {
      Alert.alert(
        t('Error', 'خطأ'),
        t(
          'Vehicle type missing. Please go back and select again.',
          'نوع المركبة مفقود. يرجى الرجوع واختيار النوع مرة أخرى.'
        )
      );
      return;
    }

    setLoading(true);

    try {
      // ================= API CALL =================
      const json = await loginCaptain({
        phone_number: phone.trim(),
        password,
        vehicle_type: selectedVehicleType,
      });

      const token = json?.data?.token;
      const captain = json?.data?.captain;

      if (!token || !captain) {
        throw new Error(t('Invalid response', 'استجابة غير صالحة'));
      }

      // ================= SERVER VALIDATION =================
      const serverVehicleType = captain.vehicle_type;

      if (serverVehicleType !== selectedVehicleType) {
        throw new Error(
          t(
            `Access Denied: You are registered as ${serverVehicleType}`,
            `تم رفض الدخول: أنت مسجل كـ ${serverVehicleType}`
          )
        );
      }

      const captainId = captain?.captain_id || captain?.user_id;

      if (!captainId) {
        throw new Error(t('Captain ID missing', 'معرف الكابتن مفقود'));
      }

      // ================= STATUS CHECK =================
      if (captain?.status === 'pending') {
        navigation.replace('PendingApprovalScreen', { selectedLanguage });
        return;
      }

      // ================= SAVE =================
      if (rememberMe) {
        await enrollBiometrics(phone.trim(), token);
      } else {
        await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      }
      await saveFcmToken(token);

      // ================= NAVIGATE =================
      navigation.replace('CaptainDashboardScreen', {
        selectedLanguage,
        token,
        captainId,
        vehicleType: serverVehicleType,
        services: captain?.services || [],
        governorate: captain?.governorate || '',
        captainData: captain,
      });
    } catch (e: any) {
      Alert.alert(t('Login Failed', 'فشل تسجيل الدخول'), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Title */}
        <Text style={styles.title}>
          {t('CAPTAIN LOGIN', 'دخول الكابتن')}
        </Text>

        <Text style={styles.subtitle}>
          {t('Access your captain dashboard', 'الوصول إلى لوحة تحكم القائد')}
        </Text>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('Phone Number', 'رقم الهاتف')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Phone Number', 'رقم الهاتف')}
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('Password', 'كلمة المرور')}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('Password', 'كلمة المرور')}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember Me Checkbox */}
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.checkbox}>
            {rememberMe ? <Text style={styles.checkboxChecked}>✓</Text> : null}
          </TouchableOpacity>
          <Text style={styles.rememberMeText}>{t("Remember Me", "تذكرني")}</Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A1A" size="large" />
          ) : (
            <Text style={styles.loginButtonText}>
              {t('LOGIN', 'دخول')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Biometric Login Option */}
        <TouchableOpacity 
          style={styles.biometricButton} 
          onPress={handleBiometricLogin}
          disabled={loading}
        >
          <Text style={styles.biometricIcon}>👤</Text>
          <Text style={styles.biometricText}>
            {t('Login with Biometrics', 'الدخول بالبصمة')}
          </Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            {t("Don't have an account? ", 'ليس لديك حساب؟ ')}
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CaptainRegisterScreen', { selectedLanguage })
            }
            disabled={loading}
          >
            <Text style={styles.registerLink}>
              {t('Register', 'تسجيل')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Decoration */}
        <View style={styles.footer}>
          <Image
            source={require('../assets/images/golden_divider.png')}
            style={[styles.divider, { transform: [{ rotate: '180deg' }] }]}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CaptainLoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFBF0', // Cream background (Original)
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 25,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: 100,
  },
  divider: {
    width: '100%',
    height: 40,
    marginVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'serif',
  },
  input: {
    backgroundColor: '#FDFBF0',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 15,
    color: '#1A1A1A',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBF0',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#1A1A1A',
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  eyeText: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 30,
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  biometricText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    textDecorationLine: 'underline',
  },
    footer: {
      width: '100%',
      marginTop: 20,
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 20,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: '#D4AF37',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    checkboxChecked: {
      color: '#D4AF37',
      fontSize: 14,
      fontWeight: 'bold',
    },
    rememberMeText: {
      color: '#666',
      fontSize: 14,
    },
  });