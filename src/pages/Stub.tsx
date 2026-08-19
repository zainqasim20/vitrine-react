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
import * as demo from '../lib/templates/editorial-demo-content';

// /showcase -- internal, dev-only preview of the Editorial case-study
// template's modules, stacked in order with a labeled heading above each
// so they can be reviewed independently. Content lives in
// src/lib/templates/editorial-demo-content.ts (shared with the real,
// user-facing /templates/preview page) -- see that file's own header for
// what's real vs. disclosed-placeholder in this content.

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
        <CoverModule content={demo.cover} />
      </ModuleSection>

      <ModuleSection label="2 · Section divider (reusable)">
        <SectionDividerModule content={demo.sectionDivider} />
      </ModuleSection>

      <ModuleSection label="3 · Brief (scroll-linked quote)">
        <BriefModule content={demo.brief} />
      </ModuleSection>

      <ModuleSection label="4 · Testimonial (placeholder attribution)">
        <TestimonialModule content={demo.testimonial} />
      </ModuleSection>

      <ModuleSection label="5 · Overview">
        <OverviewModule content={demo.overview} />
      </ModuleSection>

      <ModuleSection label="6 · Problem / Solution">
        <ProblemSolutionModule content={demo.problemSolution} />
      </ModuleSection>

      <ModuleSection label="7 · Logo derivation (real final mark, illustrative source shapes)">
        <LogoDerivationModule content={demo.logoDerivation} />
      </ModuleSection>

      <ModuleSection label="8 · Typography / color sheet (real hex pair, inferred font)">
        <TypographyColorSheetModule content={demo.typographyColorSheet} />
      </ModuleSection>

      <ModuleSection label="9 · Device mockup (illustrative -- no real app exists for this brand)">
        <DeviceMockupModule content={demo.deviceMockup} />
      </ModuleSection>

      <ModuleSection label="10 · Product card (placeholder name/price)">
        <ProductCardModule content={demo.productCard} />
      </ModuleSection>

      <ModuleSection label="11 · Website homepage (own chapter break + browser frame + stats band)">
        <WebsiteHomepageModule content={demo.websiteHomepage} />
      </ModuleSection>

      <ModuleSection label="12 · Closing mosaic (real photography)">
        <ClosingMosaicModule content={demo.closingMosaic} />
      </ModuleSection>
    </div>
  );
}
