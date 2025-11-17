import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { safeReplace } from '../lib/navigation';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, authReady, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until auth initialization completes before redirecting
    if (!authReady) return;
    if (!isAuthenticated) {
      safeReplace(router, '/login');
      return;
    }

    if (user && user.verified === false) {
      safeReplace(router, '/verification-required');
      return;
    }

    setLoading(false);
  }, [user, authLoading, router]);

  if (loading || authLoading) {
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
