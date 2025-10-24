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
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; password: string }>();
  const { login, loading, error, user, getCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Clear any cached data when login page loads to prevent data leakage
  useEffect(() => {
    console.log('[Login] Clearing cached data on login page load');
    
    // Clear SWR cache
    if (typeof window !== 'undefined') {
      // Clear all SWR cache keys that might contain user-specific data
      const swr = require('swr');
      if (swr && swr.cache) {
        console.log('[Login] Clearing SWR cache');
        swr.cache.clear();
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
        console.log('[Login] Clearing sessionStorage:', key);
        sessionStorage.removeItem(key);
      });
    }
  }, []);

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      console.log('[Login] Attempting login with:', data.email);
      
      // Clear any existing cached data before login
      if (typeof window !== 'undefined') {
        console.log('[Login] Clearing cache before new login');
        localStorage.removeItem('token'); // Remove any old token
      }
      
      setLoginAttempted(false);
      await login(data);
      // Force update user state after login
      await getCurrentUser();
      console.log('[Login] Login completed for user:', data.email);
      setLoginAttempted(true);
      // Show success message
      toast({
        title: "Login successful",
        description: "Welcome back! Redirecting to dashboard...",
      });
    } catch (err) {
      console.error('[Login] Error during login:', err);
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
    // If user is already logged in, redirect to dashboard
    if (user && !loginAttempted) {
      router.push("/dashboard");
      return;
    }

    // Check if user was redirected from verification page
    if (router.query.verify === 'true') {
      toast({ 
        title: "Email verification required", 
        description: "Please check your email to verify your account before signing in.", 
        variant: "default" 
      });
    }
    
    if (!loginAttempted) return;
    
    if (user) {
      toast({ title: "Login successful", description: "Welcome back!", variant: "default" });
      router.push("/dashboard");
    } else if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
    }
  }, [user, error, loginAttempted, router, toast]);

  return (
    <div className="relative w-full flex items-center justify-center font-sans overflow-hidden min-h-screen bg-white dark:bg-black">
      <Toaster />
      <div className="relative w-full max-w-sm p-6 space-y-6 bg-white dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-900/50">
        <div className="text-center space-y-3">
          <div className="inline-flex p-2 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
            <UserIcon />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Welcome back</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Enter your credentials to sign in</p>
          </div>
        </div>
        {/* Social login buttons - disabled */}
        <div className="grid grid-cols-3 gap-2 opacity-50 pointer-events-none select-none">
          <button
            className="flex items-center justify-center h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
            title="Login with Provider 1"
            aria-label="Login with Provider 1"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e5e7eb" /></svg>
          </button>
          <button
            className="flex items-center justify-center h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
            title="Login with Provider 2"
            aria-label="Login with Provider 2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e5e7eb" /></svg>
          </button>
          <button
            className="flex items-center justify-center h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
            title="Login with Provider 3"
            aria-label="Login with Provider 3"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e5e7eb" /></svg>
          </button>
        </div>
        {/* OR Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500 dark:text-zinc-400">
              Or continue with
            </span>
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
              className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-5 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-5 pr-10 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
