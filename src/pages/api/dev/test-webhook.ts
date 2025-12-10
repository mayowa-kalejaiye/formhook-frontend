import type { NextApiRequest, NextApiResponse } from 'next';

// Server-side webhook tester: sends a POST to the provided webhook URL and
// returns the response body and status. This avoids CORS when testing external
// webhook endpoints from the browser.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, payload } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    });

    const text = await resp.text();
    return res.status(200).json({ ok: true, status: resp.status, body: text });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
