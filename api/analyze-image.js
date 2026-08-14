// Real per-image AI drafting endpoint (not one of the 7 named pipeline
// stages -- the pre-existing "draft a section per screen" feature the
// landing page itself describes). Ported unchanged from the live site's
// api/[...path].js /analyze-image route (same prompt, same free-text call,
// same error handling). Only the routing wrapper changed -- see
// perceive-image.js for the same note.

import { isUsableKey, callGemini, extractText } from './_lib/gemini.js';

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
    const { briefA, briefB, imageBase64, mimeType } = req.body || {};
    const mediaType = mimeType || 'image/png';

    let briefContext;
    if (briefA || briefB) {
      briefContext = "The uploader gave this context for this specific screen -- use it directly, let it shape the headline and body, don't ignore it:\n";
      if (briefA) briefContext += `- What this screen is for: ${briefA}\n`;
      if (briefB) briefContext += `- What to highlight: ${briefB}\n`;
    } else {
      briefContext = 'The uploader gave no extra context for this screen -- infer everything from the screenshot alone.';
    }

    const promptText = `You are analyzing a real product screenshot to draft one section of a UX case study.

${briefContext}

Respond with ONLY valid JSON, no markdown code fences, matching exactly this shape:
{
  "headline": "a punchy 4-10 word headline for this section, grounded in what is actually visible",
  "body": "2-4 sentences of case-study prose about this specific screen, written like a designer explaining a decision"
}`;

    const contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: mediaType, data: imageBase64 } },
          { text: promptText },
        ],
      },
    ];

    const result = await callGemini(contents, 2000);
    const text = extractText(result);
    res.status(200).json({ raw: text });
  } catch (e) {
    res.status(502).json({ error: `Gemini request failed: ${e.message}` });
  }
}
