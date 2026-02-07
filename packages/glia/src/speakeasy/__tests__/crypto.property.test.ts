/**
 * Property-based tests for speakeasy crypto utilities using fast-check.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  bytesToHex,
  hexToBytes,
  hmacSha256,
  sha256,
  timingSafeEqual,
} from '../auth/crypto.js';

describe('crypto property-based tests', () => {
  it('hexToBytes(bytesToHex(x)) roundtrips for all byte arrays', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 0, maxLength: 256 }),
        (bytes) => {
          const hex = bytesToHex(bytes);
          const roundtripped = hexToBytes(hex);
          expect(roundtripped).toEqual(bytes);
        }
      )
    );
  });

  it('bytesToHex produces only lowercase hex characters', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 128 }),
        (bytes) => {
          const hex = bytesToHex(bytes);
          expect(hex).toMatch(/^[0-9a-f]*$/);
          expect(hex.length).toBe(bytes.length * 2);
        }
      )
    );
  });

  it('timingSafeEqual is reflexive', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 0, maxLength: 64 }),
        (bytes) => {
          expect(timingSafeEqual(bytes, bytes)).toBe(true);
        }
      )
    );
  });

  it('timingSafeEqual is symmetric', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 64 }),
        fc.uint8Array({ minLength: 1, maxLength: 64 }),
        (a, b) => {
          expect(timingSafeEqual(a, b)).toBe(timingSafeEqual(b, a));
        }
      )
    );
  });

  it('timingSafeEqual returns false for arrays with different lengths', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 32 }),
        fc.uint8Array({ minLength: 1, maxLength: 32 }),
        (a, b) => {
          if (a.length !== b.length) {
            expect(timingSafeEqual(a, b)).toBe(false);
          }
        }
      )
    );
  });

  it('SHA-256 always produces 32 bytes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 0, maxLength: 1024 }),
        async (bytes) => {
          const hash = await sha256(bytes);
          expect(hash.length).toBe(32);
        }
      )
    );
  });

  it('SHA-256 is deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 0, maxLength: 512 }),
        async (bytes) => {
          const hash1 = await sha256(bytes);
          const hash2 = await sha256(bytes);
          expect(timingSafeEqual(hash1, hash2)).toBe(true);
        }
      )
    );
  });

  it('HMAC-SHA-256 always produces 32 bytes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1, maxLength: 64 }),
        fc.uint8Array({ minLength: 0, maxLength: 256 }),
        async (key, msg) => {
          const mac = await hmacSha256(key, msg);
          expect(mac.length).toBe(32);
        }
      )
    );
  });

  it('HMAC-SHA-256 produces different output for different keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1, maxLength: 64 }),
        fc.uint8Array({ minLength: 1, maxLength: 64 }),
        fc.uint8Array({ minLength: 1, maxLength: 256 }),
        async (key1, key2, msg) => {
          // Skip when keys are equal
          if (timingSafeEqual(key1, key2)) return;

          const mac1 = await hmacSha256(key1, msg);
          const mac2 = await hmacSha256(key2, msg);
          expect(timingSafeEqual(mac1, mac2)).toBe(false);
        }
      )
    );
  });

  it('HMAC-SHA-256 is deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1, maxLength: 64 }),
        fc.uint8Array({ minLength: 0, maxLength: 256 }),
        async (key, msg) => {
          const mac1 = await hmacSha256(key, msg);
          const mac2 = await hmacSha256(key, msg);
          expect(timingSafeEqual(mac1, mac2)).toBe(true);
        }
      )
    );
  });
});
