import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getCanonicalJson, hashReceipt, initWasm } from '../index';

describe.skip('receiptHash conformance (WASM)', () => {
  beforeAll(async () => {
    await initWasm();
  });

  it('matches the shared v2 receiptHash vector', () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const repoRoot = path.resolve(__dirname, '../../../..');

    const vector = JSON.parse(
      readFileSync(
        path.join(repoRoot, 'docs/architecture/test-vectors/run-receipt-v2.vector.json'),
        'utf-8',
      ),
    );
    const expected = JSON.parse(
      readFileSync(
        path.join(repoRoot, 'docs/architecture/test-vectors/run-receipt-v2.expected.json'),
        'utf-8',
      ),
    );

    const canonical = getCanonicalJson(vector);
    expect(canonical).toBe(expected.canonical_json);

    const receiptHash = hashReceipt(vector, 'sha256');
    expect(receiptHash).toBe(expected.receipt_hash_sha256);
  });
});

