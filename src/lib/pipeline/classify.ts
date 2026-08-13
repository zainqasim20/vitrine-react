// Stage 2 -- Classify. Ported unchanged (same algorithm, thresholds, and
// scoring) from the live site's lib/pipeline/classify.js. Deterministic,
// data-driven scoring of Stage 1's Image Feature Record(s) against
// category-signals.json. No API call, no per-category logic hardcoded here
// -- every category-specific decision lives in the config.
//
// Only the module format changed: the source is a plain <script> that
// attaches to a shared `window.VitrinePipeline` global (this app has no
// bundler); here it's a normal ES module, since this app is bundled by Vite.
// That's a packaging change, not a behavior change.

import type { CategorySignalCondition, CategorySignalsConfig, ClassifyResult, ImageFeatureRecord } from './types';

function getField(record: ImageFeatureRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, record);
}

// Evaluates one signal's "when" condition against a single Image Feature
// Record. Supports the small condition vocabulary used by category-signals.json:
// equals / in / includesAny, plus any/all combinators for compound rules.
function evalCondition(cond: CategorySignalCondition | undefined, record: ImageFeatureRecord): boolean {
  if (!cond) return false;
  if (cond.any) return cond.any.some((c) => evalCondition(c, record));
  if (cond.all) return cond.all.every((c) => evalCondition(c, record));
  const value = cond.field ? getField(record, cond.field) : undefined;
  if (Object.prototype.hasOwnProperty.call(cond, 'equals')) return value === cond.equals;
  if (cond.in) return cond.in.includes(value);
  if (cond.includesAny) return Array.isArray(value) && cond.includesAny.some((v) => value.includes(v));
  return false;
}

// records: array of Image Feature Records (one per uploaded image already
// classified as usable by Perceive). Contributions are summed across all
// records before clamping, so multiple confirming images raise confidence
// rather than being averaged down by one ambiguous screen.
export function classifyRecords(
  records: ImageFeatureRecord | ImageFeatureRecord[],
  config: CategorySignalsConfig,
): ClassifyResult {
  const categories = (config.categories || []).map((c) => c.id);
  const rawScores: Record<string, number> = {};
  categories.forEach((id) => {
    rawScores[id] = 0;
  });

  const list = Array.isArray(records) ? records : [records];
  list.filter(Boolean).forEach((record) => {
    (config.signals || []).forEach((signal) => {
      if (evalCondition(signal.when, record)) {
        Object.entries(signal.weights || {}).forEach(([catId, weight]) => {
          if (catId in rawScores) rawScores[catId] += weight;
        });
      }
    });
  });

  const scores: Record<string, number> = {};
  categories.forEach((id) => {
    scores[id] = Math.max(0, Math.min(100, rawScores[id]));
  });

  const ranked = categories.slice().sort((a, b) => scores[b] - scores[a]);
  const category = ranked[0] || null;
  const runnerUp = ranked[1] || null;
  const confidence = category ? scores[category] : 0;

  const thresholds = config.thresholds || { autoClassify: 95, softConfirm: 80 };
  let outcome: ClassifyResult['outcome'];
  if (confidence >= thresholds.autoClassify) outcome = 'auto';
  else if (confidence >= thresholds.softConfirm) outcome = 'soft-confirm';
  else outcome = 'fallback';

  return {
    scores,
    category,
    confidence,
    outcome,
    needsSoftConfirm: outcome === 'soft-confirm',
    needsFallback: outcome === 'fallback',
    fallbackCandidates: outcome === 'fallback' ? [category, runnerUp].filter((x): x is string => !!x) : [],
  };
}

export { evalCondition, getField };
