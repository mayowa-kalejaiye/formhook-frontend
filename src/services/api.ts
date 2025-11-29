import * as React from 'react';
import { apiCache, CacheTTL } from '@/utils/cache';

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

// Add global type for window.toast (shadcn/ui toast)
declare global {
  interface Window {
    toast?: (opts: { title: string; description?: string; variant?: string }) => void;
  }
}

// Toast helpers
function showSessionExpiredToast() {
  showToast('Session expired', 'Please sign in again.', 'destructive');
}

function showToast(title, description, variant = 'default') {
  if (typeof window !== 'undefined' && window.toast) {
    window.toast({ title, description, variant });
  }
}

// JWT decode helper (no deps)
function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}
// --- Auth Helpers ---
// Reusable fetchWithAuth helper for protected endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com';
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  // Use JWT token from localStorage for all authenticated requests when not using http-only cookies
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Client-side cooldown/backoff to avoid hammering API on repeated failures (429/network/CORS)
  // Uses window.__fh_request_cooldown_until (ms timestamp) and window.__fh_consecutive_failures (counter)
  try {
    if (typeof window !== 'undefined') {
      const cooldown = (window as any).__fh_request_cooldown_until || 0;
      if (cooldown && Date.now() < cooldown) {
        // Return a consistent error-like object similar to other branches
        return { ok: false, status: 429, error: 'Client-side request cooldown active' };
      }
    }
  } catch (e) {
    // ignore any access errors to window
  }
  
  // Token expiry check (optional, UX improvement)
  if (token) {
    const payload = decodeJwt(token);
    if (payload && payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('token');
      showSessionExpiredToast();
      return { ok: false, status: 401, error: 'Session expired' };
    }
    // Add token to Authorization header per API docs
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Always prefix with backend base URL unless already absolute
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
  
  // Credentials: same-origin by default for JWT Bearer flows
  const credentials: RequestCredentials = 'same-origin';
  
  let res;
  try {
    res = await fetch(fullUrl, { 
      ...options, 
      headers,
      credentials 
    });
    // Reset consecutive failure counter on successful network response
    try {
      if (typeof window !== 'undefined') {
        (window as any).__fh_consecutive_failures = 0;
      }
    } catch (_) {}
  } catch (networkErr) {
    // Increment consecutive failure counter and start cooldown after repeated failures
    try {
      if (typeof window !== 'undefined') {
        (window as any).__fh_consecutive_failures = ((window as any).__fh_consecutive_failures || 0) + 1;
        if ((window as any).__fh_consecutive_failures >= 3) {
          // 30s cooldown to avoid tight retry loops
          (window as any).__fh_request_cooldown_until = Date.now() + 30_000;
          (window as any).__fh_consecutive_failures = 0;
        }
      }
    } catch (_) {}

    showToast('Network error', 'Could not connect to the server.', 'destructive');
    // Prevent browser default error popups
    return { ok: false, status: 0, error: 'Network error' };
  }
  if (!res) {
    showToast('Unknown error', 'No response from server.', 'destructive');
    return { ok: false, status: 0, error: 'No response from server' };
  }
  // If backend explicitly rate-limited us, start a short client-side cooldown to reduce repeated attempts
  try {
    if (res.status === 429 && typeof window !== 'undefined') {
      (window as any).__fh_request_cooldown_until = Date.now() + 30_000; // 30 seconds
    }
  } catch (_) {}
  if (res.status === 401) {
    localStorage.removeItem('token');
    showSessionExpiredToast();
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  if (!res.ok) {
    let errorMsg = 'API error';
    let errorDetail = '';
    let errorData = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        errorData = await res.json();
        errorMsg = errorData?.detail || errorData?.message || errorMsg;
        errorDetail = typeof errorData === 'string' ? errorData : '';
      } catch {
        errorDetail = 'Invalid JSON response.';
      }
    } else if (contentType.includes('text/html')) {
      errorMsg = 'Server error';
      errorDetail = 'Received HTML error page from server.';
    } else {
      try {
        errorDetail = await res.text();
      } catch {}
    }
    showToast('Error', errorMsg, 'destructive');
    return { 
      ok: false, 
      status: res.status, 
      error: errorMsg + (errorDetail ? ': ' + errorDetail : ''),
      errorData: errorData // Include the full error data for downstream use
    };
  }
  // Success: ensure any cooldowns are cleared
  try {
    if (typeof window !== 'undefined') {
      (window as any).__fh_consecutive_failures = 0;
      (window as any).__fh_request_cooldown_until = 0;
    }
  } catch (_) {}
  return res;
}

// Helper to check if client-side cooldown is currently active
export function isRequestCooldownActive(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const until = (window as any).__fh_request_cooldown_until || 0;
    return !!(until && Date.now() < until);
  } catch (e) {
    return false;
  }
}

// Cached fetch wrapper for GET requests
export async function fetchWithCache(
  url: string, 
  options: RequestInit = {}, 
  ttl: number = CacheTTL.MEDIUM
) {
  // Only cache GET requests
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    return fetchWithAuth(url, options);
  }

  // Use the full URL as cache key (includes query parameters)
  const cacheKey = url;
  
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    // Return a response-like object with cached data
    // CRITICAL: Return a deep copy to prevent mutation of cached data
    const cachedCopy = JSON.parse(JSON.stringify(cached));
    return {
      ok: true,
      status: 200,
      json: async () => cachedCopy,
      _fromCache: true
    };
  }

  // Make the actual request
  const response = await fetchWithAuth(url, options);
  
  // Cache successful responses
  if (response.ok) {
    try {
      const data = await response.json();
      // Store a deep copy in cache to prevent mutation
      apiCache.set(cacheKey, JSON.parse(JSON.stringify(data)), undefined, ttl);
      
      // Return response-like object with the original data
      return {
        ok: true,
        status: 200,
        json: async () => data,
        _fromCache: false
      };
    } catch (error) {
      // If JSON parsing fails, return the original response
      console.error('[Cache] Failed to parse response as JSON:', error);
      return response;
    }
  }

  return response;
}

// Helper to invalidate cache for mutations
export function invalidateCache(pattern: string) {
  apiCache.invalidatePattern(pattern);
}

// Simple useAuth hook
export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  });
  React.useEffect(() => {
    const handler = () => setIsLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return isLoggedIn;
}
import axios from 'axios';

// Create axios instance with JWT Bearer token authentication
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add request interceptor to include JWT token in all requests
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Note: This app uses JWT Bearer token authentication per backend API docs


// --- Webhook API ---
// Update webhook config (and other form fields)
export const updateFormWebhook = async (
  formId: string,
  data: { webhook_url?: string | null; webhook_headers?: Record<string, string>; webhook_secret?: string | null }
) => {
  try {
    // Invalidate form cache when updating
    invalidateCache(`/forms/${formId}`);
    
    // Try PATCH first (preferred) but some backends disallow PATCH on this route.
    let res: any = await fetchWithAuth(`/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // If server responds with 405 Method Not Allowed, retry using PUT for compatibility
    if (res && (res as any).status === 405) {
      console.warn('[API] PATCH not allowed, retrying update with PUT');
      res = await fetchWithAuth(`/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    if (!res || !res.ok) {
      const status = (res && (res as any).status) || 0;
      const errorMsg = (res as any).error || (res && res.errorData && (res.errorData.detail || res.errorData.message)) || `Failed to update form (status: ${status})`;
      console.error('[API] Error updating webhook/form:', { status, error: errorMsg, raw: res });
      const err = new Error(errorMsg);
      (err as any).status = status;
      throw err;
    }

    if (typeof res.json === 'function') {
      return await res.json();
    }

    return { success: true };
  } catch (error) {
    console.error('[API] Exception in updateFormWebhook:', error);
    throw error;
  }
};

// Get webhook delivery logs for a form
export const getWebhookDeliveries = async (formId: string) => {
  try {
    const res = await fetchWithAuth(`/forms/${formId}/webhook-deliveries`);
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to fetch webhook deliveries';
      console.error('[API] Error fetching webhook deliveries:', errorMsg);
      return []; // Return empty array instead of throwing
    }
    
    if (typeof res.json === 'function') {
      return await res.json();
    }
    
    return [];
  } catch (error) {
    console.error('[API] Exception in getWebhookDeliveries:', error);
    return [];
  }
};

// Admin: Retry all pending webhooks
export const retryPendingWebhooks = async () => {
  const res = await fetchWithAuth('/forms/admin/retry-webhooks', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry webhooks');
  return await res.json();
};

// Form Analytics (per-form endpoint from API docs)
export const getFormAnalytics = async (
  formId: string,
  params?: { date_from?: string; date_to?: string; interval?: string }
) => {
  // Consistent fallback structure when backend unavailable
  const fallbackAnalytics = {
    total_submissions: 0,
    time_series: [],
    status_breakdown: {},
    daily_stats: [],
    _fallback: true // Flag to indicate this is fallback data
  };

  try {
    let url = `/forms/${formId}/analytics`;
    const q = [];
    if (params?.date_from) q.push(`date_from=${encodeURIComponent(params.date_from)}`);
    if (params?.date_to) q.push(`date_to=${encodeURIComponent(params.date_to)}`);
    if (params?.interval) q.push(`interval=${encodeURIComponent(params.interval)}`);
    if (q.length) url += '?' + q.join('&');

    // Use cached fetch with medium TTL (5 minutes)
    const res = await fetchWithCache(url, {}, CacheTTL.MEDIUM);

    if (!res.ok) {
      // fetchWithAuth returns a custom error-like object on network/auth failures.
      const errorMsg = (res as any).error || `Failed to fetch form analytics (status: ${(res as any).status || 'unknown'})`;
      console.warn('[API] getFormAnalytics unavailable:', errorMsg);
      return fallbackAnalytics;
    }

    if (typeof res.json === 'function') {
      const data = await res.json();
      // Ensure data has expected structure, otherwise use fallback
      if (data && typeof data === 'object') {
        return data;
      }
      console.warn('[API] getFormAnalytics: unexpected data format, using fallback');
      return fallbackAnalytics;
    }

    // If response doesn't support .json, use fallback
    console.warn('[API] getFormAnalytics: response missing json(); using fallback');
    return fallbackAnalytics;
  } catch (error) {
    // Network or unexpected exception - log and return consistent fallback
    console.error('[API] Exception in getFormAnalytics:', error);
    return fallbackAnalytics;
  }
};

// Form Geo Analytics (geographic breakdown)
export const getFormGeoAnalytics = async (formId: string) => {
  const fallbackGeoAnalytics = {
    countries: [],
    cities: [],
    _fallback: true
  };

  try {
    // Use cached fetch with longer TTL (15 minutes) - geo data changes less frequently
    const res = await fetchWithCache(`/forms/${formId}/geo-analytics`, {}, CacheTTL.LONG);

    if (!res.ok) {
      const errorMsg = (res as any).error || `Failed to fetch geo analytics (status: ${(res as any).status || 'unknown'})`;
      console.warn('[API] getFormGeoAnalytics unavailable:', errorMsg);
      return fallbackGeoAnalytics;
    }

    if (typeof res.json === 'function') {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return data;
      }
      console.warn('[API] getFormGeoAnalytics: unexpected data format, using fallback');
      return fallbackGeoAnalytics;
    }

    console.warn('[API] getFormGeoAnalytics: response missing json(); using fallback');
    return fallbackGeoAnalytics;
  } catch (error) {
    console.error('[API] Exception in getFormGeoAnalytics:', error);
    return fallbackGeoAnalytics;
  }
};

// Dashboard Summary
export const getDashboardSummary = async (days?: number) => {
  try {
    const url = '/dashboard/summary' + (days ? `?days=${days}` : '');
    const res = await fetchWithAuth(url);
    
    if (!res.ok) {
      // Return default summary data structure instead of throwing
      return {
        total_forms: 0,
        total_submissions: 0,
        recent_submissions: [],
        trend: [],
        webhook_stats: {
          total: 0,
          delivered: 0,
          failed: 0
        }
      };
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    // Return default summary data structure instead of throwing
    return {
      total_forms: 0,
      total_submissions: 0,
      recent_submissions: [],
      trend: [],
      webhook_stats: {
        total: 0,
        delivered: 0,
        failed: 0
      }
    };
  }
};

// Subscription APIs
export const getCurrentSubscription = async () => {
  try {
    const res = await fetchWithAuth('/subscription/current');
    if (!res) return null;
    if ((res as any).ok) {
      if (typeof (res as any).json === 'function') {
        try {
          return await (res as any).json();
        } catch (e) {
          console.warn('[API] getCurrentSubscription: failed to parse JSON', e);
          return null;
        }
      }
      return null;
    }

    // Non-ok response: try to extract error details
    const errBody = (res as any).error || (res as any).message || null;
    console.warn('[API] getCurrentSubscription non-ok response:', (res as any).status, errBody);
    return null;
  } catch (error) {
    console.error('[API] getCurrentSubscription error:', error);
    return null;
  }
};

export const getSubscriptionUsage = async (params?: { days?: number }) => {
  try {
    let url = '/subscription/usage';
    if (params?.days) url += `?days=${params.days}`;
    const res = await fetchWithAuth(url);
    if (!res) return null;
    if ((res as any).ok) {
      if (typeof (res as any).json === 'function') {
        try {
          return await (res as any).json();
        } catch (e) {
          console.warn('[API] getSubscriptionUsage: failed to parse JSON', e);
          return null;
        }
      }
      return null;
    }
    console.warn('[API] getSubscriptionUsage non-ok response:', (res as any).status);
    return null;
  } catch (error) {
    console.error('[API] getSubscriptionUsage error:', error);
    return null;
  }
};

// API Token
export const generateApiToken = async () => {
  const res = await fetchWithAuth('/api-token/generate', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate API token');
  return await res.json();
};
export const revokeApiToken = async () => {
  const res = await fetchWithAuth('/api-token', { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to revoke API token');
  return await res.json();
};

// Auth (public)
export const signup = (data: { email: string; password: string }) => {
  // Always use direct API call for JWT auth
  return API.post('/auth/signup', data);
};

// Login function using JWT authentication per API docs
// Backend returns: { access_token, token_type, user: { id, email, is_verified } }
export const login = async (data: { email: string; password: string }) => {
  if (isDev) console.log('[API] Login attempt:', data.email);
  if (isDev) console.log('[API] Backend URL:', API_BASE_URL);
  try {
    // Direct POST to backend /auth/login endpoint
    const response = await API.post('/auth/login', data);
    // Return a normalized payload: always provide { access_token, user }
    const raw = response.data;
    if (isDev) console.log('[API] Login response raw:', raw);
    try {
      const normalized = normalizeLoginPayload(raw);
      if (isDev) console.log('[API] Login response normalized:', normalized);
      return normalized;
    } catch (e) {
      // Fall back to returning raw data if normalization fails for unexpected shapes
      if (isDev) console.warn('[API] Failed to normalize login response, returning raw payload', e);
      return raw;
    }
  } catch (error: any) {
    console.error('[API] Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    
    // Provide more specific error message
    if (error.message === 'Network Error') {
      const enhancedError = new Error('Cannot connect to backend server. Please check if the backend is running.');
      enhancedError.name = 'NetworkError';
      throw enhancedError;
    }

    // Surface backend error details where available (prefer `detail` or `message`)
    const serverData = error.response?.data;
    const serverMsg = serverData?.detail || serverData?.message || (typeof serverData === 'string' ? serverData : null) || error.message;

    const err = new Error(serverMsg || 'Login failed');
    (err as any).status = error.response?.status;
    (err as any).serverData = serverData;

    // If unauthorized, give a clearer message
    if (error.response?.status === 401) {
      err.message = serverMsg || 'Invalid credentials. Please check your email and password.';
      err.name = 'UnauthorizedError';
    }

    throw err;
  }
};

// Normalize login payloads to a canonical shape: { access_token, token_type?, user? }
export function normalizeLoginPayload(resData: any, providedToken?: string) {
  const token = resData?.access_token || resData?.token || providedToken || null;
  if (!token) throw new Error('No token available in login payload');

  // Prefer explicit `user` object
  let user = resData?.user;

  if (!user) {
    // Build possible user from root fields
    const possible = {
      email: resData?.email,
      verified: resData?.verified ?? resData?.is_verified,
      userId: resData?.id ?? resData?.userId ?? resData?.sub,
      ...resData,
    };
    const hasUserFields = Boolean(possible.email || possible.userId);
    if (hasUserFields) user = possible;
  }

  if (user) {
    const userObj = {
      email: user.email ?? undefined,
      verified: user.verified ?? user.is_verified ?? undefined,
      userId: String(user.userId ?? user.id ?? user.sub),
      ...user,
    } as any;

    return {
      access_token: token,
      token_type: resData?.token_type ?? resData?.tokenType,
      user: userObj,
      raw: resData,
    };
  }

  // No usable user data found — still return token so callers can hydrate from JWT
  return {
    access_token: token,
    token_type: resData?.token_type ?? resData?.tokenType,
    user: null,
    raw: resData,
  };
}

// Token-based login (for password reset links, etc.)
export const loginWithToken = (token: string) => {
  // Always use direct API call for JWT auth
  return API.post('/auth/token', { token });
};

export const verifyEmail = (token: string) => {
  // Always use direct API call for JWT auth
  return API.post('/auth/verify-email', { token });
};

export const requestEmailVerification = (email: string) => {
  // Always use direct API call for JWT auth
  return API.post('/auth/request-verification', { email });
};

// Forms
export const getForms = async () => {
  try {
    // Use cached fetch with short TTL (1 minute) - forms list changes frequently
    const res = await fetchWithCache('/forms/', {}, CacheTTL.SHORT);
    
    if (!res.ok) {
      // Return empty data instead of throwing
      return { data: [] };
    }
    
    // If res is a Response object, parse as JSON
    if (typeof res.json === 'function') {
      const data = await res.json();
      return { data };
    }
    // If res is already parsed (error case), return as is
    return res;
  } catch (error) {
    // Return empty data on any error
    return { data: [] };
  }
};
export const createForm = async (data: {
  name: string;
  description?: string;
  webhook_url?: string;
  notification_email?: string;
  fields?: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
    validation?: any;
  }>;
}) => {
  // Invalidate forms cache when creating a new form
  invalidateCache('/forms/');
  
  const res = await fetchWithAuth('/forms/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    // Extract detailed error message from fetchWithAuth response
    let errorMsg = 'Failed to create form';
    
    if (res.errorData) {
      // Handle FastAPI validation errors specifically
      if (res.errorData.detail && Array.isArray(res.errorData.detail)) {
        // FastAPI validation errors are arrays
        const validationErrors = res.errorData.detail.map(err => {
          return `${err.loc ? err.loc.join('.') : 'field'}: ${err.msg}`;
        }).join('; ');
        errorMsg = `Validation error: ${validationErrors}`;
      } else if (res.errorData.detail) {
        errorMsg = res.errorData.detail;
      } else if (res.errorData.message) {
        errorMsg = res.errorData.message;
      } else {
        errorMsg = JSON.stringify(res.errorData);
      }
    } else if (res.error) {
      errorMsg = res.error;
    }
    
    return { ok: false, error: errorMsg };
  }
  const result = await res.json();
  return { ok: true, data: result };
};
export const getForm = async (formId: string) => {
  try {
    const res = await fetchWithAuth(`/forms/${formId}`);
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to fetch form';
      console.error('[API] Error fetching form:', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (typeof res.json === 'function') {
      return await res.json();
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('[API] Exception in getForm:', error);
    throw error;
  }
};

export const deleteForm = async (formId: string) => {
  try {
    // Invalidate form-related caches
    invalidateCache('/forms/');
    invalidateCache(`/forms/${formId}`);
    
    const res = await fetchWithAuth(`/forms/${formId}`, { method: 'DELETE' });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to delete form';
      console.error('[API] Error deleting form:', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (typeof res.json === 'function') {
      return await res.json();
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] Exception in deleteForm:', error);
    throw error;
  }
};

// Submissions
export const getSubmissions = async (
  formId?: string,
  params?: { limit?: number; offset?: number; date_from?: string; date_to?: string; ip_address?: string }
) => {
  if (!formId) {
    // If no formId provided, return empty array (or you could fetch all submissions from all forms)
    return [];
  }
  
  let url = `/forms/${formId}/submissions`;
  const q = [];
  if (params?.limit) q.push(`limit=${params.limit}`);
  if (params?.offset) q.push(`offset=${params.offset}`);
  if (params?.date_from) q.push(`date_from=${encodeURIComponent(params.date_from)}`);
  if (params?.date_to) q.push(`date_to=${encodeURIComponent(params.date_to)}`);
  if (params?.ip_address) q.push(`ip_address=${encodeURIComponent(params.ip_address)}`);
  if (q.length) url += '?' + q.join('&');
  
  try {
    // Use cached fetch with short TTL (1 minute) - submissions can change frequently
    const res = await fetchWithCache(url, {}, CacheTTL.SHORT);
    if (!res.ok) {
      console.error('Failed to fetch submissions:', res.status, res.error);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
};
export const exportSubmissions = async (
  formId: string,
  params?: { date_from?: string; date_to?: string; ip_address?: string }
) => {
  let url = `/forms/${formId}/submissions/export`;
  const q = [];
  if (params?.date_from) q.push(`date_from=${encodeURIComponent(params.date_from)}`);
  if (params?.date_to) q.push(`date_to=${encodeURIComponent(params.date_to)}`);
  if (params?.ip_address) q.push(`ip_address=${encodeURIComponent(params.ip_address)}`);
  if (q.length) url += '?' + q.join('&');
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to export submissions');
  return await res.blob();
};

// --- User Profile & Account Management ---
export const getUserProfile = async () => {
  // Use a single canonical profile endpoint configured via env.
  // This avoids probing multiple legacy endpoints and hitting 404s.
  const profileEndpoint = process.env.NEXT_PUBLIC_PROFILE_ENDPOINT;
  if (!profileEndpoint) {
    // No profile endpoint configured — backend should return user in /auth/login response.
    return null;
  }

  // Ensure endpoint string is a path or absolute URL
  const path = profileEndpoint.startsWith('/') || profileEndpoint.startsWith('http') ? profileEndpoint : `/${profileEndpoint}`;
  try {
    const res = await fetchWithAuth(path);
    if (res && (res as any).ok) {
      if (typeof (res as any).json === 'function') {
        try {
          const data = await (res as any).json();
          return data;
        } catch (e) {
          console.warn('[API] getUserProfile: failed to parse JSON from', path, e);
          return null;
        }
      }
      return null;
    }

    // Non-ok responses
    const status = (res && ((res as any).status || (res as any).status === 0)) ? (res as any).status : 'unknown';
    console.warn('[API] getUserProfile failed at', path, 'status:', status, 'error:', (res as any).error || (res as any).message);
    return null;
  } catch (error) {
    console.warn('[API] getUserProfile error for', path, error);
    return null;
  }
};

export const updateUserProfile = async (data: {
  name?: string;
  timezone?: string;
  language?: string;
  notification_preferences?: object;
  date_format?: string;
  share_analytics?: boolean;
}) => {
  try {
    // Use canonical profile endpoint when configured to avoid probing legacy paths
    const profileEndpoint = process.env.NEXT_PUBLIC_PROFILE_ENDPOINT || '/user/profile';
    const path = profileEndpoint.startsWith('/') || profileEndpoint.startsWith('http') ? profileEndpoint : `/${profileEndpoint}`;

    const res = await fetchWithAuth(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Treat 404 as a graceful no-op (backend may not support profile PUT)
    if (!res) {
      return null;
    }
    if ((res as any).status === 404) {
      return null;
    }

    if (!res.ok) {
      // Graceful: if backend doesn't support updating profile, return null instead of throwing
      console.warn('[API] updateUserProfile non-ok response:', (res as any).status, (res as any).error || (res as any).message);
      return null;
    }

    if (typeof (res as any).json === 'function') {
      try {
        return await (res as any).json();
      } catch (e) {
        return null;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[API] updateUserProfile error:', error);
    // Bubble up network errors, but treat missing endpoint gracefully at call site
    throw error;
  }
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => {
  try {
    const res = await fetchWithAuth('/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to change password';
      throw new Error(errorMsg);
    }
    if (typeof res.json === 'function') {
      return await res.json();
    }
    return { success: true };
  } catch (error) {
    console.error('[API] changePassword error:', error);
    throw error;
  }
};

export const toggle2FA = async (enabled: boolean) => {
  try {
    const res = await fetchWithAuth('/user/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to update 2FA settings';
      throw new Error(errorMsg);
    }
    if (typeof res.json === 'function') {
      return await res.json();
    }
    return { success: true };
  } catch (error) {
    console.error('[API] toggle2FA error:', error);
    throw error;
  }
};

export const getSecurityLogs = async () => {
  try {
    const res = await fetchWithAuth('/user/security-logs');
    if (!res.ok) {
      console.error('[API] getSecurityLogs failed:', res.status, res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('[API] getSecurityLogs error:', error);
    return [];
  }
};

export const deleteAccount = async (password: string) => {
  try {
    const res = await fetchWithAuth('/user/delete-account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to delete account';
      throw new Error(errorMsg);
    }
    if (typeof res.json === 'function') {
      return await res.json();
    }
    return { success: true };
  } catch (error) {
    console.error('[API] deleteAccount error:', error);
    throw error;
  }
};

export const exportUserData = async () => {
  try {
    const res = await fetchWithAuth('/user/export-data');
    if (!res.ok) {
      console.error('[API] exportUserData failed:', res.status, res.statusText);
      throw new Error('Failed to export user data');
    }
    return await res.blob();
  } catch (error) {
    console.error('[API] exportUserData error:', error);
    throw error;
  }
};

// --- API Token Management (Per-Form) ---
export const generateFormToken = async (formId: string) => {
  try {
    const res = await fetchWithAuth(`/forms/${formId}/generate-token`, {
      method: 'POST'
    });
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to generate form token';
      throw new Error(errorMsg);
    }
    if (typeof res.json === 'function') {
      return await res.json();
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('[API] generateFormToken error:', error);
    throw error;
  }
};

export const revokeFormToken = async (formId: string) => {
  try {
    const res = await fetchWithAuth(`/forms/${formId}/revoke-token`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      // Extract structured error details from our fetchWithAuth wrapper
      let errorMsg = 'Failed to revoke form token';
      let serverData: any = null;
      try {
        if ((res as any).errorData) {
          serverData = (res as any).errorData;
          errorMsg = serverData?.detail || serverData?.message || JSON.stringify(serverData);
        } else if ((res as any).error) {
          errorMsg = (res as any).error;
        } else if (typeof (res as any).json === 'function') {
          try {
            const parsed = await (res as any).json();
            serverData = parsed;
            errorMsg = parsed?.detail || parsed?.message || errorMsg;
          } catch (_) {}
        }
      } catch (_) {}

      return {
        ok: false,
        status: (res as any).status || 0,
        error: errorMsg || 'Failed to revoke form token',
        server: serverData || null
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('[API] revokeFormToken error:', error);
    // Network or unexpected exception - return structured error
    return { ok: false, status: 0, error: error?.message || 'Network error' };
  }
};

// --- User API Tokens (Legacy - not implemented in backend) ---
export const getUserApiTokens = async () => {
  // Backend doesn't support multiple user-level API tokens
  // Tokens are per-form, not per-user
  if (isDev) console.log('[API] User-level API tokens not supported, use per-form tokens instead');
  return [];
};

export const createApiToken = async (name: string, permissions?: string[]) => {
  // Not implemented in backend - use per-form tokens instead
  throw new Error('User-level API tokens not supported. Use per-form tokens from the Forms page.');
};

export const deleteApiToken = async (tokenId: string) => {
  // Not implemented in backend - use per-form tokens instead
  throw new Error('User-level API tokens not supported. Use per-form tokens from the Forms page.');
};

// --- Notifications API ---
export interface Notification {
  id: string;
  type: 'submission' | 'webhook' | 'system' | 'email' | 'security' | 'milestone';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  metadata?: {
    formId?: string;
    formName?: string;
    submissionId?: string;
    webhookUrl?: string;
    status?: string;
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
    ipAddress?: string;
    userAgent?: string;
    error?: string;
  };
}

// Get all notifications for the authenticated user
export const getNotifications = async (params?: {
  limit?: number;
  offset?: number;
  type?: string;
  read?: boolean;
  archived?: boolean;
}) => {
  try {
    let url = '/notifications';
    const q = [];
    if (params?.limit) q.push(`limit=${params.limit}`);
    if (params?.offset) q.push(`offset=${params.offset}`);
    if (params?.type) q.push(`type=${params.type}`);
    if (params?.read !== undefined) q.push(`read=${params.read}`);
    if (params?.archived !== undefined) q.push(`archived=${params.archived}`);
    if (q.length) url += '?' + q.join('&');

    // Use cached fetch with short TTL (30 seconds)
    const res = await fetchWithCache(url, {}, 30000);
    
    if (!res.ok) {
      console.error('[API] Failed to fetch notifications:', res.status);
      return { notifications: [], total: 0, unread: 0 };
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('[API] getNotifications error:', error);
    return { notifications: [], total: 0, unread: 0 };
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async () => {
  try {
    const res = await fetchWithAuth('/notifications/unread-count');
    
    if (!res.ok) {
      console.error('[API] Failed to fetch unread count:', res.status);
      return 0;
    }
    
    const data = await res.json();
    return data.count || 0;
  } catch (error) {
    console.error('[API] getUnreadNotificationCount error:', error);
    return 0;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    // Invalidate notifications cache
    invalidateCache('/notifications');
    
    const res = await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'POST'
    });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to mark notification as read';
      throw new Error(errorMsg);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] markNotificationAsRead error:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    // Invalidate notifications cache
    invalidateCache('/notifications');
    
    const res = await fetchWithAuth('/notifications/mark-all-read', {
      method: 'POST'
    });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to mark all notifications as read';
      throw new Error(errorMsg);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] markAllNotificationsAsRead error:', error);
    throw error;
  }
};

// Archive a notification
export const archiveNotification = async (notificationId: string) => {
  try {
    // Invalidate notifications cache
    invalidateCache('/notifications');
    
    const res = await fetchWithAuth(`/notifications/${notificationId}/archive`, {
      method: 'POST'
    });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to archive notification';
      throw new Error(errorMsg);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] archiveNotification error:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    // Invalidate notifications cache
    invalidateCache('/notifications');
    
    const res = await fetchWithAuth(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to delete notification';
      throw new Error(errorMsg);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] deleteNotification error:', error);
    throw error;
  }
};

// Get notification preferences
export const getNotificationPreferences = async () => {
  try {
    const res = await fetchWithAuth('/notifications/preferences');
    
    if (!res.ok) {
      console.error('[API] Failed to fetch notification preferences:', res.status);
      return {
        email_notifications: true,
        webhook_failures: true,
        security_alerts: true,
        milestone_alerts: true,
        submission_alerts: true
      };
    }
    
    return await res.json();
  } catch (error) {
    console.error('[API] getNotificationPreferences error:', error);
    return {
      email_notifications: true,
      webhook_failures: true,
      security_alerts: true,
      milestone_alerts: true,
      submission_alerts: true
    };
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (preferences: {
  email_notifications?: boolean;
  webhook_failures?: boolean;
  security_alerts?: boolean;
  milestone_alerts?: boolean;
  submission_alerts?: boolean;
}) => {
  try {
    const res = await fetchWithAuth('/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to update notification preferences';
      throw new Error(errorMsg);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] updateNotificationPreferences error:', error);
    throw error;
  }
};

// --- Push Notifications API ---
// Subscribe to push notifications
export const subscribeToPush = async (subscription: PushSubscription) => {
  try {
    const res = await fetchWithAuth('/notifications/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON())
    });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to subscribe to push notifications';
      throw new Error(errorMsg);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] subscribeToPush error:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (endpoint: string) => {
  try {
    const res = await fetchWithAuth('/notifications/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });
    
    if (!res.ok) {
      const errorMsg = (res as any).error || 'Failed to unsubscribe from push notifications';
      throw new Error(errorMsg);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[API] unsubscribeFromPush error:', error);
    throw error;
  }
};

// Get VAPID public key from backend
export const getVapidPublicKey = async (): Promise<string> => {
  try {
    const res = await fetchWithAuth('/notifications/push/vapid-key');
    
    if (!res.ok) {
      console.error('[API] Failed to fetch VAPID key:', res.status);
      throw new Error('Failed to fetch VAPID public key');
    }
    
    const data = await res.json();
    return data.publicKey || data.vapid_public_key || '';
  } catch (error) {
    console.error('[API] getVapidPublicKey error:', error);
    throw error;
  }
};
