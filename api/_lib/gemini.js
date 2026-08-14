// Shared Gemini helpers, ported unchanged from the live site's
// api/[...path].js (the parts used by /api/perceive-image and /api/status
// so far -- more routes will pull from here as later pipeline stages get
// wired in). ES module, since this project's package.json sets
// "type": "module" (the live site has no bundler and used CommonJS
// module.exports/require instead) -- packaging only, same logic.

const GEMINI_MODEL = 'gemini-flash-latest';

// Strips a leading BOM (U+FEFF) and surrounding whitespace. Found by actually
// running this against the live site: a key set via `vercel env add` over a
// PowerShell-piped stdin picked up a literal U+FEFF character, which fetch()
// then rejected as an invalid header value. Trimming here makes this robust
// regardless of how a key got polluted.
export function cleanKey(k) {
  let s = String(k || '');
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  return s.trim();
}

export function isUsableKey(k) {
  const c = cleanKey(k);
  return c.length > 0 && !c.includes('...');
}

// Reads Gemini's own HTTP response. Gemini's API can itself reject an
// oversized request (its inline-image size limit is separate from, and can
// be stricter than, the platform's request body limit) with a non-JSON
// response -- a plain-text or HTML error page, not the JSON body naively
// expected. Reads as text first so a raw parser SyntaxError never leaks
// into a client-facing error message.
async function readGeminiResponse(resp) {
  const raw = await resp.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (resp.status === 413) throw new Error('The image is too large for Gemini to process.');
    throw new Error(`Gemini did not return a valid response (status ${resp.status}).`);
  }
  if (!resp.ok) {
    const message = (data && data.error && data.error.message) || `Gemini request failed (${resp.status})`;
    throw new Error(message);
  }
  return data;
}

// Structured-output call: constrains the response to a fixed JSON Schema
// server-side so the client never parses free text. No thinkingConfig: this
// model rejects thinkingBudget=0 as an invalid argument (confirmed against
// the real API) -- the fix is generous maxOutputTokens headroom instead.
export async function callGeminiStructured(contents, schema, maxOutputTokens) {
  const uri = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const resp = await fetch(uri, {
    method: 'POST',
    headers: { 'x-goog-api-key': cleanKey(process.env.GEMINI_API_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens, responseMimeType: 'application/json', responseSchema: schema },
    }),
  });
  return readGeminiResponse(resp);
}

// Free-text call (no responseSchema) -- used where the prompt itself asks
// for JSON-shaped prose (e.g. analyze-image's headline/body draft) rather
// than constraining the response server-side.
export async function callGemini(contents, maxOutputTokens) {
  const uri = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const resp = await fetch(uri, {
    method: 'POST',
    headers: { 'x-goog-api-key': cleanKey(process.env.GEMINI_API_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens },
    }),
  });
  return readGeminiResponse(resp);
}

export function extractText(result) {
  const candidate = result.candidates && result.candidates[0];
  const text = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;
  if (!text) {
    const finishReason = candidate && candidate.finishReason;
    throw new Error(`The model returned no text (finishReason: ${finishReason}) -- likely ran out of output tokens on internal reasoning before writing an answer`);
  }
  return text;
}

// Structured-output mode should always return valid JSON, but "should" isn't
// "will" -- fails with a clean, real error instead of a raw parser exception.
export function parseStructuredJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The model returned something that could not be read as valid data.');
  }
}
