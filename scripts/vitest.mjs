/**
 * Vitest launcher that works around bun's esbuild binary resolution issue.
 *
 * Bun's module linker can break esbuild's native binary IPC. This script
 * copies the esbuild binary to a temp dir and sets ESBUILD_BINARY_PATH
 * so vite/vitest can find a working copy.
 */
import { spawn } from 'node:child_process';
import { chmodSync, copyFileSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function resolveEsbuildBinaryPath() {
  const esbuildMain = require.resolve('esbuild');
  return path.resolve(path.dirname(esbuildMain), '../bin/esbuild');
}

function prepareEsbuildBinaryInTmp() {
  const src = resolveEsbuildBinaryPath();
  const dir = mkdtempSync(path.join('/tmp', 'bb-sdk-esbuild-'));
  const dst = path.join(dir, 'esbuild');
  copyFileSync(src, dst);
  chmodSync(dst, 0o755);
  return dst;
}

const args = process.argv.slice(2);
const vitestCli = require.resolve('vitest/vitest.mjs');

const env = { ...process.env };
if (!env.ESBUILD_BINARY_PATH) {
  env.ESBUILD_BINARY_PATH = prepareEsbuildBinaryInTmp();
}

const child = spawn(process.execPath, [vitestCli, ...args], {
  stdio: 'inherit',
  env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
