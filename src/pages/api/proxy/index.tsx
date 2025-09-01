import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API Proxy for backend requests - helps bypass CORS issues
 * This is a temporary solution until CORS is properly configured on the backend
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, data, headers = {} } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`Proxying request to: ${url}`);
    
    // Make the request to the backend
    const backendResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    // Get the response data
    let responseData;
    const contentType = backendResponse.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await backendResponse.json();
    } else {
      responseData = await backendResponse.text();
    }

    // Return the response from the backend
    return res.status(backendResponse.status).json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy request to backend' });
  }
}
