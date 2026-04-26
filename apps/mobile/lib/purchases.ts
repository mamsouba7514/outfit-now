// ─── RevenueCat — subscription management ────────────────────────────────────
//
// Product IDs must match what you configure in App Store Connect + RevenueCat.
// Set EXPO_PUBLIC_REVENUECAT_IOS_KEY in your .env file.
//
// Entitlements:
//   "premium" → monthly/annual Premium plan

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

export const ENTITLEMENT_PREMIUM = 'premium';

// Product identifiers — must match App Store Connect / Play Console
export const PRODUCT_MONTHLY  = 'outfitnow_premium_monthly';
export const PRODUCT_ANNUAL   = 'outfitnow_premium_annual';

// ─── Init ─────────────────────────────────────────────────────────────────────

let _initialized = false;

export function initPurchases(userId?: string): void {
  if (_initialized) return;

  const apiKey = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? ''
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

  if (!apiKey) {
    console.warn('[Purchases] RevenueCat API key not set — purchases disabled');
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey, appUserID: userId ?? null });
  _initialized = true;
}

// ─── Customer info ────────────────────────────────────────────────────────────

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!_initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.warn('[Purchases] getCustomerInfo failed:', e);
    return null;
  }
}

export function isPremium(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return info.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
}

// ─── Offerings ────────────────────────────────────────────────────────────────

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!_initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.warn('[Purchases] getOfferings failed:', e);
    return null;
  }
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

export type PurchaseResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; cancelled: boolean; error?: string };

export async function purchasePackage(
  pkg: import('react-native-purchases').PurchasesPackage,
): Promise<PurchaseResult> {
  if (!_initialized) {
    return { success: false, cancelled: false, error: 'Purchases not initialized' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (e: unknown) {
    // UserCancelledError has code 1
    const code = (e as { code?: number })?.code;
    if (code === 1) return { success: false, cancelled: true };
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, cancelled: false, error: message };
  }
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!_initialized) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    console.warn('[Purchases] restorePurchases failed:', e);
    return null;
  }
}

// ─── Identify user (call after login) ────────────────────────────────────────

export async function identifyUser(userId: string): Promise<void> {
  if (!_initialized) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[Purchases] logIn failed:', e);
  }
}

// ─── Reset (call on logout) ───────────────────────────────────────────────────

export async function resetPurchases(): Promise<void> {
  if (!_initialized) return;
  try {
    await Purchases.logOut();
  } catch {
    // ignore — user might not be logged in
  }
}
