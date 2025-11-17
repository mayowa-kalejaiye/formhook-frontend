"use client";
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from './DashboardHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, authReady, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Only redirect after auth initialization has finished and we know the auth state
    if (!authReady) return;
    if (!isAuthenticated) {
      try {
        const { safeReplace } = require('../lib/navigation');
        safeReplace(router, '/login');
      } catch (e) {
        router.replace('/login').catch(() => {});
      }
    }
  }, [loading, user, router]);

  if (!authReady || loading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Checking authentication...</div>;
  }

  // Only show header on authenticated pages, not login/register
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register' || router.pathname === '/forgot-password';

  return (
    <>
      {!isAuthPage && <DashboardHeader />}
      <div className={!isAuthPage ? 'mt-16' : ''}>{children}</div>
    </>
  );
}
