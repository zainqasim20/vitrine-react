// Shared sample content for the Editorial ("Feature Story") template,
// used by both the internal dev showcase (src/pages/Stub.tsx, /showcase)
// and the real, user-facing template preview (src/pages/TemplatePreview.tsx,
// /templates/preview) -- one source of truth instead of two copies that
// could drift.
//
// This reuses the real brand assets the user supplied (uploads/
// Sample_Images.zip -- their own "The Florist" logo + product/lifestyle
// photography, cropped out of the composite mood-board sheets they sent).
// Real, user-owned material -- not stock, not someone else's case study,
// no copyright question.
//
// What's real vs. disclosed-placeholder in this content:
//   - Brand name "The Florist", the logo mark, the tagline "Flowers That
//     Speak From The Heart", and the hex pair #0D0D0D / #C8A24D are all
//     read directly off the user's own supplied images -- not invented.
//   - Product names, prices, stats, the testimonial quote/attribution, and
//     the "app" screen content (this brand has no real app) are lorem-
//     ipsum-style placeholder content, per the user's own instruction to
//     use it where needed -- not presented as real.
//   - The font below is my own visual guess at a face in the same
//     geometric-sans-caps family as the real wordmark; there was no
//     explicit "Font: X" spec in the supplied images the way there was a
//     confirmed hex spec, so this is disclosed as inferred, not verified.

import logoFullLockup from '../../assets/the-florist/logo-full-lockup.png';
import logoMarkOnly from '../../assets/the-florist/logo-mark-only.png';
import logoOnBlack from '../../assets/the-florist/logo-on-black-1.jpg';
import boxBouquet from '../../assets/the-florist/box-bouquet.jpg';
import bouquetWrapGoldRibbon from '../../assets/the-florist/bouquet-wrap-gold-ribbon.jpg';
import bagBouquet from '../../assets/the-florist/bag-bouquet.jpg';
import stackedCards from '../../assets/the-florist/stacked-cards.jpg';
import editorialWomanFlowers from '../../assets/the-florist/editorial-woman-flowers.jpg';
import teamWomanApron from '../../assets/the-florist/team-woman-apron.jpg';
import storefront from '../../assets/the-florist/storefront.jpg';

export const cover = {
  projectName: 'The Florist',
  category: 'Branding, Packaging, Website',
  designerName: '',
  year: '2026',
  logoUrl: logoFullLockup,
  backgroundImageUrl: bouquetWrapGoldRibbon,
};

export const sectionDivider = {
  sectionLabelLines: ['BRAND', 'IDENTITY'] as [string, string],
  projectName: 'The Florist',
  year: '2026',
  backgroundColorHex: '#0D0D0D',
};

export const brief = {
  // The real, confirmed tagline from the user's own brand spec image --
  // not invented.
  quoteText: 'Flowers that speak from the heart, for every moment worth marking.',
  backgroundColorHex: '#0D0D0D',
};

// Lorem-ipsum-style placeholder attribution, per the user's own
// instruction -- not a real named customer, unlike a case study you'd
// find published by someone else.
export const testimonial = {
  quoteAuthorName: 'A. Morgan',
  quoteAuthorRole: 'Founder, The Florist',
  backgroundColorHex: '#0D0D0D',
};

export const overview = {
  body: 'The Florist is a boutique flower studio built around a single idea: every arrangement should feel like it was made for one specific person. The identity needed to carry that same care through packaging, the storefront, and the shopping experience -- consistent, warm, and quietly premium at every touchpoint.',
};

export const problemSolution = {
  problemLabel: 'PROBLEM',
  problemText: 'The studio had a loyal local following but no consistent visual identity -- every bouquet, bag, and card looked like it came from a different shop.',
  solutionLabel: 'SOLUTION',
  solutionText: 'A single monogram mark, a locked color pair, and one packaging system applied everywhere: boxes, ribbon, bags, and the storefront sign.',
  photoUrl: teamWomanApron,
};

// Real logo, real derivation concept (letterform + botanical line mark
// combine into the final monogram) -- the two "before" shapes are my own
// simplified stand-ins for the real letterform/flower elements (I have the
// finished combined mark as a real asset, not the separated source
// layers), disclosed rather than presented as the designer's actual
// working files.
const LOGO_PANEL_LETTERFORM = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text x="50" y="72" font-family="Georgia, serif" font-size="72" font-weight="600" text-anchor="middle" fill="#0D0D0D">T</text>
  </svg>
`;
const LOGO_PANEL_FLOWER = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#C8A24D" stroke-width="2.5">
      <g transform="rotate(0 50 30)"><ellipse cx="50" cy="16" rx="9" ry="15" /></g>
      <g transform="rotate(72 50 30)"><ellipse cx="50" cy="16" rx="9" ry="15" /></g>
      <g transform="rotate(144 50 30)"><ellipse cx="50" cy="16" rx="9" ry="15" /></g>
      <g transform="rotate(216 50 30)"><ellipse cx="50" cy="16" rx="9" ry="15" /></g>
      <g transform="rotate(288 50 30)"><ellipse cx="50" cy="16" rx="9" ry="15" /></g>
      <circle cx="50" cy="30" r="3" fill="#C8A24D" />
      <path d="M50 45 L50 90" />
      <path d="M50 62 L34 72" />
      <path d="M50 70 L64 78" />
    </g>
  </svg>
`;

export const logoDerivation = {
  panels: [
    { shapeSvg: LOGO_PANEL_LETTERFORM, operatorAfter: '+' as const },
    { shapeSvg: LOGO_PANEL_FLOWER, operatorAfter: '=' as const },
    { shapeUrl: logoMarkOnly },
  ],
};

// #0D0D0D and #C8A24D are the real, confirmed hex pair from the user's own
// brand spec image. Cream and Blush are my own estimate, sampled by eye
// from the real product photography (the box/wrap backgrounds and the
// rose tones) -- disclosed as an estimate, not a spec value the way the
// other two are.
export const typographyColorSheet = {
  fontName: 'Jost (visual match -- not a confirmed spec)',
  fontSpecimenText: 'The Florist',
  colors: [
    { name: 'Ink', hex: '#0D0D0D' },
    { name: 'Gold', hex: '#C8A24D' },
    { name: 'Cream', hex: '#F3EDE1' },
    { name: 'Blush', hex: '#E3C2B8' },
  ],
};

// This brand has no real companion app -- none was in the supplied
// material, and a florist boutique realistically might not have one.
// Illustrative-only "app screen" content, built to demonstrate the module
// rather than presented as a real product.
function svgUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const MOCK_APP_SCREEN = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="650" viewBox="0 0 300 650">
    <rect width="300" height="650" fill="#0D0D0D"/>
    <rect width="300" height="110" fill="#0D0D0D"/>
    <text x="30" y="60" font-family="Georgia, serif" font-size="22" fill="#C8A24D">Your order</text>
    <text x="30" y="86" font-family="sans-serif" font-size="12" fill="#8A8A8A">Arriving today, 2-4pm</text>
    <rect x="24" y="140" width="252" height="140" rx="16" fill="#161616" stroke="#2A2A2A"/>
    <rect x="24" y="300" width="252" height="140" rx="16" fill="#161616" stroke="#2A2A2A"/>
    <rect x="44" y="160" width="140" height="12" rx="6" fill="#C8A24D"/>
    <rect x="44" y="184" width="200" height="10" rx="5" fill="#3A3A3A"/>
  </svg>
`);

export const deviceMockup = {
  deviceType: 'phone' as const,
  screenshotUrl: MOCK_APP_SCREEN,
  captionLabel: 'Order Tracking (illustrative -- no real app exists)',
  annotations: [{ text: 'Arriving in 2 hrs' }],
};

export const productCard = {
  // Product name/price are lorem-ipsum-style placeholders, per the user's
  // instruction -- not real catalog data.
  category: 'Signature Collection',
  name: 'The Ivory Bloom',
  price: '$85.00',
  photoUrl: boxBouquet,
  accentColorHex: '#C8A24D',
};

const HOMEPAGE_DIVIDER = {
  sectionLabelLines: ['WEBSITE', 'HOMEPAGE'] as [string, string],
  projectName: 'The Florist',
  year: '2026',
  backgroundColorHex: '#0D0D0D',
};

export const websiteHomepage = {
  divider: HOMEPAGE_DIVIDER,
  // Real tagline again, reused as the real hero headline this time.
  heroHeadline: 'Flowers That Speak From The Heart',
  heroBody: 'Hand-tied arrangements, delivered same-day, wrapped in a packaging system built to feel like a gift before the box is even open.',
  ctaLabel: 'Shop the Collection',
  heroImageUrl: bouquetWrapGoldRibbon,
  thumbnails: [boxBouquet, bagBouquet, stackedCards],
  thumbnailsCaption: 'The packaging system, applied consistently across every product.',
  statHeadline: 'A single identity, carried through every touchpoint.',
  // Illustrative stats -- this is a placeholder brand, not a real
  // business with real figures yet.
  stats: [
    { label: 'Same-day delivery', value: '92%' },
    { label: 'Repeat customers', value: '48%' },
    { label: 'Arrangements/mo', value: '600+' },
    { label: 'Years in bloom', value: '7' },
  ],
};

export const closingMosaic = {
  tiles: [
    { imageUrl: editorialWomanFlowers, dark: true, span: 'tall' as const },
    { imageUrl: storefront, dark: false, span: 'wide' as const },
    { imageUrl: boxBouquet, dark: false, span: 'square' as const },
    { imageUrl: teamWomanApron, dark: false, span: 'square' as const },
    { imageUrl: bagBouquet, dark: true, span: 'wide' as const },
    { imageUrl: logoOnBlack, dark: true, span: 'square' as const },
  ],
};
