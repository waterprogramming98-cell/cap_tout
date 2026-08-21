/**
 * CaptoutApp — Captain-only navigation type definitions
 * All User routes have been removed.
 */
export type RootStackParamList = {
  // ── Entry ──────────────────────────────────────────────────────────────────
  WelcomeScreen: undefined;

  // ── Captain Auth ────────────────────────────────────────────────────────────
  CaptainAuthSelectionScreen: { selectedLanguage: string };
  CaptainLoginScreen: { selectedLanguage: string; vehicleType?: string };
  CaptainRegisterScreen: { selectedLanguage: string; vehicleType: string };
  DriverRegisterScreen: { selectedLanguage: string };
  PendingApprovalScreen: { selectedLanguage: string };

  // ── Captain Dashboard ───────────────────────────────────────────────────────
  CaptainDashboardScreen: { selectedLanguage: string; token: string; captainData: any };
  CaptainScooterDashboardScreen: { selectedLanguage: string; token: string; captainData: any };
  CaptainBookingDetailsScreen: {
    selectedLanguage: string;
    token: string;
    bookingId: number;
  };

  // ── Captain Profile & Settings ──────────────────────────────────────────────
  CaptainCarDetailsScreen: { selectedLanguage: string; token: string };
  CaptainGovernorateSelectionScreen: { selectedLanguage: string; token: string };
  CaptainHourlyRateScreen: { selectedLanguage: string; token: string };
  CaptainRateSettingsScreen: { selectedLanguage: string; token: string };
  CaptainServiceSelectionScreen: { selectedLanguage: string; token: string };
  CaptainVehicleTypeSelectionScreen: { selectedLanguage: string };

  // ── Captain History & Reviews ───────────────────────────────────────────────
  CaptainTripHistoryScreen: { selectedLanguage: string; token: string };
  CaptainReviewsScreen: { captainId: number; captainName: string };

  // ── Trip ────────────────────────────────────────────────────────────────────
  TripInProgressScreen: {
    selectedLanguage: string;
    token: string;
    bookingDetails: any;
    captain: any;
  };
  ScooterIntroScreen: { selectedLanguage: string };
};
