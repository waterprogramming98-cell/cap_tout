import { API_ENDPOINTS } from './api';

/**
 * Update captain online/offline status
 */
export const setCaptainOnline = async (
  token: string,
  isOnline: boolean
) => {
  const res = await fetch(API_ENDPOINTS.CAPTAIN_ONLINE_STATUS, {
    method: 'POST', // ✅ FIXED
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      is_online: isOnline,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || 'Failed to update status'
    );
  }

  return data;
};