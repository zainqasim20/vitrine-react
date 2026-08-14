// Stage 5 -- Present. Assembles the case-study frame list for the confirmed
// category using module-sequences.json (docs/ai-system-prompt.md Part 5.1) --
// no per-category logic hardcoded here, only in the config. Pure function: no
// Gemini call, no re-analysis of images.
//
// Frame-to-section assignment: the spec describes required/recommended/optional
// frame slots per category but doesn't define a mechanism for deciding which
// approved section fills which slot (nothing in Part 1's Image Feature Record
// classifies an image as "this is the User Journey shot" vs "this is Key
// Features"). Absent that, this assigns approved sections to slots positionally,
// in the designer's own section order, required slots first -- so real content
// always fills required frames before optional ones, and nothing genuine gets
// dropped. Flagged as an implementation decision, not a spec answer.
//
// Only the module format changed (ES module instead of a global-attaching
// <script>) -- see classify.ts for the same note.

import type { ApprovedSection, DesignSystemSheet, ModuleSequencesConfig, PresentFrame, PresentResult } from './types';

function describeColors(sheet: DesignSystemSheet): string {
  if (!sheet.colors.length) return 'no dominant colors were confidently extracted';
  const roles = sheet.colors.map((c) => c.role).filter((r, i, arr) => arr.indexOf(r) === i);
  return `a palette of ${sheet.colors.length} extracted color${sheet.colors.length === 1 ? '' : 's'} (roles: ${roles.join(', ')})`;
}

function describeTypography(sheet: DesignSystemSheet): string {
  if (!sheet.typography.length) return 'no type scale was confidently extracted';
  const bands = sheet.typography.map((t) => t.role).join(', ');
  return `a type scale spanning ${bands}`;
}

function describeComponents(sheet: DesignSystemSheet): string {
  const present = Object.entries(sheet.components).filter(([, v]) => v.count > 0).map(([k]) => k);
  if (!present.length) return 'no reusable components were catalogued';
  return `a component set including ${present.join(', ')}`;
}

// Synthesizes a plausible substitute frame's text from real aggregated data
// (the DESIGN_SYSTEM_SHEET) -- describes only what was actually extracted,
// never invents specifics the sheet doesn't contain.
function synthesizeSubstituteBody(sheet: DesignSystemSheet): string {
  return `Generated from the extracted design system: ${describeColors(sheet)}, ${describeTypography(sheet)}, and ${describeComponents(sheet)}. Replace this with a real screen when one becomes available.`;
}

export function assembleFrames(
  category: string | null,
  designSystemSheet: DesignSystemSheet,
  approvedSections: ApprovedSection[],
  config: ModuleSequencesConfig,
): PresentResult {
  const sequence = (category && config.sequences && config.sequences[category]) || { required: [], recommended: [], optional: [] };
  const labels = config.frameLabels || {};
  const slots = [
    ...(sequence.required || []).map((id) => ({ id, tier: 'required' })),
    ...(sequence.recommended || []).map((id) => ({ id, tier: 'recommended' })),
    ...(sequence.optional || []).map((id) => ({ id, tier: 'optional' })),
  ];

  const queue = (approvedSections || []).slice();
  const frames: PresentFrame[] = [];

  slots.forEach((slot) => {
    const label = labels[slot.id] || slot.id;

    if (slot.id === 'design-system') {
      frames.push({ slot: slot.id, tier: slot.tier, label, generated: false, sourceSectionId: null, content: designSystemSheet });
      return;
    }

    if (queue.length) {
      const section = queue.shift()!;
      frames.push({ slot: slot.id, tier: slot.tier, label, generated: false, sourceSectionId: section.id, headline: section.headline, body: section.body });
      return;
    }

    if (slot.tier === 'required') {
      frames.push({
        slot: slot.id,
        tier: slot.tier,
        label,
        generated: true,
        generatedReason: `missing-required-frame:${slot.id}`,
        sourceSectionId: null,
        headline: `${label} (generated)`,
        body: synthesizeSubstituteBody(designSystemSheet),
      });
    }
    // recommended/optional slots with no content left are simply omitted --
    // "sections can be empty/skipped gracefully" (DESIGN_SPEC.md §8).
  });

  // Any approved sections left over after filling every slot are real,
  // designer-approved content -- never dropped, appended as extra frames.
  queue.forEach((section) => {
    frames.push({ slot: 'additional', tier: 'additional', label: 'Additional', generated: false, sourceSectionId: section.id, headline: section.headline, body: section.body });
  });

  return { category, frames };
}
