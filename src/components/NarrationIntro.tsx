import type { CSSProperties } from 'react';

// Stage 7/Narrate's output (problem statement + outcome framing), shown as a
// plain intro under the title -- the same position and order (problem
// statement, then outcome framing) the real pipeline already uses in
// Markdown export, just made visible here for the first time. This
// placement is new design work: even the live site never surfaces this
// text outside Markdown, so there's no real screen to match pixel-for-pixel.
export function NarrationIntro({
  problemStatement,
  outcomeFraming,
  bodyFont,
  marginBottom = 48,
}: {
  problemStatement: string;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom }}>
      {problemStatement && <p style={p}>{problemStatement}</p>}
      {outcomeFraming && <p style={p}>{outcomeFraming}</p>}
    </div>
  );
}
