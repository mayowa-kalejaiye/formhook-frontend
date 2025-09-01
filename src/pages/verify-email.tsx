"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { verifyEmail } from '../services/api';
import Link from 'next/link';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const VerifyEmail = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    // Wait for the token to be available from the query params
    if (!token) return;

    // Add logging to help debug
    console.log("Verifying token:", token);

    const verifyUserEmail = async () => {
      try {
        setStatus('loading');
        setMessage('Verifying your email...');
        
        const response = await verifyEmail(token as string);
        console.log("Verification response:", response);
        
        if (response.data?.success) {
          setStatus('success');
          setMessage(response.data?.message || 'Email verified successfully!');
          // Redirect to signin after 3 seconds
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(response.data?.message || 'Failed to verify email. Please try again.');
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus('error');
        setMessage(
          err?.response?.data?.detail || 
          err?.response?.data?.message || 
          'Verification link is invalid or has expired.'
        );
      }
    };

    verifyUserEmail();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-800 dark:border-t-white"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{message}</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-green-500 dark:text-green-400 p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{message}</h2>
            <p className="text-gray-600 dark:text-gray-300">Your email has been verified. You can now sign in to your account.</p>
            <Link 
              href="/login"
              className="mt-4 inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-red-500 dark:text-red-400 p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <ErrorIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Failed</h2>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link 
                href="/signup"
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Sign Up Again
              </Link>
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
