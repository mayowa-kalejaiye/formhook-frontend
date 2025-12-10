import type { SubscriptionDetails, SubscriptionUsage } from '@/types/subscription';

type SubscriptionPayload =
  | SubscriptionDetails
  | SubscriptionUsage
  | (SubscriptionDetails & { usage_info?: SubscriptionUsage | null })
  | null
  | undefined;

const metricKeys = [
  'submissions_used',
  'submissions_limit',
  'submissions_remaining',
  'usage_percentage',
  'forms_count',
  'forms_limit',
  'days_remaining',
  'trial_days_remaining',
  'next_reset_date',
  'current_period_start'
] as const;

const aliasMap: Record<string, string> = {
  submissionsUsed: 'submissions_used',
  submissionsLimit: 'submissions_limit',
  submissionsRemaining: 'submissions_remaining',
  usagePercentage: 'usage_percentage',
  formsCount: 'forms_count',
  formsLimit: 'forms_limit',
  daysRemaining: 'days_remaining',
  trialEndsAt: 'trial_ends_at',
  trialDaysRemaining: 'trial_days_remaining',
  nextResetDate: 'next_reset_date',
  currentPeriodStart: 'current_period_start',
  currentTier: 'current_tier',
  planName: 'plan_name',
  planPrice: 'plan_price',
  billingCycle: 'billing_cycle',
  subscriptionStatus: 'subscription_status'
};

const applyAliases = (source: Record<string, any>) => {
  Object.entries(aliasMap).forEach(([alias, canonical]) => {
    if (typeof source[alias] !== 'undefined' && typeof source[canonical] === 'undefined') {
      source[canonical] = source[alias];
    }
  });
  return source;
};

const normalizeTier = (tier?: string | null) => {
  if (!tier) return undefined;
  return tier.toLowerCase();
};

export const normalizeSubscriptionInfo = (payload?: SubscriptionPayload) => {
  if (!payload || typeof payload !== 'object') return null;

  const base: Record<string, any> = applyAliases({ ...payload });
  const usageRaw =
    'usage_info' in base && base.usage_info && typeof base.usage_info === 'object'
      ? base.usage_info
      : null;
  const usage = usageRaw ? applyAliases({ ...(usageRaw as Record<string, any>) }) : null;

  const resolveStatus = () => {
    const statusCandidates = [
      base.subscription_status,
      usage?.subscription_status,
      base.status
    ];
    const first = statusCandidates.find((value) => typeof value === 'string' && value);
    return typeof first === 'string' ? first.toLowerCase() : null;
  };

  const resolveTrialEnds = () =>
    base.trial_ends_at || usage?.trial_ends_at || base.trialEndsAt || usage?.trialEndsAt || null;

  const resolveTrialDays = () => {
    if (typeof base.trial_days_remaining === 'number') return base.trial_days_remaining;
    if (typeof usage?.trial_days_remaining === 'number') return usage.trial_days_remaining;
    if (typeof base.trialDaysRemaining === 'number') return base.trialDaysRemaining;
    if (typeof usage?.trialDaysRemaining === 'number') return usage.trialDaysRemaining;
    return null;
  };

  const hasFlatMetrics = metricKeys.some(
    (key) => typeof base[key] !== 'undefined' && base[key] !== null
  );

  if (!usage && hasFlatMetrics) {
    return {
      ...base,
      current_tier: normalizeTier((base as any).tier || base.current_tier) || base.current_tier,
      plan_name: base.plan_name || base.name || null,
      subscription_status: resolveStatus(),
      trial_ends_at: resolveTrialEnds(),
      trial_days_remaining: resolveTrialDays(),
      submissions_limit:
        typeof base.submissions_limit === 'number'
          ? base.submissions_limit
          : typeof base.monthly_submissions === 'number'
          ? base.monthly_submissions
          : null,
      forms_limit:
        typeof base.forms_limit === 'number'
          ? base.forms_limit
          : typeof base.max_forms === 'number'
          ? base.max_forms
          : null
    } as SubscriptionUsage & Partial<SubscriptionDetails>;
  }

  if (!usage) {
    return {
      ...base,
      current_tier: normalizeTier((base as any).tier || base.current_tier) || base.current_tier,
      plan_name: base.plan_name || base.name || null,
      subscription_status: resolveStatus(),
      trial_ends_at: resolveTrialEnds(),
      trial_days_remaining: resolveTrialDays(),
      submissions_limit:
        typeof base.submissions_limit === 'number'
          ? base.submissions_limit
          : typeof base.monthly_submissions === 'number'
          ? base.monthly_submissions
          : null,
      forms_limit:
        typeof base.forms_limit === 'number'
          ? base.forms_limit
          : typeof base.max_forms === 'number'
          ? base.max_forms
          : null
    } as SubscriptionUsage & Partial<SubscriptionDetails>;
  }

  const merged = {
    ...base,
    ...usage,
    usage_info: usage,
    current_tier:
      normalizeTier((base as any).tier || base.current_tier || usage.current_tier) || usage.current_tier,
    plan_name: base.plan_name || usage.plan_name || base.name || null,
    subscription_status: resolveStatus(),
    trial_ends_at: resolveTrialEnds(),
    trial_days_remaining: resolveTrialDays(),
    submissions_limit:
      typeof usage.submissions_limit === 'number'
        ? usage.submissions_limit
        : typeof base.submissions_limit === 'number'
        ? base.submissions_limit
        : typeof base.monthly_submissions === 'number'
        ? base.monthly_submissions
        : null,
    forms_limit:
      typeof usage.forms_limit === 'number'
        ? usage.forms_limit
        : typeof base.forms_limit === 'number'
        ? base.forms_limit
        : typeof base.max_forms === 'number'
        ? base.max_forms
        : null
  } as SubscriptionUsage & SubscriptionDetails;

  if (
    typeof merged.submissions_limit === 'number' &&
    typeof merged.submissions_used === 'number' &&
    typeof merged.submissions_remaining !== 'number'
  ) {
    merged.submissions_remaining = Math.max(merged.submissions_limit - merged.submissions_used, 0);
  }

  return merged;
};
