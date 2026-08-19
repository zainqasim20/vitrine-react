// Freeform customization document -- the data model behind /templates/customize.
//
// Distinct from the editorial-modules content types (editorial-modules.types.ts):
// those describe typed props for fixed, pre-built module components (Cover,
// Testimonial, etc.) rendered read-only in Refine's Feature Story path. This
// model instead describes a flat list of independently positioned, editable
// elements per page -- what the user asked for explicitly: drag things
// around, add/remove/replace elements, add text, add/remove pages, change
// colors, on a real canvas rather than through a fixed tool panel.
//
// A "page" here is one scrollable screen of the case study (what the
// existing modules called a "section") -- kept as the unit for add/remove/
// reorder since that's what the user described ("option to add/remove
// pages").

export type FreeformElementType = 'text' | 'image' | 'shape' | 'button';

interface FreeformElementBase {
  id: string;
  type: FreeformElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  // Custom label shown in the Layers panel instead of the auto-generated
  // one (element text / type name). Editable there directly.
  name?: string;
  // Position/size frozen against normal drag/resize -- used for images that
  // fill a decorative frame (a device mockup's screen, a mosaic tile's
  // mat). For a locked image specifically this means something more than
  // "frozen": see FreeformImageElement's zoom/focalX/focalY -- the frame
  // (x/y/w/h) never changes, but the image content inside it can still be
  // panned and zoomed without ever visually escaping the frame. Still
  // selectable and (for images) still replaceable either way, and only
  // locked until the user explicitly unlocks it from the panel.
  locked?: boolean;
}

export interface FreeformTextElement extends FreeformElementBase {
  type: 'text';
  text: string;
  // A named stack ('display'/'body'/'mono', the app's own 3 built-in
  // fonts) or any Google Fonts family name (loaded dynamically -- see
  // google-fonts.ts). Free-form string rather than a closed union so
  // picking a font isn't limited to a hardcoded list.
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  letterSpacing?: string;
  lineHeight?: number;
  uppercase?: boolean;
}

export interface FreeformImageElement extends FreeformElementBase {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain';
  borderRadius: number;
  // Focal position within the frame, 0-100% each axis -- maps to CSS
  // object-position, and is also the pan point drag adjusts when the image
  // is locked (see zoom below).
  focalX?: number;
  focalY?: number;
  // 1 = the image exactly fills its frame (cover-fit, no visible zoom).
  // Above 1 scales the image up around (focalX, focalY) via a CSS
  // transform on top of the cover-fit base, clipped by the frame's own
  // overflow:hidden -- so enlarging a locked image genuinely zooms in
  // *within* its frame instead of growing past its edges. On an unlocked
  // image, resize handles change w/h directly as usual and zoom stays 1.
  zoom?: number;
  // Adjustment sliders, all optional (absent = untouched/default). Mapped
  // to a single combined CSS filter string at render time. "Temperature"
  // is a CSS-only approximation (a warm/cool tint via sepia+hue-rotate),
  // not a real white-balance shift -- disclosed, not a from-scratch color
  // engine.
  opacity?: number; // 0-1
  blur?: number; // px
  brightness?: number; // %, 100 = untouched
  contrast?: number; // %, 100 = untouched
  saturation?: number; // %, 100 = untouched
  temperature?: number; // -100 (cool) .. 100 (warm), 0 = untouched
}

export interface FreeformShapeElement extends FreeformElementBase {
  type: 'shape';
  shape: 'rect' | 'ellipse';
  fill: string;
  borderRadius: number;
  opacity: number;
  // Solid hex or the same gradient CSS string fill/backgroundColor use.
  // Rendered as an inset second layer rather than a CSS border, since
  // border-image (needed for a gradient border) ignores border-radius in
  // every major browser -- the inset-layer trick works correctly with
  // rounded corners for both solid and gradient strokes.
  stroke?: string;
  strokeWidth?: number;
}

export interface FreeformButtonElement extends FreeformElementBase {
  type: 'button';
  text: string;
  bg: string;
  color: string;
  borderRadius: number;
}

export type FreeformElement = FreeformTextElement | FreeformImageElement | FreeformShapeElement | FreeformButtonElement;

export interface FreeformPage {
  id: string;
  name: string;
  backgroundColor: string;
  height: number;
  elements: FreeformElement[];
}

export interface FreeformDoc {
  pages: FreeformPage[];
}

// Combines an image element's adjustment sliders into one CSS filter
// string, applied directly to the <img>. Temperature has no real CSS
// equivalent, so it's approximated with sepia (warm) or hue-rotate (cool)
// plus a small saturation nudge -- a reasonable-looking stand-in, not a
// true white-balance shift.
export function freeformImageFilter(el: FreeformImageElement): string {
  const parts: string[] = [];
  if (el.blur) parts.push(`blur(${el.blur}px)`);
  if (el.brightness !== undefined && el.brightness !== 100) parts.push(`brightness(${el.brightness}%)`);
  if (el.contrast !== undefined && el.contrast !== 100) parts.push(`contrast(${el.contrast}%)`);
  if (el.saturation !== undefined && el.saturation !== 100) parts.push(`saturate(${el.saturation}%)`);
  if (el.temperature) {
    if (el.temperature > 0) {
      parts.push(`sepia(${(Math.min(el.temperature, 100) / 100) * 0.45})`);
      parts.push(`saturate(${100 + el.temperature * 0.2}%)`);
    } else {
      parts.push(`hue-rotate(${el.temperature * 0.6}deg)`);
      parts.push(`saturate(${100 + Math.abs(el.temperature) * 0.15}%)`);
    }
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------
// Gradients -- linear/radial/conic, any number of color stops. Every
// background/fill/stroke field in this model is just a plain CSS
// `background`-compatible string (a hex color OR one of these gradient
// strings written in the exact canonical form below) -- no separate
// "is this a gradient" flag anywhere in the data model. buildFreeformGradientCss
// always emits that canonical form; parseFreeformGradient only recognizes
// strings in it (round-tripping the UI's own output), not arbitrary CSS.
// ---------------------------------------------------------------------

export type FreeformGradientType = 'linear' | 'radial' | 'conic';

export interface FreeformGradientStop {
  color: string;
  position: number; // 0-100
}

export interface FreeformGradient {
  type: FreeformGradientType;
  angle: number; // degrees; the rotation for linear, the start angle for conic, unused for radial
  stops: FreeformGradientStop[];
}

export function buildFreeformGradientCss(g: FreeformGradient): string {
  const stops = [...g.stops].sort((a, b) => a.position - b.position).map((s) => `${s.color} ${s.position}%`).join(', ');
  if (g.type === 'radial') return `radial-gradient(circle, ${stops})`;
  if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg, ${stops})`;
  return `linear-gradient(${g.angle}deg, ${stops})`;
}

const GRADIENT_STOP_RE = /(#[0-9a-fA-F]{6})\s+(-?\d+(?:\.\d+)?)%/g;

export function parseFreeformGradient(value: string): FreeformGradient | null {
  const v = value.trim();
  let type: FreeformGradientType;
  let angle = 135;
  let body: string;
  let m: RegExpExecArray | null;
  if ((m = /^linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg\s*,\s*(.+)\)$/.exec(v))) {
    type = 'linear';
    angle = Number(m[1]);
    body = m[2];
  } else if ((m = /^radial-gradient\(\s*circle\s*,\s*(.+)\)$/.exec(v))) {
    type = 'radial';
    body = m[1];
  } else if ((m = /^conic-gradient\(\s*from\s+(-?\d+(?:\.\d+)?)deg\s*,\s*(.+)\)$/.exec(v))) {
    type = 'conic';
    angle = Number(m[1]);
    body = m[2];
  } else {
    return null;
  }
  const stops: FreeformGradientStop[] = [];
  let sm: RegExpExecArray | null;
  GRADIENT_STOP_RE.lastIndex = 0;
  while ((sm = GRADIENT_STOP_RE.exec(body))) {
    stops.push({ color: sm[1], position: Number(sm[2]) });
  }
  if (stops.length < 2) return null;
  return { type, angle, stops };
}

// A handful of curated multi-layer backgrounds -- real, valid CSS (comma-
// separated background-image layers, natively supported), not a
// fabricated "mesh gradient" primitive. Several soft-edged radial
// gradients overlapping on one element blend into each other at the
// edges, which is what a true mesh gradient tool produces -- this is a
// static, hand-picked approximation of that look, not a generative one.
export const FREEFORM_VIBRANT_PRESETS: { name: string; css: string }[] = [
  { name: 'Sunset Mesh', css: 'radial-gradient(at 15% 20%, #FF6B6B 0%, transparent 55%), radial-gradient(at 85% 15%, #FFD93D 0%, transparent 55%), radial-gradient(at 80% 85%, #6C5CE7 0%, transparent 55%), radial-gradient(at 15% 85%, #FF8FB1 0%, transparent 55%), linear-gradient(135deg, #2D1B4E 0%, #1A1030 100%)' },
  { name: 'Aurora', css: 'radial-gradient(at 20% 30%, #00F5A0 0%, transparent 50%), radial-gradient(at 80% 20%, #00D9F5 0%, transparent 50%), radial-gradient(at 70% 80%, #6A5ACD 0%, transparent 55%), linear-gradient(160deg, #0B1120 0%, #0F2027 100%)' },
  { name: 'Citrus Bloom', css: 'radial-gradient(at 25% 25%, #FFE066 0%, transparent 50%), radial-gradient(at 75% 30%, #FF9F1C 0%, transparent 50%), radial-gradient(at 60% 80%, #FF5C8A 0%, transparent 55%), linear-gradient(135deg, #FFF6E5 0%, #FFE8CC 100%)' },
  { name: 'Deep Violet', css: 'radial-gradient(at 30% 20%, #AD5BFC 0%, transparent 50%), radial-gradient(at 75% 75%, #6038EE 0%, transparent 55%), radial-gradient(at 20% 85%, #2B8FF5 0%, transparent 50%), linear-gradient(150deg, #0D0D14 0%, #1A1024 100%)' },
  { name: 'Coral Reef', css: 'radial-gradient(at 20% 30%, #FF8B94 0%, transparent 50%), radial-gradient(at 80% 25%, #FFC6C7 0%, transparent 50%), radial-gradient(at 65% 80%, #A0E7E5 0%, transparent 55%), linear-gradient(135deg, #FFF5F5 0%, #FFE3E3 100%)' },
  { name: 'Midnight Teal', css: 'radial-gradient(at 25% 25%, #1FA971 0%, transparent 50%), radial-gradient(at 80% 30%, #0EA5A5 0%, transparent 50%), radial-gradient(at 60% 85%, #14141A 0%, transparent 60%), linear-gradient(160deg, #071B1A 0%, #0A2E2C 100%)' },
];

export const FREEFORM_CANVAS_WIDTH = 1200;

let idCounter = 0;
export function freeformId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
