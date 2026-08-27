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
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/theme';
import app from '@react-native-firebase/app';

interface CaptainRegisterScreenProps {
  navigation: any;
  route: any;
}

const CaptainRegisterScreen: React.FC<CaptainRegisterScreenProps> = ({ navigation, route }) => {
  const { 
    selectedLanguage: initialLanguage = 'English', 
    vehicleType, 
    services, 
    governorate, 
    pricing 
  } = route.params || {};

  const [currentLanguage, setCurrentLanguage] = useState<'English' | 'Arabic'>(initialLanguage);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    plateNumber: '', // ✅ ADDED PLATE NUMBER
    vehicleModel: '', // ✅ ADDED VEHICLE MODEL
    vehicleColor: '', // ✅ ADDED VEHICLE COLOR
  });

  const [profileImage, setProfileImage] = useState<Asset | null>(null);
  const [vehicleImage, setVehicleImage] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── DIAGNOSTIC: BUILD VERSION + FIREBASE CONFIG ───────────────────────────
  useEffect(() => {
    console.log('[REGISTER] BUILD VERSION TEST df48fae - non-blocking-auth build');
    try {
      const opts = app().options;
      console.log('[REGISTER] Firebase App Name:', app().name);
      console.log('[REGISTER] Firebase Project ID:', opts.projectId);
      console.log('[REGISTER] Firebase Storage Bucket:', opts.storageBucket);
      console.log('[REGISTER] Firebase App ID:', opts.appId);
    } catch (e: any) {
      console.error('[REGISTER] Firebase config read failed:', e.message);
    }
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  const isAR = currentLanguage === 'Arabic';
  const getText = (en: string, ar: string) => (isAR ? ar : en);

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'English' ? 'Arabic' : 'English');
  };

  /* ================= IMAGE HANDLING ================= */

  const pickImage = (setter: (img: Asset) => void) => {
    launchImageLibrary({ mediaType: 'photo' }, (res) => {
      if (res.assets && res.assets.length > 0) {
        setter(res.assets[0]);
      }
    });
  };

  /* ================= FIREBASE UPLOAD ================= */

  const uploadToFirebase = async (img: Asset, path: string): Promise<string> => {
    console.log('[REGISTER] Step F: Storage upload start - path:', path);
    console.log('[REGISTER] Step F: Image URI raw:', img.uri);
    console.log('[REGISTER] Step F: Image fileName:', img.fileName);
    console.log('[REGISTER] Step F: Image fileSize:', img.fileSize);

    if (!img.uri) throw new Error('No image selected');
    try {
      // toFilePath() inside the SDK strips file:// automatically,
      // but we keep the prefix for clarity; it is harmless.
      const fileUri = img.uri.startsWith('file://') ? img.uri : `file://${img.uri}`;
      console.log('[REGISTER] Step F: Resolved fileUri:', fileUri);

      const storageRef = storage();
      console.log('[REGISTER] Step F: Storage bucket:', storageRef.app.options.storageBucket);

      const ref = storageRef.ref(path);
      console.log('[REGISTER] Step F: Ref fullPath:', ref.fullPath);
      console.log('[REGISTER] Step F: Ref toString (gs:// URL):', ref.toString());

      // Use a clean Promise wrapper to avoid the task.on() + await race condition
      // in @react-native-firebase/storage v23.  The .on() error handler fires on
      // a separate emitter and does NOT cause `await task` to reject.
      const snapshot = await new Promise<any>((resolve, reject) => {
        const task = ref.putFile(fileUri);
        task.on(
          'state_changed',
          (snap) => {
            const pct = snap.totalBytes > 0
              ? ((snap.bytesTransferred / snap.totalBytes) * 100).toFixed(1)
              : '?';
            console.log(`[REGISTER] Step F: progress ${pct}% state=${snap.state} bytes=${snap.bytesTransferred}/${snap.totalBytes}`);
          },
          (err) => {
            console.error('[REGISTER] Step F: task.on error -', err.code, err.message);
            reject(err);
          },
          () => {
            console.log('[REGISTER] Step F: task.on complete callback fired');
            resolve(task.snapshot);
          }
        );
      });

      console.log('[REGISTER] Step G: Upload complete - bytesTransferred:', snapshot?.bytesTransferred, 'state:', snapshot?.state);

      // Verify the upload actually succeeded before requesting the URL
      if (!snapshot || snapshot.state !== 'success') {
        throw new Error(`Upload did not complete successfully. State: ${snapshot?.state}`);
      }

      console.log('[REGISTER] Step G: Requesting download URL for path:', path);
      const url = await ref.getDownloadURL();
      console.log('[REGISTER] Step G: Download URL obtained:', url);
      return url;
    } catch (error: any) {
      console.error('[REGISTER] Step F/G FAILED - code:', error.code, 'message:', error.message);
      console.error('[REGISTER] Step F/G FAILED - full error:', JSON.stringify(error));
      throw new Error(`Image upload failed: ${error.message || error.code || String(error)}`);
    }
  };

  /* ================= FORM VALIDATION ================= */

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please enter your full name', 'يرجى إدخال اسمك الكامل'));
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please enter your phone number', 'يرجى إدخال رقم هاتفك'));
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please enter a valid email address', 'يرجى إدخال بريد إلكتروني صحيح'));
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert(getText('Error', 'خطأ'), getText('Password must be at least 6 characters', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(getText('Error', 'خطأ'), getText('Passwords do not match', 'كلمات المرور غير متطابقة'));
      return false;
    }

    // ✅ VALIDATE PLATE NUMBER
    if (!formData.plateNumber.trim()) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please enter your plate number', 'يرجى إدخال رقم اللوحة'));
      return false;
    }

    if (!profileImage) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please upload your profile image', 'يرجى تحميل صورتك الشخصية'));
      return false;
    }
    if (vehicleType === 'WithVehicle' && !vehicleImage) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please upload your vehicle image', 'يرجى تحميل صورة المركبة'));
      return false;
    }
    return true;
  };

  /* ================= REGISTER ================= */

  const handleRegister = async () => {
    console.log('[REGISTER] Step A: Register button pressed');

    // Step B: Validation
    console.log('[REGISTER] Step B: Running form validation...');
    if (!validateForm()) {
      console.log('[REGISTER] Step B: Validation FAILED - returning');
      return;
    }
    console.log('[REGISTER] Step B: Validation PASSED');

    // Step C: Log image picker results
    console.log('[REGISTER] Step C: profileImage:', profileImage ? `uri=${profileImage.uri} size=${profileImage.fileSize}` : 'NULL');
    console.log('[REGISTER] Step C: vehicleImage:', vehicleImage ? `uri=${vehicleImage.uri} size=${vehicleImage.fileSize}` : 'NULL');
    console.log('[REGISTER] Step C: vehicleType:', vehicleType);

    setLoading(true);
    let anonUser: any = null;

    try {
      // Step D: Firebase initialization check
      console.log('[REGISTER] Step D: Checking Firebase init...');
      try {
        const opts = app().options;
        console.log('[REGISTER] Step D: Firebase OK - projectId:', opts.projectId, 'bucket:', opts.storageBucket);
      } catch (fe: any) {
        console.error('[REGISTER] Step D: Firebase NOT initialized:', fe.message);
      }

      // Step E: Anonymous authentication (non-blocking)
      console.log('[REGISTER] Step E: Starting signInAnonymously...');
      try {
        const credential = await auth().signInAnonymously();
        anonUser = credential.user;
        console.log('[REGISTER] Step E: Anonymous auth SUCCESS - uid:', anonUser?.uid);
        console.log('[REGISTER] Step E: auth().currentUser uid:', auth().currentUser?.uid);
      } catch (authErr: any) {
        console.warn('[REGISTER] Step E: signInAnonymously FAILED:', authErr.code, authErr.message);
        console.warn('[REGISTER] Step E: Proceeding without auth - Storage rules must allow unauthenticated writes');
      }

      const id = formData.phone;

      const profileUrl = await uploadToFirebase(
        profileImage!,
        `captains/${id}/profile.jpg`
      );

      let vehicleUrl = '';
      if (vehicleImage) {
        vehicleUrl = await uploadToFirebase(
          vehicleImage,
          `captains/${id}/vehicle.jpg`
        );
      }

      console.log('[REGISTER] Step H: Preparing API payload...');
      const payload = {
        name: formData.fullName,
        phone_number: formData.phone,
        email: formData.email,
        password: formData.password,
        governorate: governorate || '',
        services: (vehicleType === 'Scooter' || vehicleType === 'No vehicle') ? [vehicleType] : (services || []),
        pricing: pricing || {},
        vehicle_type: vehicleType || 'WithoutVehicle',
        plate_number: formData.plateNumber, // ✅ ADDED TO PAYLOAD
        vehicle_model: formData.vehicleModel, // ✅ ADDED TO PAYLOAD
        vehicle_color: formData.vehicleColor, // ✅ ADDED TO PAYLOAD
        profile_image_url: profileUrl,
        vehicle_image_url: vehicleUrl,
      };

      console.log('[REGISTER] Step H: Sending API request to https://toutsroutes.com/api/captains/register');
      console.log('[REGISTER] Step H: Payload keys:', Object.keys(payload).join(', '));

      const response = await fetch(
        'https://toutsroutes.com/api/captains/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      console.log('[REGISTER] Step I: API response status:', response.status);
      const result = await response.json();
      console.log('[REGISTER] Step I: API response body:', JSON.stringify(result));

      if (!response.ok) {
        console.error('[REGISTER] Step I: API returned error:', result.error || result.message);
        throw new Error(result.error || 'Registration failed');
      }

      Alert.alert(
        getText('Success', 'نجاح'),
        getText('Registration successful! Your account is pending approval.', 'تم التسجيل بنجاح! حسابك قيد الموافقة.')
      );

      console.log('[REGISTER] Step J: Registration SUCCESS - navigating to PendingApprovalScreen');
      // Sign out the anonymous user — the captain will log in with their real account later
      if (anonUser) {
        await auth().signOut().catch(() => {});
        console.log('[REGISTER] Step J: Anonymous user signed out');
      }

      navigation.replace('PendingApprovalScreen', {
        selectedLanguage: currentLanguage,
      });
    } catch (error: any) {
      console.error('[REGISTER] CATCH: Registration failed at unknown step');
      console.error('[REGISTER] CATCH: error.message:', error.message);
      console.error('[REGISTER] CATCH: error.code:', error.code);
      console.error('[REGISTER] CATCH: error.stack:', error.stack);
      console.error('[REGISTER] CATCH: full error JSON:', JSON.stringify(error));
      // Sign out anonymous user on failure too
      if (anonUser) {
        await auth().signOut().catch(() => {});
      }
      Alert.alert(getText('Error', 'خطأ'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Logo and Language Toggle */}
      <View style={styles.topBar}>
        <Image 
          source={require('../assets/images/tout-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
          <Text style={styles.langToggleText}>
            {currentLanguage === 'English' ? 'العربية' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {getText('Captain Registration', 'تسجيل القائد')}
          </Text>
          <Text style={styles.subtitle}>
            {getText('Join our captain network', 'انضم إلى شبكة قادتنا')}
          </Text>
        </View>

        {/* Selection Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{getText('Service:', 'الخدمة:')}</Text>
            <Text style={styles.summaryValue}>
              { (vehicleType === 'Scooter' || vehicleType === 'No vehicle') 
                ? getText(vehicleType, vehicleType === 'Scooter' ? 'سكوتر' : 'بدون مركبة')
                : (services?.[0] || '---') }
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{getText('Governorate:', 'المحافظة:')}</Text>
            <Text style={styles.summaryValue}>{governorate || '---'}</Text>
          </View>
        </View>

        {/* Full Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Full Name', 'الاسم الكامل')}</Text>
          <TextInput
            style={styles.input}
            placeholder={getText('Enter your full name', 'أدخل اسمك الكامل')}
            placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
            value={formData.fullName}
            onChangeText={(fullName) => setFormData({ ...formData, fullName })}
            editable={!loading}
          />
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Phone Number', 'رقم الهاتف')}</Text>
          <TextInput
            style={styles.input}
            placeholder={getText('Enter your phone number', 'أدخل رقم هاتفك')}
            placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
            value={formData.phone}
            onChangeText={(phone) => setFormData({ ...formData, phone })}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* EMAIL INPUT */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Email Address', 'البريد الإلكتروني')}</Text>
          <TextInput
            style={styles.input}
            placeholder={getText('Enter your email address', 'أدخل بريدك الإلكتروني')}
            placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
            value={formData.email}
            onChangeText={(email) => setFormData({ ...formData, email })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Password', 'كلمة المرور')}</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder={getText('Enter your password', 'أدخل كلمة المرور')}
              placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(password) => setFormData({ ...formData, password })}
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

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Confirm Password', 'تأكيد كلمة المرور')}</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder={getText('Confirm your password', 'أكد كلمة المرور')}
              placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ PLATE NUMBER INPUT */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Plate Number', 'رقم اللوحة')}</Text>
          <TextInput
            style={styles.input}
            placeholder={getText('Enter plate number', 'أدخل رقم اللوحة')}
            placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
            value={formData.plateNumber}
            onChangeText={(plateNumber) => setFormData({ ...formData, plateNumber })}
            editable={!loading}
          />
        </View>

        {/* ✅ VEHICLE MODEL INPUT */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Vehicle Model', 'موديل المركبة')}</Text>
          <TextInput
            style={styles.input}
            placeholder={getText('Enter vehicle model (Optional)', 'أدخل موديل المركبة (اختياري)')}
            placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
            value={formData.vehicleModel}
            onChangeText={(vehicleModel) => setFormData({ ...formData, vehicleModel })}
            editable={!loading}
          />
        </View>

        {/* ✅ VEHICLE COLOR INPUT */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{getText('Vehicle Color', 'لون المركبة')}</Text>
          <TextInput
            style={styles.input}
            placeholder={getText('Enter vehicle color (Optional)', 'أدخل لون المركبة (اختياري)')}
            placeholderTextColor={COLORS.NEUTRAL_MEDIUM}
            value={formData.vehicleColor}
            onChangeText={(vehicleColor) => setFormData({ ...formData, vehicleColor })}
            editable={!loading}
          />
        </View>

        {/* Profile Image Upload */}
        <Text style={styles.inputLabel}>{getText('Profile Image', 'الصورة الشخصية')}</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage(setProfileImage)}
          disabled={loading}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage.uri }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>{getText('Upload Profile Photo', 'تحميل الصورة الشخصية')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Vehicle Image Upload (Only if WithVehicle) */}
        {vehicleType === 'WithVehicle' && (
          <>
            <Text style={styles.inputLabel}>{getText('Vehicle Image', 'صورة المركبة')}</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage(setVehicleImage)}
              disabled={loading}
            >
              {vehicleImage ? (
                <Image source={{ uri: vehicleImage.uri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadIcon}>🚗</Text>
                  <Text style={styles.uploadText}>{getText('Upload Vehicle Photo', 'تحميل صورة المركبة')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.PRIMARY_DARK} />
          ) : (
            <Text style={styles.registerButtonText}>
              {getText('Register Now', 'سجل الآن')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.footerText}>✦</Text>
          <View style={styles.divider} />
        </View>
      </ScrollView>
    </View>
  );
};

export default CaptainRegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
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
  contentContainer: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XXL,
  },
  header: {
    marginBottom: SPACING.XL,
    alignItems: 'center',
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
  },
  summaryContainer: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.XL,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_GOLD + '40',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  summaryLabel: {
    color: COLORS.NEUTRAL_LIGHT,
    fontSize: TYPOGRAPHY.SIZE_SMALL,
  },
  summaryValue: {
    color: COLORS.ACCENT_GOLD,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.SIZE_SMALL,
  },
  inputContainer: {
    marginBottom: SPACING.LG,
  },
  inputLabel: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  input: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    color: COLORS.PRIMARY_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_MEDIUM,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_MEDIUM,
  },
  passwordInput: {
    flex: 1,
    padding: SPACING.MD,
    color: COLORS.PRIMARY_LIGHT,
  },
  eyeIcon: {
    padding: SPACING.MD,
  },
  eyeText: {
    fontSize: 20,
  },
  uploadButton: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderRadius: BORDER_RADIUS.LG,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.XL,
    borderWidth: 2,
    borderColor: COLORS.ACCENT_GOLD,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: SPACING.XS,
  },
  uploadText: {
    color: COLORS.NEUTRAL_LIGHT,
    fontSize: TYPOGRAPHY.SIZE_SMALL,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  registerButton: {
    backgroundColor: COLORS.ACCENT_GOLD,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.MD,
    marginBottom: SPACING.XL,
    shadowColor: COLORS.ACCENT_GOLD,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  registerButtonText: {
    fontSize: TYPOGRAPHY.SIZE_H4,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.LG,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.ACCENT_GOLD,
    opacity: 0.3,
  },
  footerText: {
    color: COLORS.ACCENT_GOLD,
    fontSize: TYPOGRAPHY.SIZE_H5,
    marginHorizontal: SPACING.MD,
  },
});