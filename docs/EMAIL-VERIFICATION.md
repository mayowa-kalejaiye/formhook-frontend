# Email Verification System

This guide explains how to work with the email verification system in the FormHook application, especially when developing locally with a live backend.

## How Verification Works

1. User signs up with email/password
2. Backend sends verification email with a link
3. User clicks link in email
4. Frontend verifies token with backend
5. User is verified and can login

## Current Issue

When working with a local frontend (`http://localhost:3000`) and a live backend (`https://formhook-backend.onrender.com`), the verification links in emails point to the backend URL, causing a "Not Found" error when clicked.

## Immediate Solutions

### Solution 1: Manual Token Transfer

When you receive a verification email with a link like:

```plaintext
https://formhook-backend.onrender.com/verify-email?token=12345abcde
```

1. Copy just the token part (`12345abcde`)
2. Go to your local frontend: `http://localhost:3000/verify-email?token=12345abcde`
3. The verification should process successfully

### Solution 2: Use the Verification Test Script

We've provided a script to test verification tokens directly:

```bash
# Install dependencies if needed
npm install axios

# Run the script with your token
node scripts/verify-token.js YOUR_TOKEN
```

This will test if the token is valid without needing to go through the frontend.

### Solution 3: Temporarily Modify the Frontend

We've added a proxy page at `/api/verify-email` that will redirect to the correct verification page on your local frontend.

Ask the backend developer to temporarily modify the verification email URLs to:

```plaintext
http://localhost:3000/api/verify-email?token=${token}
```

## Long-term Solution

The proper solution requires coordination with the backend:

1. Backend should check the origin of the signup request
2. If it's from localhost, send verification links to localhost
3. If it's from production, send verification links to production frontend

## Testing Verification Flow

1. Start your local frontend: `npm run dev`
2. Sign up with a new email
3. Check your email for the verification link
4. If the link points to the backend, use one of the solutions above
5. Verify your email is verified by trying to log in

## Need Help?

Check the documentation in:

- `docs/email-verification-setup.md` - General setup guide
- `docs/backend-verification-fix.md` - Backend fix instructions
- `docs/local-development.md` - Local development with live backend
