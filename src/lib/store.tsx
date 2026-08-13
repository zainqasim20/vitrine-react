import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppState, ScreenStatus, ThemeMode } from './types';
import { DRAFTS } from './data';
import { classifyRecords } from './pipeline/classify';
import { perceiveImage } from './pipeline/perceive';
import { buildDesignSystemSheet } from './pipeline/extract';
import categorySignals from './pipeline/config/category-signals.json';
import type { CategorySignalsConfig } from './pipeline/types';
import type { ClientStatus } from './types';

const PIPELINE_CONFIG = categorySignals as unknown as CategorySignalsConfig;

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

// Ported from the live site's seedInterviewDefaults: pre-fills the
// Interview form's tools chips from category-signals.json's defaultTools,
// left fully editable (toolsUnconfirmed just controls the "guessed -- edit
// if wrong" hint, it's not a lock).
function seedToolsForCategory(categoryId: string | null): string[] {
  if (!categoryId) return [];
  return PIPELINE_CONFIG.defaultTools[categoryId]?.slice() || [];
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
  title: 'Rebuilding checkout for repeat buyers',
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

  apiStatus: { gemini: false, checked: false },
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
  },
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
  mdSource: () => string;
}

interface Ctx {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({ ...initialState, theme: readStoredTheme() }));
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
      .then((data: { gemini?: boolean }) => {
        patch({ apiStatus: { gemini: !!data.gemini, checked: true } });
      })
      .catch(() => {
        patch({ apiStatus: { gemini: false, checked: true } });
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
        const additions = incoming.slice(0, room).map((f) => ({ id: nextId(), name: f.name, file: f, mimeType: f.type }));
        return { files: [...s.files, ...additions] };
      });
    },
    [patch],
  );

  const removeFile = useCallback(
    (id: string) => {
      patch((s) => ({ files: s.files.filter((f) => f.id !== id) }));
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

  const goTo = useCallback(
    (i: number) => {
      const s = statusAt(i);
      patch({ idx: i });
      if (s === 'pending') load(i);
    },
    [patch, load, statusAt],
  );

  const approvedIndices = useCallback(() => {
    const s = stateRef.current;
    return s.statuses.map((st, i) => ({ st, i })).filter((x) => x.st === 'approved' && x.i < s.files.length).map((x) => x.i);
  }, []);

  const finishWaiting = useCallback(() => {
    patch({ idx: 0, statuses: [] });
    navigate('/review');
    load(0, 900);
  }, [patch, navigate, load]);

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
  // site's runExtractStage(). Scope note for this step: the live site
  // routes to its Design System edit screen next; that screen doesn't
  // exist yet here, so this bridges straight into Draft/Review instead
  // (same temporary-bridge pattern the Fallback step used) -- the real
  // sheet is still computed and stored for real, ready for that screen
  // once it's built.
  const runExtractAndProceed = useCallback(() => {
    const sheet = buildDesignSystemSheet(stateRef.current.pipeline.perceiveRecords);
    patch((s) => ({ pipeline: { ...s.pipeline, designSystemSheet: sheet } }));
    finishWaiting();
  }, [patch, finishWaiting]);

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
    if (status !== 'drafted') {
      say(status === 'approved' ? 'Already approved' : 'Nothing to approve yet');
      return;
    }
    setStatus(s.idx, 'approved');
    const nextIdx = (s.idx + 1) % Math.max(1, s.files.length);
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => goTo(nextIdx), 650);
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

  const goRefine = useCallback(() => {
    if (approvedIndices().length) navigate('/refine');
    else say('Approve a section first');
  }, [approvedIndices, navigate, say]);

  const finish = useCallback(() => {
    if (!approvedIndices().length) {
      say('Approve a section first');
      return;
    }
    navigate('/published');
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

  const mdSource = useCallback(() => {
    const s = stateRef.current;
    const rows = approvedIndices().map((i) => DRAFTS[i % DRAFTS.length]);
    const body = rows.map((d) => `## ${d.headline}\n\n${d.body}\n`).join('\n');
    return `# ${s.title}\n\n${body || '_No sections approved yet._\n'}`;
  }, [approvedIndices]);

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
    () => saveAs('case-study.txt', mdSource().replace(/[#_]/g, ''), 'text/plain'),
    [saveAs, mdSource],
  );
  const downloadHtml = useCallback(() => {
    const s = stateRef.current;
    const rows = approvedIndices().map((i) => DRAFTS[i % DRAFTS.length]);
    const body = rows.map((d) => `<h2>${d.headline}</h2><p>${d.body}</p>`).join('');
    const html = `<!doctype html><meta charset="utf-8"><title>${s.title}</title><body style="font: 16px/1.6 system-ui; max-width: 42em; margin: 4rem auto; padding: 0 1rem"><h1>${s.title}</h1>${body}</body>`;
    saveAs('case-study.html', html, 'text/html');
  }, [saveAs, approvedIndices]);

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
    mdSource,
  };

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { NAMES };
