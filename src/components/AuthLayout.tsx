"use client";
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from './DashboardHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, authReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

  React.useEffect(() => {
    // Only redirect after auth initialization has finished and we know the auth state
    if (!authReady) return;
    if (isDev) console.log('[AuthLayout] authReady:', authReady, 'isAuthenticated:', isAuthenticated, 'user:', user);
    if (!isAuthenticated) {
      try {
        const { safeReplace } = require('../lib/navigation');
        safeReplace(router, '/login');
      } catch (e) {
        router.replace('/login').catch(() => {});
      }
    }
  }, [loading, user, router, authReady, isAuthenticated]);

  if (!authReady || loading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Checking authentication...</div>;
  }

  // Only show header on authenticated pages, not login/register
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register' || router.pathname === '/forgot-password' || router.pathname === '/reset-password';

  const contentOffsetClasses = 'pt-[160px] md:pt-[120px] lg:pt-[104px]';

  return (
    <>
      {!isAuthPage && <DashboardHeader />}
      <div className={!isAuthPage ? contentOffsetClasses : ''}>{children}</div>
    </>
  );
}
