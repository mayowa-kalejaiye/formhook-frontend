// Centralized public configuration helper.
// Validates that required NEXT_PUBLIC env vars are present at build time.

type AppConfig = {
  apiBaseUrl: string;
};

const DEFAULT_API_BASE_URL = 'https://formhook-backend.onrender.com';

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name as keyof NodeJS.ProcessEnv];
  if (value && value.trim()) return value.trim();
  if (typeof fallback === 'string') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[config] ${name} not set. Falling back to default: ${fallback}`);
    }
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}

const rawPublicApiBase = readEnv('NEXT_PUBLIC_API_BASE_URL', DEFAULT_API_BASE_URL);

export const appConfig: AppConfig = {
  apiBaseUrl: rawPublicApiBase.replace(/\/$/, ''),
};

export function getApiBaseUrl() {
  return appConfig.apiBaseUrl;
}
