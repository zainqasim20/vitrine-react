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
