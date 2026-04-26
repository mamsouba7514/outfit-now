import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAuthStore } from '../hooks/useAuth';

// Init Sentry as early as possible (before any rendering)
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,         // 20% of transactions
  environment: process.env.NODE_ENV ?? 'development',
});

void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { isLoading, refresh } = useAuthStore();

  useEffect(() => {
    // Clear stale Expo Router navigation state on each launch
    void AsyncStorage.removeItem('EXPO_ROUTER_STATE').catch(() => null);
    void refresh().finally(() => void SplashScreen.hideAsync());
  }, []);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(intro)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);
