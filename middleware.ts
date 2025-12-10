import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { serverConfig } from './src/lib/serverConfig';

const PROTECTED_PATHS = ['/dashboard', '/forms', '/submissions', '/settings'];
const DEV_PROTECTED_PATHS = ['/dev', '/api/dev'];
const DEV_USER = serverConfig.devPortalUser;
const DEV_PASS = serverConfig.devPortalPass;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (DEV_PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    if (!DEV_USER || !DEV_PASS) {
      // If no credentials configured, allow access (useful for local dev)
      return NextResponse.next();
    }
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Basic ')) {
      return basicAuthRequired(request);
    }
    const decoded = decodeBasicAuth(authorization);
    if (!decoded) {
      return basicAuthRequired(request);
    }
    const [user, pass] = decoded;
    if (user !== DEV_USER || pass !== DEV_PASS) {
      return basicAuthRequired(request);
    }
    return NextResponse.next();
  }

  if (!PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  // NOTE: JWT verification should be done in your backend/API routes, not in middleware.
  // Here, we only check for token presence.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/forms/:path*', '/submissions/:path*', '/settings/:path*', '/dev/:path*', '/api/dev/:path*'],
};

function decodeBasicAuth(header: string): [string, string] | null {
  try {
    const base64Credentials = header.split(' ')[1];
    if (!base64Credentials) return null;
    const decoded = (globalThis.atob || atob)(base64Credentials);
    const sepIndex = decoded.indexOf(':');
    if (sepIndex === -1) return null;
    const username = decoded.slice(0, sepIndex);
    const password = decoded.slice(sepIndex + 1);
    return [username, password];
  } catch (error) {
    return null;
  }
}

function basicAuthRequired(request: NextRequest) {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="FormHook Dev", charset="UTF-8"',
    },
  });
}
