// Shared types for the ported AI pipeline (Perceive/Classify so far).
// Mirrors the shapes documented in docs/ai-system-prompt.md Parts 1-2, as
// implemented in the live site's lib/pipeline/*.js.

export interface ImageFeatureRecord {
  aspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | 'other';
  chrome: {
    browserChrome: boolean;
    osChrome: 'none' | 'macOS' | 'Windows' | 'iOS' | 'Android';
    deviceFrame: 'none' | 'laptop' | 'phone' | 'tablet' | 'watch';
    designToolUI: boolean;
  };
  contentType: {
    isUIScreen: boolean;
    isLogoOrMark: boolean;
    isIllustration: boolean;
    isPrintLayout: boolean;
    isPackaging: boolean;
    is3DRender: boolean;
    isArchitecturalRender: boolean;
    isMoodboardOrPalette: boolean;
  };
  dominantColors: { hex: string; role: string; coverage: number }[];
  typeSizeBands: { band: string; approxPx: number; styleDescription: string }[];
  components: string[];
  mockupStaging: 'raw-screen' | 'device-frame' | 'browser-frame' | 'presentation-scene' | 'print-mockup';
}

export interface CategorySignalCondition {
  field?: string;
  equals?: unknown;
  in?: unknown[];
  includesAny?: unknown[];
  any?: CategorySignalCondition[];
  all?: CategorySignalCondition[];
}

export interface CategorySignal {
  id: string;
  when: CategorySignalCondition;
  weights: Record<string, number>;
}

export interface CategorySignalsConfig {
  categories: { id: string; label: string }[];
  thresholds: { autoClassify: number; softConfirm: number };
  defaultTools: Record<string, string[]>;
  signals: CategorySignal[];
}

export type ClassifyOutcome = 'auto' | 'soft-confirm' | 'fallback';

export interface ClassifyResult {
  scores: Record<string, number>;
  category: string | null;
  confidence: number;
  outcome: ClassifyOutcome;
  needsSoftConfirm: boolean;
  needsFallback: boolean;
  fallbackCandidates: string[];
}

export type PerceiveStatus = 'loading' | 'done' | 'error';

// Stage 4 -- Extract's output. See docs/ai-system-prompt.md Part 4.1.
export interface DesignSystemColor {
  hex: string;
  role: string;
  sourceImageIds: string[];
}

export interface DesignSystemTypography {
  role: string;
  approxPx: number;
  styleDescription: string;
  userSuppliedFontName: string | null;
}

export interface DesignSystemComponentEntry {
  count: number;
  variants: string[];
}

export interface DesignSystemSheet {
  colors: DesignSystemColor[];
  typography: DesignSystemTypography[];
  spacingGrid: { baseUnit: string; sampledGaps: number[] };
  components: Record<string, DesignSystemComponentEntry>;
}

// Stage 5 -- Present's input/output. See docs/ai-system-prompt.md Part 5.1.
export interface ApprovedSection {
  id: string;
  file: { id: string; name: string; url?: string };
  headline: string;
  body: string;
}

export interface ModuleSequence {
  required: string[];
  recommended: string[];
  optional: string[];
}

export interface ModuleSequencesConfig {
  frameLabels: Record<string, string>;
  sequences: Record<string, ModuleSequence>;
}

export type PresentFrame =
  | { slot: 'design-system'; tier: string; label: string; generated: false; sourceSectionId: null; content: DesignSystemSheet }
  | { slot: string; tier: string; label: string; generated: false; sourceSectionId: string; headline: string; body: string }
  | { slot: string; tier: string; label: string; generated: true; generatedReason: string; sourceSectionId: null; headline: string; body: string };

export interface PresentResult {
  category: string | null;
  frames: PresentFrame[];
}
