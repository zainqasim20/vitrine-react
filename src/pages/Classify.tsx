import { useEffect, useRef, type CSSProperties } from 'react';
import { useApp } from '../lib/store';
import categorySignals from '../lib/pipeline/config/category-signals.json';
import type { CategorySignalsConfig } from '../lib/pipeline/types';

const PIPELINE_CONFIG = categorySignals as unknown as CategorySignalsConfig;

const categoryLabel = (id: string) => PIPELINE_CONFIG.categories.find((c) => c.id === id)?.label || id;

// Stage 1 (Perceive) loading state, then Stage 2's (Classify) Fallback
// question -- ported from the live site's renderClassify()/
// renderClassificationFallback(). Only reachable when a real Gemini key is
// configured (generate() branches here; the no-key path still goes
// straight to the existing mocked Waiting screen, unchanged).
//
// Scope note for this pass: once resolved (or not needed -- auto/
// soft-confirm outcomes), this falls straight through to Draft/Review,
// same as the pre-pipeline flow. Soft-confirm's own question is meant to
// be folded into the Interview form, which doesn't exist yet -- that's the
// next step. Soft-confirm outcomes are treated the same as auto for now.
export function Classify() {
  const { state, actions } = useApp();
  const proceeded = useRef(false);

  const total = state.files.length;
  const settledCount = state.files.filter((f) => {
    const s = state.pipeline.perceiveStatus[f.id];
    return s === 'done' || s === 'error';
  }).length;
  const stillPerceiving = total > 0 && settledCount < total;
  const result = state.pipeline.classifyResult;

  const needsFallback = !!result?.needsFallback && !state.pipeline.fallbackResolved;

  useEffect(() => {
    if (!stillPerceiving && result && !needsFallback && !proceeded.current) {
      proceeded.current = true;
      actions.finishWaiting();
    }
  }, [stillPerceiving, result, needsFallback, actions]);

  return (
    <main style={{ flex: 1, padding: '56px 32px 96px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {(stillPerceiving || !result) && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>
              Reading your screens with Gemini… ({settledCount}/{total})
            </span>
            <div style={shimmer(20, '58%')} />
            <div style={shimmer(12, '100%')} />
            <div style={shimmer(12, '88%')} />
          </div>
        )}

        {!stillPerceiving && needsFallback && result && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={mono()}>Quick check</span>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              What kind of project is this?
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)' }}>
              We're not sure yet from the screens alone — pick the closest match, or describe it below.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.fallbackCandidates.map((catId) => (
                <button
                  key={catId}
                  type="button"
                  onClick={() => actions.pickFallbackCategory(catId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 48,
                    padding: '0 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    background: 'transparent',
                    color: 'var(--text)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {categoryLabel(catId)}
                  <i className="ph ph-arrow-right" style={{ fontSize: 16 }} />
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={state.pipeline.fallbackOtherText}
                onChange={(e) => actions.setFallbackOtherText(e.target.value)}
                placeholder="Something else — describe it"
                style={{
                  flex: 1,
                  height: 48,
                  padding: '0 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => actions.pickFallbackOther()}
                style={{ height: 48, padding: '0 18px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Use this
              </button>
            </div>

            <button
              type="button"
              onClick={() => actions.skipFallback()}
              style={{ alignSelf: 'flex-start', height: 32, border: 0, background: 'transparent', color: 'var(--text-3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function mono(): CSSProperties {
  return { fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' };
}

function shimmer(height: number, width: string): CSSProperties {
  return {
    height,
    width,
    borderRadius: 8,
    background: 'linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 40%, var(--surface-2) 80%)',
    backgroundSize: '420px 100%',
    animation: 'v-shimmer 1.4s linear infinite',
  };
}
