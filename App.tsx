/**
 * CaptoutApp — Captain-only application
 * Package: com.captoutapp
 * AppRegistry: ToutRoutesApp
 *
 * Startup flow:
 *   WelcomeScreen (1-second static image + biometric check)
 *     → CaptainAuthSelectionScreen
 *       → CaptainLoginScreen  OR  CaptainRegisterScreen / DriverRegisterScreen
 *         → PendingApprovalScreen (new registrations)
 *         → CaptainDashboardScreen  OR  CaptainScooterDashboardScreen
 *           → CaptainBookingDetailsScreen → TripInProgressScreen
 *           → CaptainCarDetailsScreen
 *           → CaptainGovernorateSelectionScreen
 *           → CaptainHourlyRateScreen
 *           → CaptainRateSettingsScreen
 *           → CaptainServiceSelectionScreen
 *           → CaptainVehicleTypeSelectionScreen
 *           → CaptainTripHistoryScreen
 *           → CaptainReviewsScreen
 *           → ScooterIntroScreen
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// ── Entry ─────────────────────────────────────────────────────────────────────
import WelcomeScreen from './screens/WelcomeScreen';

// ── Captain Auth ──────────────────────────────────────────────────────────────
import CaptainAuthSelectionScreen from './screens/CaptainAuthSelectionScreen';
import CaptainLoginScreen from './screens/CaptainLoginScreen';
import CaptainRegisterScreen from './screens/CaptainRegisterScreen';
import DriverRegisterScreen from './screens/DriverRegisterScreen';
import PendingApprovalScreen from './screens/PendingApprovalScreen';

// ── Captain Dashboard ─────────────────────────────────────────────────────────
import CaptainDashboardScreen from './screens/CaptainDashboardScreen';
import CaptainScooterDashboardScreen from './screens/CaptainScooterDashboardScreen';
import CaptainBookingDetailsScreen from './screens/CaptainBookingDetailsScreen';

// ── Captain Profile & Settings ────────────────────────────────────────────────
import CaptainCarDetailsScreen from './screens/CaptainCarDetailsScreen';
import CaptainGovernorateSelectionScreen from './screens/CaptainGovernorateSelectionScreen';
import CaptainHourlyRateScreen from './screens/CaptainHourlyRateScreen';
import CaptainRateSettingsScreen from './screens/CaptainRateSettingsScreen';
import CaptainServiceSelectionScreen from './screens/CaptainServiceSelectionScreen';
import CaptainVehicleTypeSelectionScreen from './screens/CaptainVehicleTypeSelectionScreen';

// ── Captain History & Reviews ─────────────────────────────────────────────────
import CaptainTripHistoryScreen from './screens/CaptainTripHistoryScreen';
import CaptainReviewsScreen from './screens/CaptainReviewsScreen';

// ── Trip ──────────────────────────────────────────────────────────────────────
import TripInProgressScreen from './screens/TripInProgressScreen';
import CaptainTripChatScreen from './screens/CaptainTripChatScreen';
import ScooterIntroScreen from './screens/ScooterIntroScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WelcomeScreen">
        {/* ── Entry ─────────────────────────────────────────────────────── */}
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ headerShown: false }} />

        {/* ── Captain Auth ──────────────────────────────────────────────── */}
        <Stack.Screen name="CaptainAuthSelectionScreen" component={CaptainAuthSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainLoginScreen" component={CaptainLoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainRegisterScreen" component={CaptainRegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DriverRegisterScreen" component={DriverRegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PendingApprovalScreen" component={PendingApprovalScreen} options={{ headerShown: false }} />

        {/* ── Captain Dashboard ─────────────────────────────────────────── */}
        <Stack.Screen name="CaptainDashboardScreen" component={CaptainDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainScooterDashboardScreen" component={CaptainScooterDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainBookingDetailsScreen" component={CaptainBookingDetailsScreen} options={{ headerShown: false }} />

        {/* ── Captain Profile & Settings ────────────────────────────────── */}
        <Stack.Screen name="CaptainCarDetailsScreen" component={CaptainCarDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainGovernorateSelectionScreen" component={CaptainGovernorateSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainHourlyRateScreen" component={CaptainHourlyRateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainRateSettingsScreen" component={CaptainRateSettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainServiceSelectionScreen" component={CaptainServiceSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainVehicleTypeSelectionScreen" component={CaptainVehicleTypeSelectionScreen} options={{ headerShown: false }} />

        {/* ── Captain History & Reviews ─────────────────────────────────── */}
        <Stack.Screen name="CaptainTripHistoryScreen" component={CaptainTripHistoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainReviewsScreen" component={CaptainReviewsScreen} options={{ headerShown: false }} />

        {/* ── Trip ──────────────────────────────────────────────────────── */}
        <Stack.Screen name="TripInProgressScreen" component={TripInProgressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CaptainTripChatScreen" component={CaptainTripChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScooterIntroScreen" component={ScooterIntroScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
