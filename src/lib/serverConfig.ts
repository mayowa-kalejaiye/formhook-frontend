// Server-side configuration helper for API routes and middleware.
// Reads secrets that should never be bundled into the client.

type ServerConfig = {
  apiBaseUrl: string;
  submissionTimeoutMs: number;
  devPortalUser?: string;
  devPortalPass?: string;
};

function requireServerEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

const rawServerApiBase = process.env.FORMHOOK_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL;
if (!rawServerApiBase) {
  throw new Error('FORMHOOK_API_BASE or NEXT_PUBLIC_API_BASE_URL must be defined');
}

export const serverConfig: ServerConfig = {
  apiBaseUrl: rawServerApiBase.replace(/\/$/, ''),
  submissionTimeoutMs: Number(process.env.FORMHOOK_SUBMIT_TIMEOUT_MS || 15_000),
  devPortalUser: process.env.DEV_PORTAL_USER,
  devPortalPass: process.env.DEV_PORTAL_PASS,
};

export function getServerApiBaseUrl() {
  return serverConfig.apiBaseUrl;
}
