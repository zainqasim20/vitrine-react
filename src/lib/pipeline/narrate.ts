import type { NarrateInput, Narration } from './types';

// Stage 7 -- Narrate. The pipeline's last Gemini call (Perceive was the
// first) -- text-only, no images, proxied through /api/narrate-case-study
// with structured JSON-mode output. Takes Interview answers + Extract's
// design system sheet + the confirmed category and generates a problem
// statement + outcome framing (docs/ai-system-prompt.md Part 7).
//
// Ported verbatim from the live site's narrate.js, including its retry
// discipline -- 3 attempts with exponential backoff, same as perceive.js
// (unlike Draft's single-attempt /api/analyze-image call).

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A platform-level error comes back as plain text, not JSON -- resp.json()
// would throw a raw parser exception in that case. Always surfaces a clean,
// real error instead.
async function readJsonResponse(resp: Response): Promise<{ narration?: { problemStatement?: string; outcomeFraming?: string } } & { error?: string }> {
  const raw = await resp.text();
  let data: { narration?: { problemStatement?: string; outcomeFraming?: string } } & { error?: string };
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Narrate request failed (status ${resp.status})`);
  }
  if (!resp.ok || data.error) throw new Error(data.error || `Narrate request failed (${resp.status})`);
  return data;
}

// Retries on any failure (network error or non-2xx) with exponential
// backoff, then surfaces the real error so the caller can fall back to
// leaving the intro block out rather than crashing.
export async function narrateCaseStudy(input: NarrateInput): Promise<Narration> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await fetch('/api/narrate-case-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await readJsonResponse(resp);
      return {
        problemStatement: String(data.narration?.problemStatement || '').trim(),
        outcomeFraming: String(data.narration?.outcomeFraming || '').trim(),
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('Narrate request failed');
      if (attempt < MAX_ATTEMPTS) await wait(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }
  throw lastError || new Error('Narrate request failed');
}
