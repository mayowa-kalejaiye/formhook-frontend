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
      res.setHeader('Set-Cookie', apiResponse.headers['set-cookie']);
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
