import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Replace with your actual logic to check if user is logged in
      const isLoggedIn = false; // Placeholder
      if (isLoggedIn) {
        navigation.replace('CaptainDashboardScreen'); // Navigate to captain dashboard if logged in
      } else {
        navigation.replace('CaptainLoginScreen'); // Navigate to login if not logged in
      }
    }, 3000); // Show splash screen for 3 seconds

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/captout_logo.png")} // Assuming you have a logo in assets/images
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to CaptoutApp</Text>
      <ActivityIndicator style={styles.loadingIndicator} size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Light background
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  loadingIndicator: {
    marginTop: 20,
  },
});

export default SplashScreen;
