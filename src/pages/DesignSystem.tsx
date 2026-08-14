import { type CSSProperties } from 'react';
import { useApp } from '../lib/store';

// Stage 4 -- editable Design System Sheet, shown once right after Interview,
// before Draft/Review. Ported field-for-field from the live site's
// designsystem.js renderDesignSystemSheet(): every color, typography row,
// and component count is directly editable -- the highest-leverage
// correction point in the pipeline, per the spec. Only reachable once
// runExtractAndProceed() has computed a real sheet from the cached Perceive
// records and navigated here.

const COLOR_ROLES = ['background', 'primary', 'secondary', 'accent', 'text', 'border', 'unknown'];
const COMPONENT_LABELS: Record<string, string> = {
  buttons: 'Buttons',
  cards: 'Cards',
  icons: 'Icons',
  forms: 'Form fields',
  nav: 'Nav',
  badges: 'Badges',
  tables: 'Tables',
  charts: 'Charts',
};
const SPACING_OPTIONS = ['8pt', '4pt', 'unknown'];

export function DesignSystem() {
  const { state, actions } = useApp();
  const sheet = state.pipeline.designSystemSheet;

  return (
    <main style={{ flex: 1, padding: '56px 32px 96px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {!sheet ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>Nothing extracted yet.</p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={mono()}>Before we draft</span>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                Here's what we found
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)' }}>
                Extracted from your screens, not inferred. Fix anything that's off — this feeds every section below.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={fieldLabelTextStyle()}>Colors</span>
              {sheet.colors.length === 0 ? (
                <p style={hintStyle()}>No dominant colors were confidently extracted.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sheet.colors.map((color, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: color.hex, flex: 'none' }} />
                      <input
                        type="text"
                        value={color.hex}
                        onChange={(e) => actions.setDesignSystemColorHex(index, e.target.value)}
                        style={{ ...inputStyle(), width: 100, flex: 'none' }}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {COLOR_ROLES.map((role) => (
                          <button key={role} type="button" onClick={() => actions.setDesignSystemColorRole(index, role)} style={chipStyle(color.role === role, true)}>
                            {role}
                          </button>
                        ))}
                      </div>
                      <span style={{ ...hintStyle(), marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                        {color.sourceImageIds ? color.sourceImageIds.length : 0} screen(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={fieldLabelTextStyle()}>Typography</span>
              {sheet.typography.length === 0 ? (
                <p style={hintStyle()}>No type scale was confidently extracted.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sheet.typography.map((row, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ ...fieldLabelTextStyle(), width: 64, flex: 'none' }}>{row.role}</span>
                      <input
                        type="number"
                        value={row.approxPx}
                        onChange={(e) => actions.setDesignSystemTypographyField(index, 'approxPx', e.target.value)}
                        style={{ ...inputStyle(), width: 72, flex: 'none' }}
                      />
                      <input
                        type="text"
                        value={row.styleDescription || ''}
                        onChange={(e) => actions.setDesignSystemTypographyField(index, 'styleDescription', e.target.value)}
                        placeholder="style description"
                        style={{ ...inputStyle(), flex: 1, minWidth: 160 }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={fieldLabelTextStyle()}>Spacing grid</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SPACING_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => actions.setDesignSystemSpacing(opt)} style={chipStyle(sheet.spacingGrid.baseUnit === opt, false)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={fieldLabelTextStyle()}>Components</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {Object.entries(sheet.components).map(([bucket, entry]) => (
                  <div key={bucket} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, color: 'var(--text-2)' }}>
                      {COMPONENT_LABELS[bucket] || bucket}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={entry.count}
                      onChange={(e) => actions.setDesignSystemComponentCount(bucket, Number(e.target.value) || 0)}
                      style={inputStyle()}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => actions.designSystemContinue()}
                style={{ height: 48, padding: '0 22px', border: 0, borderRadius: 10, background: 'var(--text)', color: 'var(--bg)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function mono(): CSSProperties {
  return { fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' };
}

function hintStyle(): CSSProperties {
  return { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--text-3)' };
}

function fieldLabelTextStyle(): CSSProperties {
  return { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text-2)' };
}

function inputStyle(): CSSProperties {
  return {
    height: 40,
    padding: '0 12px',
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

function chipStyle(active: boolean, small: boolean): CSSProperties {
  return {
    height: small ? 28 : 36,
    padding: small ? '0 10px' : '0 14px',
    border: `1.5px solid ${active ? 'var(--text)' : 'var(--border)'}`,
    borderRadius: small ? 6 : 8,
    background: active ? 'var(--text)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--text)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: small ? 12 : 13,
    cursor: 'pointer',
  };
}
