/**
 * Tests for CapabilityIssuer token creation and verification
 */

import { describe, it, expect } from 'bun:test';
import { createCapabilityToken, verifyCapabilityToken } from '../auth/CapabilityIssuer.js';

describe('CapabilityIssuer', () => {
  const testKeyHex = 'a'.repeat(64); // 32-byte key as hex

  describe('createCapabilityToken', () => {
    it('creates token with all required fields', async () => {
      const now = Date.now();
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read', 'write'],
        ttlMs: 60_000,
      });

      expect(token.tokenId).toBeDefined();
      expect(token.tokenId.length).toBeGreaterThan(0);
      expect(token.issuer).toBe('test-issuer');
      expect(token.scopes).toEqual(['read', 'write']);
      expect(token.notBefore).toBeGreaterThanOrEqual(now);
      expect(token.notBefore).toBeLessThanOrEqual(now + 100); // Allow small drift
      expect(token.expiresAt).toBe(token.notBefore + 60_000);
      expect(token.signature).toHaveLength(64); // HMAC-SHA256
    });

    it('includes optional constraints', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
        constraints: {
          maxUses: 1,
          allowedOrigins: ['https://example.com'],
        },
      });

      expect(token.constraints).toEqual({
        maxUses: 1,
        allowedOrigins: ['https://example.com'],
      });
    });

    it('generates unique token IDs', async () => {
      const token1 = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test',
        scopes: ['read'],
        ttlMs: 60_000,
      });
      const token2 = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      expect(token1.tokenId).not.toBe(token2.tokenId);
    });
  });

  describe('verifyCapabilityToken', () => {
    it('verifies valid token', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      const isValid = await verifyCapabilityToken({
        token,
        verifierKeyHex: testKeyHex,
      });

      expect(isValid).toBe(true);
    });

    it('rejects token with wrong key', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      const wrongKeyHex = 'b'.repeat(64);
      const isValid = await verifyCapabilityToken({
        token,
        verifierKeyHex: wrongKeyHex,
      });

      expect(isValid).toBe(false);
    });

    it('rejects expired token', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      // Test with a time past expiration using the now parameter
      const isValid = await verifyCapabilityToken({
        token,
        verifierKeyHex: testKeyHex,
        now: token.expiresAt + 1000, // 1 second after expiration
      });

      expect(isValid).toBe(false);
    });

    it('rejects token used before notBefore', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      // Use explicit time before notBefore
      const isValid = await verifyCapabilityToken({
        token,
        verifierKeyHex: testKeyHex,
        now: token.notBefore - 1000, // 1 second before
      });

      expect(isValid).toBe(false);
    });

    it('rejects tampered token', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      // Tamper with scopes
      const tamperedToken = {
        ...token,
        scopes: ['read', 'write', 'admin'],
      };

      const isValid = await verifyCapabilityToken({
        token: tamperedToken,
        verifierKeyHex: testKeyHex,
      });

      expect(isValid).toBe(false);
    });

    it('rejects token with modified expiration', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      // Try to extend expiration
      const tamperedToken = {
        ...token,
        expiresAt: token.expiresAt + 3600_000, // Add 1 hour
      };

      const isValid = await verifyCapabilityToken({
        token: tamperedToken,
        verifierKeyHex: testKeyHex,
      });

      expect(isValid).toBe(false);
    });

    it('validates at exact boundaries', async () => {
      const token = await createCapabilityToken({
        verifierKeyHex: testKeyHex,
        issuer: 'test-issuer',
        scopes: ['read'],
        ttlMs: 60_000,
      });

      // At exact notBefore - should be valid
      const validAtStart = await verifyCapabilityToken({
        token,
        verifierKeyHex: testKeyHex,
        now: token.notBefore,
      });
      expect(validAtStart).toBe(true);

      // At exact expiresAt - should be valid
      const validAtEnd = await verifyCapabilityToken({
        token,
        verifierKeyHex: testKeyHex,
        now: token.expiresAt,
      });
      expect(validAtEnd).toBe(true);

      // Just after expiresAt - should be invalid
      const invalidAfter = await verifyCapabilityToken({
        token,
        verifierKeyHex: testKeyHex,
        now: token.expiresAt + 1,
      });
      expect(invalidAfter).toBe(false);
    });
  });
});
