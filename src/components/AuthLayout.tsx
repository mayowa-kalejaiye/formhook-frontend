"use client";
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from './DashboardHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
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
