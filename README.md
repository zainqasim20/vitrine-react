# Vitrine (React rebuild)

A from-scratch React + TypeScript + Vite implementation of Vitrine, built to
replace the vanilla-JS `app.js` architecture while keeping pixel/behavior
parity with the real, deployed site. Runs standalone — does not touch or
depend on the original live site's repo or Vercel project.

## Status

**Core flow (UI):** Landing → Upload → Waiting → Questions* → Review →
Refine → Publish, fully built and pixel-matched against the live design.
Dashboard, full Template Gallery, Showcase, and Settings are honest stub
pages for now (not yet built).

**Real AI pipeline:** Stage 1 (Perceive) and Stage 2 (Classify) are wired
in and confirmed working against the real Gemini API — ported unchanged
from the live site's `lib/pipeline/perceive.js` / `classify.js` (same
thresholds, same retry/backoff). Real results are visible via a small
dev-only badge on the Review screen (only renders when a Gemini key is
configured). Interview/Extract/Present/Validate/Narrate are not wired in
yet — see the *next steps* section.

\* The Questions screen collects different fields than the real site's
Interview stage right now — that reconciliation is planned but not done.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in GEMINI_API_KEY (and PEXELS_API_KEY / OPENAI_API_KEY as needed)
npm run dev
```

`npm run dev` mounts `/api/status` and `/api/perceive-image` locally via
`vite-dev-api-plugin.js`, which runs the exact same handler files Vercel
would run in production (see below) — not a parallel reimplementation.

## API routes (`/api`)

Standard Vercel Node Serverless Functions, one file per route:

- `api/status.js` — reports which of `GEMINI_API_KEY` / `PEXELS_API_KEY` /
  `OPENAI_API_KEY` are configured. The frontend gates all real-pipeline
  behavior on this; nothing is ever assumed.
- `api/perceive-image.js` — Stage 1/Perceive: one structured Gemini vision
  call per image.
- `api/_lib/gemini.js` — shared Gemini request/response helpers.

## Deploying

This is meant to be its own separate Vercel project (**not** added to the
live site's existing project) so the two apps stay fully independent:

1. Push this repo to GitHub.
2. Import it into a new Vercel project.
3. Set `GEMINI_API_KEY` (and `PEXELS_API_KEY` / `OPENAI_API_KEY` once
   those stages are wired in) as Environment Variables for both
   Production and Preview.
4. Vercel auto-detects the Vite build (`npm run build` → `dist/`) and the
   `/api` functions — no extra config needed.

## Next steps

Per the agreed reconciliation plan: rebuild the remaining screens to match
the real site's actual behavior (Classify/Fallback question, real
Interview fields, editable Design System screen, dynamic Present-driven
canvas, real Preview page) and drop the screens that have no real
counterpart (Waiting animation, Questions quiz, clarifying-question modal,
AI-variant generation) — in small, individually-verified steps, same as
Perceive/Classify above.
