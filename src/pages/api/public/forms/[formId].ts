// Public API endpoint to get form structure for submission (no auth required)
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Support GET for fetching form structure and POST for submitting form data
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { formId } = req.query;

  if (!formId || typeof formId !== 'string') {
    return res.status(400).json({ message: 'Form ID is required' });
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com';

    // If this is a POST request, proxy the submission to the backend
    if (req.method === 'POST') {
      try {
        const serviceToken = process.env.FORMHOOK_SERVICE_TOKEN || process.env.SERVICE_TOKEN;

        // Prefer a public submit endpoint if available
        const publicSubmitUrl = `${backendUrl}/forms/public/${formId}/submit`;
        const privateSubmitUrl = `${backendUrl}/forms/${formId}/submit`;

        const submitBody = req.body || {};

        // Try public submit first
        try {
          const publicResp = await fetch(publicSubmitUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submitBody),
          });

          const publicText = await publicResp.text();
          const contentType = publicResp.headers.get('content-type') || '';

          if (publicResp.ok) {
            if (contentType.includes('application/json')) return res.status(publicResp.status).json(JSON.parse(publicText));
            return res.status(publicResp.status).send(publicText);
          }

          console.log('Public submit failed, status:', publicResp.status, 'body:', publicText);
        } catch (err) {
          console.log('Public submit error:', err?.message || err);
        }

        // Fallback: try authenticated/private submit endpoint from server-side
        const privateHeaders: any = { 'Content-Type': 'application/json' };
        if (serviceToken) {
          // Audit log: indicate we're using the server-side service token for private submit
          // NOTE: do NOT log the token itself.
          console.log(`[Proxy] Using service token to call private submit for form ${formId}`);
          privateHeaders['Authorization'] = `Bearer ${serviceToken}`;
        } else {
          console.log(`[Proxy] No service token configured; attempting private submit without auth for form ${formId}`);
        }

        const privateResp = await fetch(privateSubmitUrl, {
          method: 'POST',
          headers: privateHeaders,
          body: JSON.stringify(submitBody),
        });

        const privateText = await privateResp.text();
        const privateContentType = privateResp.headers.get('content-type') || '';

        if (privateResp.ok) {
          if (privateContentType.includes('application/json')) return res.status(privateResp.status).json(JSON.parse(privateText));
          return res.status(privateResp.status).send(privateText);
        }

        // If we reached here both attempts failed — forward the status and body
        const statusToReturn = privateResp.status || 502;
        const bodyToReturn = (() => {
          try {
            if ((privateResp.headers.get('content-type') || '').includes('application/json')) return JSON.parse(privateText);
          } catch (e) {}
          return { message: privateText || 'Submission failed' };
        })();

        return res.status(statusToReturn).json(bodyToReturn);
      } catch (submitError) {
        console.error('Error proxying submission:', submitError);
        return res.status(500).json({ message: 'Submission proxy error' });
      }
    }

    // Otherwise, handle GET as before: fetch public endpoint, then fallback to authenticated, then local fallback
    let formData = null;

    // Try the public endpoint first
    try {
      console.log(`Trying to fetch form from: ${backendUrl}/forms/public/${formId}`);
      const publicResponse = await fetch(`${backendUrl}/forms/public/${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Backend response status: ${publicResponse.status}`);

      if (publicResponse.ok) {
        formData = await publicResponse.json();
        console.log('Got form data from public endpoint:', formData);
        return res.status(200).json(formData);
      } else {
        const errorText = await publicResponse.text();
        console.log(`Backend error response: ${errorText}`);
      }
    } catch (publicError) {
      console.log('Public endpoint error:', publicError.message);
    }

    // Temporary workaround: Try to get form data through authenticated endpoint
    // If both public and authenticated fetches fail, return a clear error message
    try {
      console.log('Trying authenticated endpoint as fallback...');
      const forwardHeaders: any = { 'Content-Type': 'application/json' };
      // Forward requester auth so owners can view private forms when signed in
      if (req.headers.authorization) forwardHeaders.authorization = req.headers.authorization as string;
      if (req.headers.cookie) forwardHeaders.cookie = req.headers.cookie as string;

      console.log('Forwarding headers to authenticated backend fetch:', Object.keys(forwardHeaders).join(', '));

      const authResponse = await fetch(`${backendUrl}/forms/${formId}`, {
        method: 'GET',
        headers: forwardHeaders,
      });

      if (authResponse.ok) {
        formData = await authResponse.json();
        console.log('Got form data from authenticated endpoint:', formData);
        return res.status(200).json(formData);
      }

      // If public endpoint failed earlier, try to use its status to pick a message
      // Note: we logged earlier when publicResponse failed, but did not keep it; use authResponse to determine access issues
      if (authResponse.status === 404) {
        return res.status(404).json({ message: 'Form not found. It may have been deleted or the ID is incorrect.' });
      }

      if (authResponse.status === 401 || authResponse.status === 403) {
        return res.status(403).json({ message: 'Access denied. This form is private or requires authentication to view.' });
      }

      // Generic backend failure: forward a helpful message and status
      const authText = await authResponse.text().catch(() => 'Unable to retrieve form metadata from backend.');
      console.log('Authenticated endpoint failed:', authResponse.status, authText);
      return res.status(authResponse.status || 502).json({ message: 'Unable to fetch form metadata from backend.', details: authText });
    } catch (authError) {
      console.log('Authenticated endpoint also failed:', authError.message);
      return res.status(502).json({ message: 'Unable to contact backend to retrieve form metadata.' });
    }
  } catch (error) {
    console.error('Error fetching form:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
