"use client";

import Link from 'next/link';
import SEO from '@/components/SEO';
import { useSubscription } from '@/context/SubscriptionContext';

const formatNumber = (value?: number | null) => {
  if (typeof value !== 'number') return '0';
  return value.toLocaleString();
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString();
};

export default function SubscriptionsPage() {
  const { planLabel, submissionsLimit, submissionsUsed, submissionsPercent, subscriptionStatus, trialEndsAt } = useSubscription();
  const usagePercent = typeof submissionsPercent === 'number' ? Math.min(submissionsPercent, 100) : 0;
  const remaining =
    typeof submissionsLimit === 'number' && typeof submissionsUsed === 'number'
      ? Math.max(submissionsLimit - submissionsUsed, 0)
      : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
      <SEO
        title="Usage — FormHook"
        description="Review your free plan usage and current limits."
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/og-image-2.svg`}
        url={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/subscriptions`}
      />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Free plan</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Usage and limits</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                FormHook is free for everyone. This page shows your current usage, remaining quota, and when limits reset.
              </p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400">
              Back to dashboard
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Plan</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{planLabel || 'Free'}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subscriptionStatus || 'active'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Submissions used</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(submissionsUsed)}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">of {formatNumber(submissionsLimit)} this month</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Remaining</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{remaining === null ? '—' : formatNumber(remaining)}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Resets on {formatDate(trialEndsAt)}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span>Usage progress</span>
              <span>{usagePercent}%</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              You have used {formatNumber(submissionsUsed)} of {formatNumber(submissionsLimit)} submissions this month.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100">
            If you hit the limit, submissions pause until the next reset.
          </div>
        </div>
      </main>
    </div>
  );
}
