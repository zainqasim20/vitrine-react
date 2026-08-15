export interface DraftContent {
  headline: string;
  body: string;
}

// Six mock case-study sections a designer would review one at a time.
// The AI drafting itself is mocked (matches the design prototype's simulated timings) —
// real drafting would need an LLM API key wired up server-side.
export const DRAFTS: DraftContent[] = [
  {
    headline: 'A first run that asks for nothing',
    body: 'The opening screen holds a single field and no account wall. Signup is deferred until there is work worth saving, which removes the most common drop-off point before the product has earned any trust.',
  },
  {
    headline: 'The empty state does the teaching',
    body: 'Rather than an illustration and a shrug, the empty state names the one action that matters and shows the shape of the result. New users are told what will happen, not congratulated for arriving.',
  },
  {
    headline: 'Progress made legible',
    body: 'Each uploaded screen becomes a numbered step with its own status. The sequence, not a percentage bar, tells the user where they are, in the same order they will read the finished case study.',
  },
  {
    headline: 'Failure states that admit fault',
    body: 'When generation fails the copy says what went wrong and what to do next. No retry loop, no vague apology.',
  },
  {
    headline: 'One decision per view',
    body: 'Review is deliberately narrow: one screen, one draft, four possible responses. Batch approval was cut because it produced case studies nobody had actually read.',
  },
  {
    headline: 'Publishing is a separate act',
    body: 'Approving a section commits it to the draft, not to the public page. The final publish step stays a distinct, reversible decision made once.',
  },
];

export const PRESENTATION_STYLES = ['Minimalist Grid', 'Story Scroll', 'Editorial Magazine'] as const;
export type PresentationStyle = (typeof PRESENTATION_STYLES)[number];

export const TEMPLATE_TEASERS = [
  { name: 'Minimalist Grid', meta: 'Even weight, no hierarchy', kind: 'grid' as const },
  { name: 'Story Scroll', meta: 'One long narrative column', kind: 'story' as const },
  { name: 'Metrics-First', meta: 'Numbers lead, prose follows', kind: 'metrics' as const },
  { name: 'Editorial Magazine', meta: 'Type-led, wide margins', kind: 'editorial' as const },
];

// Real Templates gallery data, ported from the live site's TEMPLATES/TEMPLATE_CATEGORIES.
// theme/layout are applied to Preview for real when a template is used (useTemplate()).
export interface TemplateDef {
  name: string;
  desc: string;
  kind: 'grid' | 'story' | 'split' | 'metrics' | 'editorial' | 'timeline' | 'visual' | 'deepdive';
  cat: 'Minimal' | 'Narrative' | 'Data' | 'Editorial';
  theme: 'minimal' | 'editorial' | 'bold' | 'playful';
  layout: 'stacked' | 'side-by-side' | 'compact';
}

export const TEMPLATE_CATEGORIES = ['All', 'Minimal', 'Narrative', 'Data', 'Editorial'] as const;

export const TEMPLATES: TemplateDef[] = [
  { name: 'Minimalist Grid', desc: 'Even weight, no hierarchy', kind: 'grid', cat: 'Minimal', theme: 'minimal', layout: 'stacked' },
  { name: 'Story Scroll', desc: 'One long narrative column', kind: 'story', cat: 'Narrative', theme: 'minimal', layout: 'stacked' },
  { name: 'Before/After Split', desc: 'Two states, one comparison', kind: 'split', cat: 'Data', theme: 'bold', layout: 'side-by-side' },
  { name: 'Metrics-First', desc: 'Numbers lead, prose follows', kind: 'metrics', cat: 'Data', theme: 'bold', layout: 'compact' },
  { name: 'Editorial Magazine', desc: 'Type-led, wide margins', kind: 'editorial', cat: 'Editorial', theme: 'editorial', layout: 'side-by-side' },
  { name: 'Process Timeline', desc: 'Left-rail steps, chronological', kind: 'timeline', cat: 'Narrative', theme: 'minimal', layout: 'compact' },
  { name: 'Visual-First', desc: 'Full-bleed screens, light copy', kind: 'visual', cat: 'Minimal', theme: 'playful', layout: 'stacked' },
  { name: 'Single Screen Deep-Dive', desc: 'One screen, annotated closely', kind: 'deepdive', cat: 'Editorial', theme: 'editorial', layout: 'stacked' },
];

export const HOW_STEPS = [
  { num: '01 Upload', title: 'Drop the screens', body: 'Exports, recordings, stills — in the order the flow runs. No brief, no form to fill in.' },
  { num: '02 Draft', title: 'Review one at a time', body: 'A section is written per screen. Approve, regenerate, or skip it. Nothing enters the case study without a decision.' },
  { num: '03 Refine', title: 'Art-direct the page', body: 'Set type, crop the screens, add motion where it earns its place, then publish or export as Markdown.' },
];

export const VARIANT_STYLES = ['Bold statement', 'Card breakdown', 'Icon system', 'Logo lockup', 'Image-forward'] as const;

export const MOTION_PRESETS = [
  { name: 'Draw-in', meta: '520ms · mask reveal', keyframe: 'v-draw' },
  { name: 'Gentle float', meta: '2.4s · loop', keyframe: 'v-float' },
  { name: 'Scale-in', meta: '320ms · ease-out', keyframe: 'v-scale-in' },
  { name: 'Pulse accent', meta: '900ms · loop', keyframe: 'v-pulse-accent' },
  { name: 'Keep static', meta: 'No motion applied', keyframe: 'v-static' },
] as const;

export const MOTION_TRIGGERS = [
  { label: 'On page load', icon: 'ph ph-arrow-line-down', meta: 'Plays once as the page mounts' },
  { label: 'On scroll into view', icon: 'ph ph-eye', meta: 'Plays when 40% visible' },
  { label: 'On hover', icon: 'ph ph-cursor', meta: 'Plays while pointer is over it' },
  { label: 'On click', icon: 'ph ph-hand-pointing', meta: 'Plays on each click' },
] as const;

export const PALETTE = ['#14141A', '#7A47F5', '#2B8FF5', '#1FA971', '#F3F3F5', '#FAFAFA'];

export const PATTERNS = [
  { label: 'Rounded buttons', icon: 'ph ph-rectangle' },
  { label: 'Card-based layout', icon: 'ph ph-squares-four' },
  { label: 'Pill navigation', icon: 'ph ph-list' },
  { label: '8pt spacing', icon: 'ph ph-ruler' },
];

export const JOURNEY = [
  { label: 'First run', step: 'Screen 01' },
  { label: 'Empty state', step: 'Screen 02' },
  { label: 'First result', step: 'Screen 03' },
];

export const AUDIENCE_OPTIONS = ['Hiring managers', 'Prospective clients', 'Design peers'];
export const PROVE_OPTIONS = ['Systems thinking', 'Craft & polish', 'Research depth', 'Shipping speed', 'Business impact'];
export const TECH_LABELS = ['Plain language', 'Mostly plain', 'Balanced', 'Craft vocabulary', 'Deeply technical'];
export const PACING_OPTIONS = [
  { label: 'Tight', bars: [100, 62] },
  { label: 'Measured', bars: [100, 84, 70] },
  { label: 'Long-form', bars: [100, 92, 88, 74] },
];

export const FOLLOW_UP_QUESTIONS = [
  'Was skipping the account wall your call, or the team’s?',
  'Is the empty state the part you want remembered here?',
  'Is the progress list the part you want remembered here?',
  'Should the failure copy be quoted verbatim?',
  'Was cutting batch approval a research finding or a hunch?',
  'Is reversible publishing worth its own section?',
];
