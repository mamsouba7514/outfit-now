// ─── useSubscription — reactive premium status ────────────────────────────────
//
// Usage:
//   const { isPremium, isLoading, offering, purchase, restore } = useSubscription();

import { useState, useEffect, useCallback } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import {
  getCustomerInfo,
  getCurrentOffering,
  isPremium as checkPremium,
  purchasePackage,
  restorePurchases,
  type PurchaseResult,
} from '../lib/purchases';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offering: PurchasesOffering | null;
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering]         = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading]       = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [info, offer] = await Promise.all([
      getCustomerInfo(),
      getCurrentOffering(),
    ]);
    setCustomerInfo(info);
    setOffering(offer);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, []);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    const result = await purchasePackage(pkg);
    if (result.success) {
      setCustomerInfo(result.customerInfo);
    }
    return result;
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    const info = await restorePurchases();
    if (info) setCustomerInfo(info);
    return checkPremium(info);
  }, []);

  return {
    isPremium: checkPremium(customerInfo),
    isLoading,
    customerInfo,
    offering,
    purchase,
    restore,
    refresh,
  };
}
