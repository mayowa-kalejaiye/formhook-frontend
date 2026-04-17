"use client";

import Link from 'next/link';
import SEO from '@/components/SEO';

const limits = [
  '1000 submissions per month',
  '25 active forms',
  'Basic analytics',
  'Email notifications',
  'API access',
  'Basic integrations'
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-24 dark:bg-slate-950">
      <SEO
        title="Free Plan — FormHook"
        description="FormHook is free for everyone with clear monthly limits and no billing complexity."
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhookapp.vercel.app').replace(/\/$/, '')}/og-image-2.svg`}
        url={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhookapp.vercel.app').replace(/\/$/, '')}/pricing`}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-80px] h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute right-[-120px] top-1/3 h-60 w-60 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-16 text-center sm:px-8">
        <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
          Free for all users
        </span>
        <h1 className="mt-6 text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">
          Simple pricing, no billing maze
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
          Every account uses the same free plan. You get enough room for a real project, with one clear limit set instead of a plan ladder.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
          >
            Start free
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400"
          >
            Read docs
          </Link>
        </div>
      </section>

      <section className="relative mx-auto mt-16 max-w-4xl px-4 sm:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Free plan</p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">$0</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">forever</span>
              </div>
              <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                No card, no upgrade pressure, no support tiers. Just a free product with predictable limits.
              </p>
            </div>

            <ul className="grid gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2 lg:max-w-xl">
              {limits.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
