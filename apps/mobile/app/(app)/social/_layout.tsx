import { Stack } from 'expo-router';
import { colors } from '@outfit-now/design-tokens';

export default function SocialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral[950] },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="user/[userId]" />
    </Stack>
  );
}
