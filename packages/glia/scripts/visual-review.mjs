/**
 * Visual review script for Glia Storybook.
 *
 * Uses `agent-browser` to visit each story's iframe URL, capture a screenshot
 * and an accessibility snapshot, and write results to .visual-review/.
 *
 * Usage:
 *   node scripts/visual-review.mjs [options]
 *
 * Options:
 *   --url <url>            Storybook base URL (default: http://127.0.0.1:6006)
 *   --filter <pattern>     Glob/regex filter on story IDs
 *   --headed               Show browser window (not yet supported by agent-browser)
 *   --out <dir>            Output directory (default: .visual-review)
 *   --ci                   Build Storybook first, serve on random port, then run
 *   --concurrency <n>      Parallel stories (default: 1)
 *   --snapshot-only        Skip screenshots, only capture a11y snapshots
 *   --screenshot-only      Skip a11y snapshots, only capture screenshots
 *   --wait <ms>            Wait time after page load (default: 2000)
 *   --multi-frame <n>      Capture n frames per story (default: 1)
 */

import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const STATIC_DIR = join(ROOT, "storybook-static");
const AGENT_BROWSER = "/opt/homebrew/bin/agent-browser";
const SESSION = "glia-visual";

// Stories excluded from visual review (same as test-runner !test tag)
const EXCLUDED_STORY_IDS = new Set([
  "primitives-three-ambientfield--with-anchors",
  "primitives-three-crystallineorganism--all-geometries",
  "components-clusterhero--all-clusters",
  "components-clusterheropage--all-clusters-preview",
]);

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    url: "http://127.0.0.1:6006",
    filter: null,
    headed: false,
    out: join(ROOT, ".visual-review"),
    ci: false,
    concurrency: 1,
    snapshotOnly: false,
    screenshotOnly: false,
    wait: 2000,
    multiFrame: 1,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--url":
        args.url = argv[++i];
        break;
      case "--filter":
        args.filter = argv[++i];
        break;
      case "--headed":
        args.headed = true;
        break;
      case "--out":
        args.out = argv[++i];
        break;
      case "--ci":
        args.ci = true;
        break;
      case "--concurrency":
        args.concurrency = parseInt(argv[++i], 10) || 1;
        break;
      case "--snapshot-only":
        args.snapshotOnly = true;
        break;
      case "--screenshot-only":
        args.screenshotOnly = true;
        break;
      case "--wait":
        args.wait = parseInt(argv[++i], 10) || 2000;
        break;
      case "--multi-frame":
        args.multiFrame = parseInt(argv[++i], 10) || 1;
        break;
      default:
        console.warn(`Unknown option: ${argv[i]}`);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

/** Run agent-browser and capture stdout */
function agentBrowser(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(AGENT_BROWSER, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks = [];
    const errChunks = [];
    child.stdout.on("data", (d) => chunks.push(d));
    child.stderr.on("data", (d) => errChunks.push(d));
    child.on("error", reject);
    child.on("exit", (code) => {
      const stdout = Buffer.concat(chunks).toString("utf-8");
      const stderr = Buffer.concat(errChunks).toString("utf-8");
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

/** Run agent-browser silently (discard output, just check exit code) */
async function agentBrowserExec(args) {
  const { code, stderr } = await agentBrowser(args);
  if (code !== 0) {
    throw new Error(`agent-browser ${args.join(" ")} failed (${code}): ${stderr}`);
  }
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = join(STATIC_DIR, req.url === "/" ? "index.html" : req.url);
      filePath = filePath.split("?")[0];

      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        filePath = join(filePath, "index.html");
      }
      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      createReadStream(filePath).pipe(res);
    });

    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function matchesFilter(storyId, filter) {
  if (!filter) return true;
  // Support glob-style * as regex .*
  const pattern = filter.replace(/\*/g, ".*");
  return new RegExp(pattern).test(storyId);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  let baseUrl = args.url;
  let server = null;

  // CI mode: build Storybook and start static server
  if (args.ci) {
    console.log("\n--- Building Storybook ---\n");
    const buildCode = await run("node", ["scripts/storybook.mjs", "build"], {
      cwd: ROOT,
    });
    if (buildCode !== 0) {
      console.error("Storybook build failed");
      process.exit(buildCode);
    }
    if (!existsSync(join(STATIC_DIR, "index.html"))) {
      console.error("Build output not found at", STATIC_DIR);
      process.exit(1);
    }

    console.log("\n--- Starting static server ---\n");
    const srv = await startStaticServer();
    server = srv.server;
    baseUrl = `http://127.0.0.1:${srv.port}`;
    console.log(`Serving storybook-static at ${baseUrl}`);
  }

  // Fetch story manifest
  console.log(`\n--- Fetching story manifest from ${baseUrl}/index.json ---\n`);
  let manifest;
  try {
    manifest = await fetchJSON(`${baseUrl}/index.json`);
  } catch (err) {
    console.error(`Could not fetch story manifest: ${err.message}`);
    console.error("Is Storybook running? Start it with: npm run storybook");
    if (server) server.close();
    process.exit(1);
  }

  // Extract story entries (v5 format: { v: 5, entries: { ... } })
  const entries = manifest.entries || manifest.stories || {};
  const stories = Object.values(entries).filter((entry) => {
    if (entry.type && entry.type !== "story") return false;
    if (EXCLUDED_STORY_IDS.has(entry.id)) return false;
    if (entry.tags && entry.tags.includes("!test")) return false;
    return matchesFilter(entry.id, args.filter);
  });

  console.log(`Found ${stories.length} stories to process\n`);

  if (stories.length === 0) {
    console.log("No stories matched. Exiting.");
    if (server) server.close();
    process.exit(0);
  }

  // Create output directories
  const screenshotDir = join(args.out, "screenshots");
  const snapshotDir = join(args.out, "snapshots");
  if (!args.snapshotOnly) mkdirSync(screenshotDir, { recursive: true });
  if (!args.screenshotOnly) mkdirSync(snapshotDir, { recursive: true });

  const errors = [];
  let processed = 0;
  const multiFrameStories = [];

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const storyId = story.id;
    const storyUrl = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story`;

    // Determine frame count: use CLI --multi-frame if >1, or auto-detect
    // stories tagged !static-grade (animated components that need multi-frame)
    const hasAnimationTag =
      story.tags && story.tags.includes("!static-grade");
    const frameCount =
      args.multiFrame > 1
        ? args.multiFrame
        : hasAnimationTag
          ? 3
          : 1;
    const isMultiFrame = frameCount > 1;

    try {
      // Navigate to story
      await agentBrowserExec(["open", storyUrl, "--session", SESSION]);

      // Wait for initial load
      await agentBrowserExec(["wait", String(args.wait), "--session", SESSION]);

      if (!args.snapshotOnly) {
        if (isMultiFrame) {
          // Multi-frame capture: take frameCount screenshots at 1s intervals
          for (let f = 0; f < frameCount; f++) {
            if (f > 0) {
              await agentBrowserExec(["wait", "1000", "--session", SESSION]);
            }
            const framePath = join(screenshotDir, `${storyId}_frame${f}.png`);
            await agentBrowserExec([
              "screenshot",
              framePath,
              "--full",
              "--session",
              SESSION,
            ]);
          }
          // Copy last frame as the main screenshot for backward compat
          const lastFrame = join(screenshotDir, `${storyId}_frame${frameCount - 1}.png`);
          const mainShot = join(screenshotDir, `${storyId}.png`);
          copyFileSync(lastFrame, mainShot);
          multiFrameStories.push(storyId);
        } else {
          // Single-frame capture
          const screenshotPath = join(screenshotDir, `${storyId}.png`);
          await agentBrowserExec([
            "screenshot",
            screenshotPath,
            "--full",
            "--session",
            SESSION,
          ]);
        }
      }

      // Accessibility snapshot (once, after final wait)
      if (!args.screenshotOnly) {
        const { code, stdout, stderr } = await agentBrowser([
          "snapshot",
          "--json",
          "--session",
          SESSION,
        ]);
        if (code !== 0) {
          throw new Error(`snapshot failed: ${stderr}`);
        }
        const snapshotPath = join(snapshotDir, `${storyId}.json`);
        writeFileSync(snapshotPath, stdout, "utf-8");
      }

      processed++;
      const pad = String(stories.length).length;
      const idx = String(i + 1).padStart(pad, " ");
      const suffix = isMultiFrame ? ` (${frameCount} frames)` : "";
      console.log(`[${idx}/${stories.length}] ${storyId} ✓${suffix}`);
    } catch (err) {
      processed++;
      const pad = String(stories.length).length;
      const idx = String(i + 1).padStart(pad, " ");
      console.error(`[${idx}/${stories.length}] ${storyId} ✗ ${err.message}`);
      errors.push({ storyId, error: err.message });
    }
  }

  // Close session
  try {
    await agentBrowser(["close", "--session", SESSION]);
  } catch {
    // Session may already be closed
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    storybookUrl: baseUrl,
    totalStories: stories.length,
    processed,
    errors,
    screenshotDir: args.snapshotOnly ? null : "screenshots/",
    snapshotDir: args.screenshotOnly ? null : "snapshots/",
    multiFrameStories,
  };
  writeFileSync(join(args.out, "report.json"), JSON.stringify(report, null, 2), "utf-8");

  // Summary
  console.log(`\n--- Visual Review Complete ---`);
  console.log(`  Stories processed: ${processed}/${stories.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Output: ${args.out}`);
  console.log(`  Report: ${join(args.out, "report.json")}\n`);

  if (server) server.close();
  process.exit(errors.length > 0 ? 1 : 0);
}

await main();
