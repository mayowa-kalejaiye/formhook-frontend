import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { serverConfig } from '@/lib/serverConfig';

const API_BASE = serverConfig.apiBaseUrl;
const DEFAULT_TIMEOUT_MS = serverConfig.submissionTimeoutMs;

/**
 * Proxy public submissions through Next.js so we can keep browser code simple
 * and never expose backend secrets. The FastAPI backend already handles rate
 * limiting, pricing validation, geo enrichment, and idempotency — this route
 * simply forwards the payload with the correct headers and returns the backend
 * response verbatim (with friendlier error messages on network failures).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!API_BASE) {
    return res.status(500).json({ ok: false, error: 'FORMHOOK_API_BASE/NEXT_PUBLIC_API_BASE_URL is not configured' });
  }

  const { formId, data } = req.body || {};
  if (!formId || typeof formId !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing formId in request body' });
  }
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ ok: false, error: 'Missing data payload' });
  }

  const target = `${API_BASE}/forms/${encodeURIComponent(formId)}/submit`;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': req.headers['user-agent'] ? String(req.headers['user-agent']) : 'formhook-frontend-proxy',
  };

  // Forward Authorization header if the caller provided a per-form token
  const authHeader = getHeader(req, 'authorization');
  if (authHeader) headers.authorization = authHeader;

  // Propagate Idempotency-Key if provided, otherwise create a submission-scoped key
  headers['idempotency-key'] = getHeader(req, 'idempotency-key') || getHeader(req, 'x-idempotency-key') || `fh-proxy-${randomUUID()}`;

  // Preserve the original IP so the backend can run geo/threat analysis
  const forwardedFor = getHeader(req, 'x-forwarded-for') || req.socket.remoteAddress;
  if (forwardedFor) headers['x-forwarded-for'] = forwardedFor;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const payload = await readBody(backendResponse);

    if (!backendResponse.ok) {
      const errorMessage = deriveErrorMessage(payload, backendResponse.status);
      return res.status(backendResponse.status).json({ ok: false, status: backendResponse.status, error: errorMessage, data: payload });
    }

    return res.status(200).json({ ok: true, data: payload });
  } catch (error: any) {
    clearTimeout(timeout);
    const isAbort = error?.name === 'AbortError';
    const message = isAbort
      ? 'The backend took too long to respond. It may be waking up — please retry in a few seconds.'
      : error?.message || 'Unexpected proxy error';
    return res.status(isAbort ? 504 : 502).json({ ok: false, error: message });
  }
}

function getHeader(req: NextApiRequest, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

async function readBody(resp: Response) {
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await resp.json();
    } catch (err) {
      return { error: 'Failed to parse JSON from backend', raw: await resp.text().catch(() => '') };
    }
  }
  return await resp.text();
}

function deriveErrorMessage(payload: any, status: number) {
  if (!payload) return `Backend error (status ${status})`;
  if (typeof payload === 'string') return payload;
  return payload?.detail || payload?.error || payload?.message || `Backend error (status ${status})`;
}
