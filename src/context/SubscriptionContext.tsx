'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  getCurrentSubscription,
  getPricingPlans,
  getSubscriptionRecommendation,
  getSubscriptionUsage
} from '@/services/api';
import { useAuth } from './AuthContext';
import type {
  PricingPlan,
  PricingPlansResponse,
  SubscriptionDetails,
  SubscriptionRecommendation,
  SubscriptionUsage,
  SubscriptionTier
} from '@/types/subscription';
import { PRICING_PLAN_FALLBACK } from '@/types/subscription';
import { normalizeSubscriptionInfo } from '@/lib/subscription';

interface SubscriptionContextValue {
  loading: boolean;
  plansLoading: boolean;
  error: string | null;
  currency: string;
  plans: Record<string, PricingPlan>;
  planOrder: Array<SubscriptionTier | string>;
  planList: PricingPlan[];
  current: SubscriptionDetails | null;
  usage: SubscriptionUsage | null;
  recommendation: SubscriptionRecommendation | null;
  activeTier: SubscriptionTier | string;
  activePlan: PricingPlan | null;
  planLabel: string;
  formsLimit: number | null;
  submissionsLimit: number | null;
  submissionsUsed: number | null;
  submissionsPercent: number | null;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  isTrialing: boolean;
  isTrialExpired: boolean;
  isStarterTier: boolean;
  isPaidPlan: boolean;
  isActive: boolean;
  isPastDue: boolean;
  isSuspended: boolean;
  isCancelled: boolean;
  hasFeature: (feature: string) => boolean;
  formsLimitReached: (currentFormsCount: number) => boolean;
  refresh: () => Promise<void>;
  formatPrice: (priceCents?: number | null) => string;
}

const tierOrder: SubscriptionTier[] = ['starter', 'professional', 'business', 'enterprise'];

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

const normalizeTier = (tier?: string | null): SubscriptionTier | string => {
  if (!tier) return 'starter';
  return tier.toString().toLowerCase();
};

const normalizePlanMap = (planMap: Record<string, PricingPlan>) => {
  return Object.entries(planMap || {}).reduce((acc, [key, plan]) => {
    acc[key] = {
      ...plan,
      tier: plan.tier || key
    } as PricingPlan;
    return acc;
  }, {} as Record<string, PricingPlan>);
};

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, authReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [plans, setPlans] = useState<Record<string, PricingPlan>>(() =>
    normalizePlanMap(PRICING_PLAN_FALLBACK.plans)
  );
  const [current, setCurrent] = useState<SubscriptionDetails | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [recommendation, setRecommendation] = useState<SubscriptionRecommendation | null>(null);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const data: PricingPlansResponse = await getPricingPlans();
      if (data?.plans) {
        setPlans(normalizePlanMap(data.plans));
        if (data.currency) setCurrency(data.currency);
      }
    } catch (e) {
      console.warn('[SubscriptionContext] Failed to load pricing plans, using fallback.', e);
      setPlans(normalizePlanMap(PRICING_PLAN_FALLBACK.plans));
      setCurrency('USD');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const hydrateSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrent(null);
      setUsage(null);
      setRecommendation(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [currentData, usageData, recommendationData] = await Promise.all([
        getCurrentSubscription(),
        getSubscriptionUsage({ days: 30 }),
        getSubscriptionRecommendation()
      ]);
      const normalizedCurrent = currentData
        ? {
            ...currentData,
            usage_info:
              normalizeSubscriptionInfo(currentData.usage_info) ||
              normalizeSubscriptionInfo(currentData) ||
              null
          }
        : null;

      setCurrent(normalizedCurrent);

      const normalizedUsage =
        normalizeSubscriptionInfo(usageData) ||
        normalizeSubscriptionInfo(normalizedCurrent?.usage_info) ||
        null;

      setUsage((normalizedUsage as SubscriptionUsage) || null);
      setRecommendation(recommendationData);
    } catch (e) {
      console.warn('[SubscriptionContext] Failed to hydrate subscription data.', e);
      setError('Unable to load subscription information.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (!authReady) return;
    if (isAuthenticated) {
      hydrateSubscription();
    } else {
      setCurrent(null);
      setUsage(null);
      setRecommendation(null);
    }
  }, [authReady, isAuthenticated, hydrateSubscription]);

  const refresh = useCallback(async () => {
    await hydrateSubscription();
  }, [hydrateSubscription]);

  const usageSnapshot = usage || current?.usage_info || null;
  const tierKey = normalizeTier(current?.tier || usageSnapshot?.current_tier);
  const activePlan = plans[tierKey] || null;
  const planLabel = current?.plan_name || activePlan?.name || 'Starter';
  const normalizeStatus = (value?: string | null) => (value ? value.toLowerCase() : null);
  const subscriptionStatus =
    normalizeStatus(current?.subscription_status) ||
    normalizeStatus(usageSnapshot?.subscription_status) ||
    normalizeStatus(current?.status) ||
    null;
  const trialEndsAt = current?.trial_ends_at || usageSnapshot?.trial_ends_at || null;
  const rawTrialDaysRemaining =
    typeof usageSnapshot?.trial_days_remaining === 'number'
      ? usageSnapshot.trial_days_remaining
      : null;
  const computeDaysRemaining = (iso?: string | null) => {
    if (!iso) return null;
    const timestamp = Date.parse(iso);
    if (Number.isNaN(timestamp)) return null;
    const diffMs = timestamp - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };
  const trialDaysRemaining =
    rawTrialDaysRemaining !== null && rawTrialDaysRemaining !== undefined
      ? rawTrialDaysRemaining
      : computeDaysRemaining(trialEndsAt);
  const trialEndsTimestamp = trialEndsAt ? Date.parse(trialEndsAt) : null;
  const hasValidTrialEnd = typeof trialEndsTimestamp === 'number' && !Number.isNaN(trialEndsTimestamp);
  const isTrialing = subscriptionStatus === 'trialing';
  const isTrialExpired =
    subscriptionStatus === 'trial_expired' ||
    (hasValidTrialEnd ? trialEndsTimestamp! <= Date.now() : false);
  const isStarterTier = tierKey === 'starter';
  const isPaidPlan = !isStarterTier;
  const isActive = subscriptionStatus === 'active';
  const isPastDue = subscriptionStatus === 'past_due';
  const isSuspended = subscriptionStatus === 'suspended';
  const isCancelled = subscriptionStatus === 'cancelled';
  const formsLimit = typeof activePlan?.max_forms === 'number' ? activePlan.max_forms : null;
  const submissionsLimit =
    usageSnapshot?.submissions_limit ?? activePlan?.monthly_submissions ?? null;
  const submissionsUsed =
    typeof usageSnapshot?.submissions_used === 'number'
      ? usageSnapshot.submissions_used
      : usageSnapshot
      ? 0
      : null;
  const submissionsPercent =
    submissionsLimit && typeof submissionsUsed === 'number'
      ? Math.min(100, Math.round((submissionsUsed / submissionsLimit) * 100))
      : null;
  const prioritizedOrder = tierOrder.filter((tier) => plans[tier]);
  const extraTiers = Object.keys(plans).filter(
    (key) => !prioritizedOrder.includes(key as SubscriptionTier)
  );
  const planOrder = [...prioritizedOrder, ...extraTiers];
  const planList = planOrder.map((tier) => plans[tier]).filter(Boolean) as PricingPlan[];

  const hasFeature = useCallback(
    (feature: string) => {
      if (!feature) return false;
      const features = activePlan?.features || [];
      return features.includes(feature);
    },
    [activePlan]
  );

  const formsLimitReached = useCallback(
    (count: number) => {
      if (formsLimit === null) return false;
      return count >= formsLimit;
    },
    [formsLimit]
  );

  const formatPrice = useCallback(
    (priceCents?: number | null) => {
      if (priceCents === null || priceCents === undefined) return 'Contact sales';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return formatter.format(priceCents / 100);
    },
    [currency]
  );

  const value = useMemo<SubscriptionContextValue>(() => ({
    loading,
    plansLoading,
    error,
    currency,
    plans,
    planOrder,
    planList,
    current,
    usage: usageSnapshot,
    recommendation,
    activeTier: tierKey,
    activePlan,
    planLabel,
    formsLimit,
    submissionsLimit,
    submissionsUsed,
    submissionsPercent,
    subscriptionStatus,
    trialEndsAt,
    trialDaysRemaining,
    isTrialing,
    isTrialExpired,
    isStarterTier,
    isPaidPlan,
    isActive,
    isPastDue,
    isSuspended,
    isCancelled,
    hasFeature,
    formsLimitReached,
    refresh,
    formatPrice
  }), [
    activePlan,
    currency,
    error,
    formsLimit,
    formsLimitReached,
    hasFeature,
    loading,
    planLabel,
    planList,
    planOrder,
    plans,
    plansLoading,
    recommendation,
    refresh,
    subscriptionStatus,
    submissionsLimit,
    submissionsPercent,
    submissionsUsed,
    trialEndsAt,
    trialDaysRemaining,
    isTrialExpired,
    isTrialing,
    isStarterTier,
    isPaidPlan,
    isActive,
    isPastDue,
    isSuspended,
    isCancelled,
    tierKey,
    usageSnapshot
  ]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
};
