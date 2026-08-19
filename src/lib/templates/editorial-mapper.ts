// Phase 5 -- pure mapping function from real pipeline output to the
// Editorial template's 12 module content shapes (editorial-modules.types.ts).
// Colocated with those types rather than under lib/pipeline/, since this
// isn't a pipeline stage itself (it runs after Present/Narrate, consuming
// their output) -- it's the template layer's own consumer of that output,
// the same relationship editorial-modules.types.ts already has to
// lib/pipeline/types.ts.
//
// Pure, no API calls, no state reads -- same character as present.ts.
// present.ts takes its three inputs as positional arguments; this function
// takes one input object instead, because it draws on five real stages at
// once (Perceive, Extract, Present, Narrate, Interview) rather than
// present.ts's three -- five-plus positional arguments would be harder to
// call correctly than one typed object. The underlying discipline is the
// same: every field on the input is real data already produced elsewhere
// in the pipeline, nothing is fetched or invented here.
//
// This file does NOT touch Refine.tsx, store.tsx, or module-sequences.json,
// and does not add Editorial as a selectable template anywhere -- per the
// Phase 5 ticket, it's a standalone mapping function, wired into nothing
// yet.

import type { ApprovedSection, CategorySignalsConfig, DesignSystemSheet, ImageFeatureRecord, Narration } from '../pipeline/types';
import type {
  BriefModuleContent,
  ClosingMosaicModuleContent,
  CoverModuleContent,
  DeviceMockupModuleContent,
  LogoDerivationModuleContent,
  OverviewModuleContent,
  ProblemSolutionModuleContent,
  ProductCardModuleContent,
  SectionDividerModuleContent,
  TestimonialModuleContent,
  TypographyColorSheetModuleContent,
  WebsiteHomepageModuleContent,
} from './editorial-modules.types';

export interface EditorialMapperInput {
  projectName: string;
  category: string | null;
  categorySignals: CategorySignalsConfig;
  designSystemSheet: DesignSystemSheet;
  approvedSections: ApprovedSection[];
  // Keyed by file id, matching approvedSections[i].file.id -- same shape as
  // state.pipeline.perceiveRecords, passed in rather than read from store
  // state directly (this file never imports store.tsx).
  perceiveRecords: Record<string, ImageFeatureRecord>;
  narration: Narration | null;
  outcome: string;
  tools: string[];
}

export interface EditorialContentBundle {
  cover: CoverModuleContent;
  sectionDivider: SectionDividerModuleContent;
  brief: BriefModuleContent;
  testimonial: TestimonialModuleContent;
  overview: OverviewModuleContent;
  problemSolution: ProblemSolutionModuleContent;
  logoDerivation: LogoDerivationModuleContent;
  typographyColorSheet: TypographyColorSheetModuleContent;
  deviceMockup: DeviceMockupModuleContent;
  productCard: ProductCardModuleContent;
  websiteHomepage: WebsiteHomepageModuleContent;
  closingMosaic: ClosingMosaicModuleContent;
}

// Used only when a project has zero approved sections -- shouldn't happen
// for any real project that reaches this function (Present already
// requires real approved sections to assemble frames), but keeps every
// required image field a valid, non-empty string instead of one that would
// 404. Deliberately blank and unstyled, not made to look like real content.
const NO_IMAGE_FALLBACK = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#E7E7EA"/></svg>')}`;

function categoryLabelFor(category: string | null, categorySignals: CategorySignalsConfig): string {
  if (!category) return 'This Project';
  const found = categorySignals.categories.find((c) => c.id === category);
  return found?.label || category;
}

function splitCategoryIntoTwoLines(categoryLabel: string): [string, string] {
  const words = categoryLabel.toUpperCase().split(' ');
  if (words.length <= 1) return [categoryLabel.toUpperCase(), 'CASE STUDY'];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

// DesignSystemColor.role is real free-text from Gemini's Perceive/Extract
// output (docs/ai-system-prompt.md Part 1.1/4.1, referenced throughout this
// pipeline's comments but not present in this repo's docs/ folder) -- not a
// fixed enum, so this substring match is a best-effort heuristic, not a
// guaranteed hit. When nothing matches, callers fall back to their own
// locked token (var(--violet) in ProductCardModule, etc.), which is exactly
// why those fallbacks exist.
const ACCENT_ROLE_PATTERN = /accent|primary|brand/i;

function findAccentColorHex(sheet: DesignSystemSheet): string | undefined {
  return sheet.colors.find((c) => ACCENT_ROLE_PATTERN.test(c.role))?.hex;
}

function findLogoUrl(sections: ApprovedSection[], perceiveRecords: Record<string, ImageFeatureRecord>): string | undefined {
  return sections.find((s) => perceiveRecords[s.file.id]?.contentType.isLogoOrMark)?.file.url;
}

function findUiScreenshot(sections: ApprovedSection[], perceiveRecords: Record<string, ImageFeatureRecord>): ApprovedSection | undefined {
  return sections.find((s) => perceiveRecords[s.file.id]?.contentType.isUIScreen) || sections[0];
}

function deviceTypeFor(section: ApprovedSection | undefined, perceiveRecords: Record<string, ImageFeatureRecord>): 'phone' | 'watch' {
  const frame = section && perceiveRecords[section.file.id]?.chrome.deviceFrame;
  return frame === 'watch' ? 'watch' : 'phone';
}

function findHomepageHero(sections: ApprovedSection[], perceiveRecords: Record<string, ImageFeatureRecord>): ApprovedSection | undefined {
  return (
    sections.find((s) => {
      const r = perceiveRecords[s.file.id];
      return r && (r.chrome.browserChrome || r.mockupStaging === 'browser-frame');
    }) || sections[0]
  );
}

function findProductPhoto(sections: ApprovedSection[], perceiveRecords: Record<string, ImageFeatureRecord>): ApprovedSection | undefined {
  return (
    sections.find((s) => {
      const r = perceiveRecords[s.file.id];
      return r && (r.contentType.isPackaging || r.contentType.is3DRender);
    }) || sections[0]
  );
}

const MOSAIC_SPAN_CYCLE: NonNullable<ClosingMosaicModuleContent['tiles'][number]['span']>[] = ['tall', 'wide', 'square', 'wide', 'square', 'square'];

export function mapPipelineToEditorialContent(input: EditorialMapperInput): EditorialContentBundle {
  const { projectName, category, categorySignals, designSystemSheet: sheet, approvedSections: sections, perceiveRecords, narration, outcome, tools } = input;

  const categoryLabel = categoryLabelFor(category, categorySignals);
  // No real project-date field exists anywhere in this app's state -- the
  // current calendar year is the most honest real value available, not a
  // fabricated one, but it is a disclosed stand-in for "the year the
  // project actually happened," which this pipeline doesn't capture.
  const year = String(new Date().getFullYear());
  const accentColorHex = findAccentColorHex(sheet);

  const cover: CoverModuleContent = {
    projectName,
    category: categoryLabel,
    // No designer-identity field exists anywhere in this app's state (no
    // account/profile system -- confirmed by checking SettingsPage.tsx,
    // which itself only shows placeholder "Your Name" / "you@example.com").
    // Left empty rather than invented; CoverModule renders this blank
    // instead of a fabricated name.
    designerName: '',
    year,
    logoUrl: findLogoUrl(sections, perceiveRecords),
  };

  const sectionDivider: SectionDividerModuleContent = {
    sectionLabelLines: splitCategoryIntoTwoLines(categoryLabel),
    projectName,
    year,
    backgroundColorHex: accentColorHex,
  };

  const brief: BriefModuleContent = {
    // interview.outcome is real, user-authored text describing the
    // project's outcome -- the closest real analog to a full-bleed pull
    // quote this pipeline captures anywhere.
    quoteText: outcome || sections[0]?.body || '',
    backgroundColorHex: accentColorHex,
  };

  const testimonial: TestimonialModuleContent = {
    // No reviewer/client-quote-attribution feature exists anywhere in this
    // pipeline (no name/role collection for a testimonial). Left empty
    // rather than inventing a plausible-sounding person -- TestimonialModule
    // already has a safe fallback for this (initials render as "?").
    quoteAuthorName: '',
    quoteAuthorRole: '',
    backgroundColorHex: accentColorHex,
  };

  const overview: OverviewModuleContent = {
    body: sections[0]?.body || (narration ? `${narration.problemStatement} ${narration.outcomeFraming}`.trim() : ''),
  };

  const problemSolution: ProblemSolutionModuleContent = narration
    ? {
        problemLabel: narration.problemLabel || 'The Problem',
        problemText: narration.problemStatement,
        solutionLabel: narration.outcomeLabel || 'The Outcome',
        solutionText: narration.outcomeFraming,
      }
    : {
        // Narrate hasn't run yet (no Gemini key, or this project hasn't
        // reached that stage) -- no real problem/solution text exists yet.
        problemLabel: '',
        problemText: '',
        solutionLabel: '',
        solutionText: '',
      };

  // Integration point 1 of 3 (deferred, not resolved): no logo-derivation
  // signal exists anywhere in this pipeline -- Perceive doesn't decompose a
  // logo into its constituent shapes, and nothing else in this app does
  // either. Rather than invent shape data, this returns an empty panel
  // list; LogoDerivationModule already renders nothing for an empty array
  // without erroring.
  const logoDerivation: LogoDerivationModuleContent = { panels: [] };

  // Integration point 1 of 3 flagged in the Phase 5 ticket -- RESOLVED with
  // real data. DesignSystemColor has no "name" field, only role/hex, so the
  // display name is the real extracted role string, title-cased.
  const typographyColorSheet: TypographyColorSheetModuleContent = {
    fontName: sheet.typography.find((t) => t.userSuppliedFontName)?.userSuppliedFontName || sheet.typography[0]?.styleDescription || 'Not yet specified',
    fontSpecimenText: projectName,
    colors: sheet.colors.slice(0, 6).map((c) => ({ name: c.role.charAt(0).toUpperCase() + c.role.slice(1), hex: c.hex })),
  };

  const uiScreenSection = findUiScreenshot(sections, perceiveRecords);
  const deviceMockup: DeviceMockupModuleContent = {
    deviceType: deviceTypeFor(uiScreenSection, perceiveRecords),
    screenshotUrl: uiScreenSection?.file.url || NO_IMAGE_FALLBACK,
    // Integration point 3 of 3 flagged in the Phase 5 ticket -- DEFERRED,
    // not resolved. No real signal exists yet for "should this screen be
    // shown composited into a lifestyle photo" -- that would need either a
    // real Pexels integration (out of scope this phase, per the ticket) or
    // a flag on the project data that doesn't exist. photoUrl is never
    // populated here; DeviceMockupModule already renders its flat variant
    // whenever photoUrl is absent, which is exactly the intended behavior
    // for every real project until that signal exists.
  };

  const productPhotoSection = findProductPhoto(sections, perceiveRecords);
  const productCard: ProductCardModuleContent = {
    category: categoryLabel,
    name: projectName,
    // No pricing signal exists anywhere in this pipeline (it documents
    // portfolio case studies, not e-commerce catalog data) -- an explicit
    // non-numeric placeholder, not a fabricated-but-plausible price.
    price: '—',
    photoUrl: productPhotoSection?.file.url || NO_IMAGE_FALLBACK,
    // Integration point 2 of 3 flagged in the Phase 5 ticket -- RESOLVED
    // with real data when the design system has an extractable accent;
    // undefined (falls back to var(--violet)) otherwise.
    accentColorHex,
  };

  const homepageHeroSection = findHomepageHero(sections, perceiveRecords);
  // .file.url is optional on ApprovedSection (a section can in principle
  // lack a resolved file URL) -- filtered down to real, present URLs only,
  // rather than padding gaps with the neutral fallback square, since these
  // are flexible-length arrays where it's more honest to just show fewer
  // real thumbnails than to pad with placeholders that look like content.
  const thumbUrls = sections
    .filter((s) => s.id !== homepageHeroSection?.id)
    .map((s) => s.file.url)
    .filter((u): u is string => Boolean(u));
  const websiteHomepage: WebsiteHomepageModuleContent = {
    divider: {
      sectionLabelLines: ['WEBSITE', 'HOMEPAGE'],
      projectName,
      year,
      backgroundColorHex: accentColorHex,
    },
    heroHeadline: narration?.outcomeFraming || projectName,
    heroBody: outcome || sections[0]?.body || '',
    // Static UI-chrome label, not derived data -- same convention as
    // DeviceMockupModule's own fixed "App Screen" caption-bar label.
    ctaLabel: 'See it in action',
    heroImageUrl: homepageHeroSection?.file.url || NO_IMAGE_FALLBACK,
    thumbnails: thumbUrls.slice(0, 3),
    thumbnailsCaption: thumbUrls.length ? 'Every real screen behind this case study.' : undefined,
    // Synthesized from real counts, not narration text -- heroHeadline
    // already carries narration.outcomeFraming and problemSolution already
    // carries the rest of Narration, so reusing narration a third time here
    // would just repeat the same sentence twice on one page. Assembling a
    // sentence from real counts instead (same technique present.ts's own
    // synthesizeSubstituteBody() uses: describe only what was actually
    // extracted, never invent specifics) gives this stat band its own,
    // distinct, still-real headline.
    statHeadline: `${projectName} in numbers: ${sections.length} real screen${sections.length === 1 ? '' : 's'}, ${tools.length} tool${tools.length === 1 ? '' : 's'}, one shipped outcome.`,
    // All four are real counts read directly off this project's own
    // pipeline output -- no fabricated business metrics.
    stats: [
      { label: 'Screens documented', value: String(sections.length) },
      { label: 'Colors extracted', value: String(sheet.colors.length) },
      { label: 'Components catalogued', value: String(Object.values(sheet.components).reduce((sum, c) => sum + c.count, 0)) },
      { label: 'Tools used', value: String(tools.length) },
    ],
    // No reviewer/team-avatar data exists anywhere in this pipeline --
    // omitted rather than invented.
  };

  // ClosingMosaic's real content is every approved section's own real
  // screenshot, capped at 6 (the reference proportions this module was
  // built against). span/dark are a presentational cycle chosen here at
  // the mapper level, not by the component -- ClosingMosaicModule itself
  // still just renders whatever span/dark it's given per tile, exactly as
  // built in Phase 4; alternating them is this mapper's own disclosed
  // choice for lack of any real per-image "light/dark" signal, not the
  // component reintroducing the index%2 pattern that ticket ruled out.
  const mosaicUrls = sections.map((s) => s.file.url).filter((u): u is string => Boolean(u));
  const closingMosaic: ClosingMosaicModuleContent = {
    tiles: mosaicUrls.slice(0, 6).map((url, i) => ({
      imageUrl: url,
      span: MOSAIC_SPAN_CYCLE[i % MOSAIC_SPAN_CYCLE.length],
      dark: i % 2 === 1,
    })),
  };

  return {
    cover,
    sectionDivider,
    brief,
    testimonial,
    overview,
    problemSolution,
    logoDerivation,
    typographyColorSheet,
    deviceMockup,
    productCard,
    websiteHomepage,
    closingMosaic,
  };
}
