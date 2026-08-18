// Abstract "screen sketch" for Present's generated placeholder frames (no
// matching uploaded screen for a required slot) -- my own visual design,
// same technique as the Templates gallery's TemplateThumb sketches, but
// tinted from the project's real extracted accent color instead of the
// fixed brand violet, so the placeholder itself looks intentional rather
// than a bare gray box. Never claims to be a real screenshot -- it's
// purely decorative, sits behind the existing "AI-generated -- no X screen
// uploaded" disclosure badge, which is untouched by this.
function tint(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(122, 71, 245, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function GeneratedFrameArt({ accentHex }: { accentHex: string | null }) {
  if (!accentHex) return null;
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      <span style={{ height: 14, width: '38%', borderRadius: 4, background: tint(accentHex, 0.35) }} />
      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>
        <span style={{ flex: 1.4, borderRadius: 10, background: tint(accentHex, 0.16) }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          <span style={{ height: 9, borderRadius: 3, background: tint(accentHex, 0.32) }} />
          <span style={{ height: 9, width: '80%', borderRadius: 3, background: tint(accentHex, 0.22) }} />
          <span style={{ height: 9, width: '60%', borderRadius: 3, background: tint(accentHex, 0.22) }} />
          <span style={{ height: 26, width: 88, borderRadius: 8, marginTop: 8, background: tint(accentHex, 0.4) }} />
        </div>
      </div>
    </div>
  );
}
