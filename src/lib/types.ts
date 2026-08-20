import type { ApprovedSection, ClassifyResult, DesignSystemSheet, ImageFeatureRecord, Narration, PerceiveStatus, PresentFrame } from './pipeline/types';
import type { FreeformDoc } from './templates/freeform-types';

// The canvas's real, dynamic section list -- a superset of ApprovedSection
// that also carries the real Design System sheet and any Present-generated
// placeholder sections, each tagged with `kind` so Refine.tsx can branch.
export type CanvasSection =
  | (ApprovedSection & { kind: 'image' })
  | { id: string; kind: 'design-system'; label: string; content: DesignSystemSheet }
  | { id: string; kind: 'generated'; label: string; headline: string; body: string };

export type ThemeMode = 'light' | 'dark' | 'system';

// Real stock-photo shape, returned by /api/pexels-search (unchanged from
// the live site's response mapping) and /api/unsplash-search (a second,
// later-added real source normalized into the same fields -- see
// StockPhotoSearch in Customize.tsx). downloadLocation is Unsplash-only:
// their API Guidelines require pinging that URL when a photo is actually
// used, not just shown in search results (see
// api/unsplash-track-download.js); Pexels has no equivalent requirement.
export interface PexelsPhoto {
  id: number | string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
  alt: string;
  source?: 'pexels' | 'unsplash';
  downloadLocation?: string;
}

export type StockPhotoEntry = { status: 'loading' } | { status: 'unavailable' } | { status: 'ready'; photo: PexelsPhoto } | { status: 'error'; message: string };

// Real Scene Construction Framework treatment (CSS/layout only, no image
// generation) applied to Key Features frames -- ported from
// docs/presentation-styles-creativity-engine.md Part 1 (the 8 layers),
// Part 3 (category -> environment/mood mapping) and Part 6 (consistency
// guardrails: one color grade + one dominant surface family per project).
// A pure function of the project's own real extracted colors + real
// Classify category, so every frame gets the identical treatment -- see
// store.tsx's sceneTreatment().
export interface SceneTreatment {
  category: string | null;
  accentHex: string | null;
  panelBackground: string;
  imageShadow: string;
  tiltDeg: number;
  glossy: boolean;
  padding: number;
  // Whether panelBackground reads dark enough that overlay text needs to be
  // light -- used by Cover Variants' text-on-scene compositions. A per-
  // recipe flag rather than parsing the CSS string (some recipes are
  // gradients) at render time.
  textOnDark: boolean;
}

export type ScreenStatus = 'pending' | 'loading' | 'drafted' | 'error' | 'skipped' | 'approved';

export interface UploadedFile {
  id: string;
  name: string;
  file?: File;
  mimeType?: string;
  // Real object URL for the uploaded file, created via URL.createObjectURL
  // and revoked on removal -- the actual screenshot, not a placeholder graphic.
  url?: string;
}

export interface Caption {
  headline: string;
  body: string;
}

export type ProjectStatus = 'Draft' | 'Published';

// Text/settings that survive a reload -- what openProject() can restore for
// an older project when its in-memory files/blob URLs are gone. Deliberately
// keyed on previewTheme/previewLayout (this port's own real Preview fields),
// not the live site's overloaded state.theme.
export interface ProjectSnapshot {
  title: string;
  previewTheme: AppState['previewTheme'];
  previewLayout: AppState['previewLayout'];
  briefA: string;
  briefB: string;
  // The freeform customize doc, present only for Feature Story projects
  // saved from /templates/customize. Unlike the frames pipeline above (real
  // screenshots live in memory-only blob URLs, so a reopened project can
  // only restore its text/settings), a freeform doc has no such gap: every
  // image is either a bundled asset path or a base64 data URI already
  // written into the element itself, so this snapshot really is the whole
  // project -- reopening restores the exact canvas, not just its settings.
  freeform?: AppState['freeform'];
  freeformTemplateMode?: AppState['templateMode'];
}

// Real, localStorage-backed project record -- ported from the live site's
// PROJECTS_KEY model. cover is a real canvas-downsampled JPEG data URL of
// the first approved screenshot, never a stock/placeholder image.
export interface ProjectRecord {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: number;
  editedAt: number;
  deletedAt: number | null;
  sectionCount: number;
  cover: string | null;
  snapshot: ProjectSnapshot;
}

export interface SectionSize {
  w: number;
  h: number;
}

export type ClarifyingContext = 'style' | 'brief' | 'variant' | null;

export type PreviewLayout = 'grid' | 'editorial' | 'list';

export interface VariantSlot {
  index: number;
  ready: boolean;
}

export type ClientStatus = 'Personal' | 'Client — can name' | 'Client — confidential (NDA)';

export interface InterviewState {
  projectName: string;
  clientStatus: ClientStatus;
  tools: string[];
  toolsUnconfirmed: boolean;
  customTool: string;
  outcome: string;
  fonts: string;
  submitted: boolean;
  skipped: boolean;
}

export interface AppState {
  theme: ThemeMode;

  files: UploadedFile[];
  briefA: string;
  briefB: string;
  projectName: string;
  prompt: string;
  template: string;

  // Phase 6 -- which render path Refine's canvas uses, distinct from
  // `template` above (which only ever held a display name for Review.tsx's
  // cosmetic "swap presentation style" picker and never changed actual
  // rendering). 'frames' is the existing category-driven frame loop,
  // unchanged; 'feature-story' renders the Editorial module set via
  // mapPipelineToEditorialContent() instead. Additive: every existing
  // template keeps resolving to 'frames'.
  templateMode: 'frames' | 'feature-story';

  // The freeform customize screen (/templates/customize) -- a genuinely
  // editable draft the user lands on straight from "Use template" for
  // Feature Story, instead of the fixed-content read-only Refine canvas.
  // null until a template seeds it (useTemplate()); persists across
  // navigation within the session same as everything else in this context.
  freeform: FreeformDoc | null;
  // Which page's toolbar/background panel is "in focus" -- driven by
  // scroll position in the continuous-scroll canvas (all pages render at
  // once now, not one-at-a-time), not by an exclusive open/closed view.
  freeformActivePageId: string | null;
  // Multi-select: shift-click adds/removes an id. Selection is scoped to
  // one page at a time (selecting on a different page starts a fresh
  // single selection there) -- see selectFreeform() in store.tsx.
  freeformSelectedIds: string[];
  freeformCanUndo: boolean;
  freeformCanRedo: boolean;

  vCount: number;
  variants: VariantSlot[];
  vSteer: string;

  qAud: string;
  qProve: string[];
  qTech: number;
  qPace: string;
  qAvoid: string;

  idx: number;
  statuses: ScreenStatus[];
  fuAns: string | null;
  fuOff: boolean;

  tplOpen: boolean;

  sel: string | null;
  layers: boolean;
  hover: string | null;
  sizes: Record<string, SectionSize>;
  title: string;
  textTab: string;
  lock: boolean;
  ratio: string;
  fontSize: number;
  weight: string;
  font: string;
  lead: number;
  color: string;
  align: string;
  emph: string;
  motion: string;
  studio: boolean;
  mTab: string;
  speed: string;
  dir: string;
  ease: string;
  loop: boolean;
  trigger: string;
  kf: number;
  replayKey: number;
  fx: boolean;
  more: boolean;
  btnFx: string;
  imgFx: string;
  cursorFx: string;
  reveal: boolean;
  revealAmt: string;
  adv: boolean;
  cover: number;
  prevLay: PreviewLayout;

  // Real, public Preview page (/preview) -- distinct from prevLay (the
  // Refine canvas's own grid/editorial/list toggle). Layout/theme choices
  // here are real, applied for real; fx (imgFx/cursorFx/reveal/revealAmt
  // above) are read here too, same fields Refine's Micro-interactions panel
  // already writes to -- Preview is where they actually run.
  previewLayout: 'stacked' | 'side-by-side' | 'compact';
  previewTheme: 'minimal' | 'editorial' | 'bold' | 'playful';
  adjB: number;
  adjC: number;
  adjS: number;
  rwPrompt: string;
  rwPick: number;
  imgTab: string;

  cq: ClarifyingContext;

  copied: boolean;
  toast: string;
  published: boolean;
  dlSel: Record<number, boolean>;

  // Real per-image AI drafting (not one of the 7 named pipeline stages --
  // the pre-existing "draft a section per screen" feature). Keyed by file
  // index, matching statuses/idx -- ported from the live site's
  // state.captions/captionSource/draftStatus/draftError.
  captions: Record<number, Caption>;
  captionSource: Record<number, 'ai'>;
  draftStatus: Record<number, 'loading' | 'done' | 'error'>;
  draftError: Record<number, string>;

  // Real backend availability, fetched from /api/status on load -- never
  // assumed. Matches the live site's apiStatus gate exactly: real-pipeline
  // behavior only runs when apiStatus.gemini is true; otherwise the app
  // falls through to the pre-pipeline flow unchanged. pexels gates the
  // Templates gallery's real stock photos the same way.
  apiStatus: { gemini: boolean; pexels: boolean; unsplash: boolean; checked: boolean };

  // Real stock photos for the Templates gallery, fetched live from Pexels
  // through /api/pexels-search -- cached per query so re-filtering doesn't
  // refetch. Never presented as anything but a sample (tagged + credited),
  // so it's never confused with a user's real upload.
  stockCache: Record<string, StockPhotoEntry>;

  // AI pipeline (docs/ai-system-prompt.md Stages 1-2: Perceive/Classify,
  // plus Stage 2's Fallback question so far). Keyed by file id rather than
  // array index (the live site uses index) -- an id is stable across
  // reordering/removal, which the index isn't; the underlying per-record
  // algorithm is unchanged.
  pipeline: {
    perceiveRecords: Record<string, ImageFeatureRecord>;
    perceiveStatus: Record<string, PerceiveStatus>;
    perceiveError: Record<string, string>;
    classifyResult: ClassifyResult | null;
    categoryOverride: string | null;
    categoryOtherLabel: string;
    fallbackOtherText: string;
    fallbackResolved: boolean;
    categoryResolutionMethod: 'auto' | 'picked-candidate' | 'picked-other' | 'skipped';

    // Stage 3 -- Interview -- and Stage 4 -- Extract's output, computed
    // once Interview is submitted/skipped.
    softConfirmResolved: boolean;
    interview: InterviewState;
    designSystemSheet: DesignSystemSheet | null;

    // Stage 5 -- Present's output, computed once on the Draft-to-Refine
    // transition from the real approved sections + design system sheet.
    // null until then; the canvas falls back to the pre-pipeline static
    // section list exactly as it did before this stage existed.
    frames: PresentFrame[] | null;

    // Stage 7 -- Narrate's output, computed asynchronously and in parallel
    // with Present on the Draft-to-Refine transition -- never blocks
    // entering or using Refine. null until it resolves; the canvas/Preview
    // intro block and Markdown export both simply omit it until then.
    narration: Narration | null;
    narrationStatus: 'loading' | 'done' | 'error' | null;
    narrationError: string | null;
  };

  // Real, localStorage-backed project persistence (My Projects/Trash) --
  // ported from the live site's state.projects/currentProjectId/lastSavedAt.
  projects: ProjectRecord[];
  currentProjectId: string | null;
  lastSavedAt: number | null;
  npOpen: boolean;
  settingsTab: 'Profile' | 'Plan';
  templateFilter: string;
}
