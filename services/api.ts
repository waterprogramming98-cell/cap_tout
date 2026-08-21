const API_BASE_URL = 'https://toutsroutes.com';

/* ================= ENDPOINTS ================= */

export const API_ENDPOINTS = {
  ADMIN_LOGIN: `${API_BASE_URL}/api/login`,

  USER_LOGIN: `${API_BASE_URL}/api/users/login`,
  USER_REGISTER: `${API_BASE_URL}/api/users/register`,
  USERS: `${API_BASE_URL}/api/users`,
  USER_PROFILE: `${API_BASE_URL}/api/users/me`,

  USER_STATUS: (id: number) =>
    `${API_BASE_URL}/api/users/${id}/status`,

  USER_BOOKING_HISTORY: `${API_BASE_URL}/api/bookings/user/history`,
  USER_TRIP_HISTORY: `${API_BASE_URL}/api/user/trip-history`,
  USER_SAVE_RATING: `${API_BASE_URL}/api/user/save-rating`,

  CAPTAIN_LOGIN: `${API_BASE_URL}/api/captains/login`,
  CAPTAIN_REGISTER: `${API_BASE_URL}/api/captains/register`,
  CAPTAIN_PROFILE: `${API_BASE_URL}/api/captains/me`,
  CAPTAINS: `${API_BASE_URL}/api/captains`,

  CAPTAIN_APPROVE: (id: number) =>
    `${API_BASE_URL}/api/captains/${id}/approve`,

  CAPTAIN_REJECT: (id: number) =>
    `${API_BASE_URL}/api/captains/${id}/reject`,

  CAPTAIN_RATES: (id: number) =>
    `${API_BASE_URL}/api/captains/${id}/rates`,

  CAPTAIN_BOOKINGS: `${API_BASE_URL}/api/bookings/captain`,
  CAPTAIN_BOOKING_HISTORY: `${API_BASE_URL}/api/bookings/captain/history`,
  CAPTAIN_ACTIVE_BOOKING: `${API_BASE_URL}/api/bookings/captain/active`,

  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  CAPTAIN_CANCEL_BOOKING: (id: number) => `${API_BASE_URL}/api/bookings/${id}/captain-cancel`,
  CAPTAIN_TRIP_MESSAGES: (id: number) => `${API_BASE_URL}/api/bookings/${id}/messages/captain`,

  BOOKING_STATUS: (id: number) =>
    `${API_BASE_URL}/api/bookings/${id}/status`,

  CAPTAIN_FCM_TOKEN: `${API_BASE_URL}/api/captains/me/fcm-token`,

  CAPTAIN_ONLINE_STATUS: `${API_BASE_URL}/api/captains/me/online-status`,
  CAPTAIN_PRESENCE: `${API_BASE_URL}/api/captains/me/presence`,
  CAPTAIN_HEARTBEAT: `${API_BASE_URL}/api/captains/me/heartbeat`,

  BIOMETRIC_REGISTER_USER:
    `${API_BASE_URL}/api/biometric/register/user`,
  BIOMETRIC_LOGIN_USER:
    `${API_BASE_URL}/api/biometric/login/user`,

  BIOMETRIC_REGISTER_CAPTAIN:
    `${API_BASE_URL}/api/biometric/register/captain`,
  BIOMETRIC_LOGIN_CAPTAIN:
    `${API_BASE_URL}/api/biometric/login/captain`,

  REVIEWS: `${API_BASE_URL}/api/reviews`,

  CAPTAIN_REVIEWS: (captainId: number) =>
    `${API_BASE_URL}/api/captains/${captainId}/reviews`,
};

/* ================= TYPES ================= */

export interface Credentials {
  phone_number: string;
  password: string;
  vehicle_type?: string;
}

export interface UserData {
  user_id?: number;
  captain_id?: number;
  name: string;
  email?: string;
  phone_number: string;
  status?: string;
}

export interface LoginSuccessData {
  user?: UserData;
  captain?: UserData;
  token: string;
}

export interface OnlineStatusResponse {
  data?: {
    is_online: boolean;
    updated_at?: string;
  };
  is_online?: boolean;
  success?: boolean;
}

export interface HeartbeatResponse {
  success: boolean;
  message?: string;
}

/* ================= ERROR HANDLER ================= */

const handleApiError = async (response: Response) => {
  const errorData = await response.json().catch(() => ({}));

  throw new Error(
    errorData.error ||
    errorData.message ||
    `HTTP ${response.status}`
  );
};

/* ================= AUTH ================= */

// loginUser removed — User auth is in ToutApp only

export const loginCaptain = async (credentials: Credentials) => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/* ================= BIOMETRICS (FIXED) ================= */

export const registerBiometrics = async (
  userType: 'user' | 'captain',
  deviceId: string,
  jwtToken: string,
  phoneNumber: string // ✅ REQUIRED BY BACKEND
) => {
  const url =
    userType === 'user'
      ? API_ENDPOINTS.BIOMETRIC_REGISTER_USER
      : API_ENDPOINTS.BIOMETRIC_REGISTER_CAPTAIN;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      phone_number: phoneNumber, // ✅ MUST MATCH BACKEND EXACT KEY
      device_id: deviceId,       // ✅ MUST MATCH BACKEND EXACT KEY
    }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

export const loginWithBiometrics = async (
  userType: 'user' | 'captain',
  deviceId: string,
  biometricToken: string
) => {
  const url =
    userType === 'user'
      ? API_ENDPOINTS.BIOMETRIC_LOGIN_USER
      : API_ENDPOINTS.BIOMETRIC_LOGIN_CAPTAIN;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: deviceId,
      biometric_token: biometricToken,
    }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/* ================= REVIEWS ================= */

export const submitReview = async (
  bookingId: number,
  rating: number,
  comment: string,
  token: string
) => {
  const res = await fetch(API_ENDPOINTS.REVIEWS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_id: bookingId,
      rating,
      comment,
    }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

export const getCaptainReviews = async (captainId: number) => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_REVIEWS(captainId));

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/* ================= TRIP HISTORY (NEW) ================= */

export const getUserTripHistory = async (
  token: string,
  page: number = 1,
  perPage: number = 10
) => {
  const url = `${API_ENDPOINTS.USER_TRIP_HISTORY}?page=${page}&per_page=${perPage}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/* ================= SAVE RATING (NEW) ================= */

export const saveRating = async (
  token: string,
  bookingId: number,
  rating: number,
  comment: string = ''
) => {
  const res = await fetch(API_ENDPOINTS.USER_SAVE_RATING, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_id: bookingId,
      rating,
      comment,
    }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/* ================= CAPTAIN ONLINE STATUS (NEW) ================= */

/**
 * Update Captain's online status
 * @param token - JWT token for authentication
 * @param isOnline - Boolean to set online/offline status
 * @returns OnlineStatusResponse
 */
export const updateCaptainOnlineStatus = async (
  token: string,
  isOnline: boolean
): Promise<OnlineStatusResponse> => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_ONLINE_STATUS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_online: isOnline }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/**
 * Get Captain's current online status
 * @param token - JWT token for authentication
 * @returns OnlineStatusResponse
 */
export const getCaptainOnlineStatus = async (
  token: string
): Promise<OnlineStatusResponse> => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_ONLINE_STATUS, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/**
 * Send a heartbeat to keep the Captain's online status active
 * This should be called periodically (every 30 seconds) when the Captain is online
 * @param token - JWT token for authentication
 * @returns HeartbeatResponse
 */
export const sendCaptainHeartbeat = async (
  token: string
): Promise<HeartbeatResponse> => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_HEARTBEAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      is_active: true,
    }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/**
 * Register FCM token for push notifications
 * @param token - JWT token for authentication
 * @param fcmToken - Firebase Cloud Messaging token
 * @returns Response from server
 */
export const registerFCMToken = async (
  token: string,
  fcmToken: string
) => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_FCM_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fcm_token: fcmToken }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};

/**
 * Update Captain's presence status
 * This can be used to track when the Captain was last active
 * @param token - JWT token for authentication
 * @returns Response from server
 */
export const updateCaptainPresence = async (
  token: string
) => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_PRESENCE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      last_seen: new Date().toISOString(),
    }),
  });

  if (!res.ok) await handleApiError(res);
  return res.json();
};