// Real per-image AI drafting -- not one of the 7 named pipeline stages (the
// pre-existing "draft a section per screen" feature the landing page itself
// describes). Ported unchanged from the live site's maybeDraftAI: a single
// attempt, no retry/backoff loop -- unlike Perceive, a failed draft surfaces
// immediately and the designer retries manually via "Try again"/"Regenerate",
// never a silent auto-retry burning quota behind their back.

async function readJsonResponse(resp: Response): Promise<{ raw: string }> {
  const raw = await resp.text();
  let data: { error?: string; raw?: string };
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (resp.status === 413) throw new Error('That image is too large to send to the AI.');
    throw new Error(`Analyze-image request failed (status ${resp.status})`);
  }
  if (!resp.ok || data.error) throw new Error(data.error || `Analyze-image request failed (${resp.status})`);
  return { raw: data.raw || '' };
}

export async function draftCaption(imageBase64: string, mimeType: string, briefA: string, briefB: string): Promise<string> {
  const resp = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, briefA, briefB }),
  });
  const data = await readJsonResponse(resp);
  return data.raw;
}
