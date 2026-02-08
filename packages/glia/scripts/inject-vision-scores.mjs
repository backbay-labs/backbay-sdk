/**
 * Injects manually-evaluated Tier 3 vision scores into existing grade files.
 * These scores were produced by Claude reading each screenshot and evaluating
 * against the 6-dimension Backbay aesthetic rubric.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRADES_DIR = join(__dirname, "..", ".visual-review", "grades");

// Dimension weights (same as aesthetic-grade.mjs)
const DIMENSION_WEIGHTS = [0.20, 0.20, 0.15, 0.15, 0.10, 0.20];
const DIMENSION_NAMES = [
  "glass_fidelity", "dark_theme_coherence", "visual_hierarchy",
  "ambient_atmosphere", "interaction_polish", "compositional_beauty",
];

// My visual evaluations — raw 1-5 scores per dimension
// [glass, dark, hierarchy, ambient, polish, beauty]
const VISION_SCORES = {
  "primitives-organisms-glasspanel--default": {
    raw: [4, 5, 3, 2, 3, 3],
    notes: "Clean frosted panel, subtle cyan border, near-black bg. Good glass execution but minimal content limits hierarchy/atmosphere scores.",
  },
  "primitives-atoms-glowbutton--default": {
    raw: [2, 5, 2, 4, 4, 4],
    notes: "Gorgeous cyan neon glow with beautiful diffusion on near-black. The glow radiates perfectly. Atom nature limits hierarchy score but the glow aesthetic is excellent.",
  },
  "primitives-atoms-hudprogressring--default": {
    raw: [4, 5, 3, 4, 4, 4],
    notes: "Beautiful HUD progress ring at 75% with rainbow gradient arc, cyan percentage text, glass container. Strong sci-fi HUD aesthetic.",
  },
  "primitives-atoms-glowinput--default": {
    raw: [2, 5, 2, 3, 3, 3],
    notes: "Clean input with cyan neon border glow on near-black. Minimal but the glow treatment is well-executed. Placeholder text readable.",
  },
  "primitives-atoms-aurorabackground--default": {
    raw: [1, 5, 3, 1, 2, 2],
    notes: "Aurora animation not visible in static screenshot — appears as near-black with centered heading/description. The effect is the whole point and it's lost in capture.",
  },
  "primitives-atoms-glitchtext--default": {
    raw: [1, 5, 1, 2, 2, 2],
    notes: "Shows 'LOADING' in monospace uppercase on black. The glitch animation isn't captured in static. Monospace uppercase treatment is on-brand but minimal.",
  },
  "primitives-molecules-kpistat--default": {
    raw: [4, 5, 4, 3, 3, 4],
    notes: "Glass card with 'Total Revenue', bold $45.2K, green +20.2% trend indicator. Good typography hierarchy (label→value→trend), subtle cyan glass border.",
  },
  "primitives-molecules-threedcard--default": {
    raw: [5, 5, 4, 4, 4, 5],
    notes: "Stunning glass card with inner gradient image area, cyan sparkle icon, CTA buttons. Glass-within-glass layering, cyan border glow. Beautiful composition and depth.",
  },
  "primitives-organisms-commandpalette--default": {
    raw: [2, 5, 3, 3, 3, 3],
    notes: "Shows closed trigger state with 'Press ⌘+K' hint and cyan glow button. The actual palette overlay isn't shown — would score higher if open.",
  },
  "primitives-organisms-glasssidebar--default": {
    raw: [4, 5, 4, 2, 4, 4],
    notes: "Full sidebar with 'Backbay' header, sectioned nav (MAIN/COMMUNICATION), cyan active state. Proper glass panel, good icon alignment, uppercase section labels.",
  },
  "primitives-organisms-bentogrid--default": {
    raw: [1, 2, 4, 1, 3, 3],
    notes: "Three feature cards with LIGHT/PASTEL gradient images — breaks the dark theme contract. Cards are white, not glass. Hierarchy is decent but aesthetic is wrong for Backbay.",
  },
  "components-agentpanel--default": {
    raw: [4, 5, 4, 3, 4, 4],
    notes: "Dark glass panel with model selectors (Claude Opus/Sonnet/GPT-4o/Codex), cyan price labels, textarea, Run button. Good information architecture, proper glass treatment.",
  },
  "components-clusterhero-clusterhero--default": {
    raw: [4, 5, 5, 5, 5, 5],
    notes: "S-tier. Alexandria cluster with ornate gold crest, PUBLISH/LEASE/COMPOUND tabs, stats, gold LAUNCH button, news feed. Right-side crest with serif typography. Cathedral-like atmosphere.",
  },
  "desktop-shell-startmenu--default": {
    raw: [3, 5, 4, 2, 4, 4],
    notes: "Desktop OS start menu with search, pinned apps (monospace letter icons), category tabs with gold active accent. Uppercase labels, clear structure. Feels like a real OS.",
  },
  "systems-emotion-overview--default": {
    raw: [3, 4, 5, 4, 4, 5],
    notes: "Rich dashboard: 'Glyph Emotion System' heading, 3D glyph visualization (rendered!), AVO dimension sliders with color-coded bars, 6 feature cards. Impressive composition and information density.",
  },
  "primitives-atoms-statbadge--default": {
    raw: [1, 5, 1, 2, 3, 2],
    notes: "Tiny emerald '1.3K XP' pill badge on near-black. Subtle glow border. Extremely minimal atom — correct for its purpose but limited visual signal.",
  },
  "primitives-atoms-glasscheckbox--default": {
    raw: [2, 5, 1, 1, 3, 2],
    notes: "Single checkbox with label on near-black. Subtle glass-like border on checkbox. Minimal form element — functional but not visually interesting in isolation.",
  },
  "primitives-organisms-glasstable--default": {
    raw: [4, 5, 4, 2, 4, 4],
    notes: "Clean data table with cyan-tinted column headers, 10 data rows, glass panel border. Good readability, consistent alignment, functional elegance.",
  },
};

function computeTier3(raw) {
  const mapped = {};
  for (let i = 0; i < DIMENSION_NAMES.length; i++) {
    mapped[DIMENSION_NAMES[i]] = (raw[i] - 1) * 25;
  }
  let weightedSum = 0;
  for (let i = 0; i < DIMENSION_NAMES.length; i++) {
    weightedSum += mapped[DIMENSION_NAMES[i]] * DIMENSION_WEIGHTS[i];
  }
  return { score: Math.round(weightedSum), metrics: mapped, raw_scores: Object.fromEntries(DIMENSION_NAMES.map((d, i) => [d, raw[i]])) };
}

function gradeFromComposite(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

async function main() {
  const allResults = [];

  for (const [storyId, data] of Object.entries(VISION_SCORES)) {
    const storyPath = join(GRADES_DIR, "by-story", `${storyId}.json`);
    let existing = { tier1: null, tier2: null };
    if (existsSync(storyPath)) {
      existing = JSON.parse(await readFile(storyPath, "utf-8"));
    }

    const tier3 = computeTier3(data.raw);
    const tier1Score = existing.tier1?.score ?? null;
    const tier2Score = existing.tier2?.score ?? null;

    // Composite: 0.15*T1 + 0.25*T2 + 0.60*T3
    let composite;
    if (tier1Score != null && tier2Score != null) {
      composite = 0.15 * tier1Score + 0.25 * tier2Score + 0.60 * tier3.score;
    } else if (tier2Score != null) {
      composite = 0.25 * tier2Score + 0.75 * tier3.score;
    } else {
      composite = tier3.score;
    }
    composite = Math.round(composite * 10) / 10;
    const grade = gradeFromComposite(composite);

    const result = {
      storyId,
      composite,
      grade,
      tier1: existing.tier1,
      tier2: existing.tier2,
      tier3: { score: tier3.score, metrics: tier3.metrics, raw_scores: tier3.raw_scores },
      dimensions: tier3.metrics,
      tier3_notes: data.notes,
    };

    await writeFile(storyPath, JSON.stringify(result, null, 2));
    allResults.push(result);
    console.log(`${storyId} ... ${grade} (${composite}) [T1:${tier1Score ?? '-'} T2:${tier2Score ?? '-'} T3:${tier3.score}]`);
  }

  // Write updated scores.json (merge with existing)
  const scoresPath = join(GRADES_DIR, "scores.json");
  let existingScores = [];
  if (existsSync(scoresPath)) {
    existingScores = JSON.parse(await readFile(scoresPath, "utf-8"));
  }
  // Replace entries that we scored, keep the rest
  const scoredIds = new Set(allResults.map(r => r.storyId));
  const merged = [
    ...existingScores.filter(r => !scoredIds.has(r.storyId)),
    ...allResults.map(r => ({ storyId: r.storyId, composite: r.composite, grade: r.grade, tier1: r.tier1, tier2: r.tier2, tier3: r.tier3, dimensions: r.dimensions })),
  ].sort((a, b) => b.composite - a.composite);
  await writeFile(scoresPath, JSON.stringify(merged, null, 2));

  // Summary
  console.log("\n" + "=".repeat(60));
  const sorted = [...allResults].sort((a, b) => b.composite - a.composite);
  const dist = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const r of allResults) dist[r.grade]++;
  const avg = Math.round(allResults.reduce((s, r) => s + r.composite, 0) / allResults.length * 10) / 10;
  console.log(`Vision-scored: ${allResults.length} stories`);
  console.log(`Grade Distribution: S:${dist.S}  A:${dist.A}  B:${dist.B}  C:${dist.C}  D:${dist.D}`);
  console.log(`Average Composite: ${avg}`);
  console.log(`\nTop 5:`);
  sorted.slice(0, 5).forEach(r => console.log(`  ${r.grade} (${r.composite}) ${r.storyId}`));
  console.log(`\nBottom 5:`);
  sorted.slice(-5).forEach(r => console.log(`  ${r.grade} (${r.composite}) ${r.storyId}`));
  console.log("=".repeat(60));
}

main().catch(console.error);
