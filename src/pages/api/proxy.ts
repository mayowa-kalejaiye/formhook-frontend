import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Extract the target URL and data from the request body
    const { url, data, method = 'POST', headers = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    console.log('[Proxy] Forwarding request to:', url);
    
    // Forward credentials and headers
    const config = {
      method: method,
      url,
      data,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        // Forward cookies if they exist
        ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
        // Forward authorization header if it exists
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
      },
      withCredentials: true,
      validateStatus: (status) => true, // Don't throw on any status
    };
    
    // Make the request to the API
    const apiResponse = await axios(config);
    
    console.log('[Proxy] API Response:', {
      status: apiResponse.status,
      headers: apiResponse.headers,
      data: apiResponse.data
    });

    // Forward cookies from the API response
    if (apiResponse.headers['set-cookie']) {
      // Normalize cookies so they are valid for the frontend domain.
      // Some backends set the Domain attribute to the API domain which prevents the browser
      // from sending the cookie to the frontend-origin proxy on subsequent requests.
      const incomingCookies: string[] = Array.isArray(apiResponse.headers['set-cookie'])
        ? apiResponse.headers['set-cookie']
        : [String(apiResponse.headers['set-cookie'])];

      const normalized = incomingCookies.map(raw => {
        // Remove Domain attributes to ensure cookie is set for the current origin
        let parts = raw.split(/;\s*/).filter(Boolean);
        parts = parts.filter(p => !/^Domain=/i.test(p));

        // Ensure Path is set to / so cookie is sent on all requests
        if (!parts.some(p => /^Path=/i.test(p))) {
          parts.push('Path=/');
        }

        // Keep SameSite and Secure flags if present, otherwise set SameSite=None for cross-site compatibility
        if (!parts.some(p => /^SameSite=/i.test(p))) {
          parts.push('SameSite=None');
        }

        return parts.join('; ');
      });

      // Set the normalized cookies on the response so browser stores them on the frontend origin
      res.setHeader('Set-Cookie', normalized);
    }

    // Forward the API response
    return res.status(apiResponse.status).json(apiResponse.data);
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Handle errors and forward them to the client
    if (axios.isAxiosError(error) && error.response) {
      // Forward the exact error from the API
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Generic error
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
