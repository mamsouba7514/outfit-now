import { PostHog } from 'posthog-react-native';

const POSTHOG_KEY = process.env['EXPO_PUBLIC_POSTHOG_KEY'] ?? '';
const POSTHOG_HOST = process.env['EXPO_PUBLIC_POSTHOG_HOST'] ?? 'https://eu.posthog.com';

// Only instantiate when a real key is provided — PostHog throws if key is empty
let _posthog: PostHog | null = null;
function getPostHog(): PostHog | null {
  if (!POSTHOG_KEY) return null;
  if (!_posthog) _posthog = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
  return _posthog;
}

export function identifyUser(userId: string, props?: { email?: string; tier?: string }) {
  getPostHog()?.identify(userId, props);
}

export function resetAnalytics() {
  getPostHog()?.reset();
}

function capture(event: string, props?: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPostHog()?.capture(event, props as any);
}

export const track = {
  signupCompleted: (method: 'email' | 'apple' | 'google') =>
    capture('signup_completed', { method }),

  onboardingCompleted: (data: { gender: string; styleCount: number }) =>
    capture('onboarding_completed', data),

  scanStarted: () => capture('scan_started'),

  scanCompleted: (data: { category: string; durationMs?: number }) =>
    capture('scan_completed', data),

  scanValidated: (data: { itemId: string; categoryChanged: boolean; tagsEdited: boolean }) =>
    capture('scan_validated', data),

  briefCreated: (data: { occasion: string; hasStyleNotes: boolean }) =>
    capture('brief_created', data),

  briefCompleted: (data: { occasion: string; outfitCount: number; durationMs?: number }) =>
    capture('brief_completed', data),

  outfitWorn: (data: { outfitId: string; occasion: string }) =>
    capture('outfit_worn', data),

  outfitSaved: (data: { outfitId: string }) =>
    capture('outfit_saved', data),

  outfitDiscarded: (data: { outfitId: string }) =>
    capture('outfit_discarded', data),

  affiliateClicked: (data: { productId: string; network: string }) =>
    capture('affiliate_clicked', data),

  premiumPaywallViewed: () => capture('premium_paywall_viewed'),

  premiumCheckoutStarted: () => capture('premium_checkout_started'),

  premiumActivated: () => capture('premium_activated'),
};
