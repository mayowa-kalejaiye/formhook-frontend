import { useEffect, useState } from 'react';

/**
 * Hook to prevent hydration mismatches when using dates
 * Returns null during SSR, actual date on client
 */
export function useIsomorphicDate() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentDate(new Date()), 0);
    return () => clearTimeout(timer);
  }, []);

  return currentDate;
}

/**
 * Hook to get a consistent date string that won't cause hydration issues
 * Uses a static fallback during SSR
 */
export function useStaticDateFallback(date?: string | null, fallback: string = '2025-09-22T12:00:00.000Z') {
  return date || fallback;
}
