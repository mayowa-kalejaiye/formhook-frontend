import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Email Verification Proxy API
 * 
 * This endpoint serves as a proxy for email verification when developing locally
 * with a live backend. When the backend sends verification emails with links to
 * its own domain, those links won't work with a local frontend.
 * 
 * This endpoint:
 * 1. Receives verification requests from emails (to the backend domain)
 * 2. Redirects to the local frontend verification page with the token
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'No verification token provided' });
  }
  
  // Log for debugging
  console.log(`Received verification request with token: ${token}`);
  
  // Redirect to the frontend verification page with the token
  return res.redirect(302, `/verify-email?token=${token}`);
}
