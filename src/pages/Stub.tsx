import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { CoverModule } from '../components/templates/editorial/CoverModule';
import { SectionDividerModule } from '../components/templates/editorial/SectionDividerModule';
import { BriefModule } from '../components/templates/editorial/BriefModule';
import { TestimonialModule } from '../components/templates/editorial/TestimonialModule';
import { OverviewModule } from '../components/templates/editorial/OverviewModule';
import { ProblemSolutionModule } from '../components/templates/editorial/ProblemSolutionModule';
import { LogoDerivationModule } from '../components/templates/editorial/LogoDerivationModule';
import { TypographyColorSheetModule } from '../components/templates/editorial/TypographyColorSheetModule';
import { DeviceMockupModule } from '../components/templates/editorial/DeviceMockupModule';
import { ProductCardModule } from '../components/templates/editorial/ProductCardModule';
import { WebsiteHomepageModule } from '../components/templates/editorial/WebsiteHomepageModule';
import { ClosingMosaicModule } from '../components/templates/editorial/ClosingMosaicModule';

import logoFullLockup from '../assets/the-florist/logo-full-lockup.png';
import logoMarkOnly from '../assets/the-florist/logo-mark-only.png';
import logoOnBlack from '../assets/the-florist/logo-on-black-1.jpg';
import boxBouquet from '../assets/the-florist/box-bouquet.jpg';
import bouquetWrapGoldRibbon from '../assets/the-florist/bouquet-wrap-gold-ribbon.jpg';
import bagBouquet from '../assets/the-florist/bag-bouquet.jpg';
import stackedCards from '../assets/the-florist/stacked-cards.jpg';
import editorialWomanFlowers from '../assets/the-florist/editorial-woman-flowers.jpg';
import teamWomanApron from '../assets/the-florist/team-woman-apron.jpg';
import storefront from '../assets/the-florist/storefront.jpg';

// /showcase -- preview of the Editorial case-study template's modules,
// stacked in order with a labeled heading above each so they can be
// reviewed independently.
//
// This pass reuses the real brand assets the user supplied (uploads/
// Sample_Images.zip -- their own "The Florist" logo + product/lifestyle
// photography, cropped out of the composite mood-board sheets they sent,
// see the crop script this session ran for exactly what was extracted from
// where). Real, user-owned material -- not stock, not someone else's case
// study, no copyright question.
//
// What's real vs. disclosed-placeholder in this mock content:
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

const MOCK_COVER = {
  projectName: 'The Florist',
  category: 'Branding, Packaging, Website',
  designerName: '',
  year: '2026',
  logoUrl: logoFullLockup,
  backgroundImageUrl: bouquetWrapGoldRibbon,
};

const MOCK_DIVIDER = {
  sectionLabelLines: ['BRAND', 'IDENTITY'] as [string, string],
  projectName: 'The Florist',
  year: '2026',
  backgroundColorHex: '#0D0D0D',
};

const MOCK_BRIEF = {
  // The real, confirmed tagline from the user's own brand spec image --
  // not invented.
  quoteText: 'Flowers that speak from the heart, for every moment worth marking.',
  backgroundColorHex: '#0D0D0D',
};

// Lorem-ipsum-style placeholder attribution, per the user's own
// instruction -- not a real named customer, unlike a case study you'd
// find published by someone else.
const MOCK_TESTIMONIAL = {
  quoteAuthorName: 'A. Morgan',
  quoteAuthorRole: 'Founder, The Florist',
  backgroundColorHex: '#0D0D0D',
};

const MOCK_OVERVIEW = {
  body: 'The Florist is a boutique flower studio built around a single idea: every arrangement should feel like it was made for one specific person. The identity needed to carry that same care through packaging, the storefront, and the shopping experience -- consistent, warm, and quietly premium at every touchpoint.',
};

const MOCK_PROBLEM_SOLUTION = {
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

const MOCK_LOGO_DERIVATION = {
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
const MOCK_TYPOGRAPHY_COLOR = {
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

const MOCK_DEVICE_MOCKUP = {
  deviceType: 'phone' as const,
  screenshotUrl: MOCK_APP_SCREEN,
  captionLabel: 'Order Tracking (illustrative -- no real app exists)',
  annotations: [{ text: 'Arriving in 2 hrs' }],
};

const MOCK_PRODUCT_CARD = {
  // Product name/price are lorem-ipsum-style placeholders, per the user's
  // instruction -- not real catalog data.
  category: 'Signature Collection',
  name: 'The Ivory Bloom',
  price: '$85.00',
  photoUrl: boxBouquet,
  accentColorHex: '#C8A24D',
};

const MOCK_HOMEPAGE_DIVIDER = {
  sectionLabelLines: ['WEBSITE', 'HOMEPAGE'] as [string, string],
  projectName: 'The Florist',
  year: '2026',
  backgroundColorHex: '#0D0D0D',
};

const MOCK_WEBSITE_HOMEPAGE = {
  divider: MOCK_HOMEPAGE_DIVIDER,
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

const MOCK_CLOSING_MOSAIC = {
  tiles: [
    { imageUrl: editorialWomanFlowers, dark: true, span: 'tall' as const },
    { imageUrl: storefront, dark: false, span: 'wide' as const },
    { imageUrl: boxBouquet, dark: false, span: 'square' as const },
    { imageUrl: teamWomanApron, dark: false, span: 'square' as const },
    { imageUrl: bagBouquet, dark: true, span: 'wide' as const },
    { imageUrl: logoOnBlack, dark: true, span: 'square' as const },
  ],
};

function ModuleSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ padding: '20px 48px 0' }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</span>
      </div>
      <div style={{ paddingTop: 16 }}>{children}</div>
    </section>
  );
}

export function Stub() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '16px 40px', borderBottom: '1px solid var(--border)' }}>
        <Logo height={26} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ThemeSwitch />
          <Link
            to="/create"
            style={{ height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--violet-gradient)', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            Start a case study
          </Link>
        </div>
      </header>

      <div style={{ padding: '32px 48px 8px' }}>
        <h1 style={{ margin: '0 0 4px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 26, letterSpacing: '-0.02em' }}>Editorial template — module preview</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)' }}>
          Real "The Florist" brand assets (your own uploaded images), lorem-ipsum-style placeholder content where noted per module.
        </p>
      </div>

      <ModuleSection label="1 · Cover">
        <CoverModule content={MOCK_COVER} />
      </ModuleSection>

      <ModuleSection label="2 · Section divider (reusable)">
        <SectionDividerModule content={MOCK_DIVIDER} />
      </ModuleSection>

      <ModuleSection label="3 · Brief (scroll-linked quote)">
        <BriefModule content={MOCK_BRIEF} />
      </ModuleSection>

      <ModuleSection label="4 · Testimonial (placeholder attribution)">
        <TestimonialModule content={MOCK_TESTIMONIAL} />
      </ModuleSection>

      <ModuleSection label="5 · Overview">
        <OverviewModule content={MOCK_OVERVIEW} />
      </ModuleSection>

      <ModuleSection label="6 · Problem / Solution">
        <ProblemSolutionModule content={MOCK_PROBLEM_SOLUTION} />
      </ModuleSection>

      <ModuleSection label="7 · Logo derivation (real final mark, illustrative source shapes)">
        <LogoDerivationModule content={MOCK_LOGO_DERIVATION} />
      </ModuleSection>

      <ModuleSection label="8 · Typography / color sheet (real hex pair, inferred font)">
        <TypographyColorSheetModule content={MOCK_TYPOGRAPHY_COLOR} />
      </ModuleSection>

      <ModuleSection label="9 · Device mockup (illustrative -- no real app exists for this brand)">
        <DeviceMockupModule content={MOCK_DEVICE_MOCKUP} />
      </ModuleSection>

      <ModuleSection label="10 · Product card (placeholder name/price)">
        <ProductCardModule content={MOCK_PRODUCT_CARD} />
      </ModuleSection>

      <ModuleSection label="11 · Website homepage (own chapter break + browser frame + stats band)">
        <WebsiteHomepageModule content={MOCK_WEBSITE_HOMEPAGE} />
      </ModuleSection>

      <ModuleSection label="12 · Closing mosaic (real photography)">
        <ClosingMosaicModule content={MOCK_CLOSING_MOSAIC} />
      </ModuleSection>
    </div>
  );
}
