import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Removed 'jsonwebtoken' import as it is not compatible with Next.js Edge Middleware

const PROTECTED_PATHS = ['/dashboard', '/forms', '/submissions', '/settings'];
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'changeme';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ['/dashboard/:path*', '/forms/:path*', '/submissions/:path*', '/settings/:path*'],
};
