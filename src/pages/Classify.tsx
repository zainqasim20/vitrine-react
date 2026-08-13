import { type CSSProperties } from 'react';
import { useApp } from '../lib/store';
import categorySignals from '../lib/pipeline/config/category-signals.json';
import type { CategorySignalsConfig } from '../lib/pipeline/types';

const CLIENT_STATUS_OPTIONS: Array<'Personal' | 'Client — can name' | 'Client — confidential (NDA)'> = [
  'Personal',
  'Client — can name',
  'Client — confidential (NDA)',
];

const PIPELINE_CONFIG = categorySignals as unknown as CategorySignalsConfig;

const categoryLabel = (id: string) => PIPELINE_CONFIG.categories.find((c) => c.id === id)?.label || id;

// Stage 1 (Perceive) loading state, then Stage 2's (Classify) Fallback
// question, then Stage 3 (Interview) -- ported from the live site's
// renderClassify()/renderClassificationFallback()/renderInterview(). Only
// reachable when a real Gemini key is configured (generate() branches
// here; the no-key path still goes straight to the existing mocked
// Waiting screen, unchanged).
//
// Once Fallback is resolved (or wasn't needed), the Interview form shows
// next -- soft-confirm is folded into it rather than shown standalone, per
// the live site. Submitting or skipping Interview runs Stage 4 (Extract)
// and bridges to Draft/Review (runExtractAndProceed).
export function Classify() {
  const { state, actions } = useApp();

  const total = state.files.length;
  const settledCount = state.files.filter((f) => {
    const s = state.pipeline.perceiveStatus[f.id];
    return s === 'done' || s === 'error';
  }).length;
  const stillPerceiving = total > 0 && settledCount < total;
  const result = state.pipeline.classifyResult;

  const needsFallback = !!result?.needsFallback && !state.pipeline.fallbackResolved;
  const needsSoftConfirm = !!result?.needsSoftConfirm && !state.pipeline.softConfirmResolved;
  const showInterview = !stillPerceiving && !!result && !needsFallback;

  const interview = state.pipeline.interview;
  const categoryId = actions.currentCategoryId();
  const categoryLbl = actions.currentCategoryLabel();

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

        {showInterview && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={mono()}>Tell us a bit more</span>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                {categoryId ? `Looks like ${categoryLbl}` : "Let's fill in the details"}
              </h2>
            </div>

            {needsSoftConfirm && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-2)' }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>
                  We're fairly sure this is <strong style={{ color: 'var(--text)' }}>{categoryLbl}</strong> — is that right?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => actions.acceptSoftConfirm(true)} style={chipStyle(true)}>
                    Yes, that's right
                  </button>
                  <button type="button" onClick={() => actions.acceptSoftConfirm(false)} style={chipStyle(false)}>
                    No
                  </button>
                </div>
              </div>
            )}

            <label style={fieldLabelStyle()}>
              Project name
              <input
                type="text"
                value={interview.projectName}
                onChange={(e) => actions.setInterviewField('projectName', e.target.value)}
                placeholder="What's this project called?"
                style={inputStyle()}
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={fieldLabelTextStyle()}>Client status</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CLIENT_STATUS_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => actions.setInterviewClientStatus(opt)} style={chipStyle(interview.clientStatus === opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={fieldLabelTextStyle()}>
                Tools used{interview.toolsUnconfirmed && interview.tools.length > 0 ? ' (guessed — tap to adjust)' : ''}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {interview.tools.map((tool) => (
                  <button key={tool} type="button" onClick={() => actions.toggleInterviewTool(tool)} style={chipStyle(true)}>
                    {tool} <span style={{ marginLeft: 4 }}>×</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={interview.customTool}
                  onChange={(e) => actions.setInterviewField('customTool', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      actions.addInterviewTool();
                    }
                  }}
                  placeholder="Add a tool"
                  style={{ ...inputStyle(), flex: 1 }}
                />
                <button type="button" onClick={() => actions.addInterviewTool()} style={{ ...chipStyle(false), height: 44 }}>
                  Add
                </button>
              </div>
            </div>

            <label style={fieldLabelStyle()}>
              Outcome
              <textarea
                value={interview.outcome}
                onChange={(e) => actions.setInterviewField('outcome', e.target.value)}
                placeholder="What did this work achieve?"
                rows={3}
                style={{ ...inputStyle(), height: 'auto', padding: '12px 14px', resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </label>

            <label style={fieldLabelStyle()}>
              Fonts
              <input
                type="text"
                value={interview.fonts}
                onChange={(e) => actions.setInterviewField('fonts', e.target.value)}
                placeholder="Any fonts we should credit?"
                style={inputStyle()}
              />
            </label>

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => actions.submitInterview()}
                style={{ height: 48, padding: '0 22px', border: 0, borderRadius: 10, background: 'var(--text)', color: 'var(--bg)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => actions.skipInterview()}
                style={{ height: 48, padding: '0 18px', border: 0, background: 'transparent', color: 'var(--text-3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
              >
                Skip — use defaults
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function fieldLabelTextStyle(): CSSProperties {
  return { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text-2)' };
}

function fieldLabelStyle(): CSSProperties {
  return { display: 'flex', flexDirection: 'column', gap: 8, ...fieldLabelTextStyle() };
}

function inputStyle(): CSSProperties {
  return {
    height: 46,
    padding: '0 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    outline: 'none',
    fontWeight: 400,
  };
}

function chipStyle(active: boolean): CSSProperties {
  return {
    height: 36,
    padding: '0 14px',
    border: `1.5px solid ${active ? 'var(--text)' : 'var(--border)'}`,
    borderRadius: 8,
    background: active ? 'var(--text)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--text)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  };
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
