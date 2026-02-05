/**
 * Tests for speakeasy storage implementations
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  createInMemorySpeakeasyStorage,
  createEncryptedLocalStorageSpeakeasyStorage,
  createDefaultSpeakeasyStorage,
} from '../auth/storage.js';
import type { Verifier } from '../types.js';
import { hexToBytes, randomHex } from '../auth/crypto.js';

function createMockVerifier(): Verifier {
  return {
    hash: randomHex(32),
    salt: randomHex(16),
    domain: 'https://test.local',
    createdAt: Date.now(),
    version: 1,
  };
}

describe('createInMemorySpeakeasyStorage', () => {
  it('starts empty', async () => {
    const storage = createInMemorySpeakeasyStorage();
    expect(await storage.getVerifier()).toBeNull();
  });

  it('stores and retrieves verifier', async () => {
    const storage = createInMemorySpeakeasyStorage();
    const verifier = createMockVerifier();

    await storage.setVerifier(verifier);
    const retrieved = await storage.getVerifier();

    expect(retrieved).toEqual(verifier);
  });

  it('clears verifier', async () => {
    const storage = createInMemorySpeakeasyStorage();
    await storage.setVerifier(createMockVerifier());
    expect(await storage.getVerifier()).not.toBeNull();

    await storage.clearVerifier();
    expect(await storage.getVerifier()).toBeNull();
  });

  it('overwrites previous verifier', async () => {
    const storage = createInMemorySpeakeasyStorage();
    const verifier1 = createMockVerifier();
    const verifier2 = createMockVerifier();

    await storage.setVerifier(verifier1);
    await storage.setVerifier(verifier2);

    const retrieved = await storage.getVerifier();
    expect(retrieved).toEqual(verifier2);
  });

  it('instances are isolated', async () => {
    const storage1 = createInMemorySpeakeasyStorage();
    const storage2 = createInMemorySpeakeasyStorage();

    await storage1.setVerifier(createMockVerifier());

    expect(await storage1.getVerifier()).not.toBeNull();
    expect(await storage2.getVerifier()).toBeNull();
  });
});

describe('createEncryptedLocalStorageSpeakeasyStorage', () => {
  // Mock localStorage for Node.js environment
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    // Reset mock storage
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);

    // Mock globalThis.localStorage
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    };
  });

  it('stores verifier encrypted', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const storage = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret });
    const verifier = createMockVerifier();

    await storage.setVerifier(verifier);

    // Check that something was stored
    const storageKey = 'bb-ui:speakeasy:verifier:encrypted:v1';
    expect(mockLocalStorage[storageKey]).toBeDefined();

    // Parse the stored payload
    const payload = JSON.parse(mockLocalStorage[storageKey]);
    expect(payload.v).toBe(2); // v2 uses random salt
    expect(payload.iv).toBeDefined();
    expect(payload.ct).toBeDefined();
    expect(payload.salt).toBeDefined(); // v2 includes salt

    // Verify it's not plaintext JSON
    expect(payload.ct).not.toContain(verifier.hash);
  });

  it('retrieves and decrypts verifier', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const storage = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret });
    const verifier = createMockVerifier();

    await storage.setVerifier(verifier);
    const retrieved = await storage.getVerifier();

    expect(retrieved).toEqual(verifier);
  });

  it('returns null for empty storage', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const storage = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret });

    const retrieved = await storage.getVerifier();
    expect(retrieved).toBeNull();
  });

  it('clears encrypted verifier', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const storage = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret });

    await storage.setVerifier(createMockVerifier());
    await storage.clearVerifier();

    const retrieved = await storage.getVerifier();
    expect(retrieved).toBeNull();

    const storageKey = 'bb-ui:speakeasy:verifier:encrypted:v1';
    expect(mockLocalStorage[storageKey]).toBeUndefined();
  });

  it('fails to decrypt with wrong device secret', async () => {
    const deviceSecret1 = hexToBytes(randomHex(32));
    const deviceSecret2 = hexToBytes(randomHex(32));

    const storage1 = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret: deviceSecret1 });
    const storage2 = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret: deviceSecret2 });

    await storage1.setVerifier(createMockVerifier());

    // Try to decrypt with different secret
    const retrieved = await storage2.getVerifier();
    expect(retrieved).toBeNull(); // Should fail gracefully
  });

  it('uses custom storage key', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const customKey = 'custom:speakeasy:key';
    const storage = createEncryptedLocalStorageSpeakeasyStorage({
      deviceSecret,
      key: customKey,
    });

    await storage.setVerifier(createMockVerifier());

    expect(mockLocalStorage[customKey]).toBeDefined();
    expect(mockLocalStorage['bb-ui:speakeasy:verifier:encrypted:v1']).toBeUndefined();
  });

  it('produces different ciphertext for same verifier (random IV and salt)', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const storage = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret });
    const verifier = createMockVerifier();
    const storageKey = 'bb-ui:speakeasy:verifier:encrypted:v1';

    await storage.setVerifier(verifier);
    const payload1 = JSON.parse(mockLocalStorage[storageKey]);

    // Store again
    await storage.setVerifier(verifier);
    const payload2 = JSON.parse(mockLocalStorage[storageKey]);

    // Different IV and salt should produce different ciphertext
    expect(payload1.iv).not.toBe(payload2.iv);
    expect(payload1.salt).not.toBe(payload2.salt);
    expect(payload1.ct).not.toBe(payload2.ct);
  });
});

describe('createDefaultSpeakeasyStorage', () => {
  beforeEach(() => {
    // Mock localStorage for tests
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  });

  it('throws when deviceSecret is undefined', () => {
    expect(() => {
      createDefaultSpeakeasyStorage({ deviceSecret: undefined as unknown as Uint8Array });
    }).toThrow('[Speakeasy] deviceSecret is required for secure storage');
  });

  it('throws when deviceSecret is empty', () => {
    expect(() => {
      createDefaultSpeakeasyStorage({ deviceSecret: new Uint8Array(0) });
    }).toThrow('[Speakeasy] deviceSecret is required for secure storage');
  });

  it('throws when no persistent storage available', () => {
    // Remove both storage backends
    delete (globalThis as Record<string, unknown>).localStorage;
    delete (globalThis as Record<string, unknown>).indexedDB;

    const deviceSecret = hexToBytes(randomHex(32));

    expect(() => {
      createDefaultSpeakeasyStorage({ deviceSecret });
    }).toThrow('[Speakeasy] No secure persistent storage available');
  });

  it('returns encrypted storage when deviceSecret provided', () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const storage = createDefaultSpeakeasyStorage({ deviceSecret });

    // Should not throw and return a valid storage
    expect(storage).toBeDefined();
    expect(storage.getVerifier).toBeInstanceOf(Function);
    expect(storage.setVerifier).toBeInstanceOf(Function);
    expect(storage.clearVerifier).toBeInstanceOf(Function);
  });
});
