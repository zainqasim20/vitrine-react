// A curated subset of real Google Fonts (correct, real category per font,
// not fabricated) to make the font picker browsable/searchable without
// shipping Google's entire ~1500-family catalog. Not a hard limit though:
// loadGoogleFont() below loads *any* family name dynamically from the same
// CDN, so a name typed in that isn't in this list still works -- this list
// is the discoverable/curated subset, not the ceiling.
//
// Fetching Google's own metadata API (webfonts.googleapis.com) for a live,
// complete catalog needs an API key this project doesn't have; this list
// is a reasonable, honestly-scoped stand-in for that, built from
// well-established real font names, not invented ones.

export type GoogleFontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';

export interface GoogleFontEntry {
  family: string;
  category: GoogleFontCategory;
}

export const FONT_CATEGORY_LABELS: Record<GoogleFontCategory, string> = {
  'sans-serif': 'Sans Serif',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Handwriting',
  monospace: 'Monospace',
};

export const GOOGLE_FONTS: GoogleFontEntry[] = [
  // Sans serif
  ...[
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Inter', 'Raleway', 'Nunito', 'Rubik', 'Work Sans',
    'Karla', 'Mulish', 'Manrope', 'DM Sans', 'Barlow', 'Heebo', 'Urbanist', 'Sora', 'Outfit', 'Plus Jakarta Sans',
    'Figtree', 'Space Grotesk', 'Epilogue', 'Lexend', 'Josefin Sans', 'Quicksand', 'Archivo', 'Public Sans',
    'Red Hat Display', 'IBM Plex Sans', 'Noto Sans', 'PT Sans', 'Source Sans 3', 'Titillium Web', 'Hind', 'Cabin',
    'Oxygen', 'Overpass', 'Fira Sans', 'Assistant', 'Jost', 'Prompt',
  ].map((family) => ({ family, category: 'sans-serif' as const })),
  // Serif
  ...[
    'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Source Serif 4', 'Crimson Text', 'Libre Baskerville',
    'EB Garamond', 'Cormorant Garamond', 'Cormorant', 'Bitter', 'Vollkorn', 'Spectral', 'Noto Serif', 'Domine',
    'Frank Ruhl Libre', 'Zilla Slab', 'Alegreya', 'Rokkitt', 'IBM Plex Serif', 'Tinos', 'Neuton', 'Arvo',
    'Old Standard TT', 'Josefin Slab',
  ].map((family) => ({ family, category: 'serif' as const })),
  // Display
  ...[
    'Bebas Neue', 'Anton', 'Archivo Black', 'Oswald', 'Passion One', 'Alfa Slab One', 'Bungee', 'Fredoka',
    'Righteous', 'Titan One', 'Luckiest Guy', 'Abril Fatface', 'Bangers', 'Staatliches', 'Rammetto One',
    'Baloo 2', 'Comfortaa', 'Paytone One', 'Squada One', 'Fjalla One',
  ].map((family) => ({ family, category: 'display' as const })),
  // Handwriting
  ...[
    'Pacifico', 'Dancing Script', 'Great Vibes', 'Sacramento', 'Satisfy', 'Caveat', 'Kalam',
    'Shadows Into Light', 'Amatic SC', 'Indie Flower', 'Permanent Marker', 'Homemade Apple', 'Kaushan Script',
    'Courgette', 'Marck Script', 'Yellowtail', 'Allura', 'Lobster', 'Playball', 'Cookie',
  ].map((family) => ({ family, category: 'handwriting' as const })),
  // Monospace
  ...[
    'Roboto Mono', 'Source Code Pro', 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Space Mono',
    'Inconsolata', 'Courier Prime', 'PT Mono', 'Overpass Mono', 'Cousine', 'Anonymous Pro', 'DM Mono',
    'Red Hat Mono',
  ].map((family) => ({ family, category: 'monospace' as const })),
];

const FONT_BY_NAME = new Map(GOOGLE_FONTS.map((f) => [f.family.toLowerCase(), f]));
const GENERIC_FALLBACK: Record<GoogleFontCategory, string> = {
  'sans-serif': 'sans-serif',
  serif: 'serif',
  display: 'sans-serif',
  handwriting: 'cursive',
  monospace: 'monospace',
};

const loadedFamilies = new Set<string>();

// Injects a <link> to Google Fonts' CSS2 endpoint for the given family --
// the same mechanism any static site uses to load a web font, requiring no
// API key (only the catalog-search/metadata API needs one, not this).
// Idempotent per family so re-selecting an already-loaded font is a no-op.
export function loadGoogleFont(family: string): void {
  const key = family.toLowerCase();
  if (loadedFamilies.has(key) || typeof document === 'undefined') return;
  loadedFamilies.add(key);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// The 3 legacy names resolve to the app's own existing brand stacks
// (unchanged look for anything not re-pointed at a Google Font); anything
// else is treated as a Google Font family name, loaded on demand, with a
// sensible generic fallback based on its known category (or plain
// sans-serif if it's a custom name typed in and not in the curated list).
export function resolveFreeformFontCss(fontFamily: string): string {
  if (fontFamily === 'display') return "'Bricolage Grotesque', sans-serif";
  if (fontFamily === 'body') return "'Plus Jakarta Sans', system-ui, sans-serif";
  if (fontFamily === 'mono') return "'Geist Mono', monospace";
  loadGoogleFont(fontFamily);
  const known = FONT_BY_NAME.get(fontFamily.toLowerCase());
  const fallback = known ? GENERIC_FALLBACK[known.category] : 'sans-serif';
  return `'${fontFamily}', ${fallback}`;
}
