import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import Slider from '@react-native-community/slider';

interface Props {
  navigation: any;
  route: {
    params: {
      selectedLanguage: string;
      vehicleType: 'WithVehicle' | 'WithoutVehicle';
    };
  };
}

/* ✅ STRICT CATEGORY TYPE */
type CategoryKey =
  | 'Economy'
  | 'Family'
  | 'Medical'
  | 'Luxury'
  | 'School Trips';

const CaptainCarDetailsScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { selectedLanguage, vehicleType } = route.params;

  const isAR = selectedLanguage === 'Arabic';
  const t = (en: string, ar: string) => (isAR ? ar : en);

  /* ✅ PRICING STATE */
  const [pricing, setPricing] = useState<Record<CategoryKey, number>>({
    Economy: 4,
    Family: 7,
    Medical: 8,
    Luxury: 14,
    'School Trips': 6,
  });

  /* ✅ CATEGORY CONFIG */
  const categories: Record<
    CategoryKey,
    { min: number; max: number; en: string; ar: string }
  > = {
    Economy: { min: 3, max: 6, en: 'Economy', ar: 'علي قد الإيد' },
    Family: { min: 5, max: 10, en: 'Family', ar: 'توصيلة الحبايب' },
    Medical: { min: 6, max: 12, en: 'Medical', ar: 'الطاقم الطبي' },
    Luxury: { min: 10, max: 18, en: 'Luxury', ar: 'درجة رجال الأعمال' },
    'School Trips': {
      min: 4,
      max: 8,
      en: 'School Trips',
      ar: 'توصيل مدارس',
    },
  };

  const handleNext = () => {
    navigation.navigate('CaptainServiceSelectionScreen', {
      selectedLanguage,
      vehicleType,
      pricing,
      categories: Object.keys(categories), // ✅ IMPORTANT
    });
  };

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        {t('Set Your Prices', 'حدد أسعارك')}
      </Text>

      {(Object.keys(categories) as CategoryKey[]).map((key) => {
        const item = categories[key];

        return (
          <View key={key} style={styles.card}>

            <Text style={styles.category}>
              {isAR ? item.ar : item.en}
            </Text>

            <Text style={styles.price}>
              {pricing[key]} EGP / km
            </Text>

            <Slider
              minimumValue={item.min}
              maximumValue={item.max}
              step={0.5}
              value={pricing[key]}
              minimumTrackTintColor="#FFD700"
              maximumTrackTintColor="#333"
              thumbTintColor="#FFD700"
              onValueChange={(val: number) =>
                setPricing((prev) => ({
                  ...prev,
                  [key]: val,
                }))
              }
            />

            <Text style={styles.range}>
              {item.min} - {item.max} EGP/km
            </Text>

          </View>
        );
      })}

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {t('Continue', 'متابعة')}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

export default CaptainCarDetailsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 15,
  },

  title: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },

  category: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },

  price: {
    color: '#fff',
    marginVertical: 10,
  },

  range: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },

  button: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },

  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
});