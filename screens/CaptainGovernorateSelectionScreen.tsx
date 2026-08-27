import React, { useState } from 'react';
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

interface Governorate {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
}

const GOVERNORATES: Governorate[] = [
  { id: '1', name_en: 'Cairo', name_ar: 'القاهرة', icon: '🏛️' },
  { id: '2', name_en: 'Giza', name_ar: 'الجيزة', icon: '🔺' },
  { id: '3', name_en: 'Alexandria', name_ar: 'الإسكندرية', icon: '🌊' },
  { id: '4', name_en: 'Asyut', name_ar: 'أسيوط', icon: '🏜️' },
  { id: '5', name_en: 'Red Sea', name_ar: 'البحر الأحمر', icon: '🏖️' },
  { id: '6', name_en: 'South Sinai', name_ar: 'جنوب سيناء', icon: '⛰️' },
];

interface CaptainGovernorateSelectionProps {
  navigation: any;
  route: any;
}

const CaptainGovernorateSelection: React.FC<CaptainGovernorateSelectionProps> = ({
  navigation,
  route,
}) => {
  const { 
    selectedLanguage: initialLanguage, 
    captainData, 
    token, 
    services, 
    vehicleType, 
    pricing 
  } = route.params || {};

  const [currentLanguage, setCurrentLanguage] = useState<'English' | 'Arabic'>(initialLanguage || 'English');
  const [selectedGovernorate, setSelectedGovernorate] = useState<Governorate | null>(null);

  const isAR = currentLanguage === 'Arabic';

  const getText = (en: string, ar: string) => (isAR ? ar : en);

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'English' ? 'Arabic' : 'English');
  };

  const handleContinue = () => {
    if (!selectedGovernorate) return;

    // STEP 2: Navigate to Captain Registration Screen
    navigation.navigate('CaptainRegisterScreen', {
      selectedLanguage: currentLanguage,
      token,
      captainData,
      governorate: selectedGovernorate.name_en,
      services,
      vehicleType,
      pricing,
    });
  };

  const renderGovernorateItem = ({ item }: { item: Governorate }) => (
    <TouchableOpacity
      style={[
        styles.governorateCard,
        selectedGovernorate?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => setSelectedGovernorate(item)}
    >
      <Text style={styles.icon}>{item.icon}</Text>
      <Text
        style={[
          styles.governorateName,
          selectedGovernorate?.id === item.id && styles.selectedText,
        ]}
      >
        {getText(item.name_en, item.name_ar)}
      </Text>
    </TouchableOpacity>
  );

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {getText('Select Your Operating City', 'اختر مدينة العمل')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {getText('Where will you provide services?', 'أين ستقدم الخدمات؟')}
          </Text>
        </View>

        {/* Governorates Grid */}
        <FlatList
          data={GOVERNORATES}
          renderItem={renderGovernorateItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContainer}
        />

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedGovernorate && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedGovernorate}
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

export default CaptainGovernorateSelection;

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
  gridContainer: {
    marginBottom: SPACING.XL,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  governorateCard: {
    width: '48%',
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderWidth: 2,
    borderColor: COLORS.ACCENT_GOLD,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  selectedCard: {
    backgroundColor: COLORS.ACCENT_GOLD,
    borderColor: COLORS.ACCENT_GOLD,
  },
  icon: {
    fontSize: 40,
    marginBottom: SPACING.SM,
  },
  governorateName: {
    fontSize: TYPOGRAPHY.SIZE_H5,
    fontWeight: '600',
    color: COLORS.ACCENT_GOLD,
    textAlign: 'center',
  },
  selectedText: {
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