"use client";
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestEmailVerification } from '../services/api';
import Link from 'next/link';
import { useRouter } from 'next/router';

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const VerificationRequired = () => {
  const { user, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setSending(true);
    setError(null);
    try {
      const response = await requestEmailVerification(user.email);
      if (response.data?.success) {
        setSent(true);
      } else {
        setError(response.data?.message || 'Failed to send verification email. Please try again.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'An error occurred. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    try {
      const { safeReplace } = require('../lib/navigation');
      safeReplace(router, '/login');
    } catch (e) {
      try { router.push('/login'); } catch (_) {}
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div className="text-amber-500 dark:text-amber-400 p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 inline-block mb-4">
          <AlertIcon />
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Email Verification Required
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your account needs to be verified before you can access this page. Please check your email for a verification link.
        </p>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {sent && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-md mb-4">
            Verification email sent! Please check your inbox.
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleResendVerification}
            disabled={sending || sent}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
          >
            {sending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-gray-900 border-t-transparent mr-2"></div>
                Sending...
              </div>
            ) : sent ? (
              'Email Sent'
            ) : (
              'Resend Verification Email'
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Need help? <Link href="/contact" className="text-gray-900 dark:text-gray-100 hover:underline">Contact Support</Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationRequired;
