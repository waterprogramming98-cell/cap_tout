/**
 * @format
 */

import { AppRegistry, PermissionsAndroid, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

/**
 * ================= RUNTIME NOTIFICATION PERMISSION (Android 13+) =================
 * POST_NOTIFICATIONS must be declared in AndroidManifest.xml AND requested at runtime
 * on Android 13+ (API 33+). messaging().requestPermission() alone is not sufficient.
 */
const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      console.log('[NOTIF] POST_NOTIFICATIONS permission result:', result);
    } else {
      console.log('[NOTIF] POST_NOTIFICATIONS not required (Android < 13 or iOS), Platform.Version:', Platform.Version);
    }
  } catch (error) {
    console.error('[NOTIF] Error requesting POST_NOTIFICATIONS permission:', error);
  }
};
requestNotificationPermission();

/**
 * ================= NOTIFEE CHANNEL CREATION =================
 * Create channel ride_requests_v4 with custom sound file ride_request.wav.
 * A new channel ID is used to bypass any OS-cached settings from previous channels.
 * Android notification channels are permanent once created — changing sound on an
 * existing channel has no effect after the user has seen it once.
 */
const createNotifeeChannel = async () => {
  try {
    // Delete all previous channel versions to keep the channel list clean
    try { await notifee.deleteChannel('ride_requests'); } catch (_) {}
    try { await notifee.deleteChannel('ride_requests_v2'); } catch (_) {}
    try { await notifee.deleteChannel('ride_requests_v3'); } catch (_) {}

    await notifee.createChannel({
      id: 'ride_requests_v4',
      name: 'Ride Requests',
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500],
      sound: 'ride_request',
    });
    console.log('[NOTIF] Channel created: ride_requests_v4');
  } catch (error) {
    console.error('[NOTIF] Error creating channel:', error);
  }
};
createNotifeeChannel();

/**
 * ================= BACKGROUND MESSAGE HANDLER =================
 * Runs when the app is in the background or completely closed.
 * FCM delivers the data-only message and React Native starts a headless JS task.
 */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[NOTIF] Received FCM', JSON.stringify(remoteMessage));

  try {
    const { notification, data } = remoteMessage;
    const type = data?.type || data?.notification_type;
    
    if (type === 'booking_cancelled' || type === 'BOOKING_CANCELLED') {
      await notifee.displayNotification({
        title: notification?.title || data?.title || 'Trip Cancelled',
        body: notification?.body || data?.body || 'The passenger has cancelled the trip.',
        android: {
          channelId: 'ride_requests_v4',
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
          importance: AndroidImportance.HIGH,
          priority: 'high',
        },
        data: data,
      });
      return;
    }

    const title = notification?.title || data?.title || 'New Ride Request';
    const body = notification?.body || data?.body || 'You have a new ride request';
    const rideId = data?.ride_id || data?.booking_id || null;
    const riderName = data?.rider_name || 'A rider';
    const pickupLocation = data?.pickup_location || data?.pickup_address || 'Pickup location';
    const fare = data?.fare || data?.estimated_fare || 'N/A';

    await notifee.displayNotification({
      title: title,
      body: body,
      android: {
        channelId: 'ride_requests_v4',
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
        style: {
          type: 1, // BigTextStyle
          text: `${body}\n\nRider: ${riderName}\nPickup: ${pickupLocation}\nFare: ${fare}`,
        },
        importance: AndroidImportance.HIGH,
        priority: 'high',
        vibrationPattern: [300, 500],
      },
      ios: {
        sound: 'ride_request.wav',
      },
      data: {
        ride_id: rideId,
        rider_name: riderName,
        pickup_location: pickupLocation,
        fare: fare,
        type: type,
      },
    });

    console.log('[NOTIF] Displayed on channel ride_requests_v4');
  } catch (error) {
    console.error('[NOTIF] Error handling background message:', error);
  }
});

/**
 * ================= FOREGROUND MESSAGE HANDLER =================
 * Runs when the app is open in the foreground.
 * FCM does not auto-display notifications in foreground — Notifee handles it here.
 */
messaging().onMessage(async (remoteMessage) => {
  console.log('[NOTIF] Received FCM', JSON.stringify(remoteMessage));

  try {
    const { notification, data } = remoteMessage;
    const type = data?.type || data?.notification_type;

    if (type === 'booking_cancelled' || type === 'BOOKING_CANCELLED') {
      // In foreground, we might skip the tray notification if we're already handling it in screens
      // but let's show it for safety if the user is not in the dashboard/trip screen.
      await notifee.displayNotification({
        title: notification?.title || data?.title || 'Trip Cancelled',
        body: notification?.body || data?.body || 'The passenger has cancelled the trip.',
        android: {
          channelId: 'ride_requests_v4',
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
          importance: AndroidImportance.HIGH,
          priority: 'high',
        },
        data: data,
      });
      return;
    }

    const title = notification?.title || data?.title || 'New Ride Request';
    const body = notification?.body || data?.body || 'You have a new ride request';
    const rideId = data?.ride_id || data?.booking_id || null;
    const riderName = data?.rider_name || 'A rider';
    const pickupLocation = data?.pickup_location || data?.pickup_address || 'Pickup location';
    const fare = data?.fare || data?.estimated_fare || 'N/A';

    await notifee.displayNotification({
      title: title,
      body: body,
      android: {
        channelId: 'ride_requests_v4',
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
        style: {
          type: 1, // BigTextStyle
          text: `${body}\n\nRider: ${riderName}\nPickup: ${pickupLocation}\nFare: ${fare}`,
        },
        importance: AndroidImportance.HIGH,
        priority: 'high',
        vibrationPattern: [300, 500],
      },
      ios: {
        sound: 'ride_request.wav',
      },
      data: {
        ride_id: rideId,
        rider_name: riderName,
        pickup_location: pickupLocation,
        fare: fare,
        type: type,
      },
    });

    console.log('[NOTIF] Displayed on channel ride_requests_v4');
  } catch (error) {
    console.error('[NOTIF] Error handling foreground message:', error);
  }
});

/**
 * ================= NOTIFICATION PRESS HANDLER =================
 * When the captain taps a ride-request notification, the dashboard
 * re-fetches bookings automatically via the isFocused effect.
 */
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('[NOTIF] Notification pressed:', detail.notification?.data);
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('[NOTIF] Background notification pressed:', detail.notification?.data);
  }
});

/**
 * ================= PERSISTENT ONLINE STATUS INITIALIZATION =================
 * Restores the Captain's online status when the app restarts.
 */
const initializePersistentOnlineStatus = async () => {
  try {
    const savedOnlineStatus = await AsyncStorage.getItem('captain_online_status');
    const captainToken = await AsyncStorage.getItem('captain_token');
    const captainId = await AsyncStorage.getItem('captain_id');

    if (savedOnlineStatus === 'true' && captainToken && captainId) {
      console.log('Restoring Captain online status on app start...');
      try {
        const response = await fetch('https://toutsroutes.com/api/captains/me/online-status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${captainToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const serverOnlineStatus = data?.data?.is_online || data?.is_online;
          if (!serverOnlineStatus) {
            console.log('Server shows offline, updating to online...');
            await fetch('https://toutsroutes.com/api/captains/me/online-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${captainToken}`,
              },
              body: JSON.stringify({ is_online: true }),
            });
          }
        }
      } catch (syncError) {
        console.log('Could not sync online status with server:', syncError);
      }
    }
  } catch (error) {
    console.error('Error initializing persistent online status:', error);
  }
};
initializePersistentOnlineStatus();

/**
 * ================= HEARTBEAT SERVICE =================
 * Periodically sends a heartbeat to maintain the Captain's online status.
 */
const startHeartbeatService = async () => {
  try {
    const captainToken = await AsyncStorage.getItem('captain_token');
    const savedOnlineStatus = await AsyncStorage.getItem('captain_online_status');

    if (savedOnlineStatus === 'true' && captainToken) {
      setInterval(async () => {
        try {
          await fetch('https://toutsroutes.com/api/captains/me/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${captainToken}`,
            },
            body: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
          console.log('Heartbeat sent');
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }, 30000);
    }
  } catch (error) {
    console.error('Error starting heartbeat service:', error);
  }
};
startHeartbeatService();

AppRegistry.registerComponent(appName, () => App);
