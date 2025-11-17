import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { safeReplace } from '../lib/navigation';

export default function SigninRedirect() {
  const router = useRouter();
  useEffect(() => {
    safeReplace(router, '/login');
  }, [router]);
  return null;
}
