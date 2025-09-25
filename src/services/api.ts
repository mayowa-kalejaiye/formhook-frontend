import * as React from 'react';

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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com';
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  const isUsingCookies = isUsingHttpOnlyCookies();
  
  // Only check localStorage token if not using HTTP-only cookies
  if (!isUsingCookies) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log('[fetchWithAuth] Token check:', { hasToken: !!token, url });
    
    // Token expiry check (optional, UX improvement)
    if (token) {
      const payload = decodeJwt(token);
      if (payload && payload.exp && Date.now() / 1000 > payload.exp) {
        console.log('[fetchWithAuth] Token expired, redirecting to login');
        localStorage.removeItem('token');
        showSessionExpiredToast();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return { ok: false, error: 'Session expired' };
      }
      // Add token to Authorization header
      headers.set('Authorization', `Bearer ${token}`);
      console.log('[fetchWithAuth] Added Authorization header for URL:', url);
    } else {
      console.warn('[fetchWithAuth] No token found for authenticated request to:', url);
    }
  }
  
  // Always prefix with backend base URL unless already absolute
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
  
  // Always include credentials when using cookies
  const credentials: RequestCredentials = isUsingCookies ? 'include' : 'same-origin';
  
  let res;
  try {
    res = await fetch(fullUrl, { 
      ...options, 
      headers,
      credentials 
    });
  } catch (networkErr) {
    showToast('Network error', 'Could not connect to the server.', 'destructive');
    // Prevent browser default error popups
    return { ok: false, status: 0, error: 'Network error' };
  }
  if (!res) {
    showToast('Unknown error', 'No response from server.', 'destructive');
    return { ok: false, status: 0, error: 'No response from server' };
  }
  if (res.status === 401) {
    console.error('[fetchWithAuth] 401 Unauthorized response for:', url);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      showSessionExpiredToast();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  if (!res.ok) {
    console.error(`[fetchWithAuth] ${res.status} error for:`, url);
    let errorMsg = 'API error';
    let errorDetail = '';
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        console.error('[fetchWithAuth] Error response data:', data);
        errorMsg = data?.detail || data?.message || errorMsg;
        errorDetail = typeof data === 'string' ? data : '';
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
    return { ok: false, status: res.status, error: errorMsg + (errorDetail ? ': ' + errorDetail : '') };
  }
  return res;
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

// Determine if we should use the proxy based on environment
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const shouldUseProxy = isProduction;

// Create axios instance
const API = axios.create({
  baseURL: API_BASE_URL, // Reusing the API_BASE_URL from above
  withCredentials: true, // Important for HTTP-only cookies
});

// Helper to check if we're using HttpOnly cookies or JWT in localStorage
export function isUsingHttpOnlyCookies() {
  // This should match your backend configuration
  return process.env.NEXT_PUBLIC_USE_HTTP_ONLY_COOKIES === 'true';
}


// --- Webhook API ---
// Update webhook config (and other form fields)
export const updateFormWebhook = async (
  formId: string,
  data: { webhook_url?: string | null; webhook_headers?: Record<string, string>; webhook_secret?: string | null }
) => {
  const res = await fetchWithAuth(`/forms/${formId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update webhook');
  return await res.json();
};

// Get webhook delivery logs for a form
export const getWebhookDeliveries = async (formId: string) => {
  const res = await fetchWithAuth(`/forms/${formId}/webhook-deliveries`);
  if (!res.ok) throw new Error('Failed to fetch webhook deliveries');
  return await res.json();
};

// Admin: Retry all pending webhooks
export const retryPendingWebhooks = async () => {
  const res = await fetchWithAuth('/forms/admin/retry-webhooks', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry webhooks');
  return await res.json();
};

// Dashboard Analytics
export const getDashboardAnalytics = async (params?: { range?: string }) => {
  const url = '/dashboard/analytics' + (params?.range ? `?range=${encodeURIComponent(params.range)}` : '');
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to fetch dashboard analytics');
  return await res.json();
};
// Form Analytics
export const getFormAnalytics = async (
  formId: string,
  params?: { date_from?: string; date_to?: string; interval?: string }
) => {
  let url = `/forms/${formId}/analytics`;
  const q = [];
  if (params?.date_from) q.push(`date_from=${encodeURIComponent(params.date_from)}`);
  if (params?.date_to) q.push(`date_to=${encodeURIComponent(params.date_to)}`);
  if (params?.interval) q.push(`interval=${encodeURIComponent(params.interval)}`);
  if (q.length) url += '?' + q.join('&');
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to fetch form analytics');
  return await res.json();
};
// Dashboard Summary
export const getDashboardSummary = async (days?: number) => {
  const url = '/dashboard/summary' + (days ? `?days=${days}` : '');
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return await res.json();
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
  if (shouldUseProxy) {
    // Use the proxy in production to avoid CORS issues
    return axios.post('/api/proxy', {
      url: `${API_BASE_URL}/auth/signup`,
      data: data
    });
  } else {
    // Use direct API call in development
    return API.post('/auth/signup', data);
  }
};

// Flexible login function that supports multiple backend authentication endpoints
export const login = (data: { email: string; password: string }) => {
  // First try the standard login endpoint
  const loginAtEndpoint = (endpoint: string) => {
    if (shouldUseProxy) {
      // Use the proxy in production to avoid CORS issues
      return axios.post('/api/proxy', {
        url: `${API_BASE_URL}${endpoint}`,
        data: data
      });
    } else {
      // Use direct API call in development
      return API.post(endpoint, data);
    }
  };
  
  // Start with the primary login endpoint
  return loginAtEndpoint('/auth/login')
    .catch(error => {
      // If the first endpoint fails specifically with a not found error (404),
      // try the email login endpoint as fallback
      if (error.response && error.response.status === 404) {
        return loginAtEndpoint('/auth/email-login');
      }
      // For any other error, propagate it
      throw error;
    });
};

// Token-based login (for password reset links, etc.)
export const loginWithToken = (token: string) => {
  if (shouldUseProxy) {
    // Use the proxy in production to avoid CORS issues
    return axios.post('/api/proxy', {
      url: `${API_BASE_URL}/auth/token`,
      data: { token }
    });
  } else {
    // Use direct API call in development
    return API.post('/auth/token', { token });
  }
};

export const verifyEmail = (token: string) => {
  if (shouldUseProxy) {
    // Use the proxy in production to avoid CORS issues
    return axios.post('/api/proxy', {
      url: `${API_BASE_URL}/auth/verify-email`,
      data: { token }
    });
  } else {
    // Use direct API call in development
    return API.post('/auth/verify-email', { token });
  }
};

export const requestEmailVerification = (email: string) => {
  if (shouldUseProxy) {
    // Use the proxy in production to avoid CORS issues
    return axios.post('/api/proxy', {
      url: `${API_BASE_URL}/auth/request-verification`,
      data: { email }
    });
  } else {
    // Use direct API call in development
    return API.post('/auth/request-verification', { email });
  }
};

// Forms
export const getForms = async () => {
  const res = await fetchWithAuth('/forms/');
  // Log the full response for debugging
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[getForms] fetchWithAuth response:', res);
  }
  if (!res.ok) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[getForms] Error fetching forms:', res.error || res.status);
    }
    throw new Error(res.error || 'Failed to fetch forms');
  }
  // If res is a Response object, parse as JSON
  if (typeof res.json === 'function') {
    const data = await res.json();
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[getForms] Parsed forms data:', data);
    }
    return { data };
  }
  // If res is already parsed (error case), return as is
  return res;
};
export const createForm = async (data: {
  name: string;
  description?: string;
  webhook_url?: string;
  notification_email?: string;
}) => {
  const res = await fetchWithAuth('/forms/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    // Try to extract a meaningful error message from the response
    let errorMsg = 'Failed to create form';
    try {
      const data = await res.json();
      errorMsg = data?.detail || data?.message || JSON.stringify(data);
    } catch {
      // fallback: try text
      try {
        errorMsg = await res.text();
      } catch {}
    }
    return { ok: false, error: errorMsg };
  }
  return await res.json();
};
export const getForm = async (formId: string) => {
  const res = await fetchWithAuth(`/forms/${formId}`);
  if (!res.ok) throw new Error('Failed to fetch form');
  return await res.json();
};
export const deleteForm = async (formId: string) => {
  const res = await fetchWithAuth(`/forms/${formId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete form');
  return await res.json();
};

// Submissions
export const getSubmissions = async (
  formId: string,
  params?: { limit?: number; offset?: number; date_from?: string; date_to?: string; ip_address?: string }
) => {
  let url = `/forms/${formId}/submissions`;
  const q = [];
  if (params?.limit) q.push(`limit=${params.limit}`);
  if (params?.offset) q.push(`offset=${params.offset}`);
  if (params?.date_from) q.push(`date_from=${encodeURIComponent(params.date_from)}`);
  if (params?.date_to) q.push(`date_to=${encodeURIComponent(params.date_to)}`);
  if (params?.ip_address) q.push(`ip_address=${encodeURIComponent(params.ip_address)}`);
  if (q.length) url += '?' + q.join('&');
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return await res.json();
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
  const res = await fetchWithAuth('/user/profile');
  if (!res.ok) throw new Error('Failed to get user profile');
  return await res.json();
};

export const updateUserProfile = async (data: {
  name?: string;
  timezone?: string;
  language?: string;
  notification_preferences?: object;
}) => {
  const res = await fetchWithAuth('/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update user profile');
  return await res.json();
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => {
  const res = await fetchWithAuth('/user/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to change password');
  }
  return await res.json();
};

export const toggle2FA = async (enabled: boolean) => {
  const res = await fetchWithAuth('/user/2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) throw new Error('Failed to update 2FA settings');
  return await res.json();
};

export const getSecurityLogs = async () => {
  const res = await fetchWithAuth('/user/security-logs');
  if (!res.ok) throw new Error('Failed to get security logs');
  return await res.json();
};

export const deleteAccount = async (password: string) => {
  const res = await fetchWithAuth('/user/delete-account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to delete account');
  }
  return await res.json();
};

export const exportUserData = async () => {
  const res = await fetchWithAuth('/user/export-data');
  if (!res.ok) throw new Error('Failed to export user data');
  return await res.blob();
};

// --- Enhanced API Token Management ---
export const getUserApiTokens = async () => {
  const res = await fetchWithAuth('/user/api-tokens');
  if (!res.ok) throw new Error('Failed to get API tokens');
  return await res.json();
};

export const createApiToken = async (name: string, permissions?: string[]) => {
  const res = await fetchWithAuth('/user/api-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, permissions: permissions || ['forms:read', 'submissions:read'] })
  });
  if (!res.ok) throw new Error('Failed to create API token');
  return await res.json();
};

export const deleteApiToken = async (tokenId: string) => {
  const res = await fetchWithAuth(`/user/api-tokens/${tokenId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete API token');
  return await res.json();
};
