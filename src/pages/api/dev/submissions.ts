import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    ok: false,
    error: 'Deprecated endpoint',
    message: 'Use /dashboard/summary on the backend directly. This route is no longer supported.',
  });
}
