"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

type Props = {
  formId: string; // forms are identified on the backend; required for submission
  submitPath?: string; // server-side proxy path (defaults to /api/forms/submit)
  authToken?: string; // optional Bearer token if the form requires one
};

// Minimal embeddable form component for developers to drop into pages.
// - Validates required fields on client-side
// - Posts to server-side proxy (`/api/forms/submit`) so API keys stay secret
// - Retries up to 2 times automatically with exponential backoff

export default function EmbedForm({ formId, submitPath = '/api/forms/submit', authToken }: Props) {
  const { register, handleSubmit, formState } = useForm();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function doSubmit(values: any) {
    setStatus('sending');
    setMessage(null);

    const maxRetries = 2;

    // Generate a stable idempotency key per user submission attempt so backend
    // deduplicates retries (FastAPI already supports Idempotency-Key headers).
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fh-${Date.now()}-${Math.random()}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'idempotency-key': idempotencyKey,
        };
        if (authToken) headers.authorization = `Bearer ${authToken}`;

        const resp = await fetch(submitPath, {
          method: 'POST',
          headers,
          body: JSON.stringify({ formId, data: values }),
        });

        const json = await resp.json().catch(() => ({}));

        if (resp.ok && json?.ok) {
          setStatus('success');
          setMessage('Thanks — your response was submitted.');
          return;
        }

        // If not OK, throw to trigger retry logic
        throw new Error(json?.error || json?.message || json?.body || `HTTP ${resp.status}`);
      } catch (err: any) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
        if (attempt < maxRetries) {
          // wait and retry
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        setStatus('error');
        setMessage(String(err?.message || err || 'Submission failed'));
        return;
      }
    }
  }

  return (
    <div className="max-w-md p-4 border rounded-md bg-white">
      <form
        onSubmit={handleSubmit(doSubmit)}
        className="space-y-3"
        aria-live="polite"
      >
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            {...register('name', { required: true, maxLength: 100 })}
            className="mt-1 block w-full border rounded px-2 py-1"
            type="text"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            {...register('email', {
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            })}
            className="mt-1 block w-full border rounded px-2 py-1"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
            {...register('message', { required: true, maxLength: 2000 })}
            className="mt-1 block w-full border rounded px-2 py-1"
            placeholder="Write your message"
            rows={4}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending…' : 'Submit'}
          </button>

          {status === 'success' && <span className="text-green-600">{message}</span>}
          {status === 'error' && <span className="text-red-600">{message}</span>}
        </div>
      </form>
    </div>
  );
}
