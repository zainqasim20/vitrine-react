// Real Unsplash search -- same shape/pattern as pexels-search.js so the
// frontend can treat both sources interchangeably, normalized into the
// same PexelsPhoto-shaped fields. Unsplash's own response nests things
// differently (user.name, urls.regular, links.download_location) and
// additionally requires attribution (user.links.html, with utm_source/
// utm_medium query params per Unsplash's API Guidelines) and a download-
// tracking ping when a photo is actually used -- that ping is
// unsplash-track-download.js, a separate endpoint, since it also needs the
// access key server-side and the frontend only has the tracking URL.
import { cleanKey, isUsableKey } from './_lib/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const accessKey = cleanKey(process.env.UNSPLASH_ACCESS_KEY);
  if (!isUsableKey(accessKey)) {
    res.status(400).json({ error: 'Unsplash API key not configured' });
    return;
  }
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const query = requestUrl.searchParams.get('query') || 'abstract design';
  const perPage = requestUrl.searchParams.get('perPage') || 6;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`;
    const r = await fetch(url, { headers: { Authorization: `Client-ID ${accessKey}` } });
    const data = await r.json();
    if (!r.ok) throw new Error((data && data.errors && data.errors[0]) || `Request failed (${r.status})`);
    const photos = (data.results || []).map((p) => ({
      id: p.id,
      src: p.urls.regular,
      thumb: p.urls.small,
      width: p.width,
      height: p.height,
      photographer: p.user?.name || 'Unknown',
      photographerUrl: p.user?.links?.html ? `${p.user.links.html}?utm_source=vitrine&utm_medium=referral` : '',
      pageUrl: p.links?.html || '',
      alt: p.alt_description || '',
      downloadLocation: p.links?.download_location || '',
      source: 'unsplash',
    }));
    res.status(200).json({ photos });
  } catch (e) {
    res.status(502).json({ error: `Unsplash request failed: ${e.message}` });
  }
}
