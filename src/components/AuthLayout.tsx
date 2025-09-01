"use client";
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../services/api';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Checking authentication...</div>;
  }
  return <>{children}</>;
}
