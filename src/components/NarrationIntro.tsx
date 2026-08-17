import type { CSSProperties } from 'react';

// Stage 7/Narrate's output (problem statement + outcome framing), shown as a
// plain intro under the title -- the same position and order (problem
// statement, then outcome framing) the real pipeline already uses in
// Markdown export, just made visible here for the first time. This
// placement is new design work: even the live site never surfaces this
// text outside Markdown, so there's no real screen to match pixel-for-pixel.
//
// Labels (problemLabel/outcomeLabel) are real section headers Gemini writes
// per docs/portfolio-knowledge-base.md Part 3.1 -- shown only when non-empty,
// same small-caps mono treatment as Refine's other section labels ("OVERVIEW",
// "DESIGN SYSTEM").
const labelStyle: CSSProperties = {
  fontFamily: "'Geist Mono', monospace",
  fontSize: 11.5,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
};

export function NarrationIntro({
  problemLabel,
  problemStatement,
  outcomeLabel,
  outcomeFraming,
  bodyFont,
  marginBottom = 48,
}: {
  problemLabel?: string;
  problemStatement: string;
  outcomeLabel?: string;
  outcomeFraming: string;
  bodyFont?: string;
  marginBottom?: number;
}) {
  if (!problemStatement && !outcomeFraming) return null;
  const p: CSSProperties = {
    margin: 0,
    fontFamily: bodyFont || "'Plus Jakarta Sans', sans-serif",
    fontSize: 17,
    lineHeight: 1.65,
    color: 'var(--text-2)',
    maxWidth: '62ch',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom }}>
      {problemStatement && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {problemLabel && <span style={labelStyle}>{problemLabel}</span>}
          <p style={p}>{problemStatement}</p>
        </div>
      )}
      {outcomeFraming && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {outcomeLabel && <span style={labelStyle}>{outcomeLabel}</span>}
          <p style={p}>{outcomeFraming}</p>
        </div>
      )}
    </div>
  );
}
