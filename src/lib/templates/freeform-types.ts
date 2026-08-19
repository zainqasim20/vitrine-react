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

export const FREEFORM_CANVAS_WIDTH = 1200;

let idCounter = 0;
export function freeformId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
