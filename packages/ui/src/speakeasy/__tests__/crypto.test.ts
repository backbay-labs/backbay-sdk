/**
 * Tests for speakeasy crypto utilities
 */

import { describe, it, expect } from 'vitest';
import {
  bytesToHex,
  concatBytes,
  hexToBytes,
  hmacSha256,
  randomHex,
  sha256,
  timingSafeEqual,
  utf8ToBytes,
} from '../auth/crypto.js';

describe('crypto utilities', () => {
  describe('utf8ToBytes', () => {
    it('encodes ASCII string', () => {
      const bytes = utf8ToBytes('hello');
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(5);
      expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
    });

    it('encodes empty string', () => {
      const bytes = utf8ToBytes('');
      expect(bytes.length).toBe(0);
    });

    it('encodes unicode string', () => {
      const bytes = utf8ToBytes('こんにちは');
      expect(bytes.length).toBeGreaterThan(5); // Each char is 3 bytes in UTF-8
    });
  });

  describe('bytesToHex / hexToBytes', () => {
    it('roundtrips correctly', () => {
      const original = new Uint8Array([0, 127, 255, 16, 32]);
      const hex = bytesToHex(original);
      const restored = hexToBytes(hex);
      expect(Array.from(restored)).toEqual(Array.from(original));
    });

    it('produces lowercase hex', () => {
      const bytes = new Uint8Array([255, 171, 205]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('ffabcd');
    });

    it('handles empty array', () => {
      const bytes = new Uint8Array([]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('');
      expect(hexToBytes(hex).length).toBe(0);
    });

    it('hexToBytes rejects invalid hex', () => {
      expect(() => hexToBytes('xyz')).toThrow('[Speakeasy] Invalid hex');
      expect(() => hexToBytes('abc')).toThrow('[Speakeasy] Invalid hex'); // Odd length
    });

    it('hexToBytes strips 0x prefix', () => {
      const bytes = hexToBytes('0xabcd');
      expect(Array.from(bytes)).toEqual([171, 205]);
    });
  });

  describe('concatBytes', () => {
    it('concatenates multiple arrays', () => {
      const a = new Uint8Array([1, 2]);
      const b = new Uint8Array([3, 4, 5]);
      const c = new Uint8Array([6]);
      const result = concatBytes(a, b, c);
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('handles empty arrays', () => {
      const a = new Uint8Array([]);
      const b = new Uint8Array([1, 2]);
      const result = concatBytes(a, b);
      expect(Array.from(result)).toEqual([1, 2]);
    });

    it('handles no arguments', () => {
      const result = concatBytes();
      expect(result.length).toBe(0);
    });
  });

  describe('randomHex', () => {
    it('generates correct length', () => {
      const hex16 = randomHex(16);
      expect(hex16.length).toBe(32); // 16 bytes = 32 hex chars

      const hex32 = randomHex(32);
      expect(hex32.length).toBe(64);
    });

    it('generates different values each time', () => {
      const a = randomHex(16);
      const b = randomHex(16);
      expect(a).not.toBe(b);
    });

    it('produces valid hex', () => {
      const hex = randomHex(8);
      expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
    });
  });

  describe('timingSafeEqual', () => {
    it('returns true for equal arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);
      expect(timingSafeEqual(a, b)).toBe(true);
    });

    it('returns false for different arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 5]);
      expect(timingSafeEqual(a, b)).toBe(false);
    });

    it('returns false for different lengths', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);
      expect(timingSafeEqual(a, b)).toBe(false);
    });

    it('returns true for empty arrays', () => {
      const a = new Uint8Array([]);
      const b = new Uint8Array([]);
      expect(timingSafeEqual(a, b)).toBe(true);
    });
  });

  describe('sha256', () => {
    it('produces 32-byte hash', async () => {
      const hash = await sha256(utf8ToBytes('hello'));
      expect(hash.length).toBe(32);
    });

    it('produces deterministic output', async () => {
      const a = await sha256(utf8ToBytes('test'));
      const b = await sha256(utf8ToBytes('test'));
      expect(bytesToHex(a)).toBe(bytesToHex(b));
    });

    it('produces known hash for empty input', async () => {
      const hash = await sha256(new Uint8Array([]));
      // SHA-256 of empty string
      expect(bytesToHex(hash)).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
    });
  });

  describe('hmacSha256', () => {
    it('produces 32-byte MAC', async () => {
      const key = utf8ToBytes('secret');
      const msg = utf8ToBytes('message');
      const mac = await hmacSha256(key, msg);
      expect(mac.length).toBe(32);
    });

    it('produces deterministic output', async () => {
      const key = utf8ToBytes('key');
      const msg = utf8ToBytes('data');
      const a = await hmacSha256(key, msg);
      const b = await hmacSha256(key, msg);
      expect(bytesToHex(a)).toBe(bytesToHex(b));
    });

    it('different keys produce different MACs', async () => {
      const msg = utf8ToBytes('message');
      const mac1 = await hmacSha256(utf8ToBytes('key1'), msg);
      const mac2 = await hmacSha256(utf8ToBytes('key2'), msg);
      expect(bytesToHex(mac1)).not.toBe(bytesToHex(mac2));
    });

    it('different messages produce different MACs', async () => {
      const key = utf8ToBytes('key');
      const mac1 = await hmacSha256(key, utf8ToBytes('msg1'));
      const mac2 = await hmacSha256(key, utf8ToBytes('msg2'));
      expect(bytesToHex(mac1)).not.toBe(bytesToHex(mac2));
    });
  });
});
