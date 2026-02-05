import { spawn } from "node:child_process";
import { chmodSync, copyFileSync, mkdtempSync, readFileSync } from "node:fs";
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
  return path.resolve(path.dirname(esbuildMain), "../bin/esbuild");
}

function resolveStorybookCliPath() {
  const pkgPath = require.resolve("storybook/package.json");
  const pkgDir = path.dirname(pkgPath);
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.storybook ?? pkg.bin?.["storybook"];
  if (typeof bin !== "string" || !bin) {
    throw new Error("Could not resolve Storybook CLI path from storybook/package.json");
  }
  return path.resolve(pkgDir, bin);
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
  const storybookCli = resolveStorybookCliPath();

  const env = { ...process.env };
  if (!env.ESBUILD_BINARY_PATH) {
    env.ESBUILD_BINARY_PATH = prepareEsbuildBinaryInTmp();
  }

  const child = spawn(process.execPath, [storybookCli, ...args], {
    stdio: "inherit",
    env,
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

await main();
