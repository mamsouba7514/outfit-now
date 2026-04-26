import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiRequest } from './api';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permission and register the Expo push token with the API.
 * Safe to call multiple times — short-circuits if already granted.
 * Returns the token string, or null on failure / no permission.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Outfit Now',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2448D8',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    const token = tokenData.data;

    // Register token with our API
    await apiRequest('/v1/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    return token;
  } catch (err) {
    console.warn('[Notifications] token registration failed:', err);
    return null;
  }
}

/**
 * Unregister push token (call on logout).
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    await apiRequest('/v1/me/push-token', { method: 'DELETE' });
  } catch {
    // ignore
  }
}

/**
 * Add a listener for notification taps (app in background / closed).
 * Returns the remove function.
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}
