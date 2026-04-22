# Updated Authentication Integration

This document explains the changes made to support the improved authentication system in the backend.

## Backend Authentication Improvements

The backend team has made several improvements to the authentication system:

1. **Multiple login endpoints** - Added flexibility with three login methods:
   - `/auth/login` - Standard login endpoint
   - `/auth/email-login` - Email-focused login
   - `/auth/token` - OAuth2-compatible token endpoint (username/password form flow)

2. **Better error handling** - More detailed error messages and improved status codes

3. **Temporary bypass of email verification** - Email verification is now optional during development, with verification being processed in the background

## Frontend Changes

### 1. API Service Layer Updates

- Added a flexible login function in `src/services/api.ts` that tries multiple endpoints
- Added a new `loginWithToken` function for token-based authentication
- Fixed duplicate `API_BASE_URL` declaration

### 2. Auth Context Enhancements

- Added `userId` field to the user object
- Added `loginWithToken` method to the auth context
- Updated JWT token decoding to extract more user information
- Improved method parameter passing for the proxy API

### 3. New Pages

- Added `/reset-password` page that handles password reset confirmation
- Added `/forgot-password` page for requesting password resets
- Added API route `/api/token-login` as a legacy bridge for reset-token redirects

### 4. Proxy API Implementation

- Created `/api/proxy.ts` that securely forwards requests to the backend
- This is used in production to avoid CORS issues

## How it Works

### Normal Login Flow

1. User enters email/password on the login page
2. Frontend attempts login at `/auth/login`
3. If that fails with 404, it automatically tries `/auth/email-login`
4. On success, the JWT token is stored or HTTP-only cookie is set
5. User is redirected to the dashboard

### Password Reset Flow

1. User clicks "Forgot password?" on the login page
2. User enters email on the forgot-password page
3. Backend sends an email with a reset link
4. User clicks the link which contains a token
5. Frontend opens `/reset-password?token=...`
6. User sets a new password
7. Previous JWT sessions are revoked automatically

## Environment Detection

The system automatically detects the environment:

- In development (localhost), direct API calls are made
- In production, the proxy API is used to avoid CORS issues

## HTTP-only Cookies vs JWT in localStorage

The system supports both authentication methods:

- HTTP-only cookies: More secure, set by the server
- JWT in localStorage: More flexible, managed by the frontend

The method used is determined by the `NEXT_PUBLIC_USE_HTTP_ONLY_COOKIES` environment variable.
