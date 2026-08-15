// Stage 7 -- Narrate endpoint. Ported unchanged from the live site's
// api/[...path].js /narrate-case-study route (same prompt, same schema,
// same error handling). Only the routing wrapper changed: this app uses
// Vercel's one-file-per-route convention instead of a single catch-all,
// and this exact handler is also mounted locally by vite-dev-api-plugin.js
// for `npm run dev` -- same function, same behavior, both places.

import { isUsableKey, callGeminiStructured, extractText, parseStructuredJson } from './_lib/gemini.js';

// Narration schema -- { problemStatement, outcomeFraming }, matching the
// live site's Narration shape exactly. The schema object itself wasn't
// pasted verbatim (only the prompt/route logic was) -- this is the direct,
// unambiguous JSON-Schema encoding of that already-real response shape,
// same STRING/OBJECT vocabulary PERCEIVE_SCHEMA already uses. Flag it if
// the real schema is actually stricter (e.g. length bounds).
const NARRATE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    problemStatement: { type: 'STRING' },
    outcomeFraming: { type: 'STRING' },
  },
  required: ['problemStatement', 'outcomeFraming'],
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
    const { categoryLabel, projectName, clientStatus, ndaFlag, outcome, tools, designSystemSheet } = req.body || {};
    const sheet = designSystemSheet || { colors: [], typography: [], components: {} };

    const colorSummary = sheet.colors && sheet.colors.length
      ? `${sheet.colors.length} extracted color(s), roles: ${sheet.colors.map((c) => c.role).join(', ')}`
      : 'no dominant colors were confidently extracted';
    const typeSummary = sheet.typography && sheet.typography.length
      ? `type scale spanning: ${sheet.typography.map((t) => t.role).join(', ')}`
      : 'no type scale was confidently extracted';
    const componentEntries = Object.entries(sheet.components || {}).filter(([, v]) => v && v.count > 0);
    const componentSummary = componentEntries.length
      ? `components present: ${componentEntries.map(([k, v]) => `${k} (${v.count})`).join(', ')}`
      : 'no reusable components were catalogued';

    let ndaInstruction = '';
    if (ndaFlag) {
      ndaInstruction = `\n\nThis project is NDA-flagged. You MUST NOT use a real client/company name, even if one is implied by the project name below -- refer to the client only as a generic placeholder (e.g. "a [industry] client" if the industry is genuinely inferable from the category/content, otherwise plainly "a client"). State the redaction plainly somewhere in the problem statement (e.g. "client details are withheld under NDA"). Never invent a replacement company name, industry, or fact to fill the gap.`;
    }

    const outcomeInstruction = outcome && outcome.trim()
      ? `\n\nThe designer described the outcome/metric as: "${outcome.trim()}". Reflect this in the outcome framing, in their own terms -- don't inflate or add specifics they didn't give.`
      : `\n\nNo outcome or metric was provided. Do not invent one -- either omit an outcome claim entirely or state plainly that no outcome metric was given.`;

    const promptText = `You are writing the problem statement and outcome framing for a portfolio case study, based only on the structured project data below -- not an image.

Category: ${categoryLabel || 'unspecified'}
Project name: ${projectName || '(untitled)'}
Client status: ${clientStatus || 'Personal'}
Tools used: ${(tools && tools.length) ? tools.join(', ') : '(not specified)'}
Design system summary: ${colorSummary}; ${typeSummary}; ${componentSummary}
${ndaInstruction}${outcomeInstruction}

Tone rules: plain, specific language. Do not use inflated adjectives ("revolutionary", "seamless", "game-changing", etc.) unless the designer's own outcome text above already used that word -- in which case you may echo it, not amplify it further.

Respond with the problem statement (2-4 sentences) and outcome framing (1-3 sentences) matching the provided schema exactly.`;

    const contents = [{ role: 'user', parts: [{ text: promptText }] }];

    const result = await callGeminiStructured(contents, NARRATE_SCHEMA, 1500);
    const text = extractText(result);
    const narration = parseStructuredJson(text);
    res.status(200).json({ narration });
  } catch (e) {
    res.status(502).json({ error: `Gemini request failed: ${e.message}` });
  }
}
