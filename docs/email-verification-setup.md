# Email Verification Setup Guide

## Issue: Email Verification Not Working

When a user clicks a verification link, they are currently directed to:
```
https://formhook-backend.onrender.com/verify-email?token=<TOKEN>
```

This URL returns a `{"detail":"Not Found"}` error because the backend doesn't have a handler for this endpoint.

## Solution: Backend Email Verification Handling

### Option 1: Redirect to Frontend (Recommended)

The verification link in emails should either:

1. **Point directly to the frontend**:
   ```
   https://formhook-frontend.vercel.app/verify-email?token=<TOKEN>
   ```

2. **OR have the backend redirect to frontend**:
   - Add a route in your backend that redirects verification links to the frontend
   - Example implementation (Python/FastAPI):

   ```python
   @app.get("/verify-email")
   async def redirect_verification(token: str):
       # Redirect to frontend verification page with the token
       frontend_url = os.getenv("FRONTEND_URL", "https://formhook-frontend.vercel.app")
       redirect_url = f"{frontend_url}/verify-email?token={token}"
       return RedirectResponse(url=redirect_url)
   ```

### Option 2: Handle Verification on Backend

If you prefer to handle verification directly on the backend:

1. **Create a verification endpoint**:
   ```python
   @app.get("/verify-email")
   async def verify_email(token: str, request: Request):
       # Verify the token
       success, message = await verify_user_email(token)
       
       # Return a simple HTML response
       if success:
           return HTMLResponse(content="""
           <html>
               <head><title>Email Verified</title></head>
               <body>
                   <h1>Email Verified Successfully!</h1>
                   <p>Your email has been verified. You can now <a href="https://formhook-frontend.vercel.app/login">login to your account</a>.</p>
               </body>
           </html>
           """)
       else:
           return HTMLResponse(content=f"""
           <html>
               <head><title>Verification Failed</title></head>
               <body>
                   <h1>Verification Failed</h1>
                   <p>{message}</p>
                   <p><a href="https://formhook-frontend.vercel.app/resend-verification">Request a new verification email</a></p>
               </body>
           </html>
           """, status_code=400)
   ```

## Configuration

For Option 1, make sure your backend has environment variables for the frontend URL:

```
FRONTEND_URL=https://formhook-frontend.vercel.app
```

## Email Template Update

Ensure your email template uses the correct verification URL:

```html
<a href="${FRONTEND_URL}/verify-email?token=${verificationToken}">Verify your email</a>
```

Or if using backend redirect:

```html
<a href="${BACKEND_URL}/verify-email?token=${verificationToken}">Verify your email</a>
```

## Testing Verification

1. Sign up with a new email
2. Check that the verification email is sent
3. Click the verification link
4. Verify you're redirected to the frontend verification page
5. Confirm the success message appears
