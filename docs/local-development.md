# Local Development with Live Backend

When developing locally but using a live backend, email verification links can be problematic.

## The Issue

1. You sign up on your local frontend: `http://localhost:3000`
2. The live backend sends an email with verification link: `https://formhook-backend.onrender.com/verify-email?token=...`
3. Clicking this link fails because:
   - It goes to the backend which doesn't have a handler
   - Even if the backend had a redirect, it would redirect to the production frontend, not your local instance

## Local Development Solutions

### Option 1: Manual Token Transfer (Quick & Easy)

1. Sign up on your local frontend
2. When you receive the verification email, copy just the token part from the URL
3. Manually navigate to `http://localhost:3000/verify-email?token=YOUR_TOKEN`

### Option 2: Configure Local Proxy (Recommended)

A proxy page has been set up at:
```
/api/verify-email
```

This will capture verification requests and redirect them to your local verification page.

To use this:

1. Modify verification emails during development to use:
   ```
   http://localhost:3000/api/verify-email?token=${token}
   ```

2. Or, for the backend developer: add a check to send different verification URLs based on the origin:
   ```javascript
   // Example backend code
   const getVerificationUrl = (token, origin) => {
     // If request came from localhost, use the local proxy endpoint
     if (origin && origin.includes('localhost')) {
       return `${origin}/api/verify-email?token=${token}`;
     }
     // Otherwise use production frontend
     return `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
   }
   ```

### Option 3: Use ngrok for Development

1. Install ngrok: `npm install -g ngrok`
2. Run your frontend: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok URL provided (e.g., `https://abc123.ngrok.io`) as your frontend URL
5. Update your backend's allowed origins to include this URL
6. Ask backend to send verification emails to this temporary URL

## Production Deployment

Before deploying to production:

1. Ensure your backend sends verification emails with links to your production frontend URL
2. The verification endpoint should be properly configured on your frontend
3. Test the entire flow in production to confirm it's working
