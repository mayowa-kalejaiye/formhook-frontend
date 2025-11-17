"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import { useToast } from "../hooks/use-toast";
import { Toaster } from "../components/ui/toaster";

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export default function Login() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; password: string }>();
  const { login, loading, error, user, getCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loginAttempted, setLoginAttempted] = useState(false);
  const redirectedRef = React.useRef(false);
  const isDev = process.env.NODE_ENV !== 'production';
  const debug = {
    log: (...args: any[]) => { if (isDev) console.log(...args); },
    warn: (...args: any[]) => { if (isDev) console.warn(...args); },
    error: (...args: any[]) => { if (isDev) console.error(...args); }
  };

  const REDIRECT_FLAG = 'formhook_redirected_to_dashboard_at';
  const REDIRECT_TTL = 10000;
  const shouldPerformRedirect = () => {
    try {
      // Check an in-memory flag first (survives module reloads in many dev setups)
      if (typeof window !== 'undefined' && (window as any).__formhook_redirected) {
        const ts = Number((window as any).__formhook_redirected);
        if (!isNaN(ts) && Date.now() - ts <= REDIRECT_TTL) return false;
      }

      if (typeof window === 'undefined') return true;
      const val = localStorage.getItem(REDIRECT_FLAG);
      if (!val) return true;
      const t = Number(val);
      if (isNaN(t)) return true;
      // If last redirect was more than REDIRECT_TTL ago, allow another
      return Date.now() - t > REDIRECT_TTL;
    } catch (e) {
      return true;
    }
  };
  const markRedirectPerformed = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(REDIRECT_FLAG, String(Date.now()));
        try { (window as any).__formhook_redirected = Date.now(); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  };

  // Clear any cached data when login page loads to prevent data leakage
  useEffect(() => {
    debug.log('[Login] Clearing cached data on login page load');
    
    // Clear SWR cache
    if (typeof window !== 'undefined') {
      // Clear all SWR cache keys that might contain user-specific data
      const swr = require('swr');
      if (swr && swr.cache) {
        debug.log('[Login] Clearing SWR cache');
        try { swr.cache.clear(); } catch (e) { debug.warn('[Login] SWR cache.clear failed', e); }
      }
    }
    
    // Clear any form-related data from sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('form') || key.includes('submission'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        debug.log('[Login] Clearing sessionStorage:', key);
        try { sessionStorage.removeItem(key); } catch (e) { debug.warn('[Login] sessionStorage.removeItem failed', e); }
      });
    }
  }, []);

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      debug.log('[Login] Attempting login with:', data.email);
      
      // Clear any existing cached data before login
      if (typeof window !== 'undefined') {
        debug.log('[Login] Clearing cache before new login');
        try { localStorage.removeItem('token'); } catch (e) { debug.warn('[Login] localStorage.removeItem failed', e); }
      }
      
      setLoginAttempted(false);
      await login(data);
      setLoginAttempted(true);
      
      // Show success message
      toast({
        title: "Login successful",
        description: "Welcome back! Redirecting to dashboard...",
      });
    } catch (err) {
      debug.error('[Login] Error during login:', err);
      setLoginAttempted(true);
      
      // Show error toast
      const errorMessage = error || 'Login failed. Please try again.';
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Robust redirect to dashboard if user is logged in — ensure this only runs once per session/HMR.
    if (user && !loading && typeof window !== 'undefined') {
      // Avoid repeated redirects across hot reloads by persisting a short-lived flag in localStorage.
      if (!redirectedRef.current && shouldPerformRedirect()) {
        redirectedRef.current = true;
        markRedirectPerformed();
        debug.log('[Login] User detected, redirecting to dashboard');
        // Prefer SPA navigation and avoid full-page reloads; log any router errors in dev.
        router.replace('/dashboard').catch((err: any) => {
          debug.warn('[Login] router.replace failed', err);
        });
      } else {
        debug.log('[Login] Redirect suppressed by guard');
      }
      return;
    }

    // Show verification toast if redirected from verification page
    if (router.query.verify === 'true') {
      toast({ 
        title: 'Email verification required', 
        description: 'Please check your email to verify your account before signing in.', 
        variant: 'default' 
      });
    }
  // Intentionally exclude `getCurrentUser` here to avoid repeatedly refreshing auth state from the effect.
  }, [user, loading, router, toast]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left marketing/design panel */}
      <div className="hidden md:flex flex-col justify-center items-start p-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-md">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-md bg-white/20 flex items-center justify-center border border-white/30">
              <UserIcon />
            </div>
            <h2 className="text-2xl font-semibold">FormHook</h2>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">Build beautiful, reliable forms — fast</h1>
          <p className="text-sm md:text-base text-white/90 mb-6">FormHook helps you collect responses, run webhooks and analyze results without the pain. Lightweight, privacy-first, and easy to integrate.</p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">✓</span>
              <span className="text-sm">Fast setup — publish forms in minutes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">✓</span>
              <span className="text-sm">Reliable webhooks & delivery analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">✓</span>
              <span className="text-sm">Privacy-first: you own the data</span>
            </li>
          </ul>

          <div className="flex gap-3">
            <a href="/signup" className="inline-block rounded-md bg-white text-indigo-700 px-4 py-2 font-semibold">Get started</a>
            <a href="/pricing" className="inline-block rounded-md border border-white/30 px-4 py-2 text-white/90">See pricing</a>
          </div>
        </div>
      </div>

      {/* Right login panel */}
          <div className="flex items-center justify-center p-6 bg-white dark:bg-black">
            <div className="w-full max-w-md relative z-10">
          {mounted && <Toaster />}
              <div className="p-6 space-y-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-900/50">
            <div className="text-center space-y-3">
              <div className="inline-flex p-2 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
                <UserIcon />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Welcome back</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Enter your credentials to sign in</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {router.query.verify === 'true' && (
                <div className="text-blue-600 text-center font-medium bg-blue-50 rounded p-2 border border-blue-100 mb-2">
                  Please check your email to verify your account before signing in.
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-50">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  {...register("email", { required: "Email is required" })}
                  placeholder="name@example.com"
                  className="flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm shadow-sm transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message as string}</span>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-50">
                    Password
                  </label>
                  <a 
                    href="/forgot-password" 
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    {...register("password", { required: "Password is required" })}
                    placeholder="Enter your password"
                    className="flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 pr-10 text-sm shadow-sm transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-red-500">{errors.password.message as string}</span>}
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 h-9 px-4 py-2 w-full"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Sign In"}
              </button>
              {error && <div className="text-red-600 text-center font-medium bg-red-50 rounded p-2 border border-red-100 mt-2">{error}</div>}
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Don&apos;t have an account?{' '}
                <a href="/signup" className="font-medium text-zinc-900 dark:text-zinc-50 underline underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                  Sign up
                </a>
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Need to verify your email?{' '}
                <a href="/resend-verification" className="font-medium text-zinc-900 dark:text-zinc-50 underline underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                  Resend verification
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
