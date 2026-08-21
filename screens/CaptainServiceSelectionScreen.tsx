import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../styles/theme'; 

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation'; 

/* ================= TYPES ================= */

interface CaptainServiceSelectionParams {
  selectedLanguage: 'English' | 'Arabic';
  vehicleType?: any;
  pricing?: any;
  captainData?: any;
  token?: string;
  governorate?: any;
}

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CaptainServiceSelection'
>;

type RouteProps = RouteProp<RootStackParamList, 'CaptainServiceSelection'> & {
  params: CaptainServiceSelectionParams;
};

interface Props {
  navigation: NavigationProp;
  route: RouteProps;
}

interface Service {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  categoryKey: CategoryKey;
}

type CategoryKey =
  | 'Economy'
  | 'Family'
  | 'Luxury'
  | 'Medical'
  | 'School Trips';

const SERVICES: Service[] = [
  {
    id: '1',
    name_en: 'Economy',
    name_ar: 'علي قد الايد',
    description_en: 'Affordable everyday rides',
    description_ar: 'رحلات يومية بأسعار مناسبة',
    icon: '🚗',
    categoryKey: 'Economy',
  },
  {
    id: '2',
    name_en: 'Family',
    name_ar: 'توصيله الحبايب',
    description_en: 'Spacious for the whole family',
    description_ar: 'مساحة كافية لجميع أفراد العائلة',
    icon: '👨‍👩‍👧‍👦',
    categoryKey: 'Family',
  },
  {
    id: '3',
    name_en: 'Luxury',
    name_ar: 'درجه رجال الاعمال',
    description_en: 'Premium experience',
    description_ar: 'تجربة فاخرة ومميزة',
    icon: '🚙',
    categoryKey: 'Luxury',
  },
  {
    id: '4',
    name_en: 'Medical',
    name_ar: 'الطاقم الطبي',
    description_en: 'Specialized medical transport',
    description_ar: 'نقل طبي متخصص وآمن',
    icon: '🚑',
    categoryKey: 'Medical',
  },
  {
    id: '5',
    name_en: 'School Trips',
    name_ar: 'توصيل المدارس',
    description_en: 'Safe transport for students',
    description_ar: 'نقل آمن وموثوق للطلاب',
    icon: '🚌',
    categoryKey: 'School Trips',
  },
];

/* ================= SCREEN ================= */

const CaptainServiceSelection: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { 
    selectedLanguage: initialLanguage, 
    vehicleType, 
    pricing, 
    captainData, 
    token, 
  } = route.params || {};

  const [currentLanguage, setCurrentLanguage] = useState<'English' | 'Arabic'>(initialLanguage || 'English');
  const [selectedService, setSelectedService] = useState<CategoryKey | null>(null);

  // ✅ AUTO-BYPASS FOR SCOOTER & FREE DRIVER (No vehicle)
  useEffect(() => {
    if (vehicleType === 'Scooter' || vehicleType === 'No vehicle') {
      navigation.navigate('CaptainGovernorateSelectionScreen', {
        selectedLanguage: currentLanguage,
        vehicleType,
        services: [], // No specific category needed
        pricing,
        captainData,
        token,
      } as any);
    }
  }, [vehicleType]);

  const isAR = currentLanguage === 'Arabic';

  const getText = (en: string, ar: string) => (isAR ? ar : en);

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'English' ? 'Arabic' : 'English');
  };

  const handleSelectService = (category: CategoryKey) => {
    setSelectedService(prev => prev === category ? null : category);
  };

  const handleContinue = () => {
    if (!selectedService) {
      return;
    }

    // STEP 1: Navigate to Governorate Selection
    navigation.navigate('CaptainGovernorateSelectionScreen', {
      selectedLanguage: currentLanguage,
      vehicleType,
      services: [selectedService], // Passing single service as array
      pricing,
      captainData,
      token,
    } as any);
  };

  const renderServiceItem = ({ item }: { item: Service }) => {
    const isSelected = selectedService === item.categoryKey;
    return (
      <TouchableOpacity
        style={[
          styles.serviceCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handleSelectService(item.categoryKey)}
      >
        <Text style={styles.icon}>{item.icon}</Text>
        <Text
          style={[
            styles.serviceName,
            isSelected && styles.selectedText,
          ]}
        >
          {getText(item.name_en, item.name_ar)}
        </Text>
        <Text
          style={[
            styles.serviceDescription,
            isSelected && styles.selectedDescription,
          ]}
        >
          {getText(item.description_en, item.description_ar)}
        </Text>
      </TouchableOpacity>
    );
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
        {/* Header Text */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {getText('Select Service Type', 'اختر نوع الخدمة')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {getText('Choose the single service you will provide', 'اختر الخدمة الوحيدة التي ستقدمها')}
          </Text>
        </View>

        {/* Services List */}
        <FlatList
          data={SERVICES}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedService && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedService}
        >
          <Text style={styles.continueButtonText}>
            {getText('Continue', 'متابعة')}
          </Text>
        </TouchableOpacity>

        {/* Footer Decoration */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.footerText}>✦</Text>
          <View style={styles.divider} />
        </View>
      </ScrollView>
    </View>
  );
};

export default CaptainServiceSelection;

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
    marginBottom: SPACING.XXL,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZE_H2,
    fontWeight: '700',
    color: COLORS.PRIMARY_LIGHT,
    marginBottom: SPACING.SM,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: COLORS.NEUTRAL_LIGHT,
    textAlign: 'center',
  },
  listContainer: {
    marginBottom: SPACING.XL,
  },
  serviceCard: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderWidth: 2,
    borderColor: COLORS.ACCENT_GOLD,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.LG,
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: COLORS.ACCENT_GOLD,
    borderColor: COLORS.ACCENT_GOLD,
  },
  icon: {
    fontSize: 40,
    marginBottom: SPACING.MD,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.SIZE_H5,
    fontWeight: '700',
    color: COLORS.ACCENT_GOLD,
    marginBottom: SPACING.SM,
  },
  selectedText: {
    color: COLORS.PRIMARY_DARK,
  },
  serviceDescription: {
    fontSize: TYPOGRAPHY.SIZE_SMALL,
    color: COLORS.NEUTRAL_LIGHT,
    textAlign: 'center',
  },
  selectedDescription: {
    color: COLORS.PRIMARY_DARK,
  },
  continueButton: {
    backgroundColor: COLORS.ACCENT_GOLD,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.XL,
    shadowColor: COLORS.ACCENT_GOLD,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.SIZE_H4,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    letterSpacing: 2,
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