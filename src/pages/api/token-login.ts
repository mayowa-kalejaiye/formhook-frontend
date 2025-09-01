import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Token Login Proxy API
 * 
 * This endpoint serves as a proxy for token-based logins (password reset, magic links, etc.)
 * It receives token login requests and redirects to the frontend's token login page.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'No login token provided' });
  }
  
  // Log for debugging
  console.log(`Received token login request with token: ${token}`);
  
  // Redirect to the frontend token login page with the token
  return res.redirect(302, `/reset-password?token=${token}`);
}
