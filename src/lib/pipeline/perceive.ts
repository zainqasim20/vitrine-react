// Stage 1 -- Perceive. Ported unchanged (same retry/backoff schedule, same
// normalization discipline) from the live site's lib/pipeline/perceive.js.
// One structured Gemini call per uploaded image, proxied through
// /api/perceive-image (JSON-mode / structured output server-side, not
// free-text parsing). Returns a fixed-shape Image Feature Record; callers
// are responsible for caching it per image -- this module never re-derives one.
//
// Only the module format changed (ES module instead of a global-attaching
// <script>, since this app is Vite-bundled) -- see classify.ts for the same note.

import type { ImageFeatureRecord } from './types';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A platform-level error (e.g. the request body exceeding the server's size
// limit) comes back as plain text, not JSON -- resp.json() would throw a raw
// parser exception in that case. Always surfaces a clean, real error instead.
async function readJsonResponse(resp: Response): Promise<{ record: unknown }> {
  const raw = await resp.text();
  let data: { error?: string; record?: unknown };
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (resp.status === 413) throw new Error('That image is too large to send to the AI.');
    throw new Error(`Perceive request failed (status ${resp.status})`);
  }
  if (!resp.ok || data.error) throw new Error(data.error || `Perceive request failed (${resp.status})`);
  return data as { record: unknown };
}

// Fills in a safe, honest default for any field Gemini omitted -- never
// invents a positive signal, only guarantees every consumer can read every
// field without a null check.
export function normalizeRecord(raw: unknown): ImageFeatureRecord {
  const r = (raw || {}) as Partial<ImageFeatureRecord> & Record<string, unknown>;
  const chrome = (r.chrome || {}) as Partial<ImageFeatureRecord['chrome']>;
  const contentType = (r.contentType || {}) as Partial<ImageFeatureRecord['contentType']>;
  return {
    aspectRatio: (r.aspectRatio as ImageFeatureRecord['aspectRatio']) || 'other',
    chrome: {
      browserChrome: !!chrome.browserChrome,
      osChrome: chrome.osChrome || 'none',
      deviceFrame: chrome.deviceFrame || 'none',
      designToolUI: !!chrome.designToolUI,
    },
    contentType: {
      isUIScreen: !!contentType.isUIScreen,
      isLogoOrMark: !!contentType.isLogoOrMark,
      isIllustration: !!contentType.isIllustration,
      isPrintLayout: !!contentType.isPrintLayout,
      isPackaging: !!contentType.isPackaging,
      is3DRender: !!contentType.is3DRender,
      isArchitecturalRender: !!contentType.isArchitecturalRender,
      isMoodboardOrPalette: !!contentType.isMoodboardOrPalette,
    },
    dominantColors: Array.isArray(r.dominantColors)
      ? r.dominantColors
          .filter((c) => c && typeof c.hex === 'string')
          .slice(0, 6)
          .map((c) => ({ hex: c.hex, role: c.role || 'unknown', coverage: typeof c.coverage === 'number' ? c.coverage : 0 }))
      : [],
    typeSizeBands: Array.isArray(r.typeSizeBands)
      ? r.typeSizeBands
          .filter((b) => b && b.band)
          .map((b) => ({ band: b.band, approxPx: typeof b.approxPx === 'number' ? b.approxPx : 0, styleDescription: String(b.styleDescription || '') }))
      : [],
    components: Array.isArray(r.components) ? r.components.filter((c): c is string => typeof c === 'string') : [],
    mockupStaging: (r.mockupStaging as ImageFeatureRecord['mockupStaging']) || 'raw-screen',
  };
}

// Retries on any failure (network error or non-2xx from our own proxy --
// Gemini free-tier rate limits surface as a proxied 502/429 either way) with
// exponential backoff, then surfaces the real error so the caller can fall
// back to asking the designer instead of crashing the pipeline.
export async function perceiveImage(imageBase64: string, mimeType: string): Promise<ImageFeatureRecord> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await fetch('/api/perceive-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const data = await readJsonResponse(resp);
      return normalizeRecord(data.record);
    } catch (e) {
      lastError = e;
      if (attempt < MAX_ATTEMPTS) await wait(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Perceive request failed');
}
