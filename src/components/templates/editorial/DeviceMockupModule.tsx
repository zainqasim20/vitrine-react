import type { CSSProperties } from 'react';
import type { DeviceMockupAnnotation, DeviceMockupModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Phase 3 -- floats a phone/watch screenshot on flat
// canvas, or composites the same device+screenshot into a lifestyle photo
// when photoUrl is supplied.
//
// Checked src/components/DeviceFrame.tsx first, per the ticket, before
// building a parallel implementation. Not reusable here for three concrete
// reasons:
//   1. Its DeviceFrameKind is 'phone' | 'laptop' | 'browser' | 'none' --
//      there's no 'watch' kind, and this module needs one.
//   2. deviceFrameKindFor() decides its kind from an ImageFeatureRecord
//      (src/lib/pipeline/types.ts) -- real pipeline coupling this module
//      set has deliberately avoided importing since Phase 1.
//   3. deviceFrameBoxStyle()/DeviceChrome() are designed (by that file's
//      own comments) to merge onto an EXISTING sized box -- Refine's own
//      resizable image box -- not to produce a self-contained,
//      independently-sized mockup. That's a different prop/usage shape
//      than a standalone module needs.
// The neutral bezel color below is intentionally matched to DeviceFrame's
// own BEZEL constant for visual consistency with the app's existing
// device-mockup language -- duplicated, not imported, same precedent as
// this module set's other small local helpers (e.g. isDarkHex in
// TestimonialModule/TypographyColorSheetModule).
const BEZEL = '#1C1C22';

function PhoneFrame({ screenshotUrl }: { screenshotUrl: string }) {
  return (
    <div style={{ position: 'relative', width: 220, aspectRatio: '9 / 19.5' }}>
      <div style={{ position: 'absolute', inset: 0, border: `10px solid ${BEZEL}`, borderRadius: 34, background: BEZEL, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        <img src={screenshotUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <span aria-hidden style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 72, height: 16, borderRadius: 9, background: BEZEL, zIndex: 1 }} />
    </div>
  );
}

function WatchFrame({ screenshotUrl }: { screenshotUrl: string }) {
  return (
    <div style={{ position: 'relative', width: 140, aspectRatio: '1 / 1.15' }}>
      <div style={{ position: 'absolute', inset: 0, border: `9px solid ${BEZEL}`, borderRadius: 40, background: BEZEL, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        <img src={screenshotUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <span aria-hidden style={{ position: 'absolute', top: '38%', right: -6, width: 8, height: 22, borderRadius: 3, background: BEZEL }} />
    </div>
  );
}

function DeviceFrame({ deviceType, screenshotUrl }: { deviceType: 'phone' | 'watch'; screenshotUrl: string }) {
  return deviceType === 'watch' ? <WatchFrame screenshotUrl={screenshotUrl} /> : <PhoneFrame screenshotUrl={screenshotUrl} />;
}

function CaptionBar({ label }: { label: string }) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <span style={{ padding: '8px 16px', background: 'var(--text)', color: 'var(--bg)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        App Screen
      </span>
      <span style={{ padding: '8px 16px', background: 'var(--surface-2)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

// Alternates each annotation between the stage's upper-right and lower-left
// so multiple callouts don't stack on the same corner. The reference shows
// one floating stat card per screen; this generalizes to N without a
// caller-specified position, which the ticket left unspecified ("whatever's
// genuinely needed, keep it minimal").
function annotationStyle(index: number): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    maxWidth: 160,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
  };
  return index % 2 === 0 ? { ...base, top: 24, right: -16 } : { ...base, bottom: 24, left: -16 };
}

function FlatStage({ deviceType, screenshotUrl, annotations }: { deviceType: 'phone' | 'watch'; screenshotUrl: string; annotations: DeviceMockupAnnotation[] }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <DeviceFrame deviceType={deviceType} screenshotUrl={screenshotUrl} />
      {annotations.map((a, i) => (
        <span key={i} style={annotationStyle(i)}>
          {a.text}
        </span>
      ))}
    </div>
  );
}

// Composites the device onto a lifestyle photo. This is a disclosed
// simplification, not real image compositing: the photo fills a rounded
// card and the device sits centered near its bottom edge with its own
// shadow, giving a "held up against the scene" read without actually
// masking/blending pixels -- true compositing like the reference would need
// real photo editing or a photographed hand, not a CSS template module.
function PhotoStage({ deviceType, screenshotUrl, photoUrl }: { deviceType: 'phone' | 'watch'; screenshotUrl: string; photoUrl: string }) {
  return (
    <div style={{ position: 'relative', width: 360, aspectRatio: '4 / 3', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', left: '50%', bottom: -16, transform: 'translateX(-50%)' }}>
        <DeviceFrame deviceType={deviceType} screenshotUrl={screenshotUrl} />
      </div>
    </div>
  );
}

export function DeviceMockupModule({ content }: { content: DeviceMockupModuleContent }) {
  const { deviceType, screenshotUrl, photoUrl, captionLabel, annotations = [] } = content;

  return (
    <section style={{ background: 'var(--bg)', padding: '64px 48px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      {captionLabel && <CaptionBar label={captionLabel} />}
      {photoUrl ? <PhotoStage deviceType={deviceType} screenshotUrl={screenshotUrl} photoUrl={photoUrl} /> : <FlatStage deviceType={deviceType} screenshotUrl={screenshotUrl} annotations={annotations} />}
    </section>
  );
}
