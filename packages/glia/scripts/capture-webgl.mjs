#!/usr/bin/env node
/**
 * capture-webgl.mjs — Playwright-based WebGL screenshot capture for Storybook.
 *
 * Unlike agent-browser (pure headless, no GPU), this launches Chromium with
 * --use-gl=angle --use-angle=swiftshader so WebGL shaders actually render.
 *
 * Usage:
 *   node scripts/capture-webgl.mjs [options]
 *
 * Options:
 *   --url <url>         Storybook base URL (default: http://127.0.0.1:6006)
 *   --filter <pattern>  Glob-style filter on story IDs
 *   --wait <ms>         Wait time after page load for WebGL init (default: 5000)
 *   --out <dir>         Output directory (default: .visual-review/screenshots)
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    url: "http://127.0.0.1:6006",
    filter: null,
    wait: 5000,
    out: join(ROOT, ".visual-review", "screenshots"),
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--url":
        args.url = argv[++i];
        break;
      case "--filter":
        args.filter = argv[++i];
        break;
      case "--wait":
        args.wait = parseInt(argv[++i], 10) || 5000;
        break;
      case "--out":
        args.out = argv[++i];
        break;
    }
  }
  return args;
}

function matchesFilter(storyId, filter) {
  if (!filter) return true;
  const pattern = filter.replace(/\*/g, ".*");
  return new RegExp(pattern).test(storyId);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  console.log(`\n--- WebGL Screenshot Capture ---`);
  console.log(`  Storybook: ${args.url}`);
  console.log(`  Filter:    ${args.filter || "(all)"}`);
  console.log(`  Wait:      ${args.wait}ms`);
  console.log(`  Output:    ${args.out}\n`);

  // Fetch story manifest
  let manifest;
  try {
    const res = await fetch(`${args.url}/index.json`);
    manifest = await res.json();
  } catch (err) {
    console.error(`Could not fetch story manifest: ${err.message}`);
    console.error("Is Storybook running?");
    process.exit(1);
  }

  const entries = manifest.entries || manifest.stories || {};
  const stories = Object.values(entries).filter((entry) => {
    if (entry.type && entry.type !== "story") return false;
    return matchesFilter(entry.id, args.filter);
  });

  console.log(`Found ${stories.length} stories to capture\n`);
  if (stories.length === 0) {
    console.log("No stories matched. Exiting.");
    process.exit(0);
  }

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
  const errors = [];
  let processed = 0;

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const storyId = story.id;
    const storyUrl = `${args.url}/iframe.html?id=${storyId}&viewMode=story`;
    const pad = String(stories.length).length;
    const idx = String(i + 1).padStart(pad, " ");

    try {
      await page.goto(storyUrl, { waitUntil: "networkidle", timeout: 30000 });
      // Wait for WebGL shader compilation + first frames
      await page.waitForTimeout(args.wait);

      const screenshotPath = join(args.out, `${storyId}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      processed++;
      console.log(`[${idx}/${stories.length}] ${storyId} ✓`);
    } catch (err) {
      processed++;
      console.error(`[${idx}/${stories.length}] ${storyId} ✗ ${err.message}`);
      errors.push({ storyId, error: err.message });
    }
  }

  await browser.close();

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    storybookUrl: args.url,
    totalStories: stories.length,
    processed,
    errors,
    screenshotDir: args.out,
  };
  const reportDir = join(ROOT, ".visual-review");
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, "report.json"), JSON.stringify(report, null, 2));

  console.log(`\n--- Capture Complete ---`);
  console.log(`  Processed: ${processed}/${stories.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Output: ${args.out}\n`);

  process.exit(errors.length > 0 ? 1 : 0);
}

await main();
