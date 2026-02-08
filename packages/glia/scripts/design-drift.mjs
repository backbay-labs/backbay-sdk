#!/usr/bin/env node
/**
 * Design system drift detection for Glia components.
 *
 * Scans .tsx files in src/primitives/ and src/components/ for:
 *   - Color violations (light colors, unapproved hex values)
 *   - Glass compliance gaps (Panel/Card/Sidebar/Table missing backdrop-filter)
 *
 * Usage: node scripts/design-drift.mjs
 * Exit code 1 if any violations found.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GLIA_ROOT = join(__dirname, "..");
const SCAN_DIRS = [
  join(GLIA_ROOT, "src", "primitives"),
  join(GLIA_ROOT, "src", "components"),
];

// Approved dark hex values (lowercase, no #)
const APPROVED_HEX = new Set([
  "02040a", "0a0a0a",                          // near-blacks
  "22d3ee", "f43f5e", "10b981", "8b5cf6",      // neon accents (full)
  "d4a84b",                                      // gold
  "e879f9", "f472b6", "34d399", "a78bfa",      // neon gradients
  "cbd5e1", "64748b",                           // CSS var fallbacks (slate-300, slate-500)
]);

// Light Tailwind classes that violate dark theme
const LIGHT_CLASS_PATTERNS = [
  /\bbg-white\b(?!\/)/,
  /\btext-black\b/,
  /\btext-gray-\d{2,3}\b/,
  /\bbg-gray-\d{2,3}\b/,
  /\bbg-neutral-[1-4]00\b/,
  /\bbg-slate-[1-4]00\b/,
  /\bbg-zinc-[1-4]00\b/,
];

// Hardcoded hex color pattern (inline styles or template literals)
const HEX_COLOR_RE = /#([0-9a-fA-F]{6})\b/g;

// Light hex detection: any color with high luminance that isn't approved
function isLightHex(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  // Flag colors that are too bright for a dark theme (white, light grays, etc.)
  return luminance > 180;
}

// Glass-required component name fragments
const GLASS_NAMES = ["Panel", "Card", "Sidebar", "Table"];
const GLASS_RE = /backdrop-(?:blur|filter)|backdropFilter/;

async function collectTsxFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTsxFiles(fullPath)));
    } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".stories.tsx") && !entry.name.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const colorViolations = [];
  const glassGaps = [];

  for (const scanDir of SCAN_DIRS) {
    const files = await collectTsxFiles(scanDir);

    for (const filePath of files) {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");
      const relPath = relative(GLIA_ROOT, filePath);
      const name = basename(filePath, ".tsx");

      // Check color violations line by line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Skip comments and imports
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("import ")) continue;

        // Light Tailwind class violations
        for (const pattern of LIGHT_CLASS_PATTERNS) {
          const match = line.match(pattern);
          if (match) {
            colorViolations.push({
              file: relPath,
              line: lineNum,
              match: match[0],
              reason: "should use glass bg or dark-theme token",
            });
          }
        }

        // Hardcoded hex violations
        let hexMatch;
        HEX_COLOR_RE.lastIndex = 0;
        while ((hexMatch = HEX_COLOR_RE.exec(line)) !== null) {
          const hex = hexMatch[1].toLowerCase();
          if (!APPROVED_HEX.has(hex) && isLightHex(hex)) {
            colorViolations.push({
              file: relPath,
              line: lineNum,
              match: `#${hexMatch[1]}`,
              reason: "light hex not in approved palette",
            });
          }
        }
      }

      // Glass compliance check for Panel/Card/Sidebar/Table components
      const needsGlass = GLASS_NAMES.some((frag) => name.includes(frag));
      if (needsGlass && !GLASS_RE.test(content)) {
        glassGaps.push({
          file: relPath,
          reason: `Missing backdrop-filter (expected for ${name})`,
        });
      }
    }
  }

  // Print report
  console.log("Design System Drift Report");
  console.log("==========================");

  if (colorViolations.length > 0) {
    console.log("Color violations:");
    for (const v of colorViolations) {
      console.log(`  ${v.file}:${v.line} \u2014 ${v.match} (${v.reason})`);
    }
  } else {
    console.log("Color violations: none");
  }

  if (glassGaps.length > 0) {
    console.log("Glass compliance gaps:");
    for (const g of glassGaps) {
      console.log(`  ${g.file} \u2014 ${g.reason}`);
    }
  } else {
    console.log("Glass compliance gaps: none");
  }

  const violatingFiles = new Set([
    ...colorViolations.map((v) => v.file),
    ...glassGaps.map((g) => g.file),
  ]);

  console.log(`\nSummary: ${colorViolations.length} violation(s) in ${violatingFiles.size} file(s), ${glassGaps.length} glass compliance gap(s)`);

  if (colorViolations.length > 0 || glassGaps.length > 0) {
    process.exit(1);
  } else {
    console.log("Exit: PASS");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
