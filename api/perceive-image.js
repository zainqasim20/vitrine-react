// Stage 1 -- Perceive endpoint. Ported unchanged from the live site's
// api/[...path].js /perceive-image route (same prompt, same schema, same
// error handling). Only the routing wrapper changed: this app uses Vercel's
// one-file-per-route convention instead of a single catch-all, and this
// exact handler is also mounted locally by vite-dev-api-plugin.js for
// `npm run dev` -- same function, same behavior, both places.

import { isUsableKey, callGeminiStructured, extractText, parseStructuredJson } from './_lib/gemini.js';

// Image Feature Record schema -- see docs/ai-system-prompt.md Part 1.1.
// Type descriptions are style-only (band + description), never a guessed
// font name, per that spec's explicit rule.
const PERCEIVE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    aspectRatio: { type: 'STRING', enum: ['16:9', '9:16', '4:3', '3:4', '1:1', 'other'] },
    chrome: {
      type: 'OBJECT',
      properties: {
        browserChrome: { type: 'BOOLEAN' },
        osChrome: { type: 'STRING', enum: ['none', 'macOS', 'Windows', 'iOS', 'Android'] },
        deviceFrame: { type: 'STRING', enum: ['none', 'laptop', 'phone', 'tablet', 'watch'] },
        designToolUI: { type: 'BOOLEAN' },
      },
      required: ['browserChrome', 'osChrome', 'deviceFrame', 'designToolUI'],
    },
    contentType: {
      type: 'OBJECT',
      properties: {
        isUIScreen: { type: 'BOOLEAN' },
        isLogoOrMark: { type: 'BOOLEAN' },
        isIllustration: { type: 'BOOLEAN' },
        isPrintLayout: { type: 'BOOLEAN' },
        isPackaging: { type: 'BOOLEAN' },
        is3DRender: { type: 'BOOLEAN' },
        isArchitecturalRender: { type: 'BOOLEAN' },
        isMoodboardOrPalette: { type: 'BOOLEAN' },
      },
      required: ['isUIScreen', 'isLogoOrMark', 'isIllustration', 'isPrintLayout', 'isPackaging', 'is3DRender', 'isArchitecturalRender', 'isMoodboardOrPalette'],
    },
    dominantColors: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          hex: { type: 'STRING' },
          role: { type: 'STRING', enum: ['background', 'primary', 'secondary', 'accent', 'text', 'unknown'] },
          coverage: { type: 'NUMBER' },
        },
        required: ['hex', 'role', 'coverage'],
      },
    },
    typeSizeBands: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          band: { type: 'STRING', enum: ['display', 'heading', 'body', 'caption'] },
          approxPx: { type: 'NUMBER' },
          styleDescription: { type: 'STRING' },
        },
        required: ['band', 'approxPx', 'styleDescription'],
      },
    },
    components: { type: 'ARRAY', items: { type: 'STRING' } },
    mockupStaging: { type: 'STRING', enum: ['raw-screen', 'device-frame', 'browser-frame', 'presentation-scene', 'print-mockup'] },
  },
  required: ['aspectRatio', 'chrome', 'contentType', 'dominantColors', 'typeSizeBands', 'components', 'mockupStaging'],
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    if (!isUsableKey(process.env.GEMINI_API_KEY)) {
      res.status(400).json({ error: 'Gemini API key not configured or incomplete' });
      return;
    }
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }
    const mediaType = mimeType || 'image/png';

    const promptText = `You are extracting only visually-verifiable structural features from one uploaded design screenshot, for a portfolio case-study tool's classification step.

Report only what is actually visible. Never guess an exact font name -- describe type by size band and style only (e.g. "bold sans, tight tracking"). Never invent content, colors, or components you can't see. If something isn't present or isn't determinable, use the most conservative/neutral value for that field rather than guessing positively.

For the "components" list, use these definitions -- only list a type if the screen actually contains it:
- "button": a rectangle with a corner radius, containing short (1-4 word) text, with a visible fill or border distinct from the surrounding background.
- "card": a bordered or shadowed rectangular region grouping an image and/or heading and body text, repeated 2+ times in a grid or list.
- "icon" or "icon-grid": small glyph-like shapes, standalone or paired with a short label, repeated across the screen.
- "form-field": a label paired with an outlined or underlined input-shaped region.
- "nav-bar": a row or column of repeated icon+label or text-only items positioned at a screen edge.
- "badge": a small pill or rounded-rect shape containing 2 or fewer words or a single number, without an obvious click affordance.
- "table": a grid of aligned rows and columns of text/numbers with visible or implied row dividers.
- "chart": axis lines paired with bars, line paths, or discrete data points.

Respond with the Image Feature Record matching the provided schema exactly.`;

    const contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: mediaType, data: imageBase64 } },
          { text: promptText },
        ],
      },
    ];

    const result = await callGeminiStructured(contents, PERCEIVE_SCHEMA, 2000);
    const text = extractText(result);
    const record = parseStructuredJson(text);
    res.status(200).json({ record });
  } catch (e) {
    res.status(502).json({ error: `Gemini request failed: ${e.message}` });
  }
}
