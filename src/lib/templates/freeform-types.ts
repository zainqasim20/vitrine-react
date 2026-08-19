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
  // Position/size frozen -- used for images that fill a decorative frame
  // (a device mockup's screen, a mosaic tile's mat) where dragging the
  // image out breaks the frame's whole point. Still selectable, and (for
  // images) still replaceable -- only move/resize are blocked, and only
  // until the user explicitly unlocks it from the panel.
  locked?: boolean;
}

export interface FreeformTextElement extends FreeformElementBase {
  type: 'text';
  text: string;
  fontFamily: 'display' | 'body' | 'mono';
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
  // object-position. A simplified stand-in for a real crop-rectangle tool:
  // it repositions which part of the source image shows through a
  // cover-fit frame, but doesn't let you change the crop's own size the
  // way dragging crop handles in Figma would.
  focalX?: number;
  focalY?: number;
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

export const FREEFORM_CANVAS_WIDTH = 1200;

let idCounter = 0;
export function freeformId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
