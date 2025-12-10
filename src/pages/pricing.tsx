"use client";

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Check, Shield, Sparkles, Target } from 'lucide-react';
import SEO from '@/components/SEO';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  BillingCycle,
  PRICING_PLAN_FALLBACK,
  PricingPlan as BillingPlan,
  SubscriptionTier
} from '@/types/subscription';

type IconType = (props: { className?: string }) => JSX.Element;

interface PlanCardProps {
  plan: BillingPlan;
  billingCycle: BillingCycle;
  currency: string;
  highlighted: boolean;
}
const ICON_BY_TIER: Record<string, IconType> = {
  starter: Target,
  professional: Sparkles,
  business: Briefcase,
  enterprise: Shield,
  default: Shield
};

const COMING_SOON_TIERS = new Set(['professional', 'business', 'enterprise']);

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

const humanize = (value?: string | null) => {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeTier = (tier?: SubscriptionTier | string) => tier?.toString().toLowerCase() ?? 'starter';

const formatFeatureLabel = (value?: string | null) => {
  if (!value) return '';
  return humanize(value);
};

const buildPlanStats = (plan: BillingPlan) => {
  const stats: Array<{ label: string; value: string }> = [];
  if (typeof plan.monthly_submissions === 'number') {
    stats.push({ label: 'Monthly submissions', value: plan.monthly_submissions.toLocaleString() });
  }
  if (typeof plan.max_forms === 'number') {
    stats.push({ label: 'Active forms', value: plan.max_forms.toLocaleString() });
  }
  if (plan.max_forms === null) {
    stats.push({ label: 'Active forms', value: 'Unlimited' });
  }
  if (typeof plan.max_team_members === 'number') {
    stats.push({ label: 'Team seats', value: plan.max_team_members.toString() });
  }
  if (typeof plan.file_upload_size_mb === 'number') {
    stats.push({ label: 'File uploads', value: `${plan.file_upload_size_mb}MB` });
  }
  if (plan.support_level) {
    stats.push({ label: 'Support', value: humanize(plan.support_level) });
  }
  if (typeof plan.sla_uptime === 'number') {
    stats.push({ label: 'SLA uptime', value: `${(plan.sla_uptime * 100).toFixed(2)}%` });
  }
  if (typeof plan.remove_branding === 'boolean') {
    stats.push({ label: 'Remove branding', value: plan.remove_branding ? 'Included' : 'Not included' });
  }
  if (typeof plan.white_label === 'boolean') {
    stats.push({ label: 'White-label', value: plan.white_label ? 'Included' : 'Not included' });
  }
  return stats;
};

const AnimatedNumber = ({
  value,
  format,
  className
}: {
  value: number;
  format: { style: 'currency'; currency: string; maximumFractionDigits?: number };
  className?: string;
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 500;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = (timestamp - startTimeRef.current) / duration;
      const easedProgress = Math.min(1, progress);
      const newValue = easedProgress * value;
      setCurrentValue(newValue);
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(value);
        startTimeRef.current = null;
      }
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [value]);

  const formatter = new Intl.NumberFormat('en-US', {
    style: format.style,
    currency: format.currency,
    maximumFractionDigits: format.maximumFractionDigits ?? 0
  });

  return <span className={className}>{formatter.format(currentValue)}</span>;
};

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle, currency, highlighted }) => {
  const tierKey = normalizeTier(plan.tier);
  const Icon = ICON_BY_TIER[tierKey] ?? ICON_BY_TIER.default;
  const comingSoon = COMING_SOON_TIERS.has(tierKey);
  const priceCents = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const hasPrice = typeof priceCents === 'number' && priceCents >= 0;
  const stats = buildPlanStats(plan);
  const features = (plan.features || [])
    .map((feature) => formatFeatureLabel(feature))
    .filter(Boolean)
    .slice(0, 8);
  const ctaHref = comingSoon
    ? `/contact?intent=waitlist&plan=${tierKey}`
    : `/subscriptions?plan=${tierKey}`;
  const ctaLabel = comingSoon ? 'Join waitlist' : 'Start 3-day trial';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="flex"
    >
      <div
        className={cn(
          'flex h-full w-full flex-col rounded-3xl border bg-white/80 p-8 text-left shadow-sm ring-offset-2 transition-all dark:bg-slate-900/80',
          highlighted
            ? 'border-blue-500 shadow-blue-500/20 dark:border-blue-400'
            : 'border-slate-200 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-500/40'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl text-lg',
              highlighted ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            )}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{plan.name}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{humanize(tierKey)} tier</p>
            </div>
          </div>
          {comingSoon && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              Coming soon
            </span>
          )}
        </div>

        <div className="mt-8 space-y-1">
          {hasPrice ? (
            <>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber
                  value={(priceCents || 0) / 100}
                  format={{ style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }}
                  className="text-4xl font-bold text-slate-900 dark:text-white"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>
            </>
          ) : (
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">Custom pricing</p>
          )}
          {!comingSoon && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">3-day full-featured trial included</p>
          )}
        </div>

        {stats.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-600 dark:text-slate-300">
            {stats.map((stat) => (
              <div key={`${plan.tier}-${stat.label}`} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{stat.label}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        {features.length > 0 && (
          <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={ctaHref}
          className={cn(
            'group mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-colors',
            highlighted
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'border border-slate-300 text-slate-900 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-white dark:hover:border-blue-400',
            comingSoon && 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
          )}
        >
          {ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const { planList, planOrder, plansLoading, currency } = useSubscription();

  const orderedPlans = useMemo(() => {
    const source = planList?.length ? planList : Object.values(PRICING_PLAN_FALLBACK.plans);
    const order = planOrder?.length ? planOrder : Object.keys(PRICING_PLAN_FALLBACK.plans);
    const indexMap = new Map(order.map((tier, idx) => [tier, idx]));
    return [...source].sort((a, b) => {
      const aIdx = indexMap.get(normalizeTier(a.tier)) ?? 99;
      const bIdx = indexMap.get(normalizeTier(b.tier)) ?? 99;
      return aIdx - bIdx;
    });
  }, [planList, planOrder]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-24 dark:bg-slate-950">
      <SEO
        title="Pricing — FormHook"
        description="No forever-free plan. Every FormHook workspace starts with a 3-day trial, then moves into the paid tier that fits your volume."
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/og-image-2.svg`}
        url={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/pricing`}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-80px] h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute right-[-120px] top-1/3 h-60 w-60 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-16 text-center sm:px-8">
        <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
          No free tier · 3-day trial
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl"
        >
          Plans built for production workloads
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg"
        >
          Every new workspace starts with a fully featured Starter trial. Pick the tier that matches your submission volume before day 3 to keep webhooks, analytics, and API access active.
        </motion.p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
          >
            Start building now
          </Link>
          <Link
            href="/subscriptions"
            className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400"
          >
            Manage an existing plan
          </Link>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Usage resets monthly · Cancel or upgrade anytime
        </p>
      </section>

      <section className="relative mx-auto mt-16 max-w-6xl px-4">
        <div className="mx-auto flex w-full max-w-md items-center justify-center rounded-full border border-slate-200 bg-white/70 p-1 text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            className={cn(
              'flex-1 rounded-full px-3 py-2 transition',
              billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly billing
          </button>
          <button
            className={cn(
              'flex-1 rounded-full px-3 py-2 transition',
              billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
            onClick={() => setBillingCycle('yearly')}
          >
            Annual billing <span className="ml-1 text-[11px] font-semibold text-emerald-600">save more</span>
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plansLoading && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
              Syncing the latest billing data...
            </div>
          )}
          {orderedPlans.map((plan) => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              billingCycle={billingCycle}
              currency={currency || 'USD'}
              highlighted={normalizeTier(plan.tier) === 'professional'}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          All paid plans include analytics, spam protection, webhook signing, and SOC 2-ready data handling. Need something special? <Link href="/contact?intent=enterprise" className="font-semibold text-blue-600 hover:underline dark:text-blue-300">Talk to us.</Link>
        </p>
      </section>

      <section className="relative mx-auto mt-20 max-w-5xl rounded-3xl border border-slate-200 bg-white/80 p-10 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">What you get with every plan</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Consistent API responses, built-in rate limiting, and form-level RBAC are standard. You only choose how much throughput and support you need.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Instant webhook retries
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
              <Shield className="h-4 w-4 text-indigo-500" />
              Signed submissions
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
              <Briefcase className="h-4 w-4 text-emerald-500" />
              Audit-ready logs
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="font-semibold text-slate-900 dark:text-white">Trial guardrails</p>
            <p className="mt-1 text-sm">We pause submissions only after the 3-day trial or when invoices fail. You get reminders, never surprise shutoffs.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="font-semibold text-slate-900 dark:text-white">Usage transparency</p>
            <p className="mt-1 text-sm">Track submissions, forms, and retries in real time from the dashboard or API—no hidden overages.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
