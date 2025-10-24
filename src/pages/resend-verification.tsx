"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { requestEmailVerification } from '../services/api';
import Link from 'next/link';

const ResendVerification = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setStatus('loading');
    try {
      const response = await requestEmailVerification(data.email);
      console.log('[ResendVerification] API response:', response);
      // The backend might return success in different formats, let's handle them all
      const isSuccess = 
        response?.data?.success === true || 
        (response?.status >= 200 && response?.status < 300);
      if (isSuccess) {
        setStatus('success');
        setMessage('Verification email sent successfully! Please check your inbox.');
        console.log('Verification email sent successfully');
      } else {
        setStatus('error');
        setMessage(response?.data?.message || response?.data?.detail || 'Failed to send verification email. Please try again.');
        console.error('Failed to send verification email', response);
      }
    } catch (err: any) {
      console.error('[ResendVerification] Error sending verification email:', err);
      // Show full error details for debugging
      setStatus('error');
      setMessage(
        err?.response?.data?.detail || 
        err?.response?.data?.message || 
        err?.message ||
        'An error occurred. Please try again later.'
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Resend Verification Email</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Enter your email address below and we'll send you a new verification link.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-md mb-6">
              {message}
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {status === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-md">
                {message}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-gray-900 border-t-transparent mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Verification Email'
              )}
            </button>

            <div className="text-center mt-4">
              <Link 
                href="/login" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResendVerification;
