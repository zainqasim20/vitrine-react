# Presentation Style & Visual Creativity Engine v3
### How to construct any visual scene with genuine art-direction craft — not just pick a template

---

## PART 0 — WHY THIS DOCUMENT EXISTS

A portfolio tool that just arranges an uploaded screenshot with a caption underneath it has produced a slideshow, not a portfolio. What separates a trusted, memorable case study from a forgettable one is almost never the underlying design work itself — it's **how that work is staged, lit, and framed for the viewer.** The example that prompted this document — an iPhone tilted at -65°, resting on a wet stone, with sunlight crossing it in visible rays and the water surface catching the light — is not a random flourish. It's a deliberate, composed *scene*, built from several independent creative decisions stacked together: a surface choice, an angle choice, a lighting choice, an atmospheric choice, and a color-mood choice. None of those decisions is unique to that one scene. Each is a real, reusable variable. This document breaks presentation craft down into those reusable variables, shows how real Behance work combines them, and gives the tool a genuine grammar for constructing new scenes — not a fixed menu of eight options.

**This document assumes the tool can generate or compose imagery for hero/mockup frames** (via an image-generation call, or via compositing an uploaded real screenshot into a described environment). Where that capability doesn't exist yet, treat this document as the creative brief that should drive whatever compositing/generation approach is implemented — see Part 7 for the concrete technical mapping.

---

## PART 1 — THE SCENE CONSTRUCTION FRAMEWORK
### Eight independent, composable layers. Every real "creative" mockup scene is a specific combination of choices across these layers — never invent a ninth axis; combine these eight in new ways instead.

### Layer 1 — Surface / Environment
*What is the device/artifact physically sitting on, in, or against?*

| Option | Mood it carries | Real/plausible category fit |
|---|---|---|
| Flat studio backdrop (seamless paper/fabric) | Clean, controlled, professional | Any category, especially packaging, brand identity |
| Natural material (wood grain, marble, linen, stone) | Warm, tactile, premium, human | Food/lifestyle apps, wellness, packaging |
| Water (wet stone, shallow pool, rain-streaked glass) | Fresh, dynamic, reflective, elevated | Fitness/wellness apps, outdoor/travel brands, premium tech |
| Urban/architectural (concrete, glass building, street) | Modern, ambitious, real-world | B2B SaaS, fintech, mobility/EV apps |
| Abstract gradient/void | Futuristic, focus-pure, tech-forward | AI products, crypto, dashboards |
| In-hand (real photographed hand) | Human, immediate, relatable | Consumer/lifestyle mobile apps |
| Desk/workspace scene (real props: coffee, notebook, plants) | Grounded, everyday, approachable | Productivity apps, journaling/wellness |
| Sand/organic outdoor texture | Adventurous, natural, unrefined-luxury | Travel, outdoor gear, sustainability brands |

### Layer 2 — Angle / Placement
*How is the artifact positioned relative to the viewer?*

- **Dead flat / top-down (0°)** — clinical, catalog-like, maximum clarity, minimal drama
- **Slight tilt (10–25°)** — the most common "natural but composed" angle; implies careful arrangement without artificiality
- **Dramatic tilt (45–75°)** — implies motion, energy, or a deliberately staged "moment" rather than a static product shot. **This is the range the water/stone example falls into (-65°)** — a strong tilt reads as art-directed, not accidental.
- **Floating / levitating** — surreal, premium, "magic" quality; often paired with soft shadow beneath to keep it grounded rather than looking like an error
- **Leaning against something** — casual, human, implies the object was "just set down," lower formality
- **Multiple devices at once** — implies ecosystem/completeness (e.g., phone + laptop together) — real, common in SaaS and fintech to show cross-device consistency

### Layer 3 — Lighting
*Where is the light coming from, and what quality does it have?*

- **Flat studio softbox** — even, shadowless, neutral — the "safe" default, appropriate when the product itself must read with zero ambiguity
- **Directional natural sunlight with visible rays (god-rays/light shafts)** — this is the specific technique in the prompting example. Visible light rays crossing an object require: (a) a light source position clearly outside the frame or low on the horizon, (b) some atmospheric medium for the rays to be visible in (mist, dust, or reflected off a wet/textured surface), (c) the rays should cross *behind or across* the subject, not just illuminate it flatly. This reads as premium, cinematic, "captured at the perfect moment" — a strong technique for anything wanting to feel aspirational or elevated (travel, fitness, premium lifestyle).
- **Rim/backlight (silhouette edge glow)** — dramatic, moody, often used for hero character/3D reveals
- **Dark atmospheric with glow/bloom** — confirmed real technique (see Presentation-Styles v2's "dark atmospheric glass staging") — soft colored light bleeding around a device on a near-black background, real audience-praised technique for SaaS/tech hero frames
- **Colored gel lighting (single saturated color wash)** — bold, contemporary, brand-color-reinforcing when the gel color matches the brand palette
- **Golden hour warmth** — nostalgic, warm, human — pairs naturally with natural-material surfaces

### Layer 4 — Atmospheric / Environmental Effects
*What is happening in the air or on surfaces around the subject?*

- **Water reflections/ripples** — the subject's surroundings should visibly catch and bend the light source; a shiny/wet surface without any visible reflection reads as fake
- **Fog/mist** — makes light rays visible (see Layer 3), softens hard edges, adds depth
- **Dust/particles in light** — adds a sense of real physical space and time-of-day specificity
- **Motion blur (on background elements only, never the hero subject unless intentionally dynamic)** — implies energy without sacrificing product clarity
- **Depth of field / bokeh** — foreground or background elements thrown out of focus while the hero subject stays sharp; this is what makes a flat composite read as "photographed" rather than "pasted in"
- **Steam/condensation** — food, wellness, hot-beverage contexts specifically

### Layer 5 — Material Interplay
*How do the different surfaces in the scene relate to and reflect off each other?*

- The device screen should show a faint reflection of its environment (sky, light source) unless the on-screen content needs to be perfectly legible — a screen with zero reflection on a scene that clearly has strong directional light is a real, common mistake that breaks believability
- Matte vs. glossy contrast: pairing a matte natural surface (stone, wood) with a glossy device creates visual hierarchy — the eye is drawn to the shiniest object first
- Wet surfaces should show real specular highlights (small, bright, sharp-edged reflections of the light source) — not just generic "shininess"

### Layer 6 — Color Grade / Mood
*What is the overall color temperature and contrast treatment of the whole scene?*

- **Warm/golden** — nostalgic, human, premium-casual
- **Cool/blue-tech** — clinical precision, SaaS, fintech, AI
- **High-contrast editorial** — bold, confident, fashion/luxury adjacent
- **Soft pastel/desaturated** — calm, wellness, gentle consumer products
- **Monochrome + single accent** — the accent color should usually be the brand's actual primary color, used nowhere else in the frame — this is the single most reliable way to make a scene feel "on-brand" rather than generically pretty

### Layer 7 — Supporting Props / Context Objects
*What real-world objects, if any, share the frame with the hero subject, and do they relate to the product's actual purpose?*

**Rule: props must be semantically relevant to the product, not decorative filler.** A fitness app's hero scene benefits from real gym/outdoor-adjacent props (a water bottle, running shoes, dumbbells softly out of focus in the background) — not random decorative objects. A finance app benefits from props like a physical card, a notebook with real-looking numbers, a pen — objects that reinforce "this app is about managing real money," not generic office clutter.

### Layer 8 — Composition
*How is the frame itself organized — where does the eye go first, and what's given room to breathe?*

- **Rule of thirds** — place the hero subject off-center, not dead-center, for a more dynamic, photographed feel
- **Negative space allocation** — the side of the frame without the hero subject should be genuinely empty or very quiet (sky, water, blurred background) — this is where any text/headline overlay belongs
- **Foreground/midground/background layering** — a scene with only one depth plane (the subject and nothing else) reads as flat; even one soft foreground element (a blurred branch, a corner of water) and one background element (sky, wall, horizon) creates real depth

---

## PART 2 — NAMED REAL SCENE RECIPES
### Concrete, real, observed combinations — each broken into its Part 1 layer choices, so the underlying pattern is reusable, not just the specific instance

### Recipe: "Elevated Moment" (the water/stone/sunlight example, generalized)
- Surface: natural material with reflective quality (water, wet stone, wet glass)
- Angle: dramatic tilt (45–75°)
- Lighting: directional natural sunlight with visible rays
- Atmosphere: water reflections/ripples catching the light; soft depth of field on background
- Material: device screen shows a faint sky/light reflection; wet surface shows sharp specular highlights
- Color grade: warm/golden or cool-crisp depending on brand mood
- Props: minimal — the scene's drama comes from light and water, not clutter
- Composition: rule-of-thirds placement, generous negative space for a headline
- **Best fit**: premium lifestyle, travel, fitness/wellness, outdoor-adjacent brands — anything wanting to feel aspirational and "captured," not manufactured

### Recipe: "Dark Atmospheric Tech" (real, confirmed)
- Surface: abstract gradient/void or urban glass
- Angle: slight tilt or dead flat, multiple devices often shown together
- Lighting: dark atmospheric with glow/bloom, colored to match brand accent
- Atmosphere: soft blur/glass blur (glassmorphism) around the device edges
- Material: glossy screen with a subtle brand-colored glow reflection
- Color grade: cool/blue-tech or brand-accent monochrome
- Props: none — the device and its glow are the entire scene
- Composition: device often centered or slightly off-center with a large soft glow radius
- **Best fit**: SaaS, fintech, AI products, crypto — real, audience-praised technique ("catches attention immediately")

### Recipe: "Oversized Wordmark Overlay" (real, confirmed, multiple executions)
- Surface: bold flat saturated color (real example: bright yellow) or dark void
- Angle: device placed centrally, overlapping the giant type behind it
- Lighting: flat, even — the typography and color do the work, not lighting drama
- Atmosphere: none needed — this is a graphic, not a photographic scene
- Material: N/A (flat graphic treatment)
- Color grade: high-contrast, brand-name type in a contrasting color to the background
- Props: often a small mascot/character illustration tucked in a corner
- Composition: type physically overlaps/interlocks with the device mockup, not stacked separately above/below it
- **Best fit**: consumer mobile apps, personal portfolios, anything wanting bold, confident, un-corporate energy

### Recipe: "Movie Credits Opening" (real, confirmed, packaging + character work)
- Surface: pure flat white or brand color, no photographic environment at all
- Angle: N/A — this is a typographic/graphic opening, not a photographic one
- Lighting: N/A
- Atmosphere: none
- Material: N/A
- Color grade: high-contrast type on a flat field
- Props: a small seal/badge/logo mark, positioned like a film certification stamp
- Composition: centered, generous vertical spacing between title / tagline / credits list, echoing real film opening-credit pacing
- **Best fit**: packaging with personality/character concepts, playful branding, projects with a genuine narrative concept worth telegraphing before showing any product

### Recipe: "Annotated Hero" (real, confirmed, builds direct trust)
- Surface: any — the annotation system is the differentiator, not the backdrop
- Angle: dramatic tilt is common (implies the product is being actively "presented," not just displayed)
- Lighting: can be dramatic/cinematic since the callouts add clarity even amid visual drama
- Atmosphere: soft glow/highlight can be added specifically around each annotated point to draw the eye
- Material: real render quality matters more here since viewers are being asked to scrutinize details
- Color grade: whatever suits the product; callout labels should use a consistent, legible, brand-accent-colored small type
- Props: none — annotations replace the need for supporting props
- Composition: callouts should point to genuinely distinct features, spaced so labels never overlap; leave one clear "empty" zone for a headline
- **Best fit**: medical/technical/precision products, anything where specific features are the actual selling point (confirmed: dental implants; applies equally to hardware, precision manufacturing, technical SaaS features)

### Recipe: "Photographic Backdrop Reveal" (real, confirmed, highest-performing brand identity in the sample)
- Surface: a real, evocative photographic scene relevant to the brand's world (travel brand → landscape; restaurant → kitchen/ingredients; fashion → real setting)
- Angle: the photograph itself may have depth/perspective (a road receding into the distance), with the logo overlaid flat on top, not embedded "into" the 3D space
- Lighting: whatever the source photograph naturally has — often golden hour or dramatic natural light
- Atmosphere: whatever the photo naturally contains (motion in a road scene, mist in a landscape)
- Material: logo should be a clean, flat overlay — usually white or a single brand color — with enough contrast against the photo to stay legible
- Color grade: the photo's natural grade, lightly adjusted to keep the logo readable
- Props: N/A — the "prop" is the entire photographic world itself
- Composition: logo typically placed in the photo's most visually calm region (sky, water, empty road) so it doesn't fight busy detail
- **Best fit**: travel, hospitality, outdoor, lifestyle, any brand whose *world* is more evocative than an abstract mark alone would communicate

---

## PART 3 — CATEGORY → ENVIRONMENT/MOOD MAPPING GUIDE

| Category | Default environment tendency | Default lighting tendency | Real deviation worth knowing |
|---|---|---|---|
| Landing Page/Website (AI/SaaS) | Abstract void, dark urban glass | Dark atmospheric glow | — |
| Landing Page/Website (healthcare/real estate) | Natural material, real photographic backdrop | Soft natural light | — |
| Mobile App (consumer/lifestyle) | Bold flat color, in-hand | Flat/even, or golden hour if in-hand outdoors | Bright saturated flat colors real-confirmed to outperform "safe" dark defaults for education/consumer apps |
| Mobile App (fintech/B2B) | Urban glass, dark void | Dark atmospheric | — |
| Dashboard/SaaS | Abstract gradient, dark void | Dark atmospheric with brand-colored glow | — |
| Brand Identity/Logo | Flat brand color OR real photographic backdrop | Flat, or the photo's natural light | Photographic backdrop is real and validated, not a compromise choice |
| Packaging | Flat studio, or a "movie credits" flat field | Studio soft light with sharp specular highlights on the product | — |
| Illustration | N/A — full-bleed artwork, no staging needed | N/A | The art itself carries all mood; no external scene-staging applies |
| 3D/CGI | Abstract void, dramatic environment matching subject | Cinematic rim/directional light | — |
| Motion | Storyboard-style flat frames, or in-context environmental shots | Matches the actual footage's real grading | — |

---

## PART 4 — THE COMBINATORIAL CREATIVITY ENGINE
### How to generate a genuinely new scene, not just select a named recipe

Given: a category, a brand's extracted color palette, and a mood/personality signal (from Interview answers or Extract's tone analysis), construct a scene by making one deliberate choice per layer:

```
1. Pick Surface based on Part 3's category tendency, unless the brand's own personality
   (from Interview/Extract) suggests a deliberate deviation worth trying (see Part 3's
   "real deviation" column for precedent that deviation is legitimate).

2. Pick Angle — default to slight tilt (10-25°) unless the mood signal is "bold/energetic"
   (→ dramatic tilt) or "precise/clinical" (→ dead flat).

3. Pick Lighting to match the mood: aspirational/premium → natural sunlight with rays;
   technical/modern → dark atmospheric glow; clinical/precise → flat studio.

4. Pick Atmosphere that's physically consistent with the Surface choice — water surface
   implies reflections/ripples; abstract void implies glow/bloom; natural material implies
   soft depth of field, not fog.

5. Pick Material treatment: does the screen need to be perfectly legible (flat/minimal
   reflection) or is this a mood-first hero shot (allow a faint environmental reflection)?

6. Pick Color Grade: default to the brand's actual extracted primary/accent color as the
   single dominant grade note - never introduce a color grade that fights the real
   extracted palette.

7. Pick Props ONLY if they are semantically tied to the product's real purpose (Layer 7's
   rule). If no genuinely relevant prop exists, use none - an empty, well-lit scene beats
   an irrelevant prop every time.

8. Apply Composition rules: rule-of-thirds placement, one foreground + one background
   depth element minimum, and reserve genuine negative space for any headline overlay.
```

**This is a generative grammar, not a lookup table.** The same category can legitimately produce many different valid scenes depending on which mood signal and which layer choices are made — this is intentional and is how "thousands of presentation styles" becomes tractable: not thousands of memorized templates, but a small set of composable decisions that combine into effectively unlimited real variations.

---

## PART 5 — ENRICHING THE 8 EXISTING TEMPLATES WITH SCENE-LEVEL GUIDANCE

Each of Vitrine's 8 presentation templates (Minimalist Grid, Story Scroll, Metrics-First, Editorial Magazine, Before/After Split, Process Timeline, Visual-First, Single Screen Deep-Dive) governs *layout/pacing*. This document's scene-construction framework governs *how each individual hero/mockup frame within that layout is staged*. They operate at different levels and should be applied together:

- **Story Scroll's hook frame** → apply an "Elevated Moment" or "Oversized Wordmark Overlay" recipe for maximum opening impact
- **Metrics-First's stat block** → apply flat, high-clarity lighting (Layer 3: flat studio) since numbers must read instantly, never a dramatic-tilt scene that could obscure legibility
- **Single Screen Deep-Dive** → apply the "Annotated Hero" recipe directly
- **Before/After Split** → both sides must use *identical* Layer 1–8 choices except for the one thing that changed — any staging inconsistency between the two sides undermines the comparison's credibility
- **Visual-First** → the artwork itself is the scene; do not apply device-mockup staging logic at all here (see Illustration's row in Part 3)
- **Process Timeline** → each stage frame should use consistent Layer 6 (color grade) and Layer 8 (composition) so the sequence reads as one continuous story, varying only what the process step itself shows

---

## PART 6 — CONSISTENCY GUARDRAILS (creativity must never break brand coherence)

1. **One Layer 6 (color grade) per project.** Every scene within a single case study should share the same color-temperature logic, even if individual scenes vary in surface/lighting/angle. A project that jumps between warm-golden and cool-blue grading across different frames will feel disjointed, not creative.
2. **One dominant Surface family per project**, unless the layout template itself calls for contrast (e.g., Before/After). Switching from "natural material" to "abstract void" to "urban glass" within the same case study reads as indecisive, not versatile.
3. **The brand's real extracted accent color must appear in every scene's Layer 6 choice.** A scene that's beautifully lit but uses none of the brand's actual palette isn't "creative" — it's off-brand.
4. **Never let scene drama compromise legibility of the actual product/screenshot.** If a dramatic angle or reflection would make an uploaded real UI screenshot illegible, back off the drama — the real content always wins over the staging.
5. **Props must pass the relevance test every time (Layer 7).** When in doubt, use no prop rather than a generic one.

---

## PART 7 — TECHNICAL IMPLEMENTATION NOTES FOR THE PIPELINE

This framework should live as structured data the Present stage (and any future image-generation/compositing step) can read from:

```
SCENE_LAYERS = {
  surface: [...enum from Part 1 Layer 1],
  angle: [...enum from Part 1 Layer 2, with degree ranges],
  lighting: [...enum from Part 1 Layer 3],
  atmosphere: [...enum from Part 1 Layer 4],
  material: [...enum from Part 1 Layer 5],
  colorGrade: [...enum from Part 1 Layer 6],
  props: [...conditional, category-relevance-checked],
  composition: [...enum from Part 1 Layer 8]
}

NAMED_RECIPES = {
  "elevated-moment": { surface: "water/wet-stone", angle: "dramatic-tilt", lighting: "natural-sunlight-rays", ... },
  "dark-atmospheric-tech": { ... },
  "oversized-wordmark-overlay": { ... },
  "movie-credits-opening": { ... },
  "annotated-hero": { ... },
  "photographic-backdrop-reveal": { ... }
}

CATEGORY_SCENE_DEFAULTS = {
  landing_page_ai_saas: { surface: "abstract-void", lighting: "dark-atmospheric" },
  mobile_app_consumer: { surface: "bold-flat-color", lighting: "flat-even" },
  ...per Part 3's table
}
```

**Where this actually gets used:**
- If the pipeline generates a hero/mockup image (via an image-generation call), this structured scene data becomes the literal generation prompt — e.g., translate the chosen layers into descriptive prompt language ("iPhone tilted at -65 degrees resting on a wet stone in shallow water, golden hour sunlight crossing the frame in visible rays, water surface catching bright specular highlights, shallow depth of field, brand accent color #6038EE subtly present in the sky gradient").
- If the pipeline instead composites a *real* uploaded screenshot into a described environment (rather than generating the whole scene), this data still governs the compositing choices: background image selection (via Pexels, matched to the Surface/Lighting choice), device frame angle/rotation, shadow/reflection overlay effects, and color-grade filter applied to the final composite.
- Either way, **the real uploaded screenshot's content must never be altered or obscured** — only the staging/environment around it is generative. This preserves the honesty principle already established: AI can build the stage, but the actual work being presented must remain the designer's real, unaltered content.

---

## PART 8 — QUICK-REFERENCE CREATIVITY CHECKLIST

Before finalizing any hero/mockup scene, confirm:

- [ ] Does this scene use the brand's real extracted accent color somewhere in Layer 6?
- [ ] Is the angle/lighting/atmosphere combination physically plausible together (water implies reflections; dry flat surfaces don't need specular highlights)?
- [ ] Does the real uploaded screenshot/product content remain fully legible?
- [ ] If a prop is included, does it pass the semantic-relevance test, or should it be removed?
- [ ] Is there genuine negative space reserved for any headline/text overlay?
- [ ] Does this scene's color grade match every other scene's color grade in the same project?
- [ ] Would a real viewer describe this as "captured" or "composed" rather than "generic stock" or "randomly generated"? If not, revisit the Layer 2 (angle) and Layer 3 (lighting) choices first — these two carry the most perceived creativity per the real research (dramatic angles and natural/atmospheric lighting were the most consistently praised techniques across the entire 212-link sample).
