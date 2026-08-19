import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppState, ScreenStatus, ThemeMode } from './types';
import { DRAFTS, TEMPLATES } from './data';
import { classifyRecords } from './pipeline/classify';
import { perceiveImage } from './pipeline/perceive';
import { buildDesignSystemSheet } from './pipeline/extract';
import { assembleFrames } from './pipeline/present';
import { draftCaption } from './pipeline/draft';
import { narrateCaseStudy } from './pipeline/narrate';
import categorySignals from './pipeline/config/category-signals.json';
import moduleSequences from './pipeline/config/module-sequences.json';
import type { ApprovedSection, CategorySignalsConfig, DesignSystemColor, DesignSystemSheet, ModuleSequencesConfig, PresentFrame } from './pipeline/types';
import type { Caption, CanvasSection, ClientStatus, ProjectRecord, ProjectSnapshot, SceneTreatment, StockPhotoEntry } from './types';
import { buildFeatureStoryFreeformPages } from './templates/freeform-seed';
import { freeformId, FREEFORM_CANVAS_WIDTH, type FreeformDoc, type FreeformElement, type FreeformElementType, type FreeformPage } from './templates/freeform-types';

// New elements added from the Customize screen's own "+ Text/Image/Shape/
// Button" toolbar start with this generic gray placeholder graphic (not a
// stock photo, not a blank box) until the user replaces it with their own.
const FREEFORM_PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180"><rect width="240" height="180" fill="#EAEAF0"/><path d="M0 180 L80 100 L140 140 L240 60 L240 180 Z" fill="#D3D3D8"/><circle cx="70" cy="50" r="20" fill="#D3D3D8"/></svg>';
const FREEFORM_PLACEHOLDER_IMAGE = `data:image/svg+xml,${encodeURIComponent(FREEFORM_PLACEHOLDER_SVG)}`;

function mapFreeformPage(doc: FreeformDoc | null, pageId: string, fn: (p: FreeformPage) => FreeformPage): FreeformDoc | null {
  if (!doc) return doc;
  return { pages: doc.pages.map((p) => (p.id === pageId ? fn(p) : p)) };
}

function freeformMaxZ(elements: FreeformElement[]): number {
  return elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
}

const PIPELINE_CONFIG = categorySignals as unknown as CategorySignalsConfig;
const MODULE_SEQUENCES = moduleSequences as unknown as ModuleSequencesConfig;

// Same reasoning as the live site's maybeDraftAI/perceiveAllFiles: don't send
// an image the platform's request-body limit will reject. Vercel's Node
// Serverless Functions cap around 4.5MB; base64 inflates a file ~4/3, so
// anything much over ~3MB raw risks a platform-level 413 before route code
// runs. This only gates whether an image is offered to Gemini, never
// whether it can be uploaded.
const MAX_AI_IMAGE_SIZE = 3 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb % 1 === 0 ? mb : mb.toFixed(1)} MB`;
}

// Ported unchanged from the live site's parseDraftJson: /api/analyze-image's
// prompt asks Gemini for JSON but doesn't constrain the response server-side
// (unlike Perceive's schema-based call), so the model's own text sometimes
// wraps it in a code fence -- stripped here, never shown as a raw parse error.
function parseDraftJson(raw: string): Caption {
  let text = String(raw || '').trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  let obj: { headline?: string; body?: string };
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error('The model returned something we could not read. Try again, or write this section yourself.');
  }
  const headline = String(obj.headline || '').trim();
  const body = String(obj.body || '').trim();
  if (!headline || !body) throw new Error('The model returned an incomplete response');
  return { headline, body };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

// Used by sceneTreatment() to tint panel backgrounds/shadows from a real
// extracted hex color. Falls back to the app's own brand violet if the
// extracted value isn't parseable, rather than silently rendering nothing.
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(122, 71, 245, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb01(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r / 255, g / 255, b / 255];
}

// Perceived-brightness approximation (not full sRGB-linearized relative
// luminance -- close enough for a "is this near-black" threshold check).
function hexLuminance(hex: string): number {
  const rgb = hexToRgb01(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function hexSaturation(hex: string): number {
  const rgb = hexToRgb01(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

// My own heuristic, used by sceneTreatment() -- not literal doc content.
// A near-black extracted background plus a distinct, saturated accent
// color (e.g. dark + gold) reads as "premium dark" regardless of which
// coarse category Classify picked -- an automotive/luxury brand classified
// as generic web-ui should still get dramatic staging because the real
// extracted palette earns it, not because the category name says so. Only
// fires on real extracted colors; never guesses a mood from category alone.
function isPremiumDarkPalette(colors: DesignSystemColor[]): boolean {
  const bg = colors.find((c) => c.role === 'background');
  if (!bg || hexLuminance(bg.hex) > 0.15) return false;
  const accent = colors.find((c) => c.role === 'accent') || colors.find((c) => c.role === 'primary');
  if (!accent) return false;
  return hexSaturation(accent.hex) > 0.25 && hexLuminance(accent.hex) > 0.15;
}

// Ported unchanged from the live site's designSystemSheetToMarkdown, used by
// mdSource() to render the canvas's Design System frame into export.
function designSystemSheetToMarkdown(sheet: DesignSystemSheet): string {
  const lines: string[] = [];
  if (sheet.colors.length) lines.push(`**Colors:** ${sheet.colors.map((c) => `${c.hex} (${c.role})`).join(', ')}`, '');
  if (sheet.typography.length)
    lines.push(`**Typography:** ${sheet.typography.map((t) => `${t.role} ~${t.approxPx}px${t.styleDescription ? ` — ${t.styleDescription}` : ''}`).join('; ')}`, '');
  const comps = Object.entries(sheet.components)
    .filter(([, v]) => v.count > 0)
    .map(([k, v]) => `${k} (${v.count})`);
  if (comps.length) lines.push(`**Components:** ${comps.join(', ')}`, '');
  return lines.join('\n');
}

// Ported from the live site's seedInterviewDefaults: pre-fills the
// Interview form's tools chips from category-signals.json's defaultTools,
// left fully editable (toolsUnconfirmed just controls the "guessed -- edit
// if wrong" hint, it's not a lock).
function seedToolsForCategory(categoryId: string | null): string[] {
  if (!categoryId) return [];
  return PIPELINE_CONFIG.defaultTools[categoryId]?.slice() || [];
}

// Real client-side project persistence (localStorage) -- no server exists,
// so this is the honest ceiling: metadata + real generated cover thumbnails
// + all text/settings survive reloads; raw screenshot files cannot (blobs
// can't be serialized here), so reopening an older project asks for its
// screens back instead of pretending they're still there.
const PROJECTS_KEY = 'vitrine.projects.v1';

function loadStoredProjects(): ProjectRecord[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function genProjectId() {
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function relativeTime(ts: number | null): string {
  if (!ts) return '';
  const diffMs = Date.now() - ts;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  return new Date(ts).toLocaleDateString();
}

const NAMES = [
  '01-onboarding-empty.png',
  '02-upload-dropzone.png',
  '03-draft-review.png',
  '04-editor-toolbar.png',
  '05-motion-panel.png',
  '06-publish.png',
];

const initialState: AppState = {
  theme: 'system',

  files: [],
  briefA: '',
  briefB: '',
  projectName: '',
  prompt: '',
  template: 'Story Scroll',
  templateMode: 'frames',
  freeform: null,
  freeformActivePageId: null,
  freeformSelectedIds: [],
  freeformCanUndo: false,
  freeformCanRedo: false,

  vCount: 5,
  variants: [],
  vSteer: 'Editorial',

  qAud: 'Hiring managers',
  qProve: ['Systems thinking'],
  qTech: 2,
  qPace: 'Measured',
  qAvoid: '',

  idx: 0,
  statuses: [],
  fuAns: null,
  fuOff: false,

  tplOpen: false,

  sel: null,
  layers: false,
  hover: null,
  sizes: {},
  title: '',
  textTab: 'Font',
  lock: true,
  ratio: '16:9',
  fontSize: 28,
  weight: 'Semibold',
  font: 'Bricolage Grotesque',
  lead: 120,
  color: 'Ink',
  align: 'Left',
  emph: 'None',
  motion: 'Draw-in',
  studio: false,
  mTab: 'Suggested',
  speed: '1x',
  dir: 'Forward',
  ease: 'Ease',
  loop: true,
  trigger: 'On scroll into view',
  kf: 0,
  replayKey: 0,
  fx: false,
  more: false,
  btnFx: 'Scale',
  imgFx: 'Zoom',
  cursorFx: 'Default',
  reveal: true,
  revealAmt: 'Subtle',
  adv: false,
  cover: 0,
  prevLay: 'list',
  previewLayout: 'stacked',
  previewTheme: 'minimal',
  adjB: 100,
  adjC: 100,
  adjS: 100,
  rwPrompt: '',
  rwPick: -1,
  imgTab: 'Crop & reposition',

  cq: null,

  copied: false,
  toast: '',
  published: false,
  dlSel: {},

  captions: {},
  captionSource: {},
  draftStatus: {},
  draftError: {},

  apiStatus: { gemini: false, pexels: false, checked: false },
  stockCache: {},
  pipeline: {
    perceiveRecords: {},
    perceiveStatus: {},
    perceiveError: {},
    classifyResult: null,
    categoryOverride: null,
    categoryOtherLabel: '',
    fallbackOtherText: '',
    fallbackResolved: false,
    categoryResolutionMethod: 'auto',
    softConfirmResolved: false,
    interview: {
      projectName: '',
      clientStatus: 'Personal',
      tools: [],
      toolsUnconfirmed: true,
      customTool: '',
      outcome: '',
      fonts: '',
      submitted: false,
      skipped: false,
    },
    designSystemSheet: null,
    frames: null,
    narration: null,
    narrationStatus: null,
    narrationError: null,
  },

  projects: [],
  currentProjectId: null,
  lastSavedAt: null,
  npOpen: false,
  settingsTab: 'Profile',
  templateFilter: 'All',
};

function readStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('vitrine-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    /* localStorage unavailable */
  }
  return 'system';
}

let uid = 0;
const nextId = () => `f${Date.now()}-${uid++}`;

export interface AppActions {
  setTheme: (t: ThemeMode) => void;
  isDark: () => boolean;

  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  setHoverThumb: (id: string | null) => void;
  hoverThumb: string | null;

  setBriefA: (v: string) => void;
  setBriefB: (v: string) => void;
  skipBrief: () => void;
  setProjectName: (v: string) => void;
  setPrompt: (v: string) => void;
  setTemplate: (name: string, opts?: { announce?: boolean }) => void;

  setVCount: (n: number) => void;
  runVariants: () => void;
  setVSteer: (v: string) => void;
  openVariant: (index: number) => void;

  generate: () => void;
  finishWaiting: () => void;

  captionOf: (i: number) => Caption;
  setCaption: (i: number, field: 'headline' | 'body', value: string) => void;
  maybeDraftAI: (i: number) => void;
  regenerateDraft: () => void;

  retryPerceive: () => void;
  pickFallbackCategory: (catId: string) => void;
  setFallbackOtherText: (text: string) => void;
  pickFallbackOther: () => void;
  skipFallback: () => void;
  currentCategoryId: () => string | null;
  currentCategoryLabel: () => string;

  acceptSoftConfirm: (accepted: boolean) => void;
  setInterviewField: (field: 'projectName' | 'customTool' | 'outcome' | 'fonts', value: string) => void;
  setInterviewClientStatus: (value: ClientStatus) => void;
  toggleInterviewTool: (tool: string) => void;
  addInterviewTool: () => void;
  submitInterview: () => void;
  skipInterview: () => void;
  runExtractAndProceed: () => void;

  setDesignSystemColorHex: (index: number, hex: string) => void;
  setDesignSystemColorRole: (index: number, role: string) => void;
  setDesignSystemTypographyField: (index: number, field: 'approxPx' | 'styleDescription', value: string) => void;
  setDesignSystemComponentCount: (bucket: string, count: number) => void;
  setDesignSystemSpacing: (value: string) => void;
  designSystemContinue: () => void;

  openQuestions: () => void;
  setQAud: (v: string) => void;
  toggleQProve: (v: string) => void;
  setQTech: (v: number) => void;
  setQPace: (v: string) => void;
  setQAvoid: (v: string) => void;
  submitQuestions: () => void;
  decideForMe: () => void;

  load: (i: number, delay?: number) => void;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
  approve: () => void;
  regenerate: () => void;
  skip: () => void;
  answerFollowUp: (label: string) => void;
  dismissFollowUp: () => void;
  askFollowUp: () => void;

  toggleTplOpen: () => void;
  pickTemplate: (name: string) => void;

  goRefine: () => void;
  openEditorWith: (name: string) => void;
  finish: () => void;
  publish: () => void;

  select: (id: string | null) => void;
  deselect: () => void;
  setTitle: (v: string) => void;
  setHover: (id: string | null) => void;
  setSize: (id: string, w: number, h: number) => void;
  sizeOf: (id: string) => { w: number; h: number };
  toggleLayers: () => void;
  setTextTab: (v: string) => void;
  setFont: (v: string) => void;
  setWeight: (v: string) => void;
  sizeUp: () => void;
  sizeDown: () => void;
  setLead: (v: number) => void;
  setColor: (v: string) => void;
  setAlign: (v: string) => void;
  setEmph: (v: string) => void;
  setRwPrompt: (v: string) => void;
  runRewrite: () => void;
  pickRewrite: (i: number) => void;

  setImgTab: (v: string) => void;
  toggleLock: () => void;
  setRatio: (v: string) => void;
  setW: (v: number) => void;
  setH: (v: number) => void;
  resetImg: () => void;
  setAdjB: (v: number) => void;
  setAdjC: (v: number) => void;
  setAdjS: (v: number) => void;
  resetAdj: () => void;

  toggleStudio: () => void;
  closeStudio: () => void;
  setMTab: (v: string) => void;
  applyMotion: (name: string) => void;
  setSpeed: (v: string) => void;
  setDir: (v: string) => void;
  setEase: (v: string) => void;
  toggleLoop: () => void;
  setTrigger: (v: string) => void;
  setKf: (v: number) => void;
  replay: () => void;
  toggleAdv: () => void;

  toggleFx: () => void;
  closeFx: () => void;
  setBtnFx: (v: string) => void;
  setImgFx: (v: string) => void;
  setCursorFx: (v: string) => void;
  toggleReveal: () => void;
  setRevealAmt: (v: string) => void;

  toggleMore: () => void;
  setPrevLay: (v: AppState['prevLay']) => void;
  setCover: (i: number) => void;

  goPreview: () => void;
  setPreviewLayout: (v: AppState['previewLayout']) => void;
  setPreviewTheme: (v: AppState['previewTheme']) => void;

  say: (text: string) => void;
  copyMd: () => void;
  downloadMd: () => void;
  downloadHtml: () => void;
  downloadTxt: () => void;
  toggleDlSel: (i: number) => void;
  toggleDlAll: () => void;
  publishToShowcase: () => void;
  saveToAccount: () => void;

  openStyleQuestion: () => void;
  closeCq: (msg?: string) => void;
  cqSkip: () => void;
  cqDecide: () => void;

  addHighlight: () => void;
  editSuggestion: () => void;
  dropSuggestion: () => void;

  approvedIndices: () => number[];
  approvedSections: () => ApprovedSection[];
  canvasSections: () => CanvasSection[];
  mdSource: () => string;

  openProject: (id: string) => void;
  trashProject: (id: string) => void;
  restoreProject: (id: string) => void;
  deleteProjectForever: (id: string) => void;
  startNewProject: () => void;
  openNewProject: () => void;
  closeNewProject: () => void;
  npUpload: () => void;
  npTemplate: () => void;
  goProjects: () => void;
  goTrash: () => void;
  goBrand: () => void;
  goHelp: () => void;
  goSettings: () => void;
  goUsage: () => void;
  setSettingsTab: (v: 'Profile' | 'Plan') => void;
  logout: () => void;
  setTemplateFilter: (v: string) => void;
  useTemplate: (name: string) => void;

  selectFreeform: (pageId: string, id: string | null, additive?: boolean) => void;
  setActiveFreeformPage: (pageId: string) => void;
  patchFreeformElement: (pageId: string, elementId: string, patch: Partial<FreeformElement>) => void;
  removeFreeformElement: (pageId: string, elementId: string) => void;
  removeFreeformElements: (pageId: string, elementIds: string[]) => void;
  addFreeformElement: (pageId: string, type: FreeformElementType) => void;
  duplicateFreeformElement: (pageId: string, elementId: string) => void;
  duplicateFreeformElements: (pageId: string, elementIds: string[]) => void;
  addFreeformPage: () => void;
  duplicateFreeformPage: (pageId: string) => void;
  removeFreeformPage: (pageId: string) => void;
  reorderFreeformPages: (fromIndex: number, toIndex: number) => void;
  renameFreeformPage: (pageId: string, name: string) => void;
  setFreeformPageBackground: (pageId: string, hex: string) => void;
  setFreeformPageHeight: (pageId: string, height: number) => void;
  undoFreeform: () => void;
  redoFreeform: () => void;

  getStockPhoto: (query: string) => StockPhotoEntry;
  fetchStockPhoto: (query: string) => void;
  sceneTreatment: () => SceneTreatment;
}

interface Ctx {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    ...initialState,
    theme: readStoredTheme(),
    projects: loadStoredProjects(),
  }));
  const [hoverThumb, setHoverThumbState] = useState<string | null>(null);
  const navigate = useNavigate();

  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = useCallback((partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    setState((prev) => ({ ...prev, ...(typeof partial === 'function' ? partial(prev) : partial) }));
  }, []);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const variantTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const draftTokens = useRef<Record<number, number>>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (stateRef.current.theme === 'system') patch({});
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [patch]);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(loadTimer.current);
      clearTimeout(copyTimer.current);
      variantTimers.current.forEach(clearTimeout);
    },
    [],
  );

  // Real backend availability, fetched once on load -- ported from the live
  // site's fetchApiStatus(). Never assumed: if this fails or the endpoint
  // isn't reachable, every real-pipeline feature stays honestly disabled
  // rather than silently faked.
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data: { gemini?: boolean; pexels?: boolean }) => {
        patch({ apiStatus: { gemini: !!data.gemini, pexels: !!data.pexels, checked: true } });
      })
      .catch(() => {
        patch({ apiStatus: { gemini: false, pexels: false, checked: true } });
      });
  }, [patch]);

  const isDark = useCallback(() => {
    if (stateRef.current.theme === 'dark') return true;
    if (stateRef.current.theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const setTheme = useCallback(
    (t: ThemeMode) => {
      patch({ theme: t });
      try {
        localStorage.setItem('vitrine-theme', t);
      } catch {
        /* ignore */
      }
    },
    [patch],
  );

  const say = useCallback(
    (text: string) => {
      clearTimeout(toastTimer.current);
      patch({ toast: text });
      toastTimer.current = setTimeout(() => patch({ toast: '' }), 1800);
    },
    [patch],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      patch((s) => {
        const room = Math.max(0, 20 - s.files.length);
        const additions = incoming.slice(0, room).map((f) => ({ id: nextId(), name: f.name, file: f, mimeType: f.type, url: URL.createObjectURL(f) }));
        return { files: [...s.files, ...additions] };
      });
      if (incoming.length) setTimeout(() => autosaveProject(), 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosaveProject is a hoisted function declaration, not a dep
    [patch],
  );

  const removeFile = useCallback(
    (id: string) => {
      patch((s) => {
        const removed = s.files.find((f) => f.id === id);
        if (removed?.url) URL.revokeObjectURL(removed.url);
        return { files: s.files.filter((f) => f.id !== id) };
      });
    },
    [patch],
  );

  const setStatus = useCallback(
    (i: number, status: ScreenStatus) => {
      patch((s) => {
        const next = s.statuses.slice();
        next[i] = status;
        return { statuses: next };
      });
    },
    [patch],
  );

  const load = useCallback(
    (i: number, delay = 900) => {
      clearTimeout(loadTimer.current);
      setStatus(i, 'loading');
      patch({ idx: i });
      loadTimer.current = setTimeout(() => {
        setStatus(i, i === 3 ? 'error' : 'drafted');
      }, delay);
    },
    [patch, setStatus],
  );

  const statusAt = useCallback((i: number) => stateRef.current.statuses[i] || 'pending', []);

  // Real per-image drafting never auto-fires on navigation (only the first
  // screen does, from finishWaiting()) -- every other screen shows a manual
  // "Draft this with AI" button instead, matching the live site exactly.
  const goTo = useCallback(
    (i: number) => {
      const s = statusAt(i);
      patch({ idx: i });
      if (s === 'pending' && !stateRef.current.apiStatus.gemini) load(i);
    },
    [patch, load, statusAt],
  );

  const approvedIndices = useCallback(() => {
    const s = stateRef.current;
    return s.statuses.map((st, i) => ({ st, i })).filter((x) => x.st === 'approved' && x.i < s.files.length).map((x) => x.i);
  }, []);

  // Real captions: typed by the user, or drafted for real by Gemini vision
  // and then left fully editable -- either way, this is what actually
  // ships. Ported from the live site's captionOf/setCaption/maybeDraftAI/
  // regenerateDraft. Keyed by file index, matching statuses/idx.
  const captionOf = useCallback((i: number): Caption => stateRef.current.captions[i] || { headline: '', body: '' }, []);

  const setCaption = useCallback(
    (i: number, field: 'headline' | 'body', value: string) => {
      patch((s) => {
        const current = s.captions[i] || { headline: '', body: '' };
        const captionSource = { ...s.captionSource };
        delete captionSource[i]; // once hand-edited, it's no longer purely an AI draft
        return { captions: { ...s.captions, [i]: { ...current, [field]: value } }, captionSource };
      });
    },
    [patch],
  );

  // Real Gemini vision call -- drafts straight into the same editable
  // caption fields the user can type into, never a separate read-only
  // display. Skips silently if Gemini isn't configured, already drafted, or
  // the user already started typing (never overwrites real user text with a
  // generated draft).
  const maybeDraftAI = useCallback(
    (i: number) => {
      const s = stateRef.current;
      if (!s.apiStatus.gemini) return;
      if (s.captions[i]?.headline) return;
      if (s.draftStatus[i] === 'loading' || s.draftStatus[i] === 'done') return;
      const entry = s.files[i];
      if (!entry?.file) return;

      const token = (draftTokens.current[i] || 0) + 1;
      draftTokens.current[i] = token;

      // Same reasoning as Perceive: don't even attempt a request the
      // platform's body-size limit will reject.
      if (entry.file.size > MAX_AI_IMAGE_SIZE) {
        patch((st) => ({
          draftStatus: { ...st.draftStatus, [i]: 'error' },
          draftError: {
            ...st.draftError,
            [i]: `This screen is ${formatFileSize(entry.file!.size)} — over the ${formatFileSize(MAX_AI_IMAGE_SIZE)} limit for AI drafting (uploads themselves can be up to 10 MB, this only affects the AI step).`,
          },
        }));
        return;
      }

      patch((st) => {
        const draftError = { ...st.draftError };
        delete draftError[i];
        return { draftStatus: { ...st.draftStatus, [i]: 'loading' }, draftError };
      });

      fileToBase64(entry.file)
        .then((imageBase64) => draftCaption(imageBase64, entry.mimeType || 'image/png', stateRef.current.briefA, stateRef.current.briefB))
        .then((raw) => {
          if (draftTokens.current[i] !== token) return; // superseded by a newer call for this index
          const parsed = parseDraftJson(raw);
          patch((st) => ({
            captions: { ...st.captions, [i]: parsed },
            captionSource: { ...st.captionSource, [i]: 'ai' },
            draftStatus: { ...st.draftStatus, [i]: 'done' },
          }));
        })
        .catch((e: Error) => {
          if (draftTokens.current[i] !== token) return;
          patch((st) => ({
            draftStatus: { ...st.draftStatus, [i]: 'error' },
            draftError: { ...st.draftError, [i]: e.message || 'The Gemini request failed' },
          }));
        });
    },
    [patch],
  );

  // Explicit user action: clears whatever's there (typed or AI-drafted) and
  // asks Gemini for a fresh pass on the current screen.
  const regenerateDraft = useCallback(() => {
    const i = stateRef.current.idx;
    patch((s) => {
      const draftStatus = { ...s.draftStatus };
      delete draftStatus[i];
      const captions = { ...s.captions };
      delete captions[i];
      const captionSource = { ...s.captionSource };
      delete captionSource[i];
      return { draftStatus, captions, captionSource };
    });
    maybeDraftAI(i);
  }, [patch, maybeDraftAI]);

  // Real per-image drafting only auto-fires for the first screen on
  // entering Draft (matching the live site's enterDraft()) -- every other
  // screen shows a manual "Draft this with AI" button instead of silently
  // burning a Gemini call on every navigation.
  const finishWaiting = useCallback(() => {
    patch({ idx: 0, statuses: [] });
    navigate('/review');
    if (stateRef.current.apiStatus.gemini) {
      maybeDraftAI(0);
    } else {
      load(0, 900);
    }
  }, [patch, navigate, load, maybeDraftAI]);

  // Stage 1 + 2 -- Perceive then Classify, ported from the live site's
  // perceiveAllFiles()/runClassification(). Drives the real /classify
  // screen's loading state while it runs. Already-'done'/'error' files are
  // skipped, same as the live site, so nothing is re-sent to Gemini on a
  // re-entry (e.g. if Fallback's "something else" round-trips back here).
  const runPerceiveAndClassify = useCallback(() => {
    const files = stateRef.current.files;
    const jobs = files.map((entry) => {
      const existingStatus = stateRef.current.pipeline.perceiveStatus[entry.id];
      if (existingStatus === 'done' || existingStatus === 'error') return Promise.resolve();
      if (!entry.file) return Promise.resolve();

      if (entry.file.size > MAX_AI_IMAGE_SIZE) {
        patch((s) => ({
          pipeline: {
            ...s.pipeline,
            perceiveStatus: { ...s.pipeline.perceiveStatus, [entry.id]: 'error' },
            perceiveError: {
              ...s.pipeline.perceiveError,
              [entry.id]: `This screen is ${formatFileSize(entry.file!.size)} — over the ${formatFileSize(MAX_AI_IMAGE_SIZE)} limit for AI analysis (uploads themselves can be up to 10 MB, this only affects the AI step).`,
            },
          },
        }));
        return Promise.resolve();
      }

      patch((s) => ({ pipeline: { ...s.pipeline, perceiveStatus: { ...s.pipeline.perceiveStatus, [entry.id]: 'loading' } } }));
      return fileToBase64(entry.file)
        .then((imageBase64) => perceiveImage(imageBase64, entry.mimeType || 'image/png'))
        .then((record) => {
          patch((s) => ({
            pipeline: {
              ...s.pipeline,
              perceiveRecords: { ...s.pipeline.perceiveRecords, [entry.id]: record },
              perceiveStatus: { ...s.pipeline.perceiveStatus, [entry.id]: 'done' },
            },
          }));
        })
        .catch((e: Error) => {
          patch((s) => ({
            pipeline: {
              ...s.pipeline,
              perceiveStatus: { ...s.pipeline.perceiveStatus, [entry.id]: 'error' },
              perceiveError: { ...s.pipeline.perceiveError, [entry.id]: e.message || 'The Gemini request failed' },
            },
          }));
        });
    });

    Promise.allSettled(jobs).then(() => {
      const records = Object.values(stateRef.current.pipeline.perceiveRecords);
      const result = records.length
        ? classifyRecords(records, PIPELINE_CONFIG)
        : {
            scores: {},
            category: PIPELINE_CONFIG.categories[0]?.id || null,
            confidence: 0,
            outcome: 'fallback' as const,
            needsSoftConfirm: false,
            needsFallback: true,
            fallbackCandidates: PIPELINE_CONFIG.categories.slice(0, 2).map((c) => c.id),
          };
      patch((s) => ({
        pipeline: {
          ...s.pipeline,
          classifyResult: result,
          interview: { ...s.pipeline.interview, tools: seedToolsForCategory(result.category), toolsUnconfirmed: true },
        },
      }));
    });
  }, [patch]);

  // A failed Perceive call previously left classification silently falling
  // back to the "not sure yet" Fallback question -- indistinguishable from
  // genuine low confidence. This re-opens exactly the files that errored
  // (runPerceiveAndClassify skips anything already 'done' or 'error', so
  // those statuses have to be cleared first) and re-runs the pipeline.
  const retryPerceive = useCallback(() => {
    patch((s) => {
      const perceiveStatus = { ...s.pipeline.perceiveStatus };
      const perceiveError = { ...s.pipeline.perceiveError };
      s.files.forEach((f) => {
        if (perceiveStatus[f.id] === 'error') {
          delete perceiveStatus[f.id];
          delete perceiveError[f.id];
        }
      });
      return { pipeline: { ...s.pipeline, perceiveStatus, perceiveError, classifyResult: null } };
    });
    runPerceiveAndClassify();
  }, [patch, runPerceiveAndClassify]);

  // Ported from the live site's generate(): real pipeline needs a real
  // vision call to run at all, so only take the /classify path when a
  // Gemini key is actually configured. Otherwise -- unchanged -- straight
  // to the existing mocked Waiting -> Draft flow.
  const generate = useCallback(() => {
    if (stateRef.current.apiStatus.gemini) {
      patch((s) => ({
        pipeline: {
          ...s.pipeline,
          classifyResult: null,
          categoryOverride: null,
          categoryOtherLabel: '',
          fallbackOtherText: '',
          fallbackResolved: false,
          categoryResolutionMethod: 'auto',
          softConfirmResolved: false,
          interview: { ...s.pipeline.interview, submitted: false, skipped: false },
          designSystemSheet: null,
        },
      }));
      navigate('/classify');
      runPerceiveAndClassify();
    } else {
      navigate('/waiting');
    }
  }, [navigate, patch, runPerceiveAndClassify]);

  // Stage 2 fallback resolution actions -- ported from the live site's
  // pickFallbackCategory/pickFallbackOther/skipFallback. None of these
  // re-run Perceive or Classify; they only record how the designer resolved
  // a low-confidence category guess (categoryResolutionMethod feeds
  // Validate's low-confidence-uncorrected check later).
  const pickFallbackCategory = useCallback(
    (catId: string) => {
      patch((s) => ({
        pipeline: {
          ...s.pipeline,
          categoryOverride: catId,
          categoryOtherLabel: '',
          fallbackResolved: true,
          categoryResolutionMethod: 'picked-candidate',
          interview: { ...s.pipeline.interview, tools: seedToolsForCategory(catId), toolsUnconfirmed: true },
        },
      }));
    },
    [patch],
  );

  const setFallbackOtherText = useCallback(
    (text: string) => {
      patch((s) => ({ pipeline: { ...s.pipeline, fallbackOtherText: text } }));
    },
    [patch],
  );

  const pickFallbackOther = useCallback(() => {
    const text = stateRef.current.pipeline.fallbackOtherText.trim();
    if (!text) {
      say('Type what kind of project this is');
      return;
    }
    patch((s) => ({
      pipeline: { ...s.pipeline, categoryOverride: null, categoryOtherLabel: text, fallbackResolved: true, categoryResolutionMethod: 'picked-other' },
    }));
  }, [patch, say]);

  const skipFallback = useCallback(() => {
    patch((s) => ({ pipeline: { ...s.pipeline, fallbackResolved: true, categoryResolutionMethod: 'skipped' } }));
  }, [patch]);

  const currentCategoryId = useCallback(() => {
    const p = stateRef.current.pipeline;
    return p.categoryOverride || (p.classifyResult ? p.classifyResult.category : null);
  }, []);

  const currentCategoryLabel = useCallback(() => {
    const id = currentCategoryId();
    if (!id) return stateRef.current.pipeline.categoryOtherLabel || 'this project';
    const found = PIPELINE_CONFIG.categories.find((c) => c.id === id);
    return found?.label || id;
  }, [currentCategoryId]);

  // Stage 2's soft-confirm ("we're fairly sure this is X, is that right?"),
  // folded into the Interview form per the live site's design, not shown
  // standalone. "No" doesn't re-open a category picker on the live site
  // either -- it's only recorded (Validate's softConfirmPending check reads
  // this later); the project proceeds with the unconfirmed guess either way.
  const acceptSoftConfirm = useCallback(
    (_accepted: boolean) => {
      patch((s) => ({ pipeline: { ...s.pipeline, softConfirmResolved: true } }));
    },
    [patch],
  );

  const setInterviewField = useCallback(
    (field: 'projectName' | 'customTool' | 'outcome' | 'fonts', value: string) => {
      patch((s) => ({ pipeline: { ...s.pipeline, interview: { ...s.pipeline.interview, [field]: value } } }));
    },
    [patch],
  );

  const setInterviewClientStatus = useCallback(
    (value: ClientStatus) => {
      patch((s) => ({ pipeline: { ...s.pipeline, interview: { ...s.pipeline.interview, clientStatus: value } } }));
    },
    [patch],
  );

  const toggleInterviewTool = useCallback(
    (tool: string) => {
      patch((s) => {
        const tools = s.pipeline.interview.tools;
        const next = tools.includes(tool) ? tools.filter((t) => t !== tool) : [...tools, tool];
        return { pipeline: { ...s.pipeline, interview: { ...s.pipeline.interview, tools: next, toolsUnconfirmed: false } } };
      });
    },
    [patch],
  );

  const addInterviewTool = useCallback(() => {
    const t = stateRef.current.pipeline.interview.customTool.trim();
    if (!t) return;
    patch((s) => {
      const tools = s.pipeline.interview.tools;
      return {
        pipeline: {
          ...s.pipeline,
          interview: { ...s.pipeline.interview, tools: tools.includes(t) ? tools : [...tools, t], toolsUnconfirmed: false, customTool: '' },
        },
      };
    });
  }, [patch]);

  // Stage 4 -- Extract runs right after Interview, same moment as the live
  // site's runExtractStage(), then routes to the editable Design System
  // screen (state.route === 'design-system' on the live site) before
  // Draft/Review -- matching renderDesignSystemScreen()/designSystemContinue().
  const runExtractAndProceed = useCallback(() => {
    const sheet = buildDesignSystemSheet(stateRef.current.pipeline.perceiveRecords);
    patch((s) => ({ pipeline: { ...s.pipeline, designSystemSheet: sheet } }));
    navigate('/design-system');
  }, [patch, navigate]);

  const submitInterview = useCallback(() => {
    if (!stateRef.current.pipeline.interview.projectName.trim()) {
      say('Add a project name, or use Skip to proceed without one');
      return;
    }
    patch((s) => ({ pipeline: { ...s.pipeline, interview: { ...s.pipeline.interview, submitted: true } } }));
    runExtractAndProceed();
  }, [patch, say, runExtractAndProceed]);

  const skipInterview = useCallback(() => {
    patch((s) => ({ pipeline: { ...s.pipeline, interview: { ...s.pipeline.interview, skipped: true } } }));
    runExtractAndProceed();
  }, [patch, runExtractAndProceed]);

  // Stage 4's editable Design System Sheet -- ported field-for-field from
  // designsystem.js's renderDesignSystemSheet() and the live site's
  // setDesignSystemColorRole()/setDesignSystemSpacing()/setDesignSystemField()
  // mutations. Every color, typography row, and component count stays
  // directly editable right up until Continue locks it into the case study.
  const setDesignSystemColorHex = useCallback(
    (index: number, hex: string) => {
      patch((s) => {
        const sheet = s.pipeline.designSystemSheet;
        if (!sheet) return {};
        const colors = sheet.colors.map((c, i) => (i === index ? { ...c, hex } : c));
        return { pipeline: { ...s.pipeline, designSystemSheet: { ...sheet, colors } } };
      });
    },
    [patch],
  );

  const setDesignSystemColorRole = useCallback(
    (index: number, role: string) => {
      patch((s) => {
        const sheet = s.pipeline.designSystemSheet;
        if (!sheet) return {};
        const colors = sheet.colors.map((c, i) => (i === index ? { ...c, role } : c));
        return { pipeline: { ...s.pipeline, designSystemSheet: { ...sheet, colors } } };
      });
    },
    [patch],
  );

  const setDesignSystemTypographyField = useCallback(
    (index: number, field: 'approxPx' | 'styleDescription', value: string) => {
      patch((s) => {
        const sheet = s.pipeline.designSystemSheet;
        if (!sheet) return {};
        const typography = sheet.typography.map((t, i) =>
          i === index ? { ...t, [field]: field === 'approxPx' ? Number(value) || 0 : value } : t,
        );
        return { pipeline: { ...s.pipeline, designSystemSheet: { ...sheet, typography } } };
      });
    },
    [patch],
  );

  const setDesignSystemComponentCount = useCallback(
    (bucket: string, count: number) => {
      patch((s) => {
        const sheet = s.pipeline.designSystemSheet;
        if (!sheet) return {};
        const entry = sheet.components[bucket] || { count: 0, variants: [] };
        return {
          pipeline: {
            ...s.pipeline,
            designSystemSheet: { ...sheet, components: { ...sheet.components, [bucket]: { ...entry, count: Math.max(0, count) } } },
          },
        };
      });
    },
    [patch],
  );

  const setDesignSystemSpacing = useCallback(
    (value: string) => {
      patch((s) => {
        const sheet = s.pipeline.designSystemSheet;
        if (!sheet) return {};
        return { pipeline: { ...s.pipeline, designSystemSheet: { ...sheet, spacingGrid: { ...sheet.spacingGrid, baseUnit: value } } } };
      });
    },
    [patch],
  );

  const designSystemContinue = useCallback(() => {
    finishWaiting();
  }, [finishWaiting]);

  const openQuestions = useCallback(() => navigate('/questions'), [navigate]);

  const submitQuestions = useCallback(() => {
    patch({ fuAns: null, fuOff: false });
    generate();
  }, [patch, generate]);

  const decideForMe = useCallback(() => {
    say('Answered the rest myself — anything inferred is tagged');
    patch({ fuAns: null, fuOff: false });
    generate();
  }, [say, patch, generate]);

  const next = useCallback(() => {
    const total = stateRef.current.files.length;
    goTo(Math.min(total - 1, stateRef.current.idx + 1));
  }, [goTo]);

  const prev = useCallback(() => {
    goTo(Math.max(0, stateRef.current.idx - 1));
  }, [goTo]);

  const approve = useCallback(() => {
    const s = stateRef.current;
    const status = statusAt(s.idx);
    if (status === 'approved') {
      say('Already approved');
      return;
    }
    // Real pipeline: approval is gated on a real headline (captionOf),
    // matching the live site's approve() exactly -- there's no 'drafted'
    // status machine on the real path, captions are the source of truth.
    if (s.apiStatus.gemini) {
      if (!(s.captions[s.idx]?.headline || '').trim()) {
        say('Add a headline before approving');
        return;
      }
    } else if (status !== 'drafted') {
      say('Nothing to approve yet');
      return;
    }
    setStatus(s.idx, 'approved');
    setTimeout(() => autosaveProject(), 0);
    const nextIdx = (s.idx + 1) % Math.max(1, s.files.length);
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => goTo(nextIdx), 650);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosaveProject is a hoisted function declaration, not a dep
  }, [statusAt, say, setStatus, goTo]);

  const regenerate = useCallback(() => {
    load(stateRef.current.idx, 900);
  }, [load]);

  const skip = useCallback(() => {
    const s = stateRef.current;
    setStatus(s.idx, 'skipped');
    const nextIdx = (s.idx + 1) % Math.max(1, s.files.length);
    setTimeout(() => goTo(nextIdx), 300);
  }, [setStatus, goTo]);

  const answerFollowUp = useCallback(
    (label: string) => {
      patch({ fuAns: label, fuOff: true });
      say('Rewriting this section with that in mind');
      load(1, 700);
    },
    [patch, say, load],
  );

  const dismissFollowUp = useCallback(() => patch({ fuOff: true }), [patch]);
  const askFollowUp = useCallback(() => patch({ cq: 'brief' }), [patch]);

  const runVariants = useCallback(() => {
    variantTimers.current.forEach(clearTimeout);
    variantTimers.current = [];
    const n = stateRef.current.vCount;
    const list = Array.from({ length: n }, (_, i) => ({ index: i, ready: false }));
    patch({ variants: list });
    list.forEach((_v, i) => {
      const t = setTimeout(
        () => {
          patch((s) => {
            const cur = s.variants.slice();
            if (!cur[i]) return {};
            cur[i] = { index: i, ready: true };
            return { variants: cur };
          });
        },
        620 + i * (n > 5 ? 260 : 420) + (i % 3) * 180,
      );
      variantTimers.current.push(t);
    });
  }, [patch]);

  const closeCq = useCallback(
    (msg?: string) => {
      const wasStyle = stateRef.current.cq === 'style';
      patch({ cq: null });
      if (msg) say(msg);
      if (wasStyle) runVariants();
    },
    [patch, say, runVariants],
  );

  const cqSkip = useCallback(() => closeCq('Skipped — nothing changed'), [closeCq]);
  const cqDecide = useCallback(() => closeCq('Decided for you — anything inferred stays tagged'), [closeCq]);
  const openStyleQuestion = useCallback(() => patch({ cq: 'style' }), [patch]);

  const openVariant = useCallback(
    (index: number) => {
      const v = stateRef.current.variants[index];
      if (!v?.ready) return;
      const name = ['Bold statement', 'Card breakdown', 'Icon system', 'Logo lockup', 'Image-forward'][index % 5];
      openEditorWithInternal(name);
      say(name + ' opened in the editor');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [say],
  );

  function openEditorWithInternal(name: string) {
    patch((s) => {
      const statuses = s.statuses.slice();
      for (let i = 0; i < 3; i++) statuses[i] = 'approved';
      return { statuses, template: name, sel: null, cover: 0 };
    });
    navigate('/refine');
  }

  const openEditorWith = useCallback(
    (name: string) => {
      openEditorWithInternal(name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Real per-section list feeding the canvas, in file order -- reordering
  // isn't wired up yet (out of scope for this pass; matches the live
  // site's getSectionOrder() when no reorder override is set).
  const approvedSections = useCallback((): ApprovedSection[] => {
    const s = stateRef.current;
    return approvedIndices().map((i) => {
      const file = s.files[i];
      const cap = s.captions[i] || { headline: 'Untitled section', body: '' };
      return {
        id: `s${i}`,
        file: { id: file.id, name: file.name, url: file.url },
        headline: cap.headline || 'Untitled section',
        body: cap.body || '',
      };
    });
  }, [approvedIndices]);

  const frameIdOf = useCallback((frame: PresentFrame): string => {
    if ('content' in frame) return 'design-system';
    if (frame.generated) return `generated-${frame.slot}`;
    return frame.sourceSectionId;
  }, []);

  // Stage 5 -- Present's real, dynamic section list for the canvas: image
  // sections (real captions + real screenshots), one real design-system
  // section, and any generated placeholder sections for missing required
  // slots. Falls through to the plain approved-sections list, untouched,
  // when Present hasn't run (no Gemini key) -- exactly the pre-pipeline canvas.
  const canvasSections = useCallback((): CanvasSection[] => {
    const frames = stateRef.current.pipeline.frames;
    if (!frames || !frames.length) {
      return approvedSections().map((sec) => ({ ...sec, kind: 'image' as const }));
    }
    const bySectionId: Record<string, ApprovedSection> = {};
    approvedSections().forEach((sec) => {
      bySectionId[sec.id] = sec;
    });

    const sections: CanvasSection[] = [];
    frames.forEach((frame) => {
      const id = frameIdOf(frame);
      if ('content' in frame) {
        sections.push({ id, kind: 'design-system', label: frame.label, content: frame.content });
        return;
      }
      if (frame.generated) {
        sections.push({ id, kind: 'generated', label: frame.label, headline: frame.headline, body: frame.body });
        return;
      }
      const real = bySectionId[frame.sourceSectionId];
      if (!real) return; // section was un-approved since frames were last assembled -- skip gracefully
      sections.push({ ...real, kind: 'image' });
    });
    return sections;
  }, [approvedSections, frameIdOf]);

  // Stage 5 -- pure, deterministic, no API call. Computed once on the
  // Draft-to-Refine transition (see goRefine below), same moment the live
  // site's runPresentAndValidate() runs Present. Stage 6/Validate stays out
  // of scope for this pass -- it's dev-only and doesn't gate Publish.
  const runPresent = useCallback(() => {
    const s = stateRef.current;
    const category = currentCategoryId();
    const sheet = s.pipeline.designSystemSheet || buildDesignSystemSheet({});
    const sections = approvedSections();
    const result = assembleFrames(category, sheet, sections, MODULE_SEQUENCES);
    patch((st) => ({ pipeline: { ...st.pipeline, frames: result.frames } }));
  }, [patch, currentCategoryId, approvedSections]);

  // Stage 7 -- the pipeline's second and last Gemini call (Perceive was the
  // first), text-only. Fires once per project, cached; retried/backed-off
  // inside narrate.ts; never blocks entering or using Refine. A hoisted
  // function declaration (not useCallback) so it can call autosaveProject
  // (also hoisted, defined below) without a dependency-array ordering issue.
  function maybeNarrate() {
    const s = stateRef.current;
    if (!s.apiStatus.gemini) return;
    if (s.pipeline.narrationStatus === 'loading' || s.pipeline.narrationStatus === 'done') return;
    patch((st) => ({ pipeline: { ...st.pipeline, narrationStatus: 'loading', narrationError: null } }));

    const sheet = s.pipeline.designSystemSheet || buildDesignSystemSheet({});
    narrateCaseStudy({
      categoryLabel: currentCategoryLabel(),
      projectName: s.pipeline.interview.projectName,
      clientStatus: s.pipeline.interview.clientStatus,
      ndaFlag: s.pipeline.interview.clientStatus === 'Client — confidential (NDA)',
      outcome: s.pipeline.interview.outcome,
      tools: s.pipeline.interview.tools,
      designSystemSheet: sheet,
    })
      .then((narration) => {
        patch((st) => ({ pipeline: { ...st.pipeline, narration, narrationStatus: 'done' } }));
        autosaveProject();
      })
      .catch((e: Error) => {
        patch((st) => ({ pipeline: { ...st.pipeline, narrationStatus: 'error', narrationError: e.message || 'The Gemini request failed' } }));
      });
  }

  // ==================================================================
  // Real project persistence (localStorage) -- ported from the live site's
  // loadProjects/persistProjects/autosaveProject/openProject/trashProject
  // family, see PROJECTS_KEY comment above.
  // ==================================================================

  const persistProjects = useCallback(
    (projects: ProjectRecord[]) => {
      try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      } catch {
        say("Could not save to this browser's local storage — it may be full or disabled");
      }
    },
    [say],
  );

  // Real thumbnail: downsamples the actual first approved screenshot through
  // a canvas -- never a stock/placeholder image standing in for the user's work.
  const makeCoverThumb = useCallback(
    (callback: (cover: string | null) => void) => {
      const sections = approvedSections();
      const file = sections.length ? sections[0].file : null;
      if (!file || !file.url) {
        callback(null);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const targetW = 320;
        const scale = targetW / img.naturalWidth;
        const targetH = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          callback(null);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        try {
          callback(canvas.toDataURL('image/jpeg', 0.62));
        } catch {
          callback(null);
        }
      };
      img.onerror = () => callback(null);
      img.src = file.url;
    },
    [approvedSections],
  );

  const projectSnapshot = useCallback((): ProjectSnapshot => {
    const s = stateRef.current;
    return {
      title: s.title,
      previewTheme: s.previewTheme,
      previewLayout: s.previewLayout,
      briefA: s.briefA,
      briefB: s.briefB,
    };
  }, []);

  // Called at real state-changing checkpoints (add files, approve, publish,
  // preview layout/theme change) -- never on a timer, so "Saved" always means
  // something changed. A hoisted function declaration (not useCallback) so
  // earlier-defined actions like addFiles/approve can call it too.
  function autosaveProject(opts?: { publish?: boolean }) {
    const s = stateRef.current;
    if (!s.files.length && !s.title.trim()) return; // nothing real to save yet
    const id = s.currentProjectId || genProjectId();
    if (!s.currentProjectId) patch({ currentProjectId: id });
    const existing = s.projects.find((p) => p.id === id);
    const now = Date.now();
    const sectionCount = approvedSections().length;

    const commit = (cover: string | null | undefined) => {
      const record: ProjectRecord = {
        id,
        title: s.title.trim() || 'Untitled case study',
        status: opts?.publish ? 'Published' : existing ? existing.status : 'Draft',
        createdAt: existing ? existing.createdAt : now,
        editedAt: now,
        deletedAt: existing ? existing.deletedAt : null,
        sectionCount,
        cover: cover !== undefined ? cover : existing ? existing.cover : null,
        snapshot: projectSnapshot(),
      };
      const current = stateRef.current.projects;
      const idx = current.findIndex((p) => p.id === id);
      const projects = idx >= 0 ? current.map((p, i) => (i === idx ? record : p)) : [record, ...current];
      persistProjects(projects);
      patch({ projects, lastSavedAt: now });
    };

    if (sectionCount > 0 && (!existing || !existing.cover)) makeCoverThumb(commit);
    else commit(undefined);
  }

  // Same in-memory session (files still hold live object URLs) resumes
  // exactly where the user left off. An older project (reopened after a
  // reload) only has its text/settings -- real screenshots are never faked back.
  const openProject = useCallback(
    (id: string) => {
      const s = stateRef.current;
      const p = s.projects.find((x) => x.id === id);
      if (!p) return;
      if (s.currentProjectId === id && s.files.length) {
        navigate(approvedSections().length ? '/refine' : s.statuses.length ? '/review' : '/create');
        return;
      }
      patch({
        currentProjectId: id,
        title: p.snapshot.title || p.title,
        previewTheme: p.snapshot.previewTheme || 'minimal',
        previewLayout: p.snapshot.previewLayout || 'stacked',
        briefA: p.snapshot.briefA || '',
        briefB: p.snapshot.briefB || '',
        files: [],
        statuses: [],
        captions: {},
        captionSource: {},
        draftStatus: {},
        draftError: {},
      });
      navigate('/create');
      say(`Reopened "${p.title}" — re-add its screens to continue (this doesn't store image files between sessions)`);
    },
    [navigate, approvedSections, patch, say],
  );

  const trashProject = useCallback(
    (id: string) => {
      const current = stateRef.current.projects;
      const target = current.find((p) => p.id === id);
      if (!target) return;
      const projects = current.map((p) => (p.id === id ? { ...p, deletedAt: Date.now() } : p));
      persistProjects(projects);
      patch({ projects });
      say(`"${target.title}" moved to Trash`);
    },
    [patch, say, persistProjects],
  );

  const restoreProject = useCallback(
    (id: string) => {
      const current = stateRef.current.projects;
      const target = current.find((p) => p.id === id);
      if (!target) return;
      const projects = current.map((p) => (p.id === id ? { ...p, deletedAt: null } : p));
      persistProjects(projects);
      patch({ projects });
      say(`"${target.title}" restored`);
    },
    [patch, say, persistProjects],
  );

  const deleteProjectForever = useCallback(
    (id: string) => {
      const current = stateRef.current.projects;
      const target = current.find((p) => p.id === id);
      if (!target) return;
      const projects = current.filter((p) => p.id !== id);
      persistProjects(projects);
      patch({ projects });
      say(`"${target.title}" permanently deleted`);
    },
    [patch, say, persistProjects],
  );

  // Clears the in-progress project so "New project" always starts genuinely
  // empty rather than silently continuing whatever was last open.
  const startNewProject = useCallback(() => {
    stateRef.current.files.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    patch({
      files: [],
      statuses: [],
      captions: {},
      captionSource: {},
      draftStatus: {},
      draftError: {},
      idx: 0,
      title: '',
      briefA: '',
      briefB: '',
      currentProjectId: null,
      lastSavedAt: null,
      pipeline: { ...initialState.pipeline },
    });
  }, [patch]);

  const openNewProject = useCallback(() => patch({ npOpen: true }), [patch]);
  const closeNewProject = useCallback(() => patch({ npOpen: false }), [patch]);

  const npUpload = useCallback(() => {
    patch({ npOpen: false });
    startNewProject();
    navigate('/create');
  }, [patch, startNewProject, navigate]);

  const npTemplate = useCallback(() => {
    patch({ npOpen: false });
    startNewProject();
    navigate('/templates');
  }, [patch, startNewProject, navigate]);

  const goProjects = useCallback(() => navigate('/projects'), [navigate]);
  const goTrash = useCallback(() => navigate('/trash'), [navigate]);
  const goBrand = useCallback(() => navigate('/brand'), [navigate]);
  const goHelp = useCallback(() => navigate('/help'), [navigate]);
  const goSettings = useCallback(() => {
    patch({ settingsTab: 'Profile' });
    navigate('/settings');
  }, [patch, navigate]);
  const goUsage = useCallback(() => {
    patch({ settingsTab: 'Plan' });
    navigate('/usage');
  }, [patch, navigate]);
  const setSettingsTab = useCallback((v: 'Profile' | 'Plan') => patch({ settingsTab: v }), [patch]);

  const logout = useCallback(() => {
    say('Signed out');
    navigate('/');
  }, [say, navigate]);

  const setTemplateFilter = useCallback((v: string) => patch({ templateFilter: v }), [patch]);

  // Real effect, not a toast: the chosen template's theme + layout are applied
  // to Preview right away, matching the live site's useTemplate().
  //
  // Phase 6: also sets templateMode from the matched template's own `kind`,
  // driven by data rather than a hardcoded name check -- any future
  // module-set template just needs its own distinct `kind`, not a new
  // branch here. Every existing template's kind is not 'feature-story', so
  // this is a no-op change for all 8 of them: templateMode keeps resolving
  // to 'frames', same as it already does before this project ever reaches
  // Refine (initial state).
  // Feature Story is the one template with a real, editable freeform draft
  // (buildFeatureStoryFreeformPages() -- the other 8 have no equivalent
  // content to seed yet, same honest scoping as the Preview button). For it,
  // "Use template" now lands the user straight on /templates/customize with
  // a real draft already on the canvas, instead of routing into the
  // upload -> wait -> classify -> questions -> review pipeline like every
  // other template still does.
  const useTemplate = useCallback(
    (name: string) => {
      const tpl = TEMPLATES.find((t) => t.name === name);
      if (tpl) patch({ previewTheme: tpl.theme, previewLayout: tpl.layout });
      const isFeatureStory = tpl?.kind === 'feature-story';
      patch({ templateMode: isFeatureStory ? 'feature-story' : 'frames' });
      if (isFeatureStory) {
        const pages = buildFeatureStoryFreeformPages();
        freeformHistoryRef.current = { past: [], future: [], lastPushAt: 0 };
        patch({ freeform: { pages }, freeformActivePageId: pages[0]?.id ?? null, freeformSelectedIds: [], freeformCanUndo: false, freeformCanRedo: false });
        say(`"${name}" applied — customize it below`);
        navigate('/templates/customize');
        return;
      }
      say(`"${name}" applied — add your screens to see it`);
      navigate('/create');
    },
    [patch, say, navigate],
  );

  // Undo/redo history for the freeform doc, kept in a ref rather than
  // AppState -- it doesn't need to trigger renders itself, only the
  // freeform swap it produces does. Snapshots the doc as it stood *before*
  // a mutation, coalesced: rapid-fire calls from one continuous gesture
  // (dragging, typing in a hex field, sliding opacity) land within the
  // same window and don't each get their own undo step -- only the first
  // call after a quiet period snapshots, so one drag/type/slide is one
  // undo step, not one per pointermove/keystroke. freeformCanUndo/Redo
  // mirror the ref's lengths into real state so buttons can reflect them.
  const freeformHistoryRef = useRef<{ past: FreeformDoc[]; future: FreeformDoc[]; lastPushAt: number }>({ past: [], future: [], lastPushAt: 0 });
  const FREEFORM_HISTORY_COALESCE_MS = 500;
  const FREEFORM_HISTORY_LIMIT = 40;

  function snapshotFreeformHistory() {
    const current = stateRef.current.freeform;
    if (!current) return;
    const h = freeformHistoryRef.current;
    const now = Date.now();
    if (now - h.lastPushAt >= FREEFORM_HISTORY_COALESCE_MS) {
      h.past.push(current);
      if (h.past.length > FREEFORM_HISTORY_LIMIT) h.past.shift();
      h.future = [];
    }
    h.lastPushAt = now;
    patch({ freeformCanUndo: h.past.length > 0, freeformCanRedo: h.future.length > 0 });
  }

  const undoFreeform = useCallback(() => {
    const h = freeformHistoryRef.current;
    const prev = h.past.pop();
    if (!prev) return;
    const current = stateRef.current.freeform;
    if (current) h.future.push(current);
    h.lastPushAt = 0;
    patch((s) => ({
      freeform: prev,
      freeformSelectedIds: [],
      freeformActivePageId: prev.pages.some((p) => p.id === s.freeformActivePageId) ? s.freeformActivePageId : prev.pages[0]?.id ?? null,
      freeformCanUndo: h.past.length > 0,
      freeformCanRedo: h.future.length > 0,
    }));
  }, [patch]);

  const redoFreeform = useCallback(() => {
    const h = freeformHistoryRef.current;
    const next = h.future.pop();
    if (!next) return;
    const current = stateRef.current.freeform;
    if (current) h.past.push(current);
    h.lastPushAt = 0;
    patch((s) => ({
      freeform: next,
      freeformSelectedIds: [],
      freeformActivePageId: next.pages.some((p) => p.id === s.freeformActivePageId) ? s.freeformActivePageId : next.pages[0]?.id ?? null,
      freeformCanUndo: h.past.length > 0,
      freeformCanRedo: h.future.length > 0,
    }));
  }, [patch]);

  // additive (shift-click) toggles id in/out of the selection. Multi-select
  // is scoped to one page: shift-clicking an element on a different page
  // than the current selection starts a fresh single selection there
  // instead of mixing elements from two different coordinate spaces.
  const selectFreeform = useCallback(
    (pageId: string, id: string | null, additive = false) => {
      patch((s) => {
        if (id === null) return { freeformSelectedIds: [] };
        if (!additive) return { freeformSelectedIds: [id] };
        const owningPageId = (elId: string) => s.freeform?.pages.find((p) => p.elements.some((e) => e.id === elId))?.id;
        const currentPageId = s.freeformSelectedIds[0] ? owningPageId(s.freeformSelectedIds[0]) : null;
        if (currentPageId && currentPageId !== pageId) return { freeformSelectedIds: [id] };
        const has = s.freeformSelectedIds.includes(id);
        return { freeformSelectedIds: has ? s.freeformSelectedIds.filter((x) => x !== id) : [...s.freeformSelectedIds, id] };
      });
    },
    [patch],
  );

  const setActiveFreeformPage = useCallback((pageId: string) => patch({ freeformActivePageId: pageId }), [patch]);

  const patchFreeformElement = useCallback(
    (pageId: string, elementId: string, elPatch: Partial<FreeformElement>) => {
      snapshotFreeformHistory();
      patch((s) => ({
        freeform: mapFreeformPage(s.freeform, pageId, (p) => ({
          ...p,
          elements: p.elements.map((el) => (el.id === elementId ? ({ ...el, ...elPatch } as FreeformElement) : el)),
        })),
      }));
    },
    [patch],
  );

  const removeFreeformElement = useCallback(
    (pageId: string, elementId: string) => {
      snapshotFreeformHistory();
      patch((s) => ({
        freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, elements: p.elements.filter((el) => el.id !== elementId) })),
        freeformSelectedIds: s.freeformSelectedIds.filter((id) => id !== elementId),
      }));
    },
    [patch],
  );

  const removeFreeformElements = useCallback(
    (pageId: string, elementIds: string[]) => {
      snapshotFreeformHistory();
      const idSet = new Set(elementIds);
      patch((s) => ({
        freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, elements: p.elements.filter((el) => !idSet.has(el.id)) })),
        freeformSelectedIds: s.freeformSelectedIds.filter((id) => !idSet.has(id)),
      }));
    },
    [patch],
  );

  const addFreeformElement = useCallback(
    (pageId: string, type: FreeformElementType) => {
      snapshotFreeformHistory();
      patch((s) => {
        const page = s.freeform?.pages.find((p) => p.id === pageId);
        if (!page) return {};
        const z = freeformMaxZ(page.elements) + 1;
        const cx = FREEFORM_CANVAS_WIDTH / 2;
        const cy = page.height / 2;
        let el: FreeformElement;
        if (type === 'text') {
          el = { id: freeformId('text'), type: 'text', x: cx - 150, y: cy - 20, w: 300, h: 40, zIndex: z, text: 'New text', fontFamily: 'body', fontSize: 18, fontWeight: 600, color: '#14141A', align: 'left' };
        } else if (type === 'image') {
          el = { id: freeformId('image'), type: 'image', x: cx - 120, y: cy - 90, w: 240, h: 180, zIndex: z, src: FREEFORM_PLACEHOLDER_IMAGE, objectFit: 'cover', borderRadius: 8 };
        } else if (type === 'shape') {
          el = { id: freeformId('shape'), type: 'shape', x: cx - 80, y: cy - 60, w: 160, h: 120, zIndex: z, shape: 'rect', fill: '#EAEAF0', borderRadius: 8, opacity: 1 };
        } else {
          el = { id: freeformId('button'), type: 'button', x: cx - 90, y: cy - 20, w: 180, h: 44, zIndex: z, text: 'Button', bg: '#7A47F5', color: '#FFFFFF', borderRadius: 999 };
        }
        return {
          freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, elements: [...p.elements, el] })),
          freeformSelectedIds: [el.id],
        };
      });
    },
    [patch],
  );

  const duplicateFreeformElement = useCallback(
    (pageId: string, elementId: string) => {
      snapshotFreeformHistory();
      patch((s) => {
        const page = s.freeform?.pages.find((p) => p.id === pageId);
        const el = page?.elements.find((e) => e.id === elementId);
        if (!page || !el) return {};
        const z = freeformMaxZ(page.elements) + 1;
        const copy: FreeformElement = { ...el, id: freeformId(el.type), x: el.x + 20, y: el.y + 20, zIndex: z };
        return {
          freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, elements: [...p.elements, copy] })),
          freeformSelectedIds: [copy.id],
        };
      });
    },
    [patch],
  );

  const duplicateFreeformElements = useCallback(
    (pageId: string, elementIds: string[]) => {
      snapshotFreeformHistory();
      patch((s) => {
        const page = s.freeform?.pages.find((p) => p.id === pageId);
        if (!page) return {};
        const idSet = new Set(elementIds);
        let z = freeformMaxZ(page.elements);
        const copies: FreeformElement[] = page.elements
          .filter((el) => idSet.has(el.id))
          .map((el) => {
            z += 1;
            return { ...el, id: freeformId(el.type), x: el.x + 20, y: el.y + 20, zIndex: z };
          });
        return {
          freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, elements: [...p.elements, ...copies] })),
          freeformSelectedIds: copies.map((c) => c.id),
        };
      });
    },
    [patch],
  );

  const addFreeformPage = useCallback(() => {
    snapshotFreeformHistory();
    patch((s) => {
      if (!s.freeform) return {};
      const newPage: FreeformPage = { id: freeformId('page'), name: `Page ${s.freeform.pages.length + 1}`, backgroundColor: '#FFFFFF', height: 400, elements: [] };
      return { freeform: { pages: [...s.freeform.pages, newPage] }, freeformActivePageId: newPage.id, freeformSelectedIds: [] };
    });
  }, [patch]);

  const duplicateFreeformPage = useCallback(
    (pageId: string) => {
      snapshotFreeformHistory();
      patch((s) => {
        if (!s.freeform) return {};
        const idx = s.freeform.pages.findIndex((p) => p.id === pageId);
        if (idx < 0) return {};
        const src = s.freeform.pages[idx];
        const copy: FreeformPage = { ...src, id: freeformId('page'), name: `${src.name} copy`, elements: src.elements.map((el) => ({ ...el, id: freeformId(el.type) })) };
        const pages = [...s.freeform.pages];
        pages.splice(idx + 1, 0, copy);
        return { freeform: { pages }, freeformActivePageId: copy.id, freeformSelectedIds: [] };
      });
    },
    [patch],
  );

  // Keeps at least one page -- an empty document has nothing left to
  // customize or land on, so the last page can't be removed.
  const removeFreeformPage = useCallback(
    (pageId: string) => {
      snapshotFreeformHistory();
      patch((s) => {
        if (!s.freeform || s.freeform.pages.length <= 1) return {};
        const pages = s.freeform.pages.filter((p) => p.id !== pageId);
        const freeformActivePageId = s.freeformActivePageId === pageId ? pages[0]?.id ?? null : s.freeformActivePageId;
        return { freeform: { pages }, freeformActivePageId, freeformSelectedIds: [] };
      });
    },
    [patch],
  );

  const reorderFreeformPages = useCallback(
    (fromIndex: number, toIndex: number) => {
      snapshotFreeformHistory();
      patch((s) => {
        if (!s.freeform) return {};
        const pages = [...s.freeform.pages];
        const [moved] = pages.splice(fromIndex, 1);
        if (!moved) return {};
        pages.splice(toIndex, 0, moved);
        return { freeform: { pages } };
      });
    },
    [patch],
  );

  const renameFreeformPage = useCallback(
    (pageId: string, name: string) => {
      snapshotFreeformHistory();
      patch((s) => ({ freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, name })) }));
    },
    [patch],
  );

  const setFreeformPageBackground = useCallback(
    (pageId: string, hex: string) => {
      snapshotFreeformHistory();
      patch((s) => ({ freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, backgroundColor: hex })) }));
    },
    [patch],
  );

  const setFreeformPageHeight = useCallback(
    (pageId: string, height: number) => {
      snapshotFreeformHistory();
      patch((s) => ({ freeform: mapFreeformPage(s.freeform, pageId, (p) => ({ ...p, height: Math.max(120, Math.round(height)) })) }));
    },
    [patch],
  );

  // Real stock photos for the Templates gallery -- ported from the live
  // site's getStockPhoto()/renderTemplateThumb(). React can't fetch during
  // render (unlike the live site's read-triggers-a-fetch render() model),
  // so this splits into two: getStockPhoto() is a pure read Templates.tsx
  // uses to decide what to show, and fetchStockPhoto() is the actual
  // side-effecting call, triggered from a useEffect there once per query.
  const getStockPhoto = useCallback((query: string): StockPhotoEntry => {
    const s = stateRef.current;
    const cached = s.stockCache[query];
    if (cached) return cached;
    if (!s.apiStatus.checked) return { status: 'loading' };
    if (!s.apiStatus.pexels) return { status: 'unavailable' };
    return { status: 'loading' };
  }, []);

  const fetchStockPhoto = useCallback(
    (query: string) => {
      const s = stateRef.current;
      if (s.stockCache[query]) return;
      if (!s.apiStatus.checked || !s.apiStatus.pexels) return;
      patch((st) => ({ stockCache: { ...st.stockCache, [query]: { status: 'loading' } } }));
      fetch(`/api/pexels-search?query=${encodeURIComponent(query)}&perPage=1`)
        .then((r) => r.json())
        .then((data: { photos?: import('./types').PexelsPhoto[]; error?: string }) => {
          const entry: StockPhotoEntry =
            data.error || !data.photos || !data.photos.length ? { status: 'error', message: data.error || 'No results' } : { status: 'ready', photo: data.photos[0] };
          patch((st) => ({ stockCache: { ...st.stockCache, [query]: entry } }));
        })
        .catch((e: Error) => {
          patch((st) => ({ stockCache: { ...st.stockCache, [query]: { status: 'error', message: e.message } } }));
        });
    },
    [patch],
  );

  // Real Scene Construction Framework treatment (CSS/layout only) for Key
  // Features frames -- ported from
  // docs/presentation-styles-creativity-engine.md Part 1 (the 8 layers),
  // Part 3 (category -> environment/mood mapping) and Part 6 (consistency
  // guardrails). A pure function of the project's own real extracted
  // colors + real Classify category -- same inputs always produce the same
  // output, so every frame in a project gets the identical treatment with
  // no extra state to keep in sync (Part 6: one color grade / one
  // dominant surface family per project).
  //
  // Category rows below marked "doc: <row>" are a direct Part 3 match.
  // Rows marked "my nearest analog" or "my own extension" are my own
  // judgment call where the doc's table doesn't name this exact category
  // (real Classify's 7 categories don't line up 1:1 with Part 3's table) --
  // not presented as verbatim doc guidance. Layer 2 (Angle) is capped at a
  // small tilt everywhere per Part 6's own rule that staging drama must
  // never compromise legibility of the real uploaded content -- dramatic
  // tilt (the doc's 45-75 degree range) is excluded entirely since these
  // are real screenshots, not staged product photography.
  const sceneTreatment = useCallback((): SceneTreatment => {
    const s = stateRef.current;
    const colors = s.pipeline.designSystemSheet?.colors ?? [];
    const accent = colors.find((c) => c.role === 'accent') || colors.find((c) => c.role === 'primary') || colors[0] || null;
    const category = currentCategoryId();
    const PADDING = 40;

    if (!accent) {
      // No real color extracted -- degrade to the plain, pre-existing
      // treatment rather than fabricate a color.
      return { category, accentHex: null, panelBackground: 'var(--surface-2)', imageShadow: '0 8px 20px rgba(20,20,26,0.08)', tiltDeg: 0, glossy: false, padding: PADDING, textOnDark: false };
    }

    const tint = (alpha: number) => hexToRgba(accent.hex, alpha);
    const darkGlowRecipe = (): SceneTreatment => ({
      category,
      accentHex: accent.hex,
      panelBackground: `linear-gradient(160deg, ${tint(0.9)} 0%, #14141A 100%)`,
      imageShadow: `0 0 50px ${tint(0.28)}, 0 20px 40px rgba(0,0,0,0.28)`,
      tiltDeg: -4,
      glossy: true,
      padding: PADDING,
      textOnDark: true,
    });

    // Color-driven escalation, checked before the category switch below --
    // see isPremiumDarkPalette()'s comment. Illustration is the one
    // exception: the doc is explicit that category gets no staging no
    // matter what the palette looks like, so it's checked first and
    // skips this override entirely.
    if (category !== 'illustration' && isPremiumDarkPalette(colors)) {
      return darkGlowRecipe();
    }

    switch (category) {
      case 'mobile-app':
        // doc: Mobile App (consumer/lifestyle) -- bold flat color,
        // flat/even lighting; Part 3's deviation note says bright
        // saturated flat colors real-confirmed to outperform "safe" dark
        // defaults here.
        return { category, accentHex: accent.hex, panelBackground: accent.hex, imageShadow: `0 0 0 1px ${tint(0.18)}, 0 14px 28px rgba(20,20,26,0.16)`, tiltDeg: 5, glossy: true, padding: PADDING, textOnDark: true };
      case 'product-design':
        // my nearest analog: doc has no Product Design row -- closest is
        // Packaging (flat studio, sharp specular highlight).
        return { category, accentHex: accent.hex, panelBackground: 'var(--surface-2)', imageShadow: '0 8px 16px rgba(20,20,26,0.18)', tiltDeg: 0, glossy: true, padding: PADDING, textOnDark: false };
      case 'branding':
        // doc: Brand Identity/Logo -- flat brand color, flat lighting.
        return { category, accentHex: accent.hex, panelBackground: tint(0.35), imageShadow: '0 6px 14px rgba(20,20,26,0.10)', tiltDeg: 0, glossy: false, padding: PADDING, textOnDark: false };
      case 'architecture':
        // my nearest analog: doc has no Architecture row -- closest is
        // 3D/CGI (dramatic environment, cinematic light). Same recipe the
        // color-driven escalation above reaches for.
        return darkGlowRecipe();
      case 'illustration':
        // doc is explicit here: "the art itself carries all mood; no
        // external scene-staging applies" -- left at the plain,
        // pre-existing treatment on purpose, not upgraded.
        return { category, accentHex: accent.hex, panelBackground: 'var(--surface-2)', imageShadow: '0 8px 20px rgba(20,20,26,0.08)', tiltDeg: 0, glossy: false, padding: PADDING, textOnDark: false };
      case 'graphic-design':
        // my own extension -- doc has no Graphic Design row; treated like
        // Illustration's unstaged default.
        return { category, accentHex: accent.hex, panelBackground: 'var(--surface-2)', imageShadow: '0 8px 20px rgba(20,20,26,0.10)', tiltDeg: 0, glossy: false, padding: PADDING, textOnDark: false };
      case 'web-ui':
      default:
        // doc splits "Website" by vertical (AI/SaaS vs healthcare/real
        // estate) real Classify can't detect -- defaulting to the calmer,
        // non-dramatic row rather than guessing a vertical.
        return { category, accentHex: accent.hex, panelBackground: tint(0.12), imageShadow: '0 12px 32px rgba(20,20,26,0.10)', tiltDeg: 0, glossy: false, padding: PADDING, textOnDark: false };
    }
  }, [currentCategoryId]);

  const goRefine = useCallback(() => {
    if (!approvedIndices().length) {
      say('Approve a section first');
      return;
    }
    navigate('/refine');
    // Only if the pipeline actually ran (Gemini configured, Stage 2 reached)
    // -- otherwise Refine behaves exactly as it did before this pipeline existed.
    if (stateRef.current.pipeline.classifyResult) {
      runPresent();
      maybeNarrate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- maybeNarrate is a hoisted function declaration, not a dep
  }, [approvedIndices, navigate, say, runPresent]);

  // Real, public case-study preview -- ported from the live site's
  // goPreview(). Guarded on the same real-section-exists check as Refine.
  const goPreview = useCallback(() => {
    if (!approvedIndices().length) {
      say('Approve a section first');
      return;
    }
    navigate('/preview');
  }, [approvedIndices, say, navigate]);

  const setPreviewLayout = useCallback(
    (v: AppState['previewLayout']) => {
      patch({ previewLayout: v });
      setTimeout(() => autosaveProject(), 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosaveProject is a hoisted function declaration, not a dep
    [patch],
  );
  const setPreviewTheme = useCallback(
    (v: AppState['previewTheme']) => {
      patch({ previewTheme: v });
      setTimeout(() => autosaveProject(), 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosaveProject is a hoisted function declaration, not a dep
    [patch],
  );

  const finish = useCallback(() => {
    if (!approvedIndices().length) {
      say('Approve a section first');
      return;
    }
    autosaveProject({ publish: true });
    navigate('/published');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosaveProject is a hoisted function declaration, not a dep
  }, [approvedIndices, say, navigate]);

  const publish = finish;

  const select = useCallback((id: string | null) => patch({ sel: id }), [patch]);
  const deselect = useCallback(() => patch({ sel: null, layers: false, studio: false, fx: false }), [patch]);
  const setHover = useCallback((id: string | null) => patch({ hover: id }), [patch]);

  const sizeOf = useCallback((id: string) => stateRef.current.sizes[id] || { w: 560, h: 315 }, []);

  const setSize = useCallback(
    (id: string, w: number, h: number) => {
      patch((s) => ({ sizes: { ...s.sizes, [id]: { w: Math.round(w), h: Math.round(h) } } }));
    },
    [patch],
  );

  // Real export: when the AI pipeline reached Stage 5/Present, walks
  // canvasSections() -- the same real, ordered, edited list the canvas
  // itself renders from -- with narration (Stage 7) as an unheaded intro
  // right after the title, exactly matching the live site's buildMarkdown().
  // Falls back to the pre-pipeline DRAFTS mock, untouched, when the pipeline
  // never ran (no Gemini key).
  const mdSource = useCallback(() => {
    const s = stateRef.current;
    const lines: string[] = [`# ${s.title || 'Untitled case study'}`, ''];

    const narration = s.pipeline.narration;
    if (narration && (narration.problemStatement || narration.outcomeFraming)) {
      if (narration.problemStatement) {
        if (narration.problemLabel) lines.push(`**${narration.problemLabel}**`, '');
        lines.push(narration.problemStatement, '');
      }
      if (narration.outcomeFraming) {
        if (narration.outcomeLabel) lines.push(`**${narration.outcomeLabel}**`, '');
        lines.push(narration.outcomeFraming, '');
      }
    }

    if (s.pipeline.frames && s.pipeline.frames.length) {
      const sections = canvasSections();
      if (!sections.length) lines.push('_No sections approved yet._', '');
      sections.forEach((sec) => {
        if (sec.kind === 'design-system') {
          lines.push(`## ${sec.label || 'Design System'}`, '');
          lines.push(designSystemSheetToMarkdown(sec.content), '');
          return;
        }
        if (sec.kind === 'generated') {
          lines.push(`## ${sec.headline || sec.label}`, '');
          if (sec.body) lines.push(sec.body, '');
          lines.push(`_AI-generated placeholder — ${sec.label} had no matching uploaded screen._`, '');
          return;
        }
        lines.push(`## ${sec.headline}`, '');
        lines.push(`![${sec.file.name}](${sec.file.name})`, '');
        lines.push(sec.body, '');
      });
      return lines.join('\n');
    }

    const rows = approvedIndices().map((i) => DRAFTS[i % DRAFTS.length]);
    const body = rows.map((d) => `## ${d.headline}\n\n${d.body}\n`).join('\n');
    return `${lines.join('\n')}\n${body || '_No sections approved yet._\n'}`;
  }, [approvedIndices, canvasSections]);

  const saveAs = useCallback(
    (name: string, text: string, type: string) => {
      try {
        const url = URL.createObjectURL(new Blob([text], { type }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        say(`${name} downloaded`);
      } catch {
        say('Download blocked by the browser');
      }
    },
    [say],
  );

  const downloadMd = useCallback(() => saveAs('case-study.md', mdSource(), 'text/markdown'), [saveAs, mdSource]);
  const downloadTxt = useCallback(
    () => saveAs('case-study.txt', mdSource().replace(/[#_*]/g, ''), 'text/plain'),
    [saveAs, mdSource],
  );
  const downloadHtml = useCallback(() => {
    const s = stateRef.current;
    const title = s.title || 'Untitled case study';
    let body = '';
    if (s.pipeline.frames && s.pipeline.frames.length) {
      const narration = s.pipeline.narration;
      if (narration?.problemStatement) {
        if (narration.problemLabel) body += `<p><strong>${escapeHtml(narration.problemLabel)}</strong></p>`;
        body += `<p>${escapeHtml(narration.problemStatement)}</p>`;
      }
      if (narration?.outcomeFraming) {
        if (narration.outcomeLabel) body += `<p><strong>${escapeHtml(narration.outcomeLabel)}</strong></p>`;
        body += `<p>${escapeHtml(narration.outcomeFraming)}</p>`;
      }
      body += canvasSections()
        .map((sec) => {
          if (sec.kind === 'design-system') return `<h2>${escapeHtml(sec.label || 'Design System')}</h2><p>${escapeHtml(designSystemSheetToMarkdown(sec.content)).replace(/\n/g, '<br>')}</p>`;
          if (sec.kind === 'generated') return `<h2>${escapeHtml(sec.headline || sec.label)}</h2><p>${escapeHtml(sec.body)}</p>`;
          return `<h2>${escapeHtml(sec.headline)}</h2><p>${escapeHtml(sec.body)}</p>`;
        })
        .join('');
    } else {
      const rows = approvedIndices().map((i) => DRAFTS[i % DRAFTS.length]);
      body = rows.map((d) => `<h2>${d.headline}</h2><p>${d.body}</p>`).join('');
    }
    const html = `<!doctype html><meta charset="utf-8"><title>${escapeHtml(title)}</title><body style="font: 16px/1.6 system-ui; max-width: 42em; margin: 4rem auto; padding: 0 1rem"><h1>${escapeHtml(title)}</h1>${body}</body>`;
    saveAs('case-study.html', html, 'text/html');
  }, [saveAs, approvedIndices, canvasSections]);

  const copyMd = useCallback(() => {
    patch({ copied: true });
    navigator.clipboard?.writeText(mdSource()).catch(() => {});
    say(`Markdown copied — ${approvedIndices().length} sections`);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => patch({ copied: false }), 1600);
  }, [patch, mdSource, say, approvedIndices]);

  const toggleDlSel = useCallback(
    (i: number) => {
      patch((s) => ({ dlSel: { ...s.dlSel, [i]: s.dlSel[i] === false ? true : false } }));
    },
    [patch],
  );

  const toggleDlAll = useCallback(() => {
    const s = stateRef.current;
    const approved = approvedIndices();
    const allOn = approved.length > 0 && approved.every((i) => s.dlSel[i] !== false);
    const next: Record<number, boolean> = {};
    approved.forEach((i) => {
      next[i] = !allOn;
    });
    patch({ dlSel: next });
  }, [patch, approvedIndices]);

  const publishToShowcase = useCallback(() => {
    patch({ published: true });
    say('Published to Showcase');
  }, [patch, say]);

  const saveToAccount = useCallback(() => {
    say('Saved to My Projects');
    navigate('/projects');
  }, [say, navigate]);

  const applyMotion = useCallback(
    (name: string) => {
      const selId = stateRef.current.sel;
      const selName = selId === 'logo' ? 'Northwind mark' : 'Selected element';
      patch((s) => ({ motion: name, replayKey: s.replayKey + 1 }));
      say(name === 'Keep static' ? 'Motion removed' : `${name} applied to ${selName}`);
    },
    [patch, say],
  );

  const replay = useCallback(() => patch((s) => ({ replayKey: s.replayKey + 1 })), [patch]);

  const runRewrite = useCallback(() => {
    say(stateRef.current.rwPrompt ? 'Rewriting with your prompt…' : 'Three rewrites from the current text');
  }, [say]);

  const pickRewrite = useCallback(
    (i: number) => {
      patch({ rwPick: i });
      say('Rewrite applied — tagged AI-SUGGESTED');
    },
    [patch, say],
  );

  const pickTemplate = useCallback(
    (name: string) => {
      patch({ template: name, tplOpen: false });
      say(`${name} applied`);
    },
    [patch, say],
  );

  const setTemplate = useCallback(
    (name: string, opts?: { announce?: boolean }) => {
      patch({ template: name });
      if (opts?.announce !== false) say(`${name} selected`);
    },
    [patch, say],
  );

  const addHighlight = useCallback(() => say('Highlights stay out of the page until filled'), [say]);
  const editSuggestion = useCallback(() => say('Editing the suggested line'), [say]);
  const dropSuggestion = useCallback(() => say('Suggestion removed — nothing inferred is published'), [say]);

  const toggleQProve = useCallback(
    (label: string) => {
      patch((s) => {
        const on = s.qProve.includes(label);
        return { qProve: on ? s.qProve.filter((x) => x !== label) : [...s.qProve, label] };
      });
    },
    [patch],
  );

  const actions: AppActions = {
    setTheme,
    isDark,
    addFiles,
    removeFile,
    hoverThumb,
    setHoverThumb: setHoverThumbState,
    setBriefA: (v) => patch({ briefA: v }),
    setBriefB: (v) => patch({ briefB: v }),
    skipBrief: () => {
      patch({ briefA: '', briefB: '' });
      say('Skipped — drafting from the images alone');
    },
    setProjectName: (v) => patch({ projectName: v }),
    setPrompt: (v) => patch({ prompt: v }),
    setTemplate,
    setVCount: (n) => patch({ vCount: n }),
    runVariants,
    setVSteer: (v) => patch({ vSteer: v }),
    openVariant,
    generate,
    finishWaiting,
    captionOf,
    setCaption,
    maybeDraftAI,
    regenerateDraft,
    retryPerceive,
    pickFallbackCategory,
    setFallbackOtherText,
    pickFallbackOther,
    skipFallback,
    currentCategoryId,
    currentCategoryLabel,
    acceptSoftConfirm,
    setInterviewField,
    setInterviewClientStatus,
    toggleInterviewTool,
    addInterviewTool,
    submitInterview,
    skipInterview,
    runExtractAndProceed,
    setDesignSystemColorHex,
    setDesignSystemColorRole,
    setDesignSystemTypographyField,
    setDesignSystemComponentCount,
    setDesignSystemSpacing,
    designSystemContinue,
    openQuestions,
    setQAud: (v) => patch({ qAud: v }),
    toggleQProve,
    setQTech: (v) => patch({ qTech: v }),
    setQPace: (v) => patch({ qPace: v }),
    setQAvoid: (v) => patch({ qAvoid: v }),
    submitQuestions,
    decideForMe,
    load,
    goTo,
    next,
    prev,
    approve,
    regenerate,
    skip,
    answerFollowUp,
    dismissFollowUp,
    askFollowUp,
    toggleTplOpen: () => patch((s) => ({ tplOpen: !s.tplOpen })),
    pickTemplate,
    goRefine,
    openEditorWith,
    finish,
    publish,
    select,
    deselect,
    setTitle: (v) => patch({ title: v }),
    setHover,
    setSize,
    sizeOf,
    toggleLayers: () => patch((s) => ({ layers: !s.layers })),
    setTextTab: (v) => patch({ textTab: v }),
    setFont: (v) => patch({ font: v }),
    setWeight: (v) => patch({ weight: v }),
    sizeUp: () => patch((s) => ({ fontSize: Math.min(64, s.fontSize + 1) })),
    sizeDown: () => patch((s) => ({ fontSize: Math.max(12, s.fontSize - 1) })),
    setLead: (v) => patch({ lead: v }),
    setColor: (v) => patch({ color: v }),
    setAlign: (v) => patch({ align: v }),
    setEmph: (v) => patch({ emph: v }),
    setRwPrompt: (v) => patch({ rwPrompt: v }),
    runRewrite,
    pickRewrite,
    setImgTab: (v) => patch({ imgTab: v }),
    toggleLock: () => patch((s) => ({ lock: !s.lock })),
    setRatio: (label) => {
      const RATIO: Record<string, number | undefined> = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, Free: undefined };
      const a = RATIO[label];
      const sel = stateRef.current.sel;
      if (a && sel) {
        const cur = sizeOf(sel);
        setSize(sel, cur.w, cur.w / a);
      }
      patch({ ratio: label, lock: !!a });
    },
    setW: (w) => {
      const sel = stateRef.current.sel;
      if (!sel) return;
      const cur = sizeOf(sel);
      const clamped = Math.max(240, Math.min(624, w || 240));
      setSize(sel, clamped, stateRef.current.lock ? clamped / (cur.w / cur.h) : cur.h);
    },
    setH: (h) => {
      const sel = stateRef.current.sel;
      if (!sel) return;
      const cur = sizeOf(sel);
      const clamped = Math.max(160, Math.min(480, h || 160));
      setSize(sel, stateRef.current.lock ? clamped * (cur.w / cur.h) : cur.w, clamped);
    },
    resetImg: () => {
      const sel = stateRef.current.sel;
      if (sel) setSize(sel, 560, 315);
      patch({ ratio: '16:9', lock: true });
    },
    setAdjB: (v) => patch({ adjB: v }),
    setAdjC: (v) => patch({ adjC: v }),
    setAdjS: (v) => patch({ adjS: v }),
    resetAdj: () => patch({ adjB: 100, adjC: 100, adjS: 100 }),
    toggleStudio: () => patch((s) => ({ studio: !s.studio, fx: false })),
    closeStudio: () => patch({ studio: false }),
    setMTab: (v) => patch({ mTab: v }),
    applyMotion,
    setSpeed: (v) => patch((s) => ({ speed: v, replayKey: s.replayKey + 1 })),
    setDir: (v) => patch((s) => ({ dir: v, replayKey: s.replayKey + 1 })),
    setEase: (v) => patch((s) => ({ ease: v, replayKey: s.replayKey + 1 })),
    toggleLoop: () => patch((s) => ({ loop: !s.loop, replayKey: s.replayKey + 1 })),
    setTrigger: (v) => patch({ trigger: v }),
    setKf: (v) => patch({ kf: v }),
    replay,
    toggleAdv: () => patch((s) => ({ adv: !s.adv })),
    toggleFx: () => patch((s) => ({ fx: !s.fx, studio: false })),
    closeFx: () => patch({ fx: false }),
    setBtnFx: (v) => patch({ btnFx: v }),
    setImgFx: (v) => patch({ imgFx: v }),
    setCursorFx: (v) => patch({ cursorFx: v }),
    toggleReveal: () => patch((s) => ({ reveal: !s.reveal })),
    setRevealAmt: (v) => patch({ revealAmt: v }),
    toggleMore: () => patch((s) => ({ more: !s.more })),
    setPrevLay: (v) => patch({ prevLay: v }),
    setCover: (i) => {
      patch({ cover: i });
    },
    goPreview,
    setPreviewLayout,
    setPreviewTheme,
    say,
    copyMd,
    downloadMd,
    downloadHtml,
    downloadTxt,
    toggleDlSel,
    toggleDlAll,
    publishToShowcase,
    saveToAccount,
    openStyleQuestion,
    closeCq,
    cqSkip,
    cqDecide,
    addHighlight,
    editSuggestion,
    dropSuggestion,
    approvedIndices,
    approvedSections,
    canvasSections,
    mdSource,

    openProject,
    trashProject,
    restoreProject,
    deleteProjectForever,
    startNewProject,
    openNewProject,
    closeNewProject,
    npUpload,
    npTemplate,
    goProjects,
    goTrash,
    goBrand,
    goHelp,
    goSettings,
    goUsage,
    setSettingsTab,
    logout,
    setTemplateFilter,
    useTemplate,
    selectFreeform,
    setActiveFreeformPage,
    patchFreeformElement,
    removeFreeformElement,
    removeFreeformElements,
    addFreeformElement,
    duplicateFreeformElement,
    duplicateFreeformElements,
    addFreeformPage,
    duplicateFreeformPage,
    removeFreeformPage,
    reorderFreeformPages,
    renameFreeformPage,
    setFreeformPageBackground,
    setFreeformPageHeight,
    undoFreeform,
    redoFreeform,
    getStockPhoto,
    fetchStockPhoto,
    sceneTreatment,
  };

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { NAMES };
