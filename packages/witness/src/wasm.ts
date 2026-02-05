/**
 * WASM module loader
 */

import type { CyntraTrustWasm } from './types';

let wasmInstance: CyntraTrustWasm | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the WASM module.
 * Must be called before any verification functions.
 * Safe to call multiple times - subsequent calls return immediately.
 *
 * @example
 * ```ts
 * import { initWasm } from '@backbay/witness';
 * await initWasm();
 * ```
 */
export async function initWasm(): Promise<void> {
  if (wasmInstance) return;

  // Prevent multiple parallel initializations
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      // Dynamic import for tree-shaking
      const wasm = await import('../wasm/cyntra_trust_wasm.js');
      try {
        // Browser-style init (uses fetch on the wasm URL).
        await wasm.default();
      } catch (error) {
        // Node/Vitest fallback: wasm-bindgen's default init uses fetch(URL), which may not
        // support file: URLs in some runtimes. If fetch-based init fails, load the wasm bytes
        // directly from disk and pass them to the init function.
        const isNode =
          typeof process !== 'undefined' &&
          typeof process.versions === 'object' &&
          !!process.versions?.node;

        if (!isNode) {
          throw error;
        }

        const { readFile } = await import('node:fs/promises');
        const { fileURLToPath } = await import('node:url');

        const wasmPath = fileURLToPath(
          new URL('../wasm/cyntra_trust_wasm_bg.wasm', import.meta.url),
        );
        const wasmBytes = await readFile(wasmPath);

        await wasm.default(wasmBytes);
      }
      wasmInstance = wasm as unknown as CyntraTrustWasm;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  await initPromise;
}

/**
 * Check if WASM is initialized
 */
export function isWasmInitialized(): boolean {
  return wasmInstance !== null;
}

/**
 * Get the initialized WASM instance.
 * Throws if initWasm() hasn't been called.
 *
 * @internal
 */
export function getWasm(): CyntraTrustWasm {
  if (!wasmInstance) {
    throw new Error(
      '@backbay/witness: WASM not initialized. Call initWasm() first.',
    );
  }
  return wasmInstance;
}

/**
 * Get WASM module version
 */
export function getWasmVersion(): string {
  return getWasm().version();
}
