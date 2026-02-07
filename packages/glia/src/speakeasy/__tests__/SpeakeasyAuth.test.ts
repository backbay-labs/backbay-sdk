/**
 * Tests for SpeakeasyAuth registration and verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SpeakeasyAuth,
  fingerprintGestureSequence,
} from '../auth/SpeakeasyAuth.js';
import { createInMemorySpeakeasyStorage } from '../auth/storage.js';
import type { Challenge, GestureSequence } from '../types.js';

function createGesture(steps: GestureSequence['steps'] = []): GestureSequence {
  return {
    steps: steps.length > 0 ? steps : [{ type: 'tap', count: 3, region: 'center' }],
    totalDurationMs: 1000,
    rhythmHash: 'test-rhythm-hash',
    timestamp: Date.now(),
  };
}

function createChallenge(): Challenge {
  return {
    nonce: 'a'.repeat(64),
    salt: 'b'.repeat(32),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 30_000,
  };
}

describe('SpeakeasyAuth', () => {
  let auth: SpeakeasyAuth;
  let storage: ReturnType<typeof createInMemorySpeakeasyStorage>;

  beforeEach(() => {
    storage = createInMemorySpeakeasyStorage();
    auth = new SpeakeasyAuth({
      storage,
      domain: 'https://test.local',
      deviceSecret: 'test-device-secret',
    });
  });

  describe('registration', () => {
    it('starts unregistered', async () => {
      expect(await auth.isRegistered()).toBe(false);
      expect(await auth.getVerifier()).toBeNull();
    });

    it('registers gesture and stores verifier', async () => {
      const gesture = createGesture();
      const verifier = await auth.registerGesture(gesture);

      expect(verifier).toBeDefined();
      expect(verifier.hash).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
      expect(verifier.salt).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(verifier.domain).toBe('https://test.local');
      expect(verifier.version).toBe(1);

      expect(await auth.isRegistered()).toBe(true);
    });

    it('overwrites previous registration', async () => {
      const gesture1 = createGesture([{ type: 'tap', count: 1, region: 'center' }]);
      const gesture2 = createGesture([{ type: 'tap', count: 2, region: 'center' }]);

      const verifier1 = await auth.registerGesture(gesture1);
      const verifier2 = await auth.registerGesture(gesture2);

      // Different gestures should produce different verifiers
      expect(verifier1.hash).not.toBe(verifier2.hash);

      // Only latest should be stored
      const stored = await auth.getVerifier();
      expect(stored?.hash).toBe(verifier2.hash);
    });
  });

  describe('clear()', () => {
    it('removes verifier', async () => {
      await auth.registerGesture(createGesture());
      expect(await auth.isRegistered()).toBe(true);

      await auth.clear();
      expect(await auth.isRegistered()).toBe(false);
    });
  });

  describe('verification', () => {
    it('returns not_registered when no verifier exists', async () => {
      const result = await auth.verifyGesture(createGesture(), createChallenge());
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('not_registered');
    });

    it('verifies correct gesture', async () => {
      const gesture = createGesture();
      await auth.registerGesture(gesture);

      const result = await auth.verifyGesture(gesture, createChallenge());
      expect(result.ok).toBe(true);
      expect(result.response).toHaveLength(64); // HMAC-SHA256
    });

    it('rejects incorrect gesture', async () => {
      const correctGesture = createGesture([{ type: 'tap', count: 3, region: 'center' }]);
      const wrongGesture = createGesture([{ type: 'tap', count: 5, region: 'center' }]);

      await auth.registerGesture(correctGesture);

      const result = await auth.verifyGesture(wrongGesture, createChallenge());
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid_gesture');
    });

    it('produces different responses for different challenges', async () => {
      const gesture = createGesture();
      await auth.registerGesture(gesture);

      const challenge1 = createChallenge();
      const challenge2 = { ...createChallenge(), nonce: 'c'.repeat(64) };

      const result1 = await auth.verifyGesture(gesture, challenge1);
      const result2 = await auth.verifyGesture(gesture, challenge2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result1.response).not.toBe(result2.response);
    });

    it('rejects domain mismatch', async () => {
      // Register with different domain
      const otherAuth = new SpeakeasyAuth({
        storage,
        domain: 'https://other.local',
        deviceSecret: 'test-device-secret',
      });
      await otherAuth.registerGesture(createGesture());

      // Try to verify from original domain
      const result = await auth.verifyGesture(createGesture(), createChallenge());
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('domain_mismatch');
    });
  });

  describe('computeResponse()', () => {
    it('throws when not registered', async () => {
      await expect(auth.computeResponse(createGesture(), createChallenge())).rejects.toThrow(
        '[Speakeasy] Not registered'
      );
    });

    it('produces deterministic response for same inputs', async () => {
      const gesture = createGesture();
      const challenge = createChallenge();
      await auth.registerGesture(gesture);

      const response1 = await auth.computeResponse(gesture, challenge);
      const response2 = await auth.computeResponse(gesture, challenge);

      expect(response1).toBe(response2);
    });
  });

  describe('domain binding', () => {
    it('throws when no domain provided in non-browser environment', () => {
      // Ensure globalThis.location is not set (non-browser)
      const origLocation = globalThis.location;
      delete (globalThis as Record<string, unknown>).location;

      try {
        expect(() => {
          new SpeakeasyAuth({
            storage: createInMemorySpeakeasyStorage(),
            deviceSecret: 'test-device-secret',
            // no domain provided
          });
        }).toThrow('SpeakeasyAuth: domain must be explicitly provided in non-browser environments');
      } finally {
        if (origLocation !== undefined) {
          (globalThis as Record<string, unknown>).location = origLocation;
        }
      }
    });

    it('uses explicit domain when provided', () => {
      const auth = new SpeakeasyAuth({
        storage: createInMemorySpeakeasyStorage(),
        domain: 'https://explicit.local',
        deviceSecret: 'test-device-secret',
      });
      // Should not throw
      expect(auth).toBeDefined();
    });
  });

  describe('device secret binding', () => {
    it('different device secrets produce different verifiers', async () => {
      const gesture = createGesture();

      const auth1 = new SpeakeasyAuth({
        storage: createInMemorySpeakeasyStorage(),
        domain: 'https://test.local',
        deviceSecret: 'secret-1',
      });
      const auth2 = new SpeakeasyAuth({
        storage: createInMemorySpeakeasyStorage(),
        domain: 'https://test.local',
        deviceSecret: 'secret-2',
      });

      const verifier1 = await auth1.registerGesture(gesture);
      const verifier2 = await auth2.registerGesture(gesture);

      expect(verifier1.hash).not.toBe(verifier2.hash);
    });

    it('verification fails with wrong device secret', async () => {
      const gesture = createGesture();

      // Register with one device secret
      const authRegister = new SpeakeasyAuth({
        storage,
        domain: 'https://test.local',
        deviceSecret: 'correct-secret',
      });
      await authRegister.registerGesture(gesture);

      // Try to verify with different device secret
      const authVerify = new SpeakeasyAuth({
        storage,
        domain: 'https://test.local',
        deviceSecret: 'wrong-secret',
      });

      const result = await authVerify.verifyGesture(gesture, createChallenge());
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid_gesture');
    });
  });
});

describe('fingerprintGestureSequence', () => {
  it('produces deterministic fingerprint', () => {
    const gesture = createGesture([
      { type: 'tap', count: 3, region: 'center' },
      { type: 'hold', durationMs: 500, region: 'edge' },
    ]);

    const fp1 = fingerprintGestureSequence(gesture);
    const fp2 = fingerprintGestureSequence(gesture);

    expect(fp1).toBe(fp2);
  });

  it('different gestures produce different fingerprints', () => {
    const gesture1 = createGesture([{ type: 'tap', count: 3, region: 'center' }]);
    const gesture2 = createGesture([{ type: 'tap', count: 4, region: 'center' }]);

    const fp1 = fingerprintGestureSequence(gesture1);
    const fp2 = fingerprintGestureSequence(gesture2);

    expect(fp1).not.toBe(fp2);
  });

  it('buckets hold duration to 50ms', () => {
    // 510 and 515 both round to 500
    const gesture1 = createGesture([{ type: 'hold', durationMs: 510, region: 'center' }]);
    const gesture2 = createGesture([{ type: 'hold', durationMs: 515, region: 'center' }]);

    // Both should bucket to 500ms
    const fp1 = fingerprintGestureSequence(gesture1);
    const fp2 = fingerprintGestureSequence(gesture2);

    expect(fp1).toBe(fp2);
    expect(fp1).toContain('hold:500:');
  });
});
