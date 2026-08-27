import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

const pharaohHead = require('../assets/images/pharaoh-head.png');

interface CaptainRegisterScreenProps {
  navigation: any;
  route: any;
}

const { width } = Dimensions.get('window');

// --- Helper function to upload image to Firebase Storage ---
const uploadImage = async (imageAsset: Asset, path: string): Promise<string> => {
  if (!imageAsset.uri) {
    throw new Error("Image URI is missing.");
  }
  // Ensure file:// prefix for Android putFile compatibility
  const fileUri = imageAsset.uri.startsWith('file://') ? imageAsset.uri : `file://${imageAsset.uri}`;
  const reference = storage().ref(path);
  await reference.putFile(fileUri);
  const url = await reference.getDownloadURL();
  return url;
};


// --- API Call Function ---
const registerCaptain = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  vehicleType: string,
  plateNumber: string,
  profileImageUrl: string, // New parameter
  vehicleImageUrl: string  // New parameter
) => {
  try {
    const response = await fetch('https://toutsroutes.com/api/captains/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        phone_number: phone,
        password: password,
        vehicle_type: vehicleType,
        plate_number: plateNumber || "",
        profile_image_url: profileImageUrl, // New field
        vehicle_image_url: vehicleImageUrl, // New field
      } ),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || `Registration failed with status ${response.status}`);
    }
    return { status: response.status, data };
  } catch (error) {
    console.error('Captain Registration API error:', error);
    throw error;
  }
};

// --- Component ---
const CaptainRegisterScreen: React.FC<CaptainRegisterScreenProps> = ({ navigation, route }) => {
  const { selectedLanguage, vehicleType } = route.params || { selectedLanguage: 'English', vehicleType: 'WithVehicle' };
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: '',
  });
  
  // New state for images
  const [profileImage, setProfileImage] = useState<Asset | null>(null);
  const [vehicleImage, setVehicleImage] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);

  const getText = (englishText: string, arabicText: string) => {
    return selectedLanguage === 'Arabic' ? arabicText : englishText;
  };

  const handleChoosePhoto = (setImage: React.Dispatch<React.SetStateAction<Asset | null>>) => {
    launchImageLibrary({ mediaType: 'photo' }, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('ImagePicker Error', response.errorMessage || 'An unknown error occurred.');
      } else if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };

  const handleRegister = async () => {
    // 1. Basic Validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please fill all required fields.', 'يرجى ملء جميع الحقول المطلوبة.'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(getText('Error', 'خطأ'), getText('Passwords do not match.', 'كلمات المرور غير متطابقة.'));
      return;
    }
    if (!profileImage || !vehicleImage) {
      Alert.alert(getText('Error', 'خطأ'), getText('Please upload both a profile and vehicle photo.', 'يرجى تحميل صورة شخصية وصورة للمركبة.'));
      return;
    }

    setLoading(true);
    let anonUser: any = null;
    try {
      // Sign in anonymously so Firebase Storage rules allow the upload
      const credential = await auth().signInAnonymously();
      anonUser = credential.user;

      // 2. Upload images to Firebase Storage
      // We use a temporary user ID for the path, like the phone number, since we don't have the final ID yet.
      const tempId = formData.phone || Date.now().toString();
      const profilePhotoPath = `captains/${tempId}/profile.jpg`;
      const vehiclePhotoPath = `captains/${tempId}/vehicle.jpg`;

      const profilePhotoUrl = await uploadImage(profileImage, profilePhotoPath);
      const vehiclePhotoUrl = await uploadImage(vehicleImage, vehiclePhotoPath);

      // 3. Call the backend API with the image URLs
      const { status, data } = await registerCaptain(
        formData.fullName,
        formData.email,
        formData.phone,
        formData.password,
        vehicleType,
        formData.vehiclePlate || "",
        profilePhotoUrl,  // Pass the URL
        vehiclePhotoUrl   // Pass the URL
      );

      if (status === 201) {
        Alert.alert(
          getText('Success', 'نجاح'),
          getText('Captain registered successfully! Awaiting approval.', 'تم تسجيل الكابتن بنجاح! بانتظار موافقة الإدارة.'),
          [{
            text: getText('OK', 'موافق'),
            onPress: () => navigation.navigate('CaptainLoginScreen', { selectedLanguage, vehicleType })
          }]
        );
      } else {
        Alert.alert(getText('Error', 'خطأ'), data.message || getText('Registration failed', 'فشل التسجيل'));
      }
      if (anonUser) await auth().signOut().catch(() => {});
    } catch (error: any) {
      if (anonUser) await auth().signOut().catch(() => {});
      Alert.alert(getText('Error', 'خطأ'), error.message || getText('An unexpected error occurred.', 'حدث خطأ غير متوقع.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={pharaohHead} style={styles.logoImage} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{getText('Captain Registration', 'تسجيل الكابتن')}</Text>

          {/* --- Image Pickers --- */}
          <View style={styles.imagePickerRow}>
            <TouchableOpacity style={styles.imagePicker} onPress={() => handleChoosePhoto(setProfileImage)}>
              {profileImage?.uri ? (
                <Image source={{ uri: profileImage.uri }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePickerText}>{getText('Profile Photo', 'صورة شخصية')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePicker} onPress={() => handleChoosePhoto(setVehicleImage)}>
              {vehicleImage?.uri ? (
                <Image source={{ uri: vehicleImage.uri }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePickerText}>{getText('Vehicle Photo', 'صورة المركبة')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <TextInput style={styles.input} placeholder={getText('Full Name *', 'الاسم الكامل *')} value={formData.fullName} onChangeText={(text) => setFormData({...formData, fullName: text})} editable={!loading} />
            <TextInput style={styles.input} placeholder={getText('Email *', 'البريد الإلكتروني *')} value={formData.email} onChangeText={(text) => setFormData({...formData, email: text})} keyboardType="email-address" editable={!loading} />
            <TextInput style={styles.input} placeholder={getText('Phone Number *', 'رقم الهاتف *')} value={formData.phone} onChangeText={(text) => setFormData({...formData, phone: text})} keyboardType="phone-pad" editable={!loading} />
            <TextInput style={styles.input} placeholder={getText('Driver License Number *', 'رقم رخصة القيادة *')} value={formData.licenseNumber} onChangeText={(text) => setFormData({...formData, licenseNumber: text})} editable={!loading} />
            
            {vehicleType === 'WithVehicle' && (
              <>
                <TextInput style={styles.input} placeholder={getText('Vehicle Model', 'موديل المركبة')} value={formData.vehicleModel} onChangeText={(text) => setFormData({...formData, vehicleModel: text})} editable={!loading} />
                <TextInput style={styles.input} placeholder={getText('Vehicle Plate Number', 'رقم لوحة المركبة')} value={formData.vehiclePlate} onChangeText={(text) => setFormData({...formData, vehiclePlate: text})} editable={!loading} />
                <TextInput style={styles.input} placeholder={getText('Vehicle Year', 'سنة المركبة')} value={formData.vehicleYear} onChangeText={(text) => setFormData({...formData, vehicleYear: text})} keyboardType="numeric" editable={!loading} />
              </>
            )}

            <TextInput style={styles.input} placeholder={getText('Password *', 'كلمة المرور *')} value={formData.password} onChangeText={(text) => setFormData({...formData, password: text})} secureTextEntry editable={!loading} />
            <TextInput style={styles.input} placeholder={getText('Confirm Password *', 'تأكيد كلمة المرور *')} value={formData.confirmPassword} onChangeText={(text) => setFormData({...formData, confirmPassword: text})} secureTextEntry editable={!loading} />

            <TouchableOpacity style={[styles.registerButton, loading && styles.disabledButton]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#8B4513" /> : <Text style={styles.registerButtonText}>{getText('Register', 'تسجيل')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('CaptainLoginScreen', { selectedLanguage, vehicleType })} disabled={loading}>
              <Text style={styles.loginLinkText}>{getText('Already have an account? Login', 'لديك حساب؟ تسجيل الدخول')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8B4513' },
  logoContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', opacity: 0.1 },
  logoImage: { width: width * 0.6, height: width * 0.6, resizeMode: 'contain' },
  scrollContainer: { flexGrow: 1, paddingTop: 100 },
  contentContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 40, paddingBottom: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 20, textAlign: 'center' },
  imagePickerRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  imagePicker: { width: 120, height: 120, borderRadius: 15, backgroundColor: 'rgba(255, 215, 0, 0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFD700', overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imagePickerText: { color: '#FFD700', textAlign: 'center', fontWeight: 'bold' },
  formContainer: { width: '100%', alignItems: 'center' },
  input: { backgroundColor: 'rgba(255, 215, 0, 0.9)', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 10, marginVertical: 8, width: '100%', fontSize: 16, color: '#8B4513' },
  registerButton: { backgroundColor: '#FFD700', paddingVertical: 18, borderRadius: 10, marginTop: 20, width: '100%', alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  registerButtonText: { fontSize: 18, fontWeight: 'bold', color: '#8B4513' },
  loginLink: { marginTop: 20 },
  loginLinkText: { color: '#FFD700', fontSize: 16, textDecorationLine: 'underline' },
});

export default CaptainRegisterScreen;
