import type { ClassifyResult, DesignSystemSheet, ImageFeatureRecord, PerceiveStatus } from './pipeline/types';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ScreenStatus = 'pending' | 'loading' | 'drafted' | 'error' | 'skipped' | 'approved';

export interface UploadedFile {
  id: string;
  name: string;
  file?: File;
  mimeType?: string;
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

  // Real backend availability, fetched from /api/status on load -- never
  // assumed. Matches the live site's apiStatus gate exactly: real-pipeline
  // behavior only runs when apiStatus.gemini is true; otherwise the app
  // falls through to the pre-pipeline flow unchanged.
  apiStatus: { gemini: boolean; checked: boolean };

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
  };
}
