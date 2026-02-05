import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { webcrypto } from 'node:crypto';

import { SpeakeasyAuth } from '../../src/speakeasy/auth/SpeakeasyAuth.js';
import { createInMemorySpeakeasyStorage } from '../../src/speakeasy/auth/storage.js';
import type { Challenge, GestureSequence } from '../../src/speakeasy/types.js';

beforeAll(() => {
  const hasSubtle = typeof globalThis.crypto !== 'undefined' && !!globalThis.crypto.subtle;
  if (!hasSubtle) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
  }
});

describe('SpeakeasyAuth', () => {
  beforeEach(() => {
    // isolate storage per test
  });

  it('registers and verifies a gesture sequence', async () => {
    const storage = createInMemorySpeakeasyStorage();
    const auth = new SpeakeasyAuth({ storage, domain: 'https://example.com', deviceSecret: 'test-secret' });

    const gesture: GestureSequence = {
      steps: [
        { type: 'tap', count: 2, region: 'center' },
        { type: 'hold', durationMs: 550, region: 'edge' },
      ],
      totalDurationMs: 900,
      rhythmHash: 'abcd',
      timestamp: Date.now(),
    };

    const verifier = await auth.registerGesture(gesture);
    expect(verifier.version).toBe(1);
    expect(verifier.domain).toBe('https://example.com');
    expect(verifier.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(verifier.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(await auth.isRegistered()).toBe(true);

    const challenge: Challenge = {
      nonce: 'a'.repeat(64),
      salt: 'b'.repeat(32),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    };

    const ok = await auth.verifyGesture(gesture, challenge);
    expect(ok.ok).toBe(true);
    expect(ok.response).toMatch(/^[0-9a-f]{64}$/);

    const wrong: GestureSequence = {
      ...gesture,
      steps: [
        { type: 'tap', count: 2, region: 'edge' }, // changed region
        { type: 'hold', durationMs: 550, region: 'edge' },
      ],
    };

    const bad = await auth.verifyGesture(wrong, challenge);
    expect(bad.ok).toBe(false);
    expect(bad.reason).toBe('invalid_gesture');
  });

  it('fails verification on domain mismatch', async () => {
    const storage = createInMemorySpeakeasyStorage();
    const authA = new SpeakeasyAuth({ storage, domain: 'https://a.example', deviceSecret: 'test-secret' });
    const authB = new SpeakeasyAuth({ storage, domain: 'https://b.example', deviceSecret: 'test-secret' });

    const gesture: GestureSequence = {
      steps: [{ type: 'tap', count: 1, region: 'center' }],
      totalDurationMs: 120,
      rhythmHash: '00',
      timestamp: Date.now(),
    };

    await authA.registerGesture(gesture);

    const challenge: Challenge = {
      nonce: 'a'.repeat(64),
      salt: 'b'.repeat(32),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    };

    const result = await authB.verifyGesture(gesture, challenge);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('domain_mismatch');
  });
});

