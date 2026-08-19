import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/store';
import { Logo } from '../components/Logo';
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

// /templates/preview -- the real, user-facing "watch the template
// completely before you commit" view the user asked for: full-length
// render of every module in the Feature Story sequence, reachable from a
// "Preview" action on the Templates gallery card, with a "Use this
// template" action that performs the exact same real selection flow the
// gallery's own "Use template" button already does (actions.useTemplate)
// -- reused, not a parallel path.
//
// Currently Feature Story only: it's the one template with real,
// distinct module content to preview. The other 8 templates render
// through the shared category-driven frame loop and don't have an
// equivalent full "this is what it'll look like" render yet -- building
// that for each of them is the separate, larger piece of work flagged
// earlier, not silently included here.
//
// Content is sample content (src/lib/templates/editorial-demo-content.ts,
// shared with the internal /showcase dev view) -- disclosed as such below,
// since a preview happens before any project exists, so it can't show the
// visitor's own real screens yet.
export function TemplatePreview() {
  const { actions } = useApp();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 32px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Logo height={24} />
          <Link
            to="/templates"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13.5, textDecoration: 'none' }}
          >
            <i className="ph ph-arrow-left" style={{ fontSize: 15 }} />
            Back to templates
          </Link>
        </div>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Previewing · Feature Story
        </span>
        <button
          type="button"
          onClick={() => {
            actions.useTemplate('Feature Story');
            navigate('/create');
          }}
          style={{
            height: 40,
            padding: '0 20px',
            border: 0,
            borderRadius: 10,
            background: 'var(--violet-gradient)',
            color: '#FFFFFF',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Use this template
          <i className="ph ph-arrow-right" style={{ fontSize: 15 }} />
        </button>
      </header>

      <div style={{ padding: '14px 32px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
          Sample content below, so you can see the full layout before uploading anything. Your own screens, colors, and copy replace this once you start a case study.
        </p>
      </div>

      <CoverModule content={demo.cover} />
      <SectionDividerModule content={demo.sectionDivider} />
      <BriefModule content={demo.brief} />
      <TestimonialModule content={demo.testimonial} />
      <OverviewModule content={demo.overview} />
      <ProblemSolutionModule content={demo.problemSolution} />
      <LogoDerivationModule content={demo.logoDerivation} />
      <TypographyColorSheetModule content={demo.typographyColorSheet} />
      <DeviceMockupModule content={demo.deviceMockup} />
      <ProductCardModule content={demo.productCard} />
      <WebsiteHomepageModule content={demo.websiteHomepage} />
      <ClosingMosaicModule content={demo.closingMosaic} />

      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 32px', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            actions.useTemplate('Feature Story');
            navigate('/create');
          }}
          style={{
            height: 52,
            padding: '0 32px',
            border: 0,
            borderRadius: 12,
            background: 'var(--violet-gradient)',
            color: '#FFFFFF',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          Use this template
          <i className="ph ph-arrow-right" style={{ fontSize: 17 }} />
        </button>
      </div>
    </div>
  );
}
