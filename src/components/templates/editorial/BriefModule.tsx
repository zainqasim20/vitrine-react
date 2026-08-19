import { useEffect, useMemo, useRef, useState } from 'react';
import type { BriefModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Module 3/5 -- full-bleed scroll-linked pull quote.
// Words already scrolled past render at full opacity/color; upcoming words
// stay dimmed.
//
// Progress tracking: an IntersectionObserver on the section gates a
// requestAnimationFrame loop on/off -- the loop only runs while the
// section is anywhere near the viewport, and each frame reads the
// section's own getBoundingClientRect() to compute how far the reader has
// scrolled through it. This is deliberately NOT a window scroll-event
// listener (per the ticket). An earlier version tried to read progress
// straight off the IntersectionObserver entries themselves, using a dense
// threshold array to fire often -- that doesn't actually work: once a
// section is shorter than the viewport (true here), its intersection
// ratio pins at 1.0 for the entire scroll range where it's fully visible,
// so the observer stops firing mid-scroll and the reveal freezes. Gating a
// rAF loop with the observer keeps the same "don't poll the whole page"
// intent while actually producing continuous updates.
function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return true;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

// Used only when the caller doesn't supply a design-system-derived
// backgroundColorHex -- a real locked token (violet-deep), not a fabricated
// color.
const FALLBACK_BG = 'var(--violet-deep)';
const FALLBACK_BG_IS_DARK = true; // violet-deep (#6038EE) reads dark enough for white text

export function BriefModule({ content }: { content: BriefModuleContent }) {
  const { quoteText, backgroundColorHex } = content;
  const words = useMemo(() => quoteText.split(/\s+/).filter(Boolean), [quoteText]);
  const dark = backgroundColorHex ? isDarkHex(backgroundColorHex) : FALLBACK_BG_IS_DARK;

  const sectionRef = useRef<HTMLDivElement>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  // Read fresh inside the rAF loop without needing to restart the effect
  // every time the word count changes.
  const wordCountRef = useRef(words.length);
  wordCountRef.current = words.length;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let rafId: number | null = null;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // 0 when the section's top has just reached the bottom of the
      // viewport, 1 once its bottom has scrolled past the top -- i.e. how
      // far the reader has scrolled through this module specifically.
      const fraction = Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
      setRevealedCount(Math.round(fraction * wordCountRef.current));
      rafId = requestAnimationFrame(measure);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (rafId === null) rafId = requestAnimationFrame(measure);
      } else if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const fullColor = dark ? '#FFFFFF' : 'var(--text)';
  const dimColor = dark ? 'rgba(255,255,255,0.3)' : 'rgba(20,20,26,0.3)';

  return (
    <section ref={sectionRef} style={{ background: backgroundColorHex || FALLBACK_BG, padding: '96px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p
        style={{
          maxWidth: 880,
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 'clamp(28px, 4vw, 46px)',
          lineHeight: 1.28,
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        {words.map((word, i) => (
          <span key={i} style={{ color: i < revealedCount ? fullColor : dimColor, transition: 'color 220ms ease-out' }}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </section>
  );
}
