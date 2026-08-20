// Ported unchanged from the live site's api/[...path].js /pexels-search
// route (same query params, same response shape). Only the routing wrapper
// changed: this app uses Vercel's one-file-per-route convention instead of
// a single catch-all, and this exact handler is also mounted locally by
// vite-dev-api-plugin.js for `npm run dev` -- same function, same behavior,
// both places.

import { cleanKey, isUsableKey } from './_lib/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const pexelsKey = cleanKey(process.env.PEXELS_API_KEY);
  if (!isUsableKey(pexelsKey)) {
    res.status(400).json({ error: 'Pexels API key not configured' });
    return;
  }
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const query = requestUrl.searchParams.get('query') || 'abstract design';
  const perPage = requestUrl.searchParams.get('perPage') || 6;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
    const r = await fetch(url, { headers: { Authorization: pexelsKey } });
    const data = await r.json();
    if (!r.ok) throw new Error((data && data.error) || `Request failed (${r.status})`);
    const photos = (data.photos || []).map((p) => ({
      id: p.id,
      src: p.src.large,
      thumb: p.src.medium,
      width: p.width,
      height: p.height,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      pageUrl: p.url,
      alt: p.alt,
      source: 'pexels',
    }));
    res.status(200).json({ photos });
  } catch (e) {
    res.status(502).json({ error: `Pexels request failed: ${e.message}` });
  }
}
