// Ported unchanged from the live site's api/[...path].js /status route.
// Reports which real backend capabilities are actually configured -- never
// assumed. The frontend gates all real-pipeline behavior on this.

import { isUsableKey } from './_lib/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(200).json({
    pexels: isUsableKey(process.env.PEXELS_API_KEY),
    unsplash: isUsableKey(process.env.UNSPLASH_ACCESS_KEY),
    gemini: isUsableKey(process.env.GEMINI_API_KEY),
    openai: isUsableKey(process.env.OPENAI_API_KEY),
  });
}
