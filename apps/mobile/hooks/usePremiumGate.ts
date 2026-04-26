// ─── usePremiumGate ───────────────────────────────────────────────────────────
//
// Usage:
//   const { requirePremium } = usePremiumGate();
//   requirePremium(() => doProtectedAction());
//
// If the user is not premium → navigates to the paywall.
// If the user is premium → executes the callback immediately.

import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import { useSubscription } from './useSubscription';

export function usePremiumGate() {
  const { isPremium, isLoading } = useSubscription();
  const router = useRouter();

  const requirePremium = useCallback(
    (action: () => void) => {
      if (isLoading) return; // wait for subscription status to load
      if (isPremium) {
        action();
      } else {
        router.push('/(app)/premium' as never);
      }
    },
    [isPremium, isLoading],
  );

  return { isPremium, isLoading, requirePremium };
}
