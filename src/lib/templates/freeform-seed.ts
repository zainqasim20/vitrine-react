// Converts the Feature Story template's 12 fixed module components into an
// editable FreeformDoc -- the starting draft the user lands on at
// /templates/customize after clicking "Use template". Reuses the exact same
// real content as the read-only preview (editorial-demo-content.ts: the
// user's own real "The Florist" brand assets + the disclosed lorem-ipsum
// placeholders) so the customize screen opens showing the same thing the
// user already previewed -- just editable now instead of frozen.
//
// This is a one-time seed, not a live re-render of the module components:
// each module's layout is manually reproduced here as absolutely-positioned
// elements (text/image/shape/button) at a fixed 1200px canvas width, using
// the real colors/sizes read directly off each module's own source file.
// Some structural detail is necessarily simplified in the conversion (e.g.
// the Cover's gradient scrim becomes a flat translucent overlay shape, the
// logo-derivation flower glyph becomes a plain gold circle instead of the
// preview's five-petal SVG, the browser-frame traffic lights are a few
// small dots) -- disclosed here, not silent: freeform elements are simple
// primitives (rect/ellipse/text/image/button), not arbitrary SVG, so exact
// pixel-for-pixel parity with the read-only preview isn't the goal. Once
// on the canvas every one of these is just an element the user can move,
// resize, recolor, or delete like anything else.
import * as demo from './editorial-demo-content';
import { freeformId, FREEFORM_CANVAS_WIDTH as W, type FreeformButtonElement, type FreeformImageElement, type FreeformPage, type FreeformShapeElement, type FreeformTextElement } from './freeform-types';

const INK = '#0D0D0D';
const GOLD = '#C8A24D';
const WHITE = '#FFFFFF';
const TEXT = '#14141A';
const TEXT_2 = '#55555F';
const TEXT_3 = '#94949C';
const SURFACE_2 = '#FAFAFA';
const VIOLET = '#7A47F5';
const WHITE_60 = 'rgba(255,255,255,0.6)';

function T(x: number, y: number, w: number, h: number, zIndex: number, text: string, opts: Partial<FreeformTextElement> = {}): FreeformTextElement {
  return { id: freeformId('text'), type: 'text', x, y, w, h, zIndex, text, fontFamily: 'body', fontSize: 16, fontWeight: 400, color: TEXT, align: 'left', ...opts };
}
function I(x: number, y: number, w: number, h: number, zIndex: number, src: string, opts: Partial<FreeformImageElement> = {}): FreeformImageElement {
  return { id: freeformId('image'), type: 'image', x, y, w, h, zIndex, src, objectFit: 'cover', borderRadius: 0, ...opts };
}
function S(x: number, y: number, w: number, h: number, zIndex: number, fill: string, opts: Partial<FreeformShapeElement> = {}): FreeformShapeElement {
  return { id: freeformId('shape'), type: 'shape', x, y, w, h, zIndex, shape: 'rect', fill, borderRadius: 0, opacity: 1, ...opts };
}
function Btn(x: number, y: number, w: number, h: number, zIndex: number, text: string, opts: Partial<FreeformButtonElement> = {}): FreeformButtonElement {
  return { id: freeformId('button'), type: 'button', x, y, w, h, zIndex, text, bg: VIOLET, color: WHITE, borderRadius: 999, ...opts };
}

function coverPage(): FreeformPage {
  return {
    id: 'cover',
    name: 'Cover',
    backgroundColor: INK,
    height: 640,
    elements: [
      I(0, 0, W, 640, 1, demo.cover.backgroundImageUrl, { objectFit: 'cover' }),
      S(0, 0, W, 640, 2, '#000000', { opacity: 0.35 }),
      T(48, 32, 300, 18, 3, 'PRODUCTS', { fontFamily: 'mono', fontSize: 11, color: WHITE_60, uppercase: true, letterSpacing: '0.12em' }),
      T(48, 54, 420, 24, 4, demo.cover.category, { fontWeight: 700, fontSize: 13, color: WHITE }),
      T(852, 32, 300, 18, 5, 'YEAR', { fontFamily: 'mono', fontSize: 11, color: WHITE_60, uppercase: true, align: 'right', letterSpacing: '0.12em' }),
      T(852, 54, 300, 24, 6, demo.cover.year, { fontWeight: 700, fontSize: 13, color: WHITE, align: 'right' }),
      I(450, 260, 300, 120, 7, demo.cover.logoUrl, { objectFit: 'contain' }),
    ],
  };
}

function dividerPage(): FreeformPage {
  const [line1, line2] = demo.sectionDivider.sectionLabelLines;
  return {
    id: 'divider-brand',
    name: 'Divider — Brand Identity',
    backgroundColor: demo.sectionDivider.backgroundColorHex || INK,
    height: 200,
    elements: [
      T(48, 74, 300, 18, 1, line1, { fontFamily: 'mono', fontSize: 13, fontWeight: 600, color: WHITE, uppercase: true, letterSpacing: '0.12em' }),
      T(48, 96, 300, 18, 2, line2, { fontFamily: 'mono', fontSize: 13, fontWeight: 600, color: WHITE, uppercase: true, letterSpacing: '0.12em' }),
      T(852, 80, 300, 20, 3, demo.sectionDivider.projectName, { fontWeight: 700, fontSize: 13, color: WHITE, align: 'right' }),
      T(852, 102, 300, 16, 4, demo.sectionDivider.year, { fontFamily: 'mono', fontSize: 11, color: WHITE_60, align: 'right', letterSpacing: '0.04em' }),
    ],
  };
}

function briefPage(): FreeformPage {
  return {
    id: 'brief',
    name: 'Brief',
    backgroundColor: demo.brief.backgroundColorHex || INK,
    height: 280,
    elements: [T(160, 90, 880, 140, 1, demo.brief.quoteText, { fontFamily: 'display', fontSize: 36, fontWeight: 600, color: WHITE, align: 'center', lineHeight: 1.28 })],
  };
}

function testimonialPage(): FreeformPage {
  const initials = demo.testimonial.quoteAuthorName.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return {
    id: 'testimonial',
    name: 'Testimonial',
    backgroundColor: demo.testimonial.backgroundColorHex || INK,
    height: 260,
    elements: [
      S(572, 40, 56, 56, 1, VIOLET, { shape: 'ellipse', borderRadius: 999 }),
      T(572, 58, 56, 20, 2, initials, { fontFamily: 'display', fontSize: 17, fontWeight: 700, color: WHITE, align: 'center' }),
      T(450, 112, 300, 24, 3, demo.testimonial.quoteAuthorName, { fontWeight: 700, fontSize: 15, color: WHITE, align: 'center' }),
      T(450, 140, 300, 20, 4, demo.testimonial.quoteAuthorRole, { fontSize: 13, color: WHITE_60, align: 'center' }),
    ],
  };
}

function overviewPage(): FreeformPage {
  return {
    id: 'overview',
    name: 'Overview',
    backgroundColor: WHITE,
    height: 220,
    elements: [T(210, 70, 780, 100, 1, demo.overview.body, { fontSize: 17, color: TEXT_2, align: 'center', lineHeight: 1.7 })],
  };
}

function problemSolutionPage(): FreeformPage {
  return {
    id: 'problem-solution',
    name: 'Problem / Solution',
    backgroundColor: WHITE,
    height: 500,
    elements: [
      S(80, 40, 508, 420, 1, SURFACE_2, { borderRadius: 16 }),
      I(112, 72, 444, 260, 2, demo.problemSolution.photoUrl, { objectFit: 'cover', borderRadius: 10 }),
      T(112, 348, 300, 20, 3, demo.problemSolution.problemLabel, { fontFamily: 'mono', fontSize: 11, fontWeight: 600, color: TEXT_3, uppercase: true, letterSpacing: '0.04em' }),
      T(112, 372, 444, 80, 4, demo.problemSolution.problemText, { fontSize: 15, color: TEXT_2, lineHeight: 1.6 }),
      S(612, 40, 508, 420, 5, SURFACE_2, { borderRadius: 16 }),
      T(644, 72, 300, 20, 6, demo.problemSolution.solutionLabel, { fontFamily: 'mono', fontSize: 11, fontWeight: 600, color: TEXT_3, uppercase: true, letterSpacing: '0.04em' }),
      T(644, 96, 444, 340, 7, demo.problemSolution.solutionText, { fontSize: 15, color: TEXT_2, lineHeight: 1.6 }),
    ],
  };
}

function logoDerivationPage(): FreeformPage {
  const finalMark = demo.logoDerivation.panels[2] as { shapeUrl?: string };
  return {
    id: 'logo-derivation',
    name: 'Logo Derivation',
    backgroundColor: WHITE,
    height: 340,
    elements: [
      S(380, 90, 160, 160, 1, SURFACE_2, { borderRadius: 16 }),
      T(380, 130, 160, 90, 2, 'T', { fontFamily: 'display', fontSize: 90, fontWeight: 600, color: INK, align: 'center' }),
      T(560, 145, 40, 50, 3, '+', { fontFamily: 'display', fontSize: 32, fontWeight: 600, color: TEXT_3, align: 'center' }),
      S(620, 90, 160, 160, 4, SURFACE_2, { borderRadius: 16 }),
      // Simplified stand-in for the preview's five-petal SVG glyph -- a
      // plain gold circle, not a redrawn flower, since freeform shapes are
      // rect/ellipse primitives rather than arbitrary path markup.
      S(690, 150, 60, 60, 5, GOLD, { shape: 'ellipse' }),
      T(800, 145, 40, 50, 6, '=', { fontFamily: 'display', fontSize: 32, fontWeight: 600, color: TEXT_3, align: 'center' }),
      S(860, 90, 160, 160, 7, SURFACE_2, { borderRadius: 16 }),
      ...(finalMark.shapeUrl ? [I(892, 106, 96, 128, 8, finalMark.shapeUrl, { objectFit: 'contain' as const })] : []),
    ],
  };
}

function typographyColorsPage(): FreeformPage {
  const swatchXs = [240, 420, 600, 780];
  const elements = [
    S(500, 40, 90, 32, 1, INK, { borderRadius: 999 }),
    T(500, 48, 90, 18, 2, 'FONT', { fontFamily: 'mono', fontSize: 11, fontWeight: 600, color: WHITE, align: 'center', uppercase: true }),
    T(600, 48, 110, 18, 3, 'COLORS', { fontFamily: 'mono', fontSize: 11, fontWeight: 600, color: TEXT_2, align: 'center', uppercase: true }),
    T(300, 90, 600, 90, 4, demo.typographyColorSheet.fontSpecimenText, { fontFamily: 'display', fontSize: 64, fontWeight: 700, color: TEXT, align: 'center' }),
    T(300, 182, 600, 20, 5, demo.typographyColorSheet.fontName, { fontFamily: 'mono', fontSize: 11.5, color: TEXT_3, align: 'center', uppercase: true }),
  ];
  let z = 6;
  demo.typographyColorSheet.colors.forEach((c, i) => {
    const x = swatchXs[i];
    if (x === undefined) return;
    const dark = c.hex.toLowerCase() === INK.toLowerCase();
    const textColor = dark ? WHITE : INK;
    elements.push(S(x, 230, 180, 60, z++, c.hex, {}));
    elements.push(T(x, 252, 180, 16, z++, c.name.toUpperCase(), { fontWeight: 700, fontSize: 12, color: textColor, align: 'center' }));
    elements.push(T(x, 270, 180, 14, z++, c.hex.toUpperCase(), { fontFamily: 'mono', fontSize: 10.5, color: textColor, align: 'center' }));
  });
  return { id: 'typography-colors', name: 'Typography / Colors', backgroundColor: WHITE, height: 320, elements };
}

function deviceMockupPage(): FreeformPage {
  const annotation = demo.deviceMockup.annotations?.[0]?.text;
  return {
    id: 'device-mockup',
    name: 'Device Mockup',
    backgroundColor: WHITE,
    height: 560,
    elements: [
      S(480, 40, 240, 36, 1, INK, { borderRadius: 999 }),
      T(480, 50, 240, 18, 2, `APP SCREEN · ${demo.deviceMockup.captionLabel}`.toUpperCase(), { fontFamily: 'mono', fontSize: 9.5, fontWeight: 600, color: WHITE, align: 'center', uppercase: true }),
      S(500, 110, 200, 420, 3, '#1C1C22', { borderRadius: 34 }),
      I(510, 120, 180, 400, 4, demo.deviceMockup.screenshotUrl, { objectFit: 'cover', borderRadius: 24, locked: true }),
      ...(annotation ? [T(716, 140, 160, 60, 5, annotation, { fontSize: 13, fontWeight: 600, color: TEXT })] : []),
    ],
  };
}

function productCardPage(): FreeformPage {
  return {
    id: 'product-card',
    name: 'Product Card',
    backgroundColor: WHITE,
    height: 480,
    elements: [
      T(470, 60, 260, 18, 1, demo.productCard.category, { fontFamily: 'mono', fontSize: 11, fontWeight: 600, color: TEXT_3, uppercase: true, letterSpacing: '0.04em' }),
      T(470, 84, 260, 28, 2, demo.productCard.name, { fontFamily: 'display', fontSize: 20, fontWeight: 700, color: TEXT }),
      T(470, 116, 260, 24, 3, demo.productCard.price, { fontWeight: 700, fontSize: 16, color: demo.productCard.accentColorHex || VIOLET }),
      I(470, 150, 260, 260, 4, demo.productCard.photoUrl, { objectFit: 'cover', borderRadius: 16 }),
    ],
  };
}

function websiteHomepagePage(): FreeformPage {
  const stats = demo.websiteHomepage.stats.slice(0, 4);
  const corner = (i: number): { x: number; y: number; align: 'left' | 'right' } => ({ x: i % 2 === 0 ? 120 : 760, y: i < 2 ? 700 : 900, align: i % 2 === 0 ? 'left' : 'right' });
  const statEls = stats.flatMap((s, i) => {
    const { x, y, align } = corner(i);
    let z = 20 + i * 2;
    return [
      T(x, y, 220, 34, z++, s.value, { fontFamily: 'display', fontSize: 28, fontWeight: 700, color: '#F2F2F4', align }),
      T(x, y + 34, 220, 18, z++, s.label, { fontFamily: 'mono', fontSize: 10.5, color: '#77777F', uppercase: true, letterSpacing: '0.04em', align }),
    ];
  });
  const thumbs = demo.websiteHomepage.thumbnails.slice(0, 3);
  const thumbEls = thumbs.map((src, i) => I(820, 280 + i * 72, 180, 64, 12 + i, src, { objectFit: 'cover', borderRadius: 8 }));

  return {
    id: 'website-homepage',
    name: 'Website Homepage',
    backgroundColor: WHITE,
    height: 980,
    elements: [
      S(0, 0, W, 140, 1, INK),
      T(48, 44, 300, 18, 2, demo.websiteHomepage.divider.sectionLabelLines[0], { fontFamily: 'mono', fontSize: 13, fontWeight: 600, color: WHITE, uppercase: true, letterSpacing: '0.12em' }),
      T(48, 66, 300, 18, 3, demo.websiteHomepage.divider.sectionLabelLines[1], { fontFamily: 'mono', fontSize: 13, fontWeight: 600, color: WHITE, uppercase: true, letterSpacing: '0.12em' }),
      T(852, 50, 300, 20, 4, demo.websiteHomepage.divider.projectName, { fontWeight: 700, fontSize: 13, color: WHITE, align: 'right' }),
      T(852, 72, 300, 16, 5, demo.websiteHomepage.divider.year, { fontFamily: 'mono', fontSize: 11, color: WHITE_60, align: 'right' }),

      S(80, 180, 1040, 60, 6, '#EDEDF0'),
      S(100, 200, 9, 9, 7, '#FF5F57', { shape: 'ellipse' }),
      S(116, 200, 9, 9, 8, '#FEBC2E', { shape: 'ellipse' }),
      S(132, 200, 9, 9, 9, '#28C840', { shape: 'ellipse' }),

      T(120, 280, 280, 60, 10, demo.websiteHomepage.heroHeadline, { fontFamily: 'display', fontSize: 24, fontWeight: 700, color: TEXT, lineHeight: 1.2 }),
      T(120, 346, 280, 90, 11, demo.websiteHomepage.heroBody, { fontSize: 14, color: TEXT_2, lineHeight: 1.6 }),
      Btn(120, 442, 190, 40, 12, demo.websiteHomepage.ctaLabel),
      I(420, 280, 380, 300, 13, demo.websiteHomepage.heroImageUrl, { objectFit: 'cover', borderRadius: 10 }),
      ...thumbEls,
      ...(demo.websiteHomepage.thumbnailsCaption ? [T(820, 500, 180, 40, 19, demo.websiteHomepage.thumbnailsCaption, { fontSize: 12.5, color: TEXT_3, lineHeight: 1.5 })] : []),

      S(0, 660, W, 320, 30, '#14141A'),
      T(300, 770, 600, 80, 31, demo.websiteHomepage.statHeadline, { fontFamily: 'display', fontSize: 28, fontWeight: 700, color: '#F2F2F4', align: 'center', lineHeight: 1.3 }),
      ...statEls,
    ],
  };
}

function closingMosaicPage(): FreeformPage {
  const colW = 248;
  const gap = 12;
  const rowH = 160;
  const startX = 86;
  const colX = [startX, startX + colW + gap, startX + 2 * (colW + gap), startX + 3 * (colW + gap)];
  const rowY = [40, 40 + rowH + gap, 40 + 2 * (rowH + gap)];
  const tiles = demo.closingMosaic.tiles;
  // Manually reproduces the preview's CSS Grid `grid-auto-flow: dense`
  // packing for this specific 6-tile [tall, wide, square, square, wide,
  // square] sequence, since freeform elements are absolutely positioned,
  // not grid items.
  const boxes = [
    { x: colX[0], y: rowY[0], w: colW, h: rowH * 2 + gap },
    { x: colX[1], y: rowY[0], w: colW * 2 + gap, h: rowH },
    { x: colX[3], y: rowY[0], w: colW, h: rowH },
    { x: colX[1], y: rowY[1], w: colW, h: rowH },
    { x: colX[2], y: rowY[1], w: colW * 2 + gap, h: rowH },
    { x: colX[0], y: rowY[2], w: colW, h: rowH },
  ];
  const elements = tiles.slice(0, 6).map((tile, i) => {
    const b = boxes[i];
    const pad = 8;
    return [
      S(b.x, b.y, b.w, b.h, i * 2 + 1, tile.dark ? '#14141A' : SURFACE_2, { borderRadius: 16 }),
      I(b.x + pad, b.y + pad, b.w - pad * 2, b.h - pad * 2, i * 2 + 2, tile.imageUrl, { objectFit: 'cover', borderRadius: 10, locked: true }),
    ];
  });
  return { id: 'closing-mosaic', name: 'Closing Mosaic', backgroundColor: WHITE, height: 600, elements: elements.flat() };
}

export function buildFeatureStoryFreeformPages(): FreeformPage[] {
  return [
    coverPage(),
    dividerPage(),
    briefPage(),
    testimonialPage(),
    overviewPage(),
    problemSolutionPage(),
    logoDerivationPage(),
    typographyColorsPage(),
    deviceMockupPage(),
    productCardPage(),
    websiteHomepagePage(),
    closingMosaicPage(),
  ];
}
