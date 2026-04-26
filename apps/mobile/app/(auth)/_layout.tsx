import { Stack, Redirect } from 'expo-router';

import { useAuthStore } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) return <Redirect href="/(app)/home" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
