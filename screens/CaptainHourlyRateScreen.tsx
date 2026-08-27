import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';

const CaptainHourlyRateScreen: React.FC<any> = ({ route, navigation }) => {
  const params = route?.params || {};

  const token = params.token;
  const captainId = params.captainId;
  const language = params.selectedLanguage || 'English';

  const [hourlyRate, setHourlyRate] = useState(50);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const MIN = 50;
  const MAX = 300;

  const t = (en: string, ar: string) => (language === 'Arabic' ? ar : en);

  // ================= FETCH EXISTING RATE =================
  React.useEffect(() => {
    const fetchCurrentRate = async () => {
      if (!token) return;
      setFetching(true);
      try {
        const res = await fetch('https://toutsroutes.com/api/captains/me', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
        } );
        if (res.ok) {
          const data = await res.json();
          // The server returns the captain object, often nested under 'data'
          const captain = data?.data?.captain || data?.captain || data?.data || data;
          
          // Robust extraction based on your debug log showing a "rates" field
          const rate = 
            captain?.hourly_rate || 
            captain?.rate || 
            captain?.rates?.hourly_rate || 
            captain?.rates?.rate ||
            (Array.isArray(captain?.rates) ? captain.rates[0]?.hourly_rate : null) ||
            (Array.isArray(captain?.rates) ? captain.rates[0]?.rate : null) ||
            captain?.pricing?.hourly_rate ||
            captain?.pricing?.rate;

          if (rate) {
            setHourlyRate(Number(rate));
          }
        }
      } catch (e) {
        console.log('Error fetching current rate:', e);
      } finally {
        setFetching(false);
      }
    };
    fetchCurrentRate();
  }, [token]);

  const handleSave = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing token');
      return;
    }

    setLoading(true);

    try {
      // We send both 'hourly_rate' and 'rate' to ensure compatibility with the backend
      const payload = {
        hourly_rate: hourlyRate,
        rate: hourlyRate,
        captain_id: captainId,
      };

      const res = await fetch(
        'https://toutsroutes.com/api/captains/me/rates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload ),
        }
      );

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || 'Failed to save rate');
      }

      Alert.alert('Success', 'Hourly rate updated successfully');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        {t('Set Hourly Rate', 'تحديد سعر الساعة')}
      </Text>

      <View style={styles.card}>
        {fetching ? (
          <ActivityIndicator color="gold" style={{ marginVertical: 20 }} />
        ) : (
          <>
            <Text style={styles.label}>
              {hourlyRate} EGP / {t('hour', 'ساعة')}
            </Text>

            <Slider
              minimumValue={MIN}
              maximumValue={MAX}
              step={5}
              value={hourlyRate}
              onValueChange={setHourlyRate}
              minimumTrackTintColor="gold"
              maximumTrackTintColor="#444"
            />
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{t('Save', 'حفظ')}</Text>
        )}
      </TouchableOpacity>

    </View>
  );
};

export default CaptainHourlyRateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: 'gold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'gold',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
});
