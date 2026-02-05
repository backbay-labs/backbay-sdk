import { spawn } from "node:child_process";
import { chmodSync, copyFileSync, mkdtempSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function resolveTmpDir() {
  if (process.platform === "win32") {
    const os = require("node:os");
    return os.tmpdir();
  }
  return "/tmp";
}

function resolveEsbuildBinaryPath() {
  const esbuildMain = require.resolve("esbuild");
  // esbuildMain: .../node_modules/esbuild/lib/main.js
  return path.resolve(path.dirname(esbuildMain), "../bin/esbuild");
}

function resolveVitestCliPath() {
  return require.resolve("vitest/vitest.mjs");
}

function prepareEsbuildBinaryInTmp() {
  const src = resolveEsbuildBinaryPath();
  const dir = mkdtempSync(path.join(resolveTmpDir(), "bb-ui-esbuild-"));
  const dst = path.join(dir, "esbuild");
  copyFileSync(src, dst);
  chmodSync(dst, 0o755);
  return dst;
}

async function main() {
  const args = process.argv.slice(2);
  const vitestCli = resolveVitestCliPath();

  const env = { ...process.env };
  if (!env.ESBUILD_BINARY_PATH) {
    env.ESBUILD_BINARY_PATH = prepareEsbuildBinaryInTmp();
  }

  const child = spawn(process.execPath, [vitestCli, ...args], {
    stdio: "inherit",
    env,
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

await main();
