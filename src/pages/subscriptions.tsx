"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import DashboardNav from '@/components/DashboardNav';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';
import { useSubscription } from '@/context/SubscriptionContext';
import { useForms } from '@/context/FormsContext';
import { useForm } from 'react-hook-form';
import type { BillingCycle, SubscriptionTier } from '@/types/subscription';
import {
  downgradeSubscription,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionUsage,
  getDashboardSummary
} from '@/services/api';
import { toast, showApiError } from '@/hooks/use-toast';
import { cn, describeTimeUntil, formatDateShort } from '@/lib/utils';
import { normalizeSubscriptionInfo } from '@/lib/subscription';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Crown,
  Loader2,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';

type PlanFormValues = {
  targetTier: string;
  billingCycle: BillingCycle;
};

const PROVISIONABLE_TIERS: Array<SubscriptionTier | string> = ['free', 'starter'];

const canProvisionTier = (tier?: string | null) => {
  if (!tier) return false;
  return PROVISIONABLE_TIERS.includes(tier.toLowerCase());
};

const humanizeFeature = (feature: string) =>
  feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatNumber = (value?: number | null, fallback = '—') =>
  typeof value === 'number' ? value.toLocaleString() : fallback;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

export default function SubscriptionsPage() {
  const {
    loading,
    plansLoading,
    error,
    plans,
    planList,
    planOrder,
    current,
    usage,
    recommendation,
    activePlan,
    activeTier,
    planLabel,
    formsLimit,
    submissionsLimit,
    submissionsUsed,
    submissionsPercent,
    isFreeTier,
    subscriptionStatus,
    trialEndsAt,
    trialDaysRemaining,
    isTrialing,
    isTrialExpired,
    refresh,
    formatPrice
  } = useSubscription();
  const { forms, isLoading: formsLoading } = useForms();
  const [usageOverride, setUsageOverride] = useState(usage || null);
  const [usageEstimate, setUsageEstimate] = useState<any>(null);
  const [usageEstimateLoading, setUsageEstimateLoading] = useState(false);
  const trialCountdownLabel = describeTimeUntil(trialEndsAt);
  const trialEndDate = formatDateShort(trialEndsAt);
  const showTrialAlert = isTrialing || isTrialExpired;
  const subscriptionStatusLabel = subscriptionStatus
    ? subscriptionStatus.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : null;

  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const defaultCycle: BillingCycle = current?.billing_cycle || 'monthly';

  const { register, handleSubmit, watch, reset, setValue } = useForm<PlanFormValues>({
    defaultValues: {
      targetTier: activeTier,
      billingCycle: defaultCycle
    }
  });

  useEffect(() => {
    reset({
      targetTier: activeTier,
      billingCycle: current?.billing_cycle || 'monthly'
    });
  }, [activeTier, current?.billing_cycle, reset]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    setUsageOverride(usage || null);
  }, [usage]);

  useEffect(() => {
    if (usage && typeof (usage as any)?.submissions_used === 'number') {
      setUsageEstimate(null);
    }
  }, [usage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const latest = await getSubscriptionUsage({ days: 30 }).catch(() => null);
      if (!cancelled && latest) {
        setUsageOverride(normalizeSubscriptionInfo(latest));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (usage || usageOverride || current?.usage_info || usageEstimate || usageEstimateLoading) return;
    let cancelled = false;
    setUsageEstimateLoading(true);
    (async () => {
      try {
        const summary = await getDashboardSummary(30);
        if (cancelled) return;
        const fallbackLimit =
          typeof submissionsLimit === 'number'
            ? submissionsLimit
            : typeof activePlan?.monthly_submissions === 'number'
            ? activePlan.monthly_submissions
            : null;
        const used = summary?.total_submissions ?? 0;
        const formsTotal =
          typeof summary?.total_forms === 'number'
            ? summary.total_forms
            : Array.isArray(forms)
            ? forms.length
            : 0;
        const fallback = normalizeSubscriptionInfo({
          current_tier: activeTier,
          billing_cycle: current?.billing_cycle || 'monthly',
          current_period_start: current?.current_period_start || new Date().toISOString(),
          next_reset_date: current?.next_billing_date || null,
          days_remaining: null,
          submissions_used: used,
          submissions_limit: fallbackLimit,
          submissions_remaining:
            typeof fallbackLimit === 'number' ? Math.max(fallbackLimit - used, 0) : null,
          usage_percentage:
            typeof fallbackLimit === 'number' && fallbackLimit > 0
              ? Math.min(100, Math.round((used / fallbackLimit) * 100))
              : 0,
          is_over_limit:
            typeof fallbackLimit === 'number' && fallbackLimit >= 0 ? used > fallbackLimit : false,
          forms_count: formsTotal,
          forms_limit: formsLimit,
          plan_name: planLabel,
          plan_price:
            typeof activePlan?.price_monthly === 'number'
              ? formatPrice(activePlan.price_monthly)
              : undefined,
          upgrade_available: false
        });
        setUsageEstimate(fallback);
      } catch (err) {
        console.warn('[Subscriptions] Failed to build usage estimate', err);
      } finally {
        if (!cancelled) setUsageEstimateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    usage,
    usageOverride,
    current?.usage_info,
    usageEstimate,
    usageEstimateLoading,
    submissionsLimit,
    activePlan,
    forms,
    formsLimit,
    planLabel,
    activeTier,
    current?.billing_cycle,
    current?.current_period_start,
    current?.next_billing_date,
    formatPrice
  ]);

  const selectedTier = watch('targetTier');

  const targetTierLabel = (tier: string) => plans[tier]?.name || humanizeFeature(tier);

  const handlePlanSubmit = async (values: PlanFormValues) => {
    const normalizedTarget = (values.targetTier || '').toLowerCase();
    if (!normalizedTarget) {
      toast({ title: 'Select a plan first', variant: 'destructive' });
      return;
    }
    if (!canProvisionTier(normalizedTarget) && normalizedTarget !== activeTier) {
      toast({
        title: 'Plan unavailable right now',
        description: 'This tier is paused while we are on free Render/Supabase resources.',
        variant: 'destructive'
      });
      return;
    }
    if (normalizedTarget === activeTier) {
      toast({ title: 'Already on this plan', description: 'Pick a different plan to switch.' });
      return;
    }

    const currentIndex = planOrder.findIndex((tier) => tier === activeTier);
    const targetIndex = planOrder.findIndex((tier) => tier === normalizedTarget);

    if (targetIndex === -1) {
      toast({ title: 'Unknown plan selected', variant: 'destructive' });
      return;
    }

    const isUpgrade = currentIndex === -1 || targetIndex > currentIndex;

    setPlanSubmitting(true);
    try {
      if (isUpgrade) {
        await upgradeSubscription({
          target_tier: normalizedTarget,
          billing_cycle: values.billingCycle
        });
        toast({
          title: 'Upgrade requested',
          description: `We are upgrading you to ${targetTierLabel(normalizedTarget)}.`
        });
      } else {
        await downgradeSubscription({
          target_tier: normalizedTarget,
          billing_cycle: values.billingCycle
        });
        toast({
          title: 'Downgrade scheduled',
          description: `You will move to ${targetTierLabel(normalizedTarget)} at the next cycle.`
        });
      }
      await refresh();
    } catch (e) {
      showApiError(e);
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (isFreeTier) {
      toast({
        title: 'Cannot cancel the default plan',
        description: 'Developer Starter is the baseline tier for all accounts.'
      });
      return;
    }
    if (!window.confirm('Cancel current subscription? You will retain access until the cycle ends.')) return;
    setStatusSubmitting(true);
    try {
      await cancelSubscription();
      toast({ title: 'Subscription cancelled', description: 'You will downgrade at the end of this cycle.' });
      await refresh();
    } catch (e) {
      showApiError(e);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    setStatusSubmitting(true);
    try {
      await reactivateSubscription();
      toast({ title: 'Subscription reactivated' });
      await refresh();
    } catch (e) {
      showApiError(e);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const applyRecommendation = () => {
    if (!recommendation?.recommended_tier) return;
    if (!canProvisionTier(recommendation.recommended_tier)) {
      toast({
        title: 'Not available on current infrastructure',
        description: 'We will unlock this recommendation once our backend resources scale up.'
      });
      return;
    }
    setValue('targetTier', recommendation.recommended_tier.toLowerCase());
  };

  const resolvedUsage =
    normalizeSubscriptionInfo(usageOverride) ||
    normalizeSubscriptionInfo(usage) ||
    normalizeSubscriptionInfo(current?.usage_info) ||
    usageEstimate ||
    null;

  const hasUsageMetrics = typeof resolvedUsage?.submissions_used === 'number';
  const effectiveSubmissionsUsed =
    typeof submissionsUsed === 'number'
      ? submissionsUsed
      : hasUsageMetrics
      ? (resolvedUsage?.submissions_used as number)
      : null;
  const usageFormsLimit =
    typeof resolvedUsage?.forms_limit === 'number' ? resolvedUsage.forms_limit : formsLimit;
  const usageFormsCount = typeof resolvedUsage?.forms_count === 'number' ? resolvedUsage.forms_count : null;
  const fallbackFormsCount = !formsLoading && Array.isArray(forms) ? forms.length : null;
  const formsCount = typeof usageFormsCount === 'number' ? usageFormsCount : fallbackFormsCount;
  const formsRemaining =
    typeof usageFormsLimit === 'number' && typeof formsCount === 'number'
      ? Math.max(usageFormsLimit - formsCount, 0)
      : null;
  const submissionsRemaining =
    typeof submissionsLimit === 'number' && typeof effectiveSubmissionsUsed === 'number'
      ? Math.max(submissionsLimit - effectiveSubmissionsUsed, 0)
      : null;

  return (
    <AuthLayout>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen md:ml-56">
        <SEO
          title="Subscriptions & Billing — FormHook"
          description="Manage your FormHook subscription, understand usage, and upgrade when you are ready."
        />
        <DashboardNav />
        <main className="w-full px-4 sm:px-6 lg:px-8 pt-16 md:pt-8 pb-16">
          <Toaster />
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500">Billing</p>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Subscriptions</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Review your current plan, monitor usage, and switch tiers without contacting support.
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <Badge className="self-start md:self-end bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-200">
                    {planLabel}
                  </Badge>
                  {subscriptionStatusLabel && (
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {subscriptionStatusLabel}
                    </span>
                  )}
                </div>
              </div>
              {showTrialAlert && (
                <Alert className={cn(
                  'border',
                  isTrialExpired
                    ? 'border-rose-200 bg-rose-50 dark:bg-rose-900/20'
                    : 'border-amber-200 bg-amber-50 dark:bg-amber-900/20'
                )}>
                  <CalendarClock className={cn(
                    'h-4 w-4',
                    isTrialExpired ? 'text-rose-600' : 'text-amber-600'
                  )} />
                  <AlertTitle>
                    {isTrialExpired ? 'Trial expired' : 'Trial ending soon'}
                  </AlertTitle>
                  <AlertDescription className="space-y-1">
                    <p>
                      {isTrialExpired
                        ? `Your trial${trialEndDate ? ` ended on ${trialEndDate}` : ''}. Forms are paused until you upgrade.`
                        : `You have ${
                            trialCountdownLabel || `${trialDaysRemaining ?? 0} days`
                          } remaining${trialEndDate ? ` · Ends ${trialEndDate}` : ''}.`}
                    </p>
                    <Link
                      href="/pricing"
                      className="font-semibold text-current underline underline-offset-2"
                    >
                      Upgrade plan
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
              {(loading || plansLoading) && (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Syncing subscription data…
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to load subscription data</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {isFreeTier && !error && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/30">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>You are on the free Developer Starter plan</AlertTitle>
                  <AlertDescription>
                    Free tier includes {formatNumber(activePlan?.monthly_submissions)} submissions per month and up to {formsLimit || 3} forms. Upgrade when you need higher limits or premium features.
                  </AlertDescription>
                </Alert>
              )}
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Shield className="h-4 w-4" /> Current plan
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{planLabel}</h2>
                  <p className="text-sm text-slate-500">
                    {typeof activePlan?.monthly_submissions === 'number'
                      ? `${formatNumber(activePlan.monthly_submissions)} submissions / mo`
                      : 'Usage-based limits'}
                    {' '}
                    • {typeof activePlan?.max_forms === 'number' ? `${activePlan.max_forms} forms` : 'Unlimited forms'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-xs uppercase text-slate-400 block">Status</span>
                      <span className="font-medium capitalize">{current?.status || 'active'}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-slate-400 block">Billing cycle</span>
                      <span className="font-medium capitalize">{current?.billing_cycle || 'monthly'}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-slate-400 block">Next renewal</span>
                      <span className="font-medium">{formatDate(current?.next_billing_date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="text-sm"
                      disabled={statusSubmitting || current?.status === 'cancelled' || isFreeTier}
                      onClick={handleCancel}
                    >
                      {statusSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel plan'}
                    </Button>
                    {current?.status === 'cancelled' && (
                      <Button
                        variant="default"
                        className="text-sm"
                        onClick={handleReactivate}
                        disabled={statusSubmitting}
                      >
                        {statusSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reactivate'}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(activePlan?.features || []).map((feature) => (
                      <Badge key={feature} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {humanizeFeature(feature)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <TrendingUp className="h-4 w-4" /> Usage
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Submissions this cycle</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {formatNumber(effectiveSubmissionsUsed, '—')} / {formatNumber(submissionsLimit, 'Unlimited')}
                        </p>
                        {typeof submissionsRemaining === 'number' && (
                          <p className="text-xs text-slate-500">
                            {formatNumber(submissionsRemaining)} submissions remaining
                          </p>
                        )}
                        {!hasUsageMetrics && (
                          <p className="text-xs text-amber-600 mt-1">
                            Usage numbers are still syncing from the backend.
                          </p>
                        )}
                      </div>
                      {typeof submissionsPercent === 'number' && (
                        <span className="text-sm text-slate-500">{submissionsPercent}% used</span>
                      )}
                    </div>
                    <div className="h-2 mt-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.min(submissionsPercent ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="border rounded-xl p-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-500">Forms in use</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formsCount !== null ? formatNumber(formsCount) : '—'} / {formatNumber(usageFormsLimit, 'Unlimited')}
                      </p>
                      {typeof formsRemaining === 'number' && (
                        <p className="text-xs text-slate-500">{formatNumber(formsRemaining)} form slots remaining</p>
                      )}
                      {formsCount === null && (
                        <p className="text-xs text-amber-600 mt-1">Forms data is still loading.</p>
                      )}
                    </div>
                    <div className="text-right text-slate-500">
                      <p>Days left</p>
                      <p className="font-semibold">{formatNumber(resolvedUsage?.days_remaining, '—')}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Billing period started {formatDate(resolvedUsage?.current_period_start)} · renews {formatDate(resolvedUsage?.next_reset_date || current?.next_billing_date)}
                  </p>
                </CardContent>
              </Card>
            </section>

            {recommendation && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <Crown className="h-5 w-5 text-blue-500" />
                <div>
                  <AlertTitle>Recommendation: {recommendation.plan_name}</AlertTitle>
                  <AlertDescription className="text-slate-600 dark:text-slate-200">
                    {recommendation.reason} — {recommendation.additional_submissions?.toLocaleString()} extra submissions if you upgrade.
                  </AlertDescription>
                </div>
                <Button
                  variant="ghost"
                  className="ml-auto"
                  onClick={applyRecommendation}
                  disabled={!canProvisionTier(recommendation.recommended_tier)}
                >
                  Apply suggestion
                </Button>
              </Alert>
            )}

            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Choose a different plan</h2>
              </div>
              <form onSubmit={handleSubmit(handlePlanSubmit)} className="space-y-6">
                {planList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Pricing plans are unavailable right now. Please try refreshing the page.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {planList.map((plan) => {
                      const isActive = plan.tier === activeTier;
                      const isSelected = plan.tier === (selectedTier || activeTier);
                      const normalizedTier = typeof plan.tier === 'string' ? plan.tier.toLowerCase() : plan.tier;
                      const isProvisionable = canProvisionTier(normalizedTier);
                      const selectionDisabled = !isProvisionable && !isActive;
                      return (
                        <label
                          key={plan.tier}
                          className={cn(
                            'rounded-2xl border p-5 transition group flex flex-col gap-4',
                            selectionDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                            isActive
                              ? 'border-blue-600 shadow-lg shadow-blue-100 dark:shadow-blue-900/30'
                              : isSelected
                              ? 'border-blue-400'
                              : 'border-slate-200 dark:border-slate-800'
                          )}
                          aria-disabled={selectionDisabled}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">{plan.tier}</p>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                            </div>
                            <span
                              className={cn(
                                'h-4 w-4 rounded-full border-2 transition',
                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                              )}
                            />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                {typeof plan.price_monthly === 'number' ? formatPrice(plan.price_monthly) : 'Custom'}
                              </span>
                              <span className="text-sm text-slate-500">/ mo</span>
                            </div>
                            <p className="text-sm text-slate-500">
                              {typeof plan.monthly_submissions === 'number'
                                ? `${formatNumber(plan.monthly_submissions)} submissions`
                                : 'Custom limits'}
                            </p>
                          </div>
                          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            {(plan.features || []).slice(0, 5).map((feature) => (
                              <li key={feature} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span>{humanizeFeature(feature)}</span>
                              </li>
                            ))}
                            {plan.features && plan.features.length > 5 && (
                              <li className="text-xs text-slate-400">+{plan.features.length - 5} more</li>
                            )}
                          </ul>
                          <input
                            type="radio"
                            value={plan.tier}
                            className="sr-only"
                            disabled={selectionDisabled}
                            {...register('targetTier', { required: true })}
                          />
                          {isActive && (
                            <Badge className="self-start bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                              Current plan
                            </Badge>
                          )}
                          {!isProvisionable && (
                            <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200 rounded-md px-3 py-2">
                              Temporarily unavailable while we are on free infrastructure.
                            </p>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => {
                    const isSelected = watch('billingCycle') === cycle;
                    return (
                      <label
                        key={cycle}
                        className={cn(
                          'rounded-2xl border px-4 py-3 text-center cursor-pointer',
                          isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200'
                        )}
                      >
                        <input
                          type="radio"
                          value={cycle}
                          className="sr-only"
                          {...register('billingCycle')}
                        />
                        <p className="font-semibold capitalize">{cycle}</p>
                        {cycle === 'yearly' && (
                          <p className="text-xs text-emerald-600">Save 2 months</p>
                        )}
                      </label>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full sm:w-auto" disabled={planSubmitting}>
                    {planSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Updating plan…
                      </span>
                    ) : (
                      'Confirm plan change'
                    )}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Upgrades take effect immediately. Downgrades apply at the end of the current billing period unless otherwise stated.
                  </p>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </AuthLayout>
  );
}
