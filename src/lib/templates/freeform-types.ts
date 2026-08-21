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
  // 2D rotation in degrees, any element type. Applied to the whole element
  // (selection outline + handles included) rather than just its inner
  // content -- a deliberately simpler stand-in for a true 3D perspective
  // tilt, which would need a group/parent concept this flat element list
  // doesn't have. Good enough for "mockup at an angle"; not a real 3D scene.
  rotate?: number;
  // Fuses this element to every other element sharing the same id into one
  // rigid unit for dragging -- used by mockups (frame + screen, inserted
  // together) so moving any one piece moves the whole mockup, which is the
  // only way a locked/crop image's frame position changes now (there's no
  // more drag-to-pan on the image content -- see FreeformCanvas). Purely a
  // move-together relationship, not a resize/scale-together one: each
  // member still resizes independently from its own handles.
  groupId?: string;
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
  // Opts an UNLOCKED image into the same pan/zoom-within-frame interaction
  // normally reserved for locked images -- the Fit panel's "Crop" option.
  // While true, dragging the image on canvas pans it (focalX/focalY) and
  // the resize handles zoom it (zoom), same mechanic, same code path as a
  // locked image; switching back to Fill/Fit clears it and restores normal
  // move/resize. Independent of `locked` (which is about freezing position
  // permanently, e.g. a mockup frame) -- an image can be cropEnabled without
  // being locked, and a locked image ignores this since it always behaves
  // this way regardless.
  cropEnabled?: boolean;
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
  // CSS mix-blend-mode -- lets a logo/graphic composite into the photo
  // beneath it (surface texture/lighting shows through) instead of sitting
  // on top as a flat, pasted-on sticker. 'multiply' is the one that reads
  // as "printed on a wall/banner"; the others are here for cases where
  // multiply looks muddy on a dark photo. Unset/'normal' = no blending, the
  // plain default every other image on the canvas already uses.
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'luminosity' | 'soft-light';
}

export type FreeformShapeKind = 'rect' | 'ellipse' | 'triangle' | 'pentagon' | 'hexagon' | 'star' | 'arrow' | 'line';

export interface FreeformShapeElement extends FreeformElementBase {
  type: 'shape';
  shape: FreeformShapeKind;
  // Solid hex, the same gradient CSS string fill/backgroundColor use, OR a
  // `url(<data-uri>) center/cover no-repeat` CSS background shorthand --
  // ColorField's Media tab writes that same shorthand, so an uploaded photo
  // becomes the shape's fill and is naturally clipped to the shape's own
  // outline (border-radius or clip-path below), no separate "image shape"
  // element type needed.
  fill: string;
  borderRadius: number;
  opacity: number;
  // Solid hex or the same gradient CSS string fill/backgroundColor use.
  // Rendered as an inset second layer rather than a CSS border, since
  // border-image (needed for a gradient border) ignores border-radius in
  // every major browser -- the inset-layer trick works correctly with
  // rounded corners for both solid and gradient strokes. Only supported for
  // rect/ellipse -- the polygon shapes below use clip-path, which the
  // inset-layer trick doesn't cleanly generalize to, so they render
  // without a stroke option (a scoped-down simplification, disclosed).
  stroke?: string;
  strokeWidth?: number;
  // A scoped-down stand-in for true freehand "pencil tool" path distortion
  // (a full vector anchor-point editor is out of reach for this pass):
  // blur softens the shape's edges, skew shears it -- both real, applied
  // ones, just not the same tool as literally redrawing the outline by hand.
  blur?: number; // px
  skewX?: number; // deg
  skewY?: number; // deg
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

// clip-path for the shape kinds beyond plain rect/ellipse (those two use
// border-radius instead, so this returns undefined for them). Fixed
// polygons, not a generative shape system -- a reasonable curated set
// covering the common design-tool primitives.
export function freeformShapeClipPath(shape: FreeformShapeKind): string | undefined {
  switch (shape) {
    case 'triangle':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'pentagon':
      return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    case 'arrow':
      return 'polygon(0% 35%, 60% 35%, 60% 15%, 100% 50%, 60% 85%, 60% 65%, 0% 65%)';
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------
// Logo mockups -- a real, searched photo of a surface (wall, pillar, card,
// building, fabric) as the background, with a locked overlay image the
// user replaces with their own logo (same replace-image affordance a
// device mockup's "screen" already uses). Deliberately no skew/perspective
// warp on the overlay -- a flat rectangle blended with 'multiply' (see
// FreeformImageElement.blendMode) reads as convincingly "printed on" for a
// surface photographed close to straight-on, and faking perspective with a
// 2D skew on a photo that actually recedes in depth tends to look more
// wrong than no correction at all. The search query per kind is chosen to
// favor straight-on, flat compositions for exactly that reason.
export type FreeformLogoMockupKind = 'wall' | 'pillar' | 'card' | 'facade' | 'fabric';

export const FREEFORM_LOGO_MOCKUP_CONFIG: Record<
  FreeformLogoMockupKind,
  { label: string; icon: string; query: string; overlay: (w: number, h: number) => { w: number; h: number; x: number; y: number } }
> = {
  wall: {
    label: 'Wall banner',
    icon: 'ph ph-selection-all',
    query: 'concrete wall texture',
    overlay: (w, h) => ({ w: Math.round(w * 0.56), h: Math.round(h * 0.34), x: Math.round(w * 0.22), y: Math.round(h * 0.33) }),
  },
  pillar: {
    label: 'Concrete pillar',
    icon: 'ph ph-columns',
    query: 'concrete pillar architecture',
    overlay: (w, h) => ({ w: Math.round(w * 0.26), h: Math.round(h * 0.5), x: Math.round(w * 0.37), y: Math.round(h * 0.25) }),
  },
  card: {
    label: 'Business card',
    icon: 'ph ph-address-card',
    query: 'blank business card mockup desk',
    overlay: (w, h) => ({ w: Math.round(w * 0.34), h: Math.round(h * 0.2), x: Math.round(w * 0.33), y: Math.round(h * 0.4) }),
  },
  facade: {
    label: 'Building facade',
    icon: 'ph ph-buildings',
    query: 'modern concrete building facade',
    overlay: (w, h) => ({ w: Math.round(w * 0.62), h: Math.round(h * 0.16), x: Math.round(w * 0.19), y: Math.round(h * 0.6) }),
  },
  fabric: {
    label: 'Fabric banner',
    icon: 'ph ph-flag-banner',
    query: 'canvas fabric texture natural',
    overlay: (w, h) => ({ w: Math.round(w * 0.46), h: Math.round(h * 0.46), x: Math.round(w * 0.27), y: Math.round(h * 0.27) }),
  },
};

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

// A handful of curated vibrant backgrounds -- each written as ONE gradient
// (radial/conic/linear, multiple stops) in this file's own canonical
// buildFreeformGradientCss format, specifically so parseFreeformGradient
// can read it straight back into the stops editor the moment it's applied
// (clicking a preset both sets the fill AND opens it up for editing).
// Earlier drafts layered several independent radial gradients for a
// softer "mesh" look, but that composite CSS wasn't representable in this
// editor's single-gradient model and so couldn't be edited afterward --
// traded that subtlety for real editability, which is what was asked for.
export const FREEFORM_VIBRANT_PRESETS: { name: string; css: string }[] = [
  { name: 'Sunset Mesh', css: 'radial-gradient(circle, #FF6B6B 0%, #FFD93D 35%, #6C5CE7 70%, #2D1B4E 100%)' },
  { name: 'Aurora', css: 'radial-gradient(circle, #00F5A0 0%, #00D9F5 30%, #6A5ACD 65%, #0B1120 100%)' },
  { name: 'Citrus Bloom', css: 'conic-gradient(from 135deg, #FFE066 0%, #FF9F1C 35%, #FF5C8A 65%, #FFE066 100%)' },
  { name: 'Deep Violet', css: 'radial-gradient(circle, #AD5BFC 0%, #6038EE 40%, #2B8FF5 70%, #0D0D14 100%)' },
  { name: 'Coral Reef', css: 'linear-gradient(135deg, #FF8B94 0%, #FFC6C7 35%, #A0E7E5 70%, #FFF5F5 100%)' },
  { name: 'Midnight Teal', css: 'radial-gradient(circle, #1FA971 0%, #0EA5A5 35%, #14141A 70%, #071B1A 100%)' },
  { name: 'Neon Cyber', css: 'radial-gradient(circle, #FF00E5 0%, #00E5FF 40%, #7000FF 75%, #0A0014 100%)' },
  { name: 'Holographic', css: 'linear-gradient(120deg, #FFD1FF 0%, #B5FFFC 35%, #C9C2FF 65%, #FFE5B4 100%)' },
  { name: 'Duotone Blaze', css: 'linear-gradient(135deg, #FF4D00 0%, #FF0080 55%, #7A00FF 100%)' },
  { name: 'Glacier', css: 'radial-gradient(circle, #E8FBFF 0%, #9FE7F5 40%, #4A90E2 75%, #1B2A4A 100%)' },
  { name: 'Ember Noir', css: 'radial-gradient(circle, #FF6B35 0%, #C1121F 35%, #370617 70%, #0A0000 100%)' },
];

// Stylized nature-toned gradients ("sceneries") built the same way -- one
// parseable gradient each, evocative of a horizon/landscape's color grade.
// Explicitly NOT real photography: this environment has no reachable,
// legitimate photo source to pull real scenery images from, so these are
// disclosed as stylized gradient backdrops rather than presented as photos.
export const FREEFORM_SCENERY_PRESETS: { name: string; css: string }[] = [
  { name: 'Ocean Horizon', css: 'linear-gradient(180deg, #BFEFFF 0%, #4FA8D8 45%, #0B4F6C 100%)' },
  { name: 'Forest Canopy', css: 'linear-gradient(160deg, #DFF2C2 0%, #6FA85C 50%, #1F4D2E 100%)' },
  { name: 'Golden Hour', css: 'linear-gradient(135deg, #FFE9C7 0%, #FFA45C 40%, #B5473A 75%, #3A1F3D 100%)' },
  { name: 'Desert Dune', css: 'linear-gradient(160deg, #FDEBC8 0%, #E8A863 55%, #8C5A3C 100%)' },
  { name: 'Alpine Dusk', css: 'radial-gradient(circle, #A7C6E8 0%, #5C7EA8 50%, #26314A 100%)' },
  { name: 'Lavender Field', css: 'linear-gradient(150deg, #F0E4FF 0%, #B79CE8 50%, #5B4B8A 100%)' },
];

export const FREEFORM_CANVAS_WIDTH = 1200;

let idCounter = 0;
export function freeformId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
