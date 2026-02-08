#!/usr/bin/env node
/**
 * aesthetic-grade.mjs — Aesthetic grading pipeline for Glia component screenshots.
 *
 * Reads from .visual-review/ (populated by visual-review.mjs) and produces
 * multi-tier aesthetic scores:
 *   Tier 1: Structural heuristics from a11y snapshots
 *   Tier 2: Visual heuristics from screenshot PNGs (via sharp)
 *   Tier 3: Claude Vision judge (via @anthropic-ai/sdk)
 *
 * Usage:
 *   node scripts/aesthetic-grade.mjs [options]
 *
 * Options:
 *   --input <dir>       Visual review dir (default: .visual-review)
 *   --filter <pattern>  Filter story IDs (glob-style)
 *   --tier <1|2|3|all>  Which tiers to run (default: all)
 *   --model <model>     Claude model for tier 3
 *   --reference <ids>   Comma-separated gold-standard story IDs
 *   --out <dir>         Output dir (default: .visual-review/grades)
 *   --batch <n>         Tier 3 batch size before rate-limit pause (default: 5)
 *   --suggestions       Extract per-component improvement suggestions from Tier 3
 */

import { parseArgs } from "node:util";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const GLIA_ROOT = resolve(__dirname, "..");

// Load .env from SDK root (scripts/ -> glia/ -> packages/ -> sdk-root/)
const ENV_PATH = join(__dirname, "..", "..", "..", ".env");
if (existsSync(ENV_PATH)) {
  const envContent = await readFile(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    input: { type: "string", default: join(GLIA_ROOT, ".visual-review") },
    filter: { type: "string", default: "" },
    tier: { type: "string", default: "all" },
    model: { type: "string", default: "claude-sonnet-4-5-20250929" },
    reference: { type: "string", default: "" },
    out: { type: "string", default: "" },
    batch: { type: "string", default: "5" },
    suggestions: { type: "boolean", default: false },
  },
  strict: false,
  allowPositionals: true,
});

const INPUT_DIR = resolve(args.input);
const TIERS_TO_RUN = args.tier === "all" ? [1, 2, 3] : [parseInt(args.tier, 10)];
const MODEL = args.model;
const REFERENCE_IDS = args.reference ? args.reference.split(",").map((s) => s.trim()) : [];
const OUT_DIR = args.out ? resolve(args.out) : join(INPUT_DIR, "grades");
const BATCH_SIZE = parseInt(args.batch, 10) || 5;
const ENABLE_SUGGESTIONS = Boolean(args.suggestions);
const FILTER_RE = args.filter
  ? new RegExp("^" + args.filter.replace(/\*/g, ".*") + "$")
  : null;

// ---------------------------------------------------------------------------
// Tier 3 system prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert UI/UX design critic evaluating components from the Glia design system library. Glia follows a dark, glass-morphism aesthetic inspired by the Backbay Industries web platform.

Design DNA reference:
- Near-black backgrounds (#02040a to #0a0a0a), never gray
- Glass panels: backdrop-filter blur (12-40px), very high opacity (0.88-0.98), NOT transparent-looking
- Noise grain overlay (fractalNoise SVG at 2-8% opacity) on glass surfaces
- Inset top highlight: inset 0 1px 0 rgba(255,255,255,0.02) for "forged metal" feel
- Neon accent system: cyan (#22D3EE), magenta (#F43F5E), emerald (#10B981), violet (#8B5CF6)
- Accents used at 4-35% alpha for borders/glows, full saturation for text/icons only
- Neon glow shadows: double-layer (0 0 20px accent/0.4, 0 0 40px accent/0.2)
- Typography: display serif for headings, monospace for labels/data (uppercase, 0.1em+ letter-spacing), sans-serif for body
- Subtle micro-interactions: spring physics (100-200ms), breathing pulses (2-3s cycles), glow on hover/focus
- Gradient separators: borders fade to transparent at edges, never hard lines
- Overall mood: premium sci-fi HUD, clinical cyberpunk, cathedral-like atmosphere

Score each dimension 1-5. Provide brief reasoning before each score.`;

const TIER3_USER_SUFFIX = `Score this component on the following 6 dimensions (1-5 each). For each, provide brief reasoning then the score.

1. Glass Fidelity — How well does it execute the glass-morphism aesthetic? Backdrop blur, opacity, grain overlay, inset highlights.
2. Dark Theme Coherence — Is the background truly near-black? Are grays avoided? Do accent colors follow the neon palette?
3. Visual Hierarchy — Is there clear information ordering? Do headings, body, and labels use appropriate typography tiers?
4. Ambient Atmosphere — Does it feel immersive? Breathing animations, glow effects, depth layering, cathedral-like mood.
5. Interaction Polish — Focus states, hover transitions, spring physics, micro-interactions visible in the static shot.
6. Compositional Beauty — Overall balance, spacing, alignment, golden-ratio-like proportions, visual rhythm.

After scoring, provide 2-3 specific actionable improvement suggestions. Format each as:
SUGGESTION: [description]`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferComponentTier(storyId) {
  if (storyId.startsWith("primitives-atoms-")) return "atom";
  if (storyId.startsWith("primitives-molecules-")) return "molecule";
  if (storyId.startsWith("primitives-organisms-") || storyId.startsWith("components-") || storyId.startsWith("systems-") || storyId.startsWith("desktop-")) return "organism";
  if (storyId.startsWith("primitives-three-") || storyId.startsWith("primitives-3d-")) return "3d";
  if (storyId.startsWith("primitives-ambient-")) return "ambient";
  return "unknown";
}

function tierContextText(tier) {
  switch (tier) {
    case "atom":
      return "This is an ATOM — a small, single-purpose primitive (button, badge, label). Expect minimal elements, focused purpose, and a tight accent-on-dark-canvas composition. A nearly-black screenshot with a single small accent element is ideal.";
    case "molecule":
      return "This is a MOLECULE — a small composition of atoms (input group, card header, stat display). Expect modest complexity with clear grouping and controlled visual hierarchy.";
    case "organism":
      return "This is an ORGANISM or composite component — a complex UI region (panel, dialog, dashboard section). Expect rich structure, layered glass panels, clear information hierarchy, and ambient depth.";
    case "3d":
      return "This is a 3D/WebGL component. Visual scoring should focus on atmospheric quality, lighting, particle effects, and integration with the dark theme rather than traditional UI metrics.";
    case "ambient":
      return "This is an AMBIENT component — a background or atmospheric element (noise fields, gradient layers). It may appear nearly empty by design. Evaluate on subtlety and mood contribution.";
    default:
      return "Component tier could not be determined. Apply standard scoring criteria.";
  }
}

/**
 * Discover story IDs from snapshots directory.
 *
 * NOTE: Stories tagged `!static-grade` (animation-dependent components like
 * AuroraBackground, GlitchText, AmbientField, ParticleField, QuantumField,
 * SpatialWorkspace) should be excluded from default grading since static
 * screenshots don't represent their visual quality. When a Storybook manifest
 * is available, filter on the `!static-grade` tag here. For now the tag lives
 * in the story meta and callers can use --filter to skip them manually.
 */
async function discoverStoryIds() {
  const snapshotsDir = join(INPUT_DIR, "snapshots");
  const screenshotsDir = join(INPUT_DIR, "screenshots");

  const ids = new Set();

  if (existsSync(snapshotsDir)) {
    for (const f of await readdir(snapshotsDir)) {
      if (f.endsWith(".json")) ids.add(f.replace(/\.json$/, ""));
    }
  }
  if (existsSync(screenshotsDir)) {
    for (const f of await readdir(screenshotsDir)) {
      if (f.endsWith(".png")) ids.add(f.replace(/\.png$/, ""));
    }
  }

  let result = [...ids].sort();
  if (FILTER_RE) result = result.filter((id) => FILTER_RE.test(id));
  return result;
}

function gradeFromComposite(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

// ---------------------------------------------------------------------------
// TIER 1: Structural Heuristics
// ---------------------------------------------------------------------------

const INTERACTIVE_ROLES = new Set([
  "button", "textbox", "link", "checkbox", "slider",
  "switch", "combobox", "menuitem", "tab", "radio",
]);

function scoreTier1(snapshot, tier) {
  const refs = snapshot?.data?.refs || {};
  const refEntries = Object.values(refs);
  const isAtom = tier === "atom";

  // aria_completeness
  const interactive = refEntries.filter((r) => INTERACTIVE_ROLES.has(r.role));
  let ariaCompleteness;
  if (interactive.length === 0) {
    ariaCompleteness = 80;
  } else {
    const withName = interactive.filter((r) => r.name && r.name.trim().length > 0);
    ariaCompleteness = Math.round((withName.length / interactive.length) * 100);
  }

  // semantic_richness — atoms with 1 role are valid; higher baseline for atoms
  const allRoles = new Set(refEntries.map((r) => r.role).filter(Boolean));
  const semanticBase = isAtom ? 55 : 40;
  const semanticRichness = Math.min(100, semanticBase + allRoles.size * 12);

  // element_balance — atoms are supposed to be minimal, reward simplicity
  const count = refEntries.length;
  let elementBalance;
  if (count === 0) elementBalance = 0;
  else if (count <= 3) elementBalance = isAtom ? 85 : 70;
  else if (count <= 10) elementBalance = 85;
  else if (count <= 30) elementBalance = 100;
  else if (count <= 60) elementBalance = 85;
  else if (count <= 100) elementBalance = 65;
  else elementBalance = 45;

  const tier1Score = Math.round((ariaCompleteness + semanticRichness + elementBalance) / 3);

  return {
    score: tier1Score,
    metrics: { aria_completeness: ariaCompleteness, semantic_richness: semanticRichness, element_balance: elementBalance },
  };
}

// ---------------------------------------------------------------------------
// TIER 2: Visual Heuristics (sharp)
// ---------------------------------------------------------------------------

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    console.warn("  [warn] sharp not available, tier 2 will use fallback scores");
    return null;
  }
}

async function scoreTier2(screenshotPath, sharp, tier) {
  if (!sharp) {
    return {
      score: 50,
      metrics: { dark_dominance: 50, contrast_presence: 50, color_richness: 50, luminance_distribution: 50 },
    };
  }

  let raw;
  try {
    const img = sharp(screenshotPath).removeAlpha().raw();
    const { data, info } = await img.toBuffer({ resolveWithObject: true });
    raw = { data, width: info.width, height: info.height, channels: info.channels };
  } catch {
    return {
      score: 50,
      metrics: { dark_dominance: 50, contrast_presence: 50, color_richness: 50, luminance_distribution: 50 },
    };
  }

  const isAtom = tier === "atom";

  const { data, width, height, channels } = raw;
  const totalPixels = width * height;

  // Sample every 4th pixel for speed
  const brightnesses = [];
  for (let i = 0; i < totalPixels; i += 4) {
    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    brightnesses.push(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // dark_dominance
  const darkCount = brightnesses.filter((b) => b < 30).length;
  const darkRatio = darkCount / brightnesses.length;
  const darkDominance = Math.round(Math.min(100, (darkRatio / 0.7) * 100));

  // contrast_presence — forgiving threshold for isolated components on dark canvas
  const mean = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
  const variance = brightnesses.reduce((sum, b) => sum + (b - mean) ** 2, 0) / brightnesses.length;
  const stddev = Math.sqrt(variance);
  const contrastPresence = Math.round(Math.min(100, (stddev / 18) * 100));

  // color_richness — resize to 32x32 and count hue buckets
  let colorRichness;
  try {
    const small = await sharp(screenshotPath).resize(32, 32, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const hueBuckets = new Set();
    for (let i = 0; i < small.data.length; i += channels) {
      const r = small.data[i] / 255;
      const g = small.data[i + 1] / 255;
      const b = small.data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      if (delta < 0.05) continue; // achromatic
      let hue;
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue = ((hue * 60) + 360) % 360;
      hueBuckets.add(Math.floor(hue / 30));
    }
    // Dark theme aesthetic: controlled palette is good, not bad
    const bucketCount = hueBuckets.size;
    if (bucketCount === 0) colorRichness = 50; // fully achromatic
    else if (bucketCount <= 2) colorRichness = 80; // intentional accent (ideal)
    else if (bucketCount <= 4) colorRichness = 100; // rich but controlled
    else if (bucketCount <= 6) colorRichness = 75; // getting busy
    else colorRichness = 55; // too noisy for glass aesthetic
  } catch {
    colorRichness = 50;
  }

  // luminance_distribution — dark canvas with small bright accents is ideal
  const veryDark = brightnesses.filter((b) => b < 15).length / brightnesses.length;
  const bright = brightnesses.filter((b) => b > 150).length / brightnesses.length;
  let luminanceDistribution;
  if (veryDark > 0.5 && bright > 0.001) luminanceDistribution = 100; // dark with any accent
  else if (veryDark > 0.5) luminanceDistribution = 80; // pure dark is still valid
  else if (veryDark > 0.3) luminanceDistribution = 60; // mixed
  else luminanceDistribution = 30; // too bright for the aesthetic

  // For atoms, a very dark canvas (>80%) with minimal bright pixels is IDEAL —
  // small accent on dark canvas. Bump luminance score accordingly.
  if (isAtom && veryDark > 0.8) {
    luminanceDistribution = Math.max(luminanceDistribution, 95);
  }

  const tier2Score = Math.round((darkDominance + contrastPresence + colorRichness + luminanceDistribution) / 4);

  return {
    score: tier2Score,
    metrics: { dark_dominance: darkDominance, contrast_presence: contrastPresence, color_richness: colorRichness, luminance_distribution: luminanceDistribution },
  };
}

// ---------------------------------------------------------------------------
// TIER 3: Claude Vision Judge
// ---------------------------------------------------------------------------

const DIMENSION_NAMES = [
  "glass_fidelity",
  "dark_theme_coherence",
  "visual_hierarchy",
  "ambient_atmosphere",
  "interaction_polish",
  "compositional_beauty",
];

const DIMENSION_WEIGHTS = [0.20, 0.20, 0.15, 0.15, 0.10, 0.20];

function parseTier3Response(text) {
  const scores = {};
  const patterns = [
    /(\d)\s*\/\s*5/g,
    /\*\*(\d)\/5\*\*/g,
    /score:\s*(\d)/gi,
  ];

  // Try to find 6 scores in order
  const allMatches = [];
  const combined = /(?:\*\*\s*)?(\d)\s*(?:\/\s*5|\s*out\s+of\s+5)(?:\s*\*\*)?/gi;
  let m;
  while ((m = combined.exec(text)) !== null) {
    const val = parseInt(m[1], 10);
    if (val >= 1 && val <= 5) allMatches.push(val);
  }

  for (let i = 0; i < DIMENSION_NAMES.length; i++) {
    scores[DIMENSION_NAMES[i]] = allMatches[i] !== undefined ? allMatches[i] : 3;
  }

  return scores;
}

/** Extract SUGGESTION: lines from a Tier 3 response. */
function parseSuggestions(text) {
  const suggestions = [];
  const re = /SUGGESTION:\s*(.+)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m[1].trim();
    if (s.length > 0) suggestions.push(s);
  }
  return suggestions;
}

async function scoreTier3(storyId, screenshotPath, snapshotText, referenceData, client, sharp, tier) {
  const contentBlocks = [];

  // Add reference images if provided
  if (referenceData.length > 0) {
    contentBlocks.push({
      type: "text",
      text: "These are gold-standard reference components (score 5/5 on all dimensions):",
    });
    for (const ref of referenceData) {
      contentBlocks.push({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: ref.base64 },
      });
    }
  }

  // Resize screenshot to max 1568px long edge
  let imgBase64;
  try {
    const imgBuf = await readFile(screenshotPath);
    if (sharp) {
      const metadata = await sharp(imgBuf).metadata();
      const longEdge = Math.max(metadata.width || 0, metadata.height || 0);
      let resized;
      if (longEdge > 1568) {
        resized = await sharp(imgBuf)
          .resize({ width: 1568, height: 1568, fit: "inside" })
          .png()
          .toBuffer();
      } else {
        resized = imgBuf;
      }
      imgBase64 = resized.toString("base64");
    } else {
      imgBase64 = imgBuf.toString("base64");
    }
  } catch (err) {
    throw new Error(`Failed to read screenshot for ${storyId}: ${err.message}`);
  }

  contentBlocks.push({
    type: "image",
    source: { type: "base64", media_type: "image/png", data: imgBase64 },
  });

  contentBlocks.push({
    type: "text",
    text: `Accessibility tree:\n${snapshotText}`,
  });

  const tierContext = tierContextText(tier);
  contentBlocks.push({
    type: "text",
    text: `${TIER3_USER_SUFFIX}\n\nComponent tier: ${tier}. ${tierContext}`,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: contentBlocks }],
  });

  const responseText = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const rawScores = parseTier3Response(responseText);

  // Map 1-5 to 0-100
  const mapped = {};
  for (const dim of DIMENSION_NAMES) {
    mapped[dim] = (rawScores[dim] - 1) * 25;
  }

  // Weighted average
  let weightedSum = 0;
  for (let i = 0; i < DIMENSION_NAMES.length; i++) {
    weightedSum += mapped[DIMENSION_NAMES[i]] * DIMENSION_WEIGHTS[i];
  }
  const overallTier3 = Math.round(weightedSum);

  const suggestions = ENABLE_SUGGESTIONS ? parseSuggestions(responseText) : [];

  return {
    score: overallTier3,
    metrics: mapped,
    raw_scores: rawScores,
    response_text: responseText,
    suggestions,
  };
}

// ---------------------------------------------------------------------------
// Composite scoring
// ---------------------------------------------------------------------------

function computeComposite(tier1, tier2, tier3) {
  const hasTier1 = tier1 != null;
  const hasTier2 = tier2 != null;
  const hasTier3 = tier3 != null;

  let composite;
  if (hasTier1 && hasTier2 && hasTier3) {
    composite = 0.15 * tier1.score + 0.25 * tier2.score + 0.60 * tier3.score;
  } else if (hasTier1 && hasTier2) {
    composite = 0.35 * tier1.score + 0.65 * tier2.score;
  } else if (hasTier1) {
    composite = tier1.score;
  } else if (hasTier2) {
    composite = tier2.score;
  } else if (hasTier3) {
    composite = tier3.score;
  } else {
    composite = 0;
  }

  return Math.round(composite * 10) / 10;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Aesthetic Grade Pipeline");
  console.log(`  Input:  ${INPUT_DIR}`);
  console.log(`  Output: ${OUT_DIR}`);
  console.log(`  Tiers:  ${TIERS_TO_RUN.join(", ")}`);
  if (FILTER_RE) console.log(`  Filter: ${args.filter}`);
  if (ENABLE_SUGGESTIONS) console.log(`  Suggestions: enabled`);
  console.log();

  // Discover stories
  const storyIds = await discoverStoryIds();
  if (storyIds.length === 0) {
    console.error("No stories found in", INPUT_DIR);
    console.error("Run `npm run visual-review` first to capture screenshots and snapshots.");
    process.exit(1);
  }
  console.log(`Found ${storyIds.length} stories to grade.\n`);

  // Load sharp if needed for tier 2 or 3
  let sharp = null;
  if (TIERS_TO_RUN.includes(2) || TIERS_TO_RUN.includes(3)) {
    sharp = await loadSharp();
  }

  // Load Anthropic client if tier 3
  let anthropicClient = null;
  let runTier3 = TIERS_TO_RUN.includes(3);
  if (runTier3) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("[warn] ANTHROPIC_API_KEY not set, falling back to tier 1+2 only.\n");
      runTier3 = false;
    } else {
      try {
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        anthropicClient = new Anthropic();
      } catch (err) {
        console.warn(`[warn] Could not load @anthropic-ai/sdk: ${err.message}`);
        console.warn("[warn] Falling back to tier 1+2 only.\n");
        runTier3 = false;
      }
    }
  }

  // Load reference data for tier 3
  const referenceData = [];
  if (runTier3 && REFERENCE_IDS.length > 0) {
    for (const refId of REFERENCE_IDS) {
      const refScreenshot = join(INPUT_DIR, "screenshots", `${refId}.png`);
      if (!existsSync(refScreenshot)) {
        console.warn(`[warn] Reference screenshot not found: ${refId}`);
        continue;
      }
      try {
        const buf = await readFile(refScreenshot);
        let resized;
        if (sharp) {
          const meta = await sharp(buf).metadata();
          const longEdge = Math.max(meta.width || 0, meta.height || 0);
          resized = longEdge > 1568
            ? await sharp(buf).resize({ width: 1568, height: 1568, fit: "inside" }).png().toBuffer()
            : buf;
        } else {
          resized = buf;
        }
        referenceData.push({ id: refId, base64: resized.toString("base64") });
      } catch (err) {
        console.warn(`[warn] Failed to load reference ${refId}: ${err.message}`);
      }
    }
  }

  // Ensure output directories
  await mkdir(join(OUT_DIR, "by-story"), { recursive: true });

  // Grade each story
  const allResults = [];

  let tier3Count = 0;

  for (let i = 0; i < storyIds.length; i++) {
    const storyId = storyIds[i];
    const prefix = `[${i + 1}/${storyIds.length}]`;
    const tier = inferComponentTier(storyId);

    const snapshotPath = join(INPUT_DIR, "snapshots", `${storyId}.json`);
    const screenshotPath = join(INPUT_DIR, "screenshots", `${storyId}.png`);

    const hasSnapshot = existsSync(snapshotPath);
    const hasScreenshot = existsSync(screenshotPath);

    if (!hasSnapshot && !hasScreenshot) {
      console.log(`${prefix} ${storyId} ... SKIP (no data)`);
      continue;
    }

    let tier1Result = null;
    let tier2Result = null;
    let tier3Result = null;

    // Tier 1
    if (TIERS_TO_RUN.includes(1) && hasSnapshot) {
      try {
        const snapshot = JSON.parse(await readFile(snapshotPath, "utf-8"));
        tier1Result = scoreTier1(snapshot, tier);
      } catch (err) {
        console.warn(`  [warn] Tier 1 failed for ${storyId}: ${err.message}`);
      }
    }

    // Tier 2
    if (TIERS_TO_RUN.includes(2) && hasScreenshot) {
      tier2Result = await scoreTier2(screenshotPath, sharp, tier);
    }

    // Tier 3
    if (runTier3 && hasScreenshot) {
      // Batch delay: pause between batches to avoid rate limits
      if (tier3Count > 0 && tier3Count % BATCH_SIZE === 0) {
        console.log(`  [batch] Pausing 2s between batches...`);
        await new Promise((r) => setTimeout(r, 2000));
      }

      const snapshotText = hasSnapshot
        ? (JSON.parse(await readFile(snapshotPath, "utf-8"))?.data?.snapshot || "No accessibility tree available.")
        : "No accessibility tree available.";

      try {
        tier3Result = await scoreTier3(storyId, screenshotPath, snapshotText, referenceData, anthropicClient, sharp, tier);
        tier3Count++;
      } catch (err) {
        console.warn(`  [warn] Tier 3 failed for ${storyId}: ${err.message}`);
      }
    }

    const composite = computeComposite(tier1Result, tier2Result, tier3Result);
    const grade = gradeFromComposite(composite);

    const suggestions = tier3Result?.suggestions || [];

    const storyResult = {
      storyId,
      componentTier: tier,
      composite,
      grade,
      tier1: tier1Result,
      tier2: tier2Result,
      tier3: tier3Result
        ? { score: tier3Result.score, metrics: tier3Result.metrics, raw_scores: tier3Result.raw_scores }
        : null,
      dimensions: tier3Result?.metrics || null,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    // Write individual story grade
    const storyOutPath = join(OUT_DIR, "by-story", `${storyId}.json`);
    const storyOutData = { ...storyResult };
    if (tier3Result?.response_text) {
      storyOutData.tier3_response = tier3Result.response_text;
    }
    await writeFile(storyOutPath, JSON.stringify(storyOutData, null, 2));

    allResults.push(storyResult);
    console.log(`${prefix} ${storyId} ... ${grade} (${composite})`);
  }

  // Write scores.json
  const scoresPath = join(OUT_DIR, "scores.json");
  await writeFile(scoresPath, JSON.stringify(allResults, null, 2));

  // Build summary
  const gradeDistribution = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const r of allResults) gradeDistribution[r.grade]++;

  const avgComposite =
    allResults.length > 0
      ? Math.round((allResults.reduce((s, r) => s + r.composite, 0) / allResults.length) * 10) / 10
      : 0;

  // Average by dimension (tier 3 only)
  const avgByDimension = {};
  const dimCounts = {};
  for (const r of allResults) {
    if (!r.dimensions) continue;
    for (const [dim, val] of Object.entries(r.dimensions)) {
      avgByDimension[dim] = (avgByDimension[dim] || 0) + val;
      dimCounts[dim] = (dimCounts[dim] || 0) + 1;
    }
  }
  for (const dim of Object.keys(avgByDimension)) {
    avgByDimension[dim] = Math.round((avgByDimension[dim] / dimCounts[dim]) * 10) / 10;
  }

  const sorted = [...allResults].sort((a, b) => b.composite - a.composite);
  const top5 = sorted.slice(0, 5).map((r) => ({ storyId: r.storyId, composite: r.composite, grade: r.grade }));
  const bottom5 = sorted.slice(-5).reverse().map((r) => ({ storyId: r.storyId, composite: r.composite, grade: r.grade }));

  const summary = {
    timestamp: new Date().toISOString(),
    totalGraded: allResults.length,
    gradeDistribution,
    avgComposite,
    avgByDimension,
    top5,
    bottom5,
  };

  await writeFile(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  // Write suggestions.json if --suggestions enabled
  if (ENABLE_SUGGESTIONS) {
    const suggestionsData = allResults
      .filter((r) => r.suggestions && r.suggestions.length > 0)
      .map((r) => ({
        storyId: r.storyId,
        componentTier: r.componentTier,
        grade: r.grade,
        composite: r.composite,
        suggestions: r.suggestions,
      }));
    await writeFile(join(OUT_DIR, "suggestions.json"), JSON.stringify(suggestionsData, null, 2));
    console.log(`\nSuggestions extracted for ${suggestionsData.length} stories.`);
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log(
    `Grade Distribution: S:${gradeDistribution.S}  A:${gradeDistribution.A}  B:${gradeDistribution.B}  C:${gradeDistribution.C}  D:${gradeDistribution.D}`
  );
  console.log(`Average Composite:  ${avgComposite}`);
  if (top5.length > 0) {
    console.log(`Top 5:    ${top5.map((r) => `${r.storyId} (${r.grade} ${r.composite})`).join(", ")}`);
  }
  if (bottom5.length > 0) {
    console.log(`Bottom 5: ${bottom5.map((r) => `${r.storyId} (${r.grade} ${r.composite})`).join(", ")}`);
  }
  console.log("=".repeat(60));
  console.log(`\nResults written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
