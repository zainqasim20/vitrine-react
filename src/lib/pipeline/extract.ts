// Stage 4 -- Extract. Ported unchanged from the live site's
// lib/pipeline/extract.js. Consumes every uploaded image's cached Stage 1
// (Perceive) records for a project and produces one DESIGN_SYSTEM_SHEET
// (docs/ai-system-prompt.md Part 4.1). Pure aggregation only -- no Gemini
// call, no re-analysis of pixels, reads only what Perceive already cached,
// same discipline as Classify.
//
// Two fields in the spec's DESIGN_SYSTEM_SHEET example assume data the
// Stage 1 Image Feature Record schema doesn't actually capture (see
// docs/ai-system-prompt.md Part 1.1): component bounding-box positions
// (needed for Part 4.3's spacing-gap measurement) and per-component visual
// variants. Rather than fabricate either, this always reports
// spacingGrid.baseUnit as "unknown" and components.*.variants as [] --
// honest absence, not a guess dressed up as a finding.
//
// Only the module format changed (ES module instead of a global-attaching
// <script>) -- see classify.ts for the same note.

import type { DesignSystemColor, DesignSystemComponentEntry, DesignSystemSheet, DesignSystemTypography, ImageFeatureRecord } from './types';

const MAX_COLORS = 12;
const BANDS = ['display', 'heading', 'body', 'caption'] as const;

// Stage 1's free-form component strings -> the sheet's fixed bucket set.
// Unrecognized strings are ignored rather than guessed into a bucket.
const COMPONENT_BUCKET: Record<string, string> = {
  button: 'buttons',
  card: 'cards',
  icon: 'icons',
  'icon-grid': 'icons',
  'form-field': 'forms',
  'nav-bar': 'nav',
  badge: 'badges',
  table: 'tables',
  chart: 'charts',
};
const COMPONENT_BUCKETS = ['buttons', 'cards', 'icons', 'forms', 'nav', 'badges', 'tables', 'charts'];

function median(nums: number[]): number {
  const sorted = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function mostFrequent(strings: string[]): string {
  const counts: Record<string, number> = {};
  let best = '';
  let bestCount = 0;
  strings.forEach((s) => {
    if (!s) return;
    counts[s] = (counts[s] || 0) + 1;
    if (counts[s] > bestCount) {
      bestCount = counts[s];
      best = s;
    }
  });
  return best;
}

function extractColors(recordsById: Record<string, ImageFeatureRecord>): DesignSystemColor[] {
  const byHex: Record<string, { hex: string; roleCounts: Record<string, number>; sourceImageIds: string[]; totalCoverage: number }> = {};
  Object.entries(recordsById).forEach(([imageId, record]) => {
    (record.dominantColors || []).forEach((c) => {
      if (!c || typeof c.hex !== 'string') return;
      const key = c.hex.toLowerCase();
      if (!byHex[key]) byHex[key] = { hex: c.hex, roleCounts: {}, sourceImageIds: [], totalCoverage: 0 };
      const entry = byHex[key];
      const role = c.role || 'unknown';
      entry.roleCounts[role] = (entry.roleCounts[role] || 0) + 1;
      if (!entry.sourceImageIds.includes(imageId)) entry.sourceImageIds.push(imageId);
      entry.totalCoverage += typeof c.coverage === 'number' ? c.coverage : 0;
    });
  });

  return Object.values(byHex)
    .map((entry) => {
      const role = Object.entries(entry.roleCounts).sort((a, b) => b[1] - a[1])[0][0];
      return { hex: entry.hex, role, sourceImageIds: entry.sourceImageIds, _sort: [entry.sourceImageIds.length, entry.totalCoverage] as [number, number] };
    })
    .sort((a, b) => b._sort[0] - a._sort[0] || b._sort[1] - a._sort[1])
    .slice(0, MAX_COLORS)
    .map(({ hex, role, sourceImageIds }) => ({ hex, role, sourceImageIds }));
}

function extractTypography(recordsById: Record<string, ImageFeatureRecord>): DesignSystemTypography[] {
  const byBand: Record<string, { sizes: number[]; descriptions: string[] }> = {};
  BANDS.forEach((b) => {
    byBand[b] = { sizes: [], descriptions: [] };
  });
  Object.values(recordsById).forEach((record) => {
    (record.typeSizeBands || []).forEach((b) => {
      if (!b || !byBand[b.band]) return;
      if (typeof b.approxPx === 'number') byBand[b.band].sizes.push(b.approxPx);
      if (b.styleDescription) byBand[b.band].descriptions.push(b.styleDescription);
    });
  });

  return BANDS.filter((band) => byBand[band].sizes.length > 0).map((band) => ({
    role: band,
    approxPx: median(byBand[band].sizes),
    styleDescription: mostFrequent(byBand[band].descriptions),
    userSuppliedFontName: null,
  }));
}

function extractComponents(recordsById: Record<string, ImageFeatureRecord>): Record<string, DesignSystemComponentEntry> {
  const counts: Record<string, number> = {};
  COMPONENT_BUCKETS.forEach((b) => {
    counts[b] = 0;
  });
  Object.values(recordsById).forEach((record) => {
    (record.components || []).forEach((raw) => {
      const bucket = COMPONENT_BUCKET[raw];
      if (bucket) counts[bucket] += 1;
    });
  });
  const components: Record<string, DesignSystemComponentEntry> = {};
  COMPONENT_BUCKETS.forEach((b) => {
    components[b] = { count: counts[b], variants: [] };
  });
  return components;
}

// recordsById: { imageId: Image Feature Record } -- callers pass the
// project's cached Stage 1 output (state.pipeline.perceiveRecords, keyed
// by file id).
export function buildDesignSystemSheet(recordsById: Record<string, ImageFeatureRecord>): DesignSystemSheet {
  const records = recordsById || {};
  return {
    colors: extractColors(records),
    typography: extractTypography(records),
    spacingGrid: { baseUnit: 'unknown', sampledGaps: [] },
    components: extractComponents(records),
  };
}
