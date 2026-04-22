import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Reset Token Proxy API
 * 
 * This endpoint exists for legacy reset-token links and redirects to the
 * frontend password reset page.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'No reset token provided' });
  }
  
  // Log for debugging
  console.log(`Received reset token request with token: ${token}`);
  
  // Redirect to the frontend reset-password page with the token
  return res.redirect(302, `/reset-password?token=${token}`);
}
