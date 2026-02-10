#!/usr/bin/env node
/**
 * capture-cinematic.mjs — Multi-frame Playwright capture for the Clawdstrike
 * reveal cinematic animation at specific timestamps.
 *
 * Launches Chromium with SwiftShader WebGL so shaders actually render, then
 * takes a screenshot at each configured millisecond offset from page load.
 *
 * Usage:
 *   node scripts/capture-cinematic.mjs [options]
 *
 * Options:
 *   --url  <url>   Storybook base URL (default: http://127.0.0.1:6006)
 *   --wait <ms>    Initial wait before first frame capture (default: 2000)
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STORY_ID =
  "primitives-3d-fields-heroscenes-cyber-clawdstrike-reveal--clawdstrike-reveal";

const FRAME_OFFSETS_MS = [1000, 2500, 5000, 7500, 8500, 10000, 11000, 12500];

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    url: "http://127.0.0.1:6006",
    wait: 2000,
    out: join(ROOT, ".visual-review", "screenshots"),
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--url":
        args.url = argv[++i];
        break;
      case "--wait":
        args.wait = parseInt(argv[++i], 10) || 2000;
        break;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pad a millisecond value to 5 digits (e.g. 1000 -> "01000"). */
function padMs(ms) {
  return String(ms).padStart(5, "0");
}

/** Sleep for the given number of milliseconds. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  const storyUrl = `${args.url}/iframe.html?id=${STORY_ID}&viewMode=story`;

  console.log(`\n--- Cinematic Capture: Clawdstrike Reveal ---`);
  console.log(`  Storybook:     ${args.url}`);
  console.log(`  Story:         ${STORY_ID}`);
  console.log(`  Initial wait:  ${args.wait}ms`);
  console.log(`  Frames:        ${FRAME_OFFSETS_MS.length} @ [${FRAME_OFFSETS_MS.join(", ")}]ms`);
  console.log(`  Output:        ${args.out}\n`);

  mkdirSync(args.out, { recursive: true });

  // Launch Chromium with WebGL support via SwiftShader
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const captured = [];
  const errors = [];

  try {
    console.log(`Navigating to story...`);
    await page.goto(storyUrl, { waitUntil: "networkidle", timeout: 30000 });

    // Initial wait for WebGL context + shader compilation
    console.log(`Waiting ${args.wait}ms for WebGL initialisation...\n`);
    await sleep(args.wait);

    // Record the baseline time — all frame offsets are relative to this point
    const t0 = Date.now();

    for (const offsetMs of FRAME_OFFSETS_MS) {
      const elapsed = Date.now() - t0;
      const remaining = offsetMs - elapsed;

      if (remaining > 0) {
        await sleep(remaining);
      }

      const filename = `clawdstrike-reveal-t${padMs(offsetMs)}.png`;
      const filepath = join(args.out, filename);

      try {
        await page.screenshot({ path: filepath, fullPage: false });
        const actualMs = Date.now() - t0;
        captured.push({ offset: offsetMs, actualMs, filename });
        console.log(`  [t=${padMs(offsetMs)}] captured -> ${filename} (actual ${actualMs}ms)`);
      } catch (err) {
        console.error(`  [t=${padMs(offsetMs)}] FAILED: ${err.message}`);
        errors.push({ offset: offsetMs, error: err.message });
      }
    }
  } catch (err) {
    console.error(`Fatal error: ${err.message}`);
    errors.push({ offset: null, error: err.message });
  }

  await browser.close();

  // Write manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    storyId: STORY_ID,
    storyUrl,
    storybookUrl: args.url,
    initialWait: args.wait,
    frameOffsets: FRAME_OFFSETS_MS,
    captured,
    errors,
    screenshotDir: args.out,
  };

  const manifestPath = join(args.out, "clawdstrike-cinematic-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n--- Cinematic Capture Complete ---`);
  console.log(`  Captured: ${captured.length}/${FRAME_OFFSETS_MS.length} frames`);
  console.log(`  Errors:   ${errors.length}`);
  console.log(`  Manifest: ${manifestPath}`);
  console.log(`  Output:   ${args.out}\n`);

  process.exit(errors.length > 0 ? 1 : 0);
}

await main();
