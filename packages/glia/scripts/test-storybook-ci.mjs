/**
 * CI script for Storybook test runner.
 *
 * 1. Builds Storybook to storybook-static/
 * 2. Starts an HTTP server on a free port
 * 3. Runs @storybook/test-runner against that server
 * 4. Exits with the test-runner exit code
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const STATIC_DIR = join(ROOT, "storybook-static");

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

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = join(STATIC_DIR, req.url === "/" ? "index.html" : req.url);
      // Strip query strings
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

async function main() {
  // Step 1: Build Storybook
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

  // Step 2: Serve built Storybook
  console.log("\n--- Starting static server ---\n");
  const { server, port } = await startStaticServer();
  const url = `http://127.0.0.1:${port}`;
  console.log(`Serving storybook-static at ${url}`);

  // Step 3: Run tests
  console.log("\n--- Running Storybook tests ---\n");
  let testCode;
  try {
    testCode = await run(
      "npx",
      ["test-storybook", "--url", url, "--ci"],
      { cwd: ROOT }
    );
  } finally {
    server.close();
  }

  process.exit(testCode);
}

await main();
