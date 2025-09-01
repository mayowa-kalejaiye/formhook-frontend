# CORS Configuration Guide for Backend

## Current Issue

The frontend deployed at `https://formhook-frontend.vercel.app` is encountering CORS errors when trying to communicate with the backend at `https://formhook-backend.onrender.com`.

Error message:

```plaintext
Access to XMLHttpRequest at 'https://formhook-backend.onrender.com/auth/login' from origin 'https://formhook-frontend.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Required Backend Configuration

### For FastAPI

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://formhook-frontend.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# The rest of your FastAPI app...
```

### For Express.js

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS middleware configuration
app.use(cors({
  origin: ["https://formhook-frontend.vercel.app", "http://localhost:3000"],
  credentials: true,  // Important for cookies/auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// The rest of your Express app...
```

## Important CORS Considerations

1. **Preflight Requests**: Browsers send an OPTIONS request before POST/PUT/DELETE requests. Make sure your server properly handles OPTIONS requests.

2. **Credentials**: If using cookies or HTTP authentication, make sure `credentials: true` is set and the `Access-Control-Allow-Credentials: true` header is returned.

3. **Headers**: Ensure that all headers used by the frontend are in the `Access-Control-Allow-Headers` list.

4. **Methods**: Make sure all HTTP methods used by the frontend are in the `Access-Control-Allow-Methods` list.

## Testing CORS Configuration

After updating the backend configuration:

1. Make a test request from the deployed frontend
2. Check the browser's Network tab in Dev Tools
3. Verify that the preflight OPTIONS request succeeds with a 200 or 204 status
4. Confirm that the actual request includes the proper CORS headers in the response

## Additional Resources

- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [Express CORS Documentation](https://expressjs.com/en/resources/middleware/cors.html)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
