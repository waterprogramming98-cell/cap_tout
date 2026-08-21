import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PendingApproval'
>;

const PendingApprovalScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { selectedLanguage } = route.params;

  const isAR = selectedLanguage === 'Arabic';

  const t = (en: string, ar: string) => (isAR ? ar : en);

  const handleBackToLogin = () => {
    navigation.replace('CaptainLoginScreen', {
      selectedLanguage,
    });
  };

  return (
    <View style={styles.container}>

      {/* ICON */}
      <Text style={styles.icon}>⏳</Text>

      {/* TITLE */}
      <Text style={styles.title}>
        {t('Account Pending Approval', 'الحساب في انتظار الموافقة')}
      </Text>

      {/* MESSAGE */}
      <Text style={styles.message}>
        {t(
          'Your account is under review. You will be able to log in once it is approved.',
          'حسابك قيد المراجعة. ستتمكن من تسجيل الدخول بعد الموافقة.'
        )}
      </Text>

      {/* STATUS BOX */}
      <View style={styles.box}>
        <Text style={styles.boxText}>
          {t('Status: Pending', 'الحالة: قيد الانتظار')}
        </Text>
      </View>

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleBackToLogin}
      >
        <Text style={styles.buttonText}>
          {t('Back to Login', 'العودة لتسجيل الدخول')}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default PendingApprovalScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  icon: {
    fontSize: 60,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },

  message: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 25,
  },

  box: {
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },

  boxText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },

  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },

  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});