import { Ionicons } from '@expo/vector-icons';
import { colors } from '@outfit-now/design-tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Tabs, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, StatusBar } from 'react-native';

import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '../../lib/notifications';
import { initPurchases, identifyUser } from '../../lib/purchases';

function CenterFAB({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={fabStyles.wrap} activeOpacity={0.85}>
      <LinearGradient
        colors={['#1e40af', '#2563eb', '#00c4bf']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={fabStyles.circle}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  wrap: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (!isAuthenticated) return;
    initPurchases(user?.id);
    if (user?.id) void identifyUser(user.id);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void registerForPushNotifications();
    const remove = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      if (data?.screen === 'outfits') router.push('/(app)/outfits' as never);
    });
    return remove;
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar barStyle={theme.colors.statusBar} backgroundColor={theme.colors.tabBar} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: theme.dark ? '#64748b' : '#A0AEC0',
          tabBarStyle: {
            backgroundColor: theme.colors.tabBar,
            borderTopColor: theme.colors.tabBarBorder,
            borderTopWidth: 1,
            height: 68,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: 'Poppins_500Medium',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="dressing"
          options={{
            title: 'Garde-robe',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shirt-outline" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stylist"
          options={{
            title: '',
            tabBarButton: () => <CenterFAB onPress={() => router.push('/(app)/stylist')} />,
          }}
        />
        <Tabs.Screen
          name="outfits"
          options={{
            title: 'Looks',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmark-outline" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="social" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="avatar" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="scan" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="scan-validation" options={{ href: null }} />
        <Tabs.Screen name="premium" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="style-pass" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </ThemeContext.Provider>
  );
}
