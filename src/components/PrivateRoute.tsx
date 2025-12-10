import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { safeReplace } from '../lib/navigation';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, authReady, isAuthenticated } = useAuth();

  const isReady = authReady && !authLoading;
  const shouldRedirectToLogin = isReady && !isAuthenticated;
  const requiresVerification = isReady && Boolean(user && user.verified === false);
  const shouldBlockRender = !isReady || shouldRedirectToLogin || requiresVerification;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      safeReplace(router, '/login');
    }
  }, [shouldRedirectToLogin, router]);

  useEffect(() => {
    if (requiresVerification) {
      safeReplace(router, '/verification-required');
    }
  }, [requiresVerification, router]);

  if (shouldBlockRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-800 dark:border-t-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
