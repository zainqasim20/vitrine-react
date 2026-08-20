// Unsplash's API Guidelines require pinging a photo's download_location
// endpoint when it's actually used in an app (not just displayed in search
// results) -- this is that ping. It has to happen server-side because the
// endpoint itself requires the access key in its Authorization header, and
// that key must never reach the browser. Only forwards to
// api.unsplash.com specifically (not an arbitrary open proxy) -- the
// `location` param is expected to be exactly the download_location URL
// unsplash-search.js already returned for that photo.
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
  const location = requestUrl.searchParams.get('location') || '';
  let target;
  try {
    target = new URL(location);
  } catch {
    res.status(400).json({ error: 'Invalid location URL' });
    return;
  }
  if (target.hostname !== 'api.unsplash.com') {
    res.status(400).json({ error: 'location must be an api.unsplash.com URL' });
    return;
  }
  try {
    const r = await fetch(target.href, { headers: { Authorization: `Client-ID ${accessKey}` } });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch (e) {
    res.status(502).json({ error: `Unsplash tracking ping failed: ${e.message}` });
  }
}
