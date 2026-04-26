import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuthStore } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('intro_seen')
      .then((val) => setIntroSeen(val === 'true'))
      .catch(() => setIntroSeen(true));
  }, []);

  if (isLoading || introSeen === null) return <View style={{ flex: 1 }} />;

  if (!isAuthenticated) {
    return <Redirect href={introSeen ? '/login' : '/(intro)'} />;
  }

  if (!user?.onboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(app)/home" />;
}
