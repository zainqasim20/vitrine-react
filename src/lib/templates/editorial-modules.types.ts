// Typed content shapes for the new "Editorial" case-study template's five
// Phase 1 modules. Deliberately independent of PresentFrame/ApprovedSection
// (src/lib/pipeline/types.ts) for now -- unifying with the real pipeline's
// frame types is a later integration step once this pass is reviewed, per
// the ticket. Each module component takes one of these as its content prop.

// Cover -- the case study's opening frame.
export interface CoverModuleContent {
  projectName: string;
  category: string;
  designerName: string;
  year: string;
  // Real project mark image, if one exists. Falls back to a circular
  // initial mark (never left blank) when absent.
  logoUrl?: string;
  // Per-module background choice (content, not app-wide dark mode) -- see
  // the ticket's explicit note that individual modules may use a dark
  // background as a chapter-break-style choice.
  dark?: boolean;
  // Full-bleed photo backdrop behind the meta strip + mark, mirroring
  // SectionDividerModuleContent's existing backgroundColorHex/
  // backgroundImageUrl pattern (solid color OR an image, never both).
  // Added on the real-reference correction pass: the real cover this
  // module is modeled on is photo-first, not a flat color block.
  backgroundImageUrl?: string;
}

// Section divider -- reusable chapter break, reused by every later section.
export interface SectionDividerModuleContent {
  // Two stacked lines, e.g. ["MOBILE APP", "REDESIGN"].
  sectionLabelLines: [string, string];
  projectName: string;
  year: string;
  // Background is either a solid color OR an image -- never both, and the
  // image (when present) must be one of the project's own uploaded
  // screenshots, never a stock photo, per the ticket.
  backgroundColorHex?: string;
  backgroundImageUrl?: string;
}

// Brief -- full-bleed scroll-linked pull quote.
export interface BriefModuleContent {
  quoteText: string;
  // Falls back to a locked-token brand color when omitted -- in real
  // integration this is expected to be resolved from
  // DesignSystemSheet.colors by the caller before this prop is set; this
  // module itself stays decoupled from pipeline types.
  backgroundColorHex?: string;
}

// Testimonial -- attribution for the Brief module's quote, built as its own
// module so it can be independently placed/removed later. Stays a separate
// component from BriefModule; backgroundColorHex just lets it visually
// continue whatever background Brief is using instead of hard-cutting to
// white, using the same optional/falls-back-to-a-locked-token pattern
// BriefModule already uses.
export interface TestimonialModuleContent {
  quoteAuthorName: string;
  quoteAuthorRole: string;
  // Falls back to initials-in-circle when absent.
  avatarUrl?: string;
  backgroundColorHex?: string;
}

// Overview -- centered, readability-constrained summary paragraph.
export interface OverviewModuleContent {
  body: string;
}

// Problem/Solution -- two rounded cards side by side.
export interface ProblemSolutionModuleContent {
  problemLabel: string;
  problemText: string;
  solutionLabel: string;
  solutionText: string;
  // Optional portrait/photo slot for the Problem (left) card -- genuinely
  // optional, no fallback mark required (unlike Cover's logo).
  photoUrl?: string;
}

// Logo Derivation -- N equal-width panels (2-4), each an icon/shape, with an
// optional "+" or "=" operator glyph rendered after it.
export interface LogoDerivationPanel {
  // Exactly one of these is expected per panel; shapeSvg (trusted, caller-
  // supplied raw markup -- same trust boundary as this module set's other
  // URL props) takes precedence if both are given.
  shapeUrl?: string;
  shapeSvg?: string;
  operatorAfter?: '+' | '=';
}

export interface LogoDerivationModuleContent {
  panels: LogoDerivationPanel[];
}

// Typography/Color sheet -- static "Font"/"Colors" pill labels (no existing
// reusable interactive tab component fit this pill look -- see
// TypographyColorSheetModule.tsx's own comment), a display-type specimen,
// and a divided color-swatch bar.
export interface TypographyColorSheetModuleContent {
  fontName: string;
  fontSpecimenText: string;
  // Plain prop for now, deliberately -- see TypographyColorSheetModule.tsx's
  // comment on why this isn't reading DesignSystemSheet.colors directly yet.
  colors: Array<{ name: string; hex: string }>;
}

// Device Mockup -- floats a phone/watch screenshot on flat canvas by
// default, or composites the same device+screenshot into a lifestyle photo
// when photoUrl is given. Which variant renders is decided purely by
// photoUrl's presence: deciding WHETHER to source a photo for a given
// screenshot is a pipeline-integration decision for later, not this
// module's job -- it just renders whichever case it's told.
export interface DeviceMockupAnnotation {
  text: string;
}

export interface DeviceMockupModuleContent {
  deviceType: 'phone' | 'watch';
  screenshotUrl: string;
  // Presence alone selects the photo-composite variant over the flat one.
  photoUrl?: string;
  // Right-hand half of the two-tone caption bar; the left half is a fixed
  // "App Screen" chrome label. Omitting this omits the whole bar.
  captionLabel?: string;
  // Floating stat/callout cards beside the device in the flat variant only.
  annotations?: DeviceMockupAnnotation[];
}

// Product Card -- category/name/price stack over a product photo, with an
// optional quantity badge on the photo's corner.
export interface ProductCardModuleContent {
  category: string;
  name: string;
  price: string;
  photoUrl: string;
  qtyBadge?: string | number;
  // Phase 5: the accent-color integration point flagged in Phase 3 --
  // falls back to var(--violet) when absent, same optional/falls-back-to-a-
  // locked-token pattern as Brief/TestimonialModuleContent's
  // backgroundColorHex.
  accentColorHex?: string;
}

// Website Homepage -- a SectionDividerModule chapter break (reused
// directly, not duplicated, per the ticket), followed by a browser-framed
// homepage mockup and a full-bleed dark stats band.
export interface WebsiteHomepageModuleContent {
  // Fed straight into the already-built SectionDividerModule for this
  // module's own leading chapter break.
  divider: SectionDividerModuleContent;
  heroHeadline: string;
  heroBody: string;
  ctaLabel: string;
  heroImageUrl: string;
  thumbnails: string[];
  // Small caption under the right-hand thumbnail stack. The ticket
  // described "thumbnail stack + description text on the right" but its
  // enumerated field list didn't include a field for that text -- added to
  // actually cover the described layout; optional, since a thumbnail stack
  // alone is still a complete right column without it.
  thumbnailsCaption?: string;
  statHeadline: string;
  stats: Array<{ label: string; value: string }>;
  avatarUrls?: string[];
}

// Closing Mosaic -- asymmetric bento-style closing grid.
export interface ClosingMosaicTile {
  imageUrl: string;
  dark?: boolean;
  span?: 'tall' | 'wide' | 'square';
}

export interface ClosingMosaicModuleContent {
  tiles: ClosingMosaicTile[];
}
