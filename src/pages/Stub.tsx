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

// /showcase -- preview of the new "Editorial" case-study template's
// modules, stacked in order with a labeled heading above each so they can
// be reviewed independently. Fed realistic placeholder content (the
// "Northwind" mock project name matches this app's existing convention --
// used the same way in Refine.tsx's own logo mark/mock closing copy).
//
// Not wired into the real pipeline yet: this content is hand-written, not
// derived from an actual uploaded project. That integration (mapping real
// DesignSystemSheet/ApprovedSection data into these modules' content
// shapes) is a later, separate pass per the ticket.

const MOCK_COVER = {
  projectName: 'Northwind',
  category: 'Web App · Fintech',
  designerName: 'Alex Rivera',
  year: '2026',
};

const MOCK_DIVIDER = {
  sectionLabelLines: ['MOBILE APP', 'REDESIGN'] as [string, string],
  projectName: 'Northwind',
  year: '2026',
  backgroundColorHex: '#14141A',
};

// In real integration this hex would be resolved from the project's own
// DesignSystemSheet.colors (accent/primary role) by the caller before
// reaching BriefModule -- hardcoded here only because this showcase has no
// real uploaded project behind it yet.
const MOCK_BRIEF = {
  quoteText: 'We did not need another dashboard. We needed the numbers to tell the truth before the customer had to ask.',
  backgroundColorHex: '#3B2A66',
};

// Same backgroundColorHex as MOCK_BRIEF -- demonstrates Testimonial
// continuing Brief's background instead of hard-cutting to white, which is
// the whole point of this module's background prop.
const MOCK_TESTIMONIAL = {
  quoteAuthorName: 'Priya Anand',
  quoteAuthorRole: 'VP of Product, Northwind',
  backgroundColorHex: '#3B2A66',
};

const MOCK_OVERVIEW = {
  body: 'Northwind is a repeat-buyer checkout tool for mid-size retailers. The brief was narrow: cut the time between "add to cart" and "order confirmed" without hiding any of the decisions a returning customer actually wants to make. Eleven weeks from first screen to shipped release.',
};

// No photoUrl -- deliberately exercises the "no photo" path, same reasoning
// as MOCK_TESTIMONIAL testing the initials fallback in Phase 1 (there's no
// real uploaded project behind this showcase to pull a portrait from).
const MOCK_PROBLEM_SOLUTION = {
  problemLabel: 'PROBLEM',
  problemText: 'Repeat buyers were re-entering shipping and payment details on every order, even though nothing about their account had changed since the last one.',
  solutionLabel: 'SOLUTION',
  solutionText: 'A one-tap checkout that recognizes a returning buyer and pre-fills everything they already told us once, without hiding the decisions they still want to make.',
};

// Simple placeholder shapes, not real brand marks -- there's no real logo
// asset behind this showcase either.
const LOGO_PANEL_A_SVG = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="38" fill="#2B5FF5" /></svg>';
const LOGO_PANEL_B_SVG = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="16" width="68" height="68" rx="14" fill="#14141A" /></svg>';
const LOGO_PANEL_C_SVG =
  '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="16" width="68" height="68" rx="14" fill="#14141A" /><circle cx="50" cy="50" r="26" fill="#2B5FF5" /></svg>';

const MOCK_LOGO_DERIVATION = {
  panels: [{ shapeSvg: LOGO_PANEL_A_SVG, operatorAfter: '+' as const }, { shapeSvg: LOGO_PANEL_B_SVG, operatorAfter: '=' as const }, { shapeSvg: LOGO_PANEL_C_SVG }],
};

// colors is a plain prop here (not read from a real DesignSystemSheet) --
// see TypographyColorSheetModule.tsx's own comment on why, and note this
// as the integration point for later.
const MOCK_TYPOGRAPHY_COLOR = {
  fontName: 'Bricolage Grotesque',
  fontSpecimenText: 'Northwind',
  colors: [
    { name: 'Midnight', hex: '#14141A' },
    { name: 'Paper', hex: '#FAF9F6' },
    { name: 'Signal Blue', hex: '#2B5FF5' },
    { name: 'Warm Amber', hex: '#F5A623' },
  ],
};

// No real screenshot/photo/product image was reachable to mock these two
// modules with -- this environment has no PEXELS_API_KEY configured, and a
// direct connectivity check to api.pexels.com / images.pexels.com returned
// 403 from the network egress proxy (same kind of block hit reaching
// Behance directly). Rather than use a fabricated external URL that could
// silently 404, these are self-contained inline SVG illustrations --
// visibly abstract/geometric, not photorealistic, so they read as
// placeholders rather than real captured images.
function svgUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const MOCK_PHONE_SCREENSHOT = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="650" viewBox="0 0 300 650">
    <rect width="300" height="650" fill="#FAFAFA"/>
    <rect width="300" height="110" fill="#6038EE"/>
    <circle cx="40" cy="55" r="18" fill="#FFFFFF" opacity="0.9"/>
    <rect x="70" y="42" width="140" height="12" rx="6" fill="#FFFFFF" opacity="0.9"/>
    <rect x="70" y="62" width="90" height="10" rx="5" fill="#FFFFFF" opacity="0.6"/>
    <rect x="24" y="140" width="252" height="120" rx="16" fill="#FFFFFF" stroke="#E7E7EA"/>
    <rect x="24" y="280" width="252" height="120" rx="16" fill="#FFFFFF" stroke="#E7E7EA"/>
    <rect x="24" y="420" width="252" height="120" rx="16" fill="#FFFFFF" stroke="#E7E7EA"/>
    <rect x="44" y="160" width="140" height="12" rx="6" fill="#D3D3D8"/>
    <rect x="44" y="182" width="200" height="10" rx="5" fill="#E7E7EA"/>
  </svg>
`);

const MOCK_WATCH_SCREENSHOT = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="230" viewBox="0 0 200 230">
    <rect width="200" height="230" fill="#101014"/>
    <circle cx="100" cy="95" r="55" fill="none" stroke="#2B5FF5" stroke-width="8"/>
    <rect x="70" y="150" width="60" height="10" rx="5" fill="#77777F"/>
    <rect x="55" y="170" width="90" height="14" rx="7" fill="#F2F2F4"/>
  </svg>
`);

const MOCK_LIFESTYLE_PHOTO = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
    <rect width="480" height="360" fill="#14141A"/>
    <path d="M0 260 Q120 200 240 250 T480 230 V360 H0 Z" fill="#3B4A2E"/>
    <path d="M0 300 Q140 260 280 300 T480 280 V360 H0 Z" fill="#57633F"/>
    <circle cx="380" cy="80" r="46" fill="#F5A623" opacity="0.85"/>
  </svg>
`);

const MOCK_PRODUCT_PHOTO = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#EFEFEA"/>
    <rect x="140" y="150" width="120" height="150" rx="14" fill="#14141A"/>
    <rect x="155" y="120" width="90" height="40" rx="10" fill="#2B2B33"/>
    <circle cx="200" cy="225" r="26" fill="#2B5FF5"/>
  </svg>
`);

// Two configurations of the same module -- demonstrates both the flat
// variant (with a caption bar and floating annotations) and the
// photo-composite variant (activated purely by photoUrl's presence), the
// same "show the seam" reasoning used for MOCK_TESTIMONIAL's shared
// backgroundColorHex in the last phase.
const MOCK_DEVICE_MOCKUP_FLAT = {
  deviceType: 'phone' as const,
  screenshotUrl: MOCK_PHONE_SCREENSHOT,
  captionLabel: 'Shop',
  annotations: [{ text: '0/6 taken today' }],
};

const MOCK_DEVICE_MOCKUP_PHOTO = {
  deviceType: 'watch' as const,
  screenshotUrl: MOCK_WATCH_SCREENSHOT,
  photoUrl: MOCK_LIFESTYLE_PHOTO,
  captionLabel: 'Body Stats',
};

const MOCK_PRODUCT_CARD = {
  category: 'Skincare',
  name: 'Repair Serum',
  price: '$48.00',
  photoUrl: MOCK_PRODUCT_PHOTO,
  qtyBadge: 2,
};

// Same no-real-photo situation as Phase 3 -- still no PEXELS_API_KEY, and a
// direct connectivity re-check to api.pexels.com / images.pexels.com still
// returns 403 from this environment's egress proxy. More inline SVG
// placeholders, same disclosed reasoning as MOCK_PHONE_SCREENSHOT etc.
const MOCK_HERO_IMAGE = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
    <rect width="480" height="360" fill="#F3EFFE"/>
    <ellipse cx="240" cy="300" rx="160" ry="24" fill="#D9CCFB"/>
    <rect x="190" y="80" width="100" height="200" rx="20" fill="#14141A"/>
    <rect x="205" y="60" width="70" height="30" rx="10" fill="#2B2B33"/>
    <circle cx="240" cy="180" r="30" fill="#6038EE"/>
  </svg>
`);

const MOCK_THUMB_1 = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
    <rect width="200" height="140" fill="#EDE9FE"/>
    <rect x="30" y="30" width="140" height="80" rx="10" fill="#6038EE"/>
  </svg>
`);

const MOCK_THUMB_2 = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
    <rect width="200" height="140" fill="#FDEBEA"/>
    <circle cx="100" cy="70" r="45" fill="#FD8B5C"/>
  </svg>
`);

const MOCK_THUMB_3 = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
    <rect width="200" height="140" fill="#E4F6EE"/>
    <rect x="40" y="40" width="120" height="60" rx="30" fill="#1FA971"/>
  </svg>
`);

function mockAvatar(fill: string): string {
  return svgUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="${fill}"/>
      <circle cx="32" cy="26" r="12" fill="#FFFFFF"/>
      <rect x="12" y="42" width="40" height="16" rx="8" fill="#FFFFFF"/>
    </svg>
  `);
}

const MOCK_HOMEPAGE_DIVIDER = {
  sectionLabelLines: ['WEBSITE', 'HOMEPAGE'] as [string, string],
  projectName: 'Northwind',
  year: '2026',
  backgroundColorHex: '#1F2937',
};

const MOCK_WEBSITE_HOMEPAGE = {
  divider: MOCK_HOMEPAGE_DIVIDER,
  heroHeadline: 'Checkout that remembers you.',
  heroBody: 'One tap for returning buyers, full control for everyone else -- no re-typed cards, no lost carts.',
  ctaLabel: 'See it in action',
  heroImageUrl: MOCK_HERO_IMAGE,
  thumbnails: [MOCK_THUMB_1, MOCK_THUMB_2, MOCK_THUMB_3],
  thumbnailsCaption: 'Every screen in the returning-buyer flow, from cart to confirmation.',
  statHeadline: 'Built for retailers who already have repeat buyers to lose.',
  stats: [
    { label: 'Faster checkout', value: '3.2x' },
    { label: 'Cart recovery', value: '+18%' },
    { label: 'Weeks to ship', value: '11' },
    { label: 'Returning buyers', value: '64%' },
  ],
  avatarUrls: [mockAvatar('#6038EE'), mockAvatar('#FD8B5C'), mockAvatar('#1FA971')],
};

const MOCK_MOSAIC_ABSTRACT_A = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240">
    <rect width="480" height="240" fill="#FAF9F6"/>
    <path d="M60 200 C120 40 300 40 420 140" stroke="#57633F" stroke-width="10" fill="none"/>
    <ellipse cx="180" cy="90" rx="40" ry="20" fill="#7A9163" transform="rotate(-20 180 90)"/>
    <ellipse cx="260" cy="120" rx="40" ry="20" fill="#57633F" transform="rotate(10 260 120)"/>
  </svg>
`);

const MOCK_MOSAIC_ABSTRACT_B = svgUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <rect width="320" height="320" fill="#0D0D10"/>
    <circle cx="160" cy="130" r="60" fill="#27272E"/>
    <rect x="100" y="200" width="120" height="100" rx="30" fill="#27272E"/>
  </svg>
`);

const MOCK_CLOSING_MOSAIC = {
  tiles: [
    { imageUrl: MOCK_LIFESTYLE_PHOTO, dark: true, span: 'tall' as const },
    { imageUrl: MOCK_MOSAIC_ABSTRACT_A, dark: false, span: 'wide' as const },
    { imageUrl: MOCK_PRODUCT_PHOTO, dark: false, span: 'square' as const },
    { imageUrl: MOCK_THUMB_1, dark: false, span: 'square' as const },
    { imageUrl: MOCK_MOSAIC_ABSTRACT_B, dark: true, span: 'wide' as const },
    { imageUrl: MOCK_WATCH_SCREENSHOT, dark: true, span: 'square' as const },
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
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)' }}>Phase 1 + 2 + 3 + 4 build. Twelve modules, hand-fed placeholder content, not yet wired into the real pipeline.</p>
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

      <ModuleSection label="4 · Testimonial">
        <TestimonialModule content={MOCK_TESTIMONIAL} />
      </ModuleSection>

      <ModuleSection label="5 · Overview">
        <OverviewModule content={MOCK_OVERVIEW} />
      </ModuleSection>

      <ModuleSection label="6 · Problem / Solution">
        <ProblemSolutionModule content={MOCK_PROBLEM_SOLUTION} />
      </ModuleSection>

      <ModuleSection label="7 · Logo derivation">
        <LogoDerivationModule content={MOCK_LOGO_DERIVATION} />
      </ModuleSection>

      <ModuleSection label="8 · Typography / color sheet">
        <TypographyColorSheetModule content={MOCK_TYPOGRAPHY_COLOR} />
      </ModuleSection>

      <ModuleSection label="9 · Device mockup (flat variant, then photo variant)">
        <DeviceMockupModule content={MOCK_DEVICE_MOCKUP_FLAT} />
        <DeviceMockupModule content={MOCK_DEVICE_MOCKUP_PHOTO} />
      </ModuleSection>

      <ModuleSection label="10 · Product card">
        <ProductCardModule content={MOCK_PRODUCT_CARD} />
      </ModuleSection>

      <ModuleSection label="11 · Website homepage (own chapter break + browser frame + stats band)">
        <WebsiteHomepageModule content={MOCK_WEBSITE_HOMEPAGE} />
      </ModuleSection>

      <ModuleSection label="12 · Closing mosaic">
        <ClosingMosaicModule content={MOCK_CLOSING_MOSAIC} />
      </ModuleSection>
    </div>
  );
}
