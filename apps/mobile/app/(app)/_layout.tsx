import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@outfit-now/design-tokens';
import { useRouter, Tabs, Redirect } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '../../hooks/useAuth';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '../../lib/notifications';
import { initPurchases, identifyUser } from '../../lib/purchases';

export default function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // Init RevenueCat + identify user once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    initPurchases(user?.id);
    if (user?.id) void identifyUser(user.id);
  }, [isAuthenticated, user?.id]);

  // Register push token once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    void registerForPushNotifications();

    // Navigate to outfits when user taps a "brief ready" notification
    const remove = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      if (data?.screen === 'outfits') {
        router.push('/(app)/outfits' as never);
      }
    });
    return remove;
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[400],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarStyle: {
          backgroundColor: colors.neutral[900],
          borderTopColor: colors.neutral[800],
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: typography.fontWeight.medium,
          letterSpacing: 2,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dressing"
        options={{
          title: 'Dressing',
          tabBarIcon: ({ color, size }) => <Ionicons name="shirt-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stylist"
        options={{
          title: 'Stylist',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen name="outfits" options={{ href: null }} />
      <Tabs.Screen name="avatar" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="scan-validation" options={{ href: null }} />
      <Tabs.Screen name="premium" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
