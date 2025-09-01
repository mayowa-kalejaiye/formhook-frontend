# Backend Email Verification Implementation

## Quick Fix for Verification Links

Currently your verification emails are sending links to:
```
https://formhook-backend.onrender.com/verify-email?token=...
```

But your backend doesn't have a handler for this URL, causing a "Not Found" error.

## Immediate Solution (for Backend Developer)

Add this simple redirect endpoint to your backend:

### For FastAPI:

```python
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
import os

# Add to your existing FastAPI app
@app.get("/verify-email")
async def redirect_to_frontend(token: str):
    """Redirects email verification links to the frontend verification page"""
    frontend_url = os.getenv("FRONTEND_URL", "https://formhook-frontend.vercel.app")
    redirect_url = f"{frontend_url}/verify-email?token={token}"
    return RedirectResponse(url=redirect_url)
```

### For Express.js:

```javascript
// Add to your Express.js app
app.get('/verify-email', (req, res) => {
  const { token } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://formhook-frontend.vercel.app';
  res.redirect(`${frontendUrl}/verify-email?token=${token}`);
});
```

## Long-term Solution

1. Update your email templates to send links directly to the frontend:
   ```
   ${FRONTEND_URL}/verify-email?token=${token}
   ```

2. Ensure your backend API has a `/auth/verify-email` endpoint that can process 
   verification tokens sent from the frontend.

## Testing

After implementing this fix:
1. Sign up with a new email
2. Receive the verification email 
3. Click the link - it should now redirect to your frontend
4. Your frontend verification page should process the token correctly
