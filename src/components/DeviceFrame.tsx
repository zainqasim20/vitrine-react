import type { CSSProperties } from 'react';
import type { ImageFeatureRecord } from '../lib/pipeline/types';

// Real device mockup chrome -- CSS only, no image generation. Keyed off
// Perceive's own real, already-extracted chrome signal (docs/ai-system-
// prompt.md Part 1.1's chrome.deviceFrame/browserChrome fields), which
// previously went completely unused visually. Nothing renders here unless
// Gemini actually reported a device frame or visible browser chrome on
// this exact image -- never a guessed/invented mockup.
export type DeviceFrameKind = 'phone' | 'laptop' | 'browser' | 'none';

export function deviceFrameKindFor(record: ImageFeatureRecord | undefined): DeviceFrameKind {
  if (!record) return 'none';
  if (record.chrome.deviceFrame === 'phone') return 'phone';
  if (record.chrome.deviceFrame === 'laptop') return 'laptop';
  if (record.chrome.browserChrome) return 'browser';
  return 'none';
}

// Neutral charcoal, not the project's accent -- real device bezels are
// black/silver/white, not brand-colored; the accent already shows through
// the surrounding sceneTreatment() panel behind the device.
const BEZEL = '#1C1C22';
const DECK = '#3A3A42';

// Merges into the existing framed-image box's style. box-sizing: border-box
// keeps the box's own recorded width/height (the real resize state) exactly
// unchanged -- the bezel eats inward into the image area instead of growing
// the box, which is also how real device mockups read (frame overlaps the
// screen edge) and keeps Refine's resize-handle math (anchored to that same
// box) untouched.
export function deviceFrameBoxStyle(kind: DeviceFrameKind): CSSProperties {
  if (kind === 'phone') {
    return { boxSizing: 'border-box', border: `10px solid ${BEZEL}`, borderRadius: 34 };
  }
  if (kind === 'laptop') {
    return {
      boxSizing: 'border-box',
      borderStyle: 'solid',
      borderColor: BEZEL,
      borderWidth: '10px 10px 24px 10px',
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    };
  }
  return {};
}

// Notch / hinge-nub / browser-bar overlays -- sit inside the bezel's own
// inset (never negative-positioned), so they're never clipped by the box's
// overflow:hidden, and always paint above the image since they're normal
// DOM children.
export function DeviceChrome({ kind }: { kind: DeviceFrameKind }) {
  if (kind === 'phone') {
    return (
      <span
        aria-hidden
        style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 72, height: 16, borderRadius: 9, background: BEZEL }}
      />
    );
  }
  if (kind === 'laptop') {
    return (
      <span
        aria-hidden
        style={{ position: 'absolute', left: '50%', bottom: 6, transform: 'translateX(-50%)', width: 44, height: 4, borderRadius: 3, background: DECK }}
      />
    );
  }
  if (kind === 'browser') {
    // Real browser chrome pushes page content down; this overlays the top
    // edge of the image instead, so the framed box's own width/height (the
    // real resize state) never changes -- a disclosed simplification, not a
    // literal reproduction of browser layout.
    return (
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 24,
          background: '#EDEDF0',
          borderBottom: '1px solid #D7D7DC',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 10px',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#FF5F57' }} />
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#FEBC2E' }} />
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#28C840' }} />
      </span>
    );
  }
  return null;
}
