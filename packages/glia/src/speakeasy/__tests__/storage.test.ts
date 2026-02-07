/**
 * Tests for speakeasy storage implementations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInMemorySpeakeasyStorage,
  createEncryptedLocalStorageSpeakeasyStorage,
  createDefaultSpeakeasyStorage,
  migrateV1ToV2,
} from '../auth/storage.js';
import type { Verifier } from '../types.js';
import { bytesToHex, hexToBytes, randomHex, utf8ToBytes } from '../auth/crypto.js';

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

describe('migrateV1ToV2', () => {
  /**
   * Helper to create a v1 encrypted payload (fixed salt) for testing.
   * This manually replicates the v1 encryption path.
   */
  async function createV1Payload(
    verifier: Verifier,
    deviceSecret: Uint8Array
  ): Promise<string> {
    const subtle = globalThis.crypto.subtle;

    // v1 uses the fixed salt
    const fixedSalt = utf8ToBytes('bb-ui:speakeasy:encrypted-storage:v1');

    const keyMaterial = await subtle.importKey(
      'raw',
      deviceSecret as unknown as BufferSource,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: fixedSalt as unknown as BufferSource,
        iterations: 600_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = new Uint8Array(12);
    globalThis.crypto.getRandomValues(iv);

    const plaintext = new TextEncoder().encode(JSON.stringify(verifier));
    const ciphertext = await subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      plaintext as unknown as BufferSource
    );

    const payload = {
      v: 1 as const,
      iv: bytesToHex(iv),
      ct: bytesToHex(new Uint8Array(ciphertext)),
    };

    return JSON.stringify(payload);
  }

  it('migrates v1 payload to v2 with random salt', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const verifier = createMockVerifier();

    const v1Payload = await createV1Payload(verifier, deviceSecret);
    const v2PayloadStr = await migrateV1ToV2(v1Payload, deviceSecret);
    const v2Payload = JSON.parse(v2PayloadStr);

    expect(v2Payload.v).toBe(2);
    expect(v2Payload.salt).toBeDefined();
    expect(v2Payload.salt).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(v2Payload.iv).toBeDefined();
    expect(v2Payload.ct).toBeDefined();
  });

  it('preserves verifier data through migration', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const verifier = createMockVerifier();
    const mockLocalStorage: Record<string, string> = {};
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    };

    const v1Payload = await createV1Payload(verifier, deviceSecret);
    const v2PayloadStr = await migrateV1ToV2(v1Payload, deviceSecret);

    // Store the v2 payload and decrypt it through the normal storage path
    const storageKey = 'test:migration';
    mockLocalStorage[storageKey] = v2PayloadStr;

    const storage = createEncryptedLocalStorageSpeakeasyStorage({
      deviceSecret,
      key: storageKey,
    });
    const retrieved = await storage.getVerifier();
    expect(retrieved).toEqual(verifier);
  });

  it('returns v2 payload unchanged', async () => {
    const deviceSecret = hexToBytes(randomHex(32));
    const mockLocalStorage: Record<string, string> = {};
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    };

    // Create a v2 payload through normal encryption
    const storage = createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret });
    await storage.setVerifier(createMockVerifier());
    const v2Original = mockLocalStorage['bb-ui:speakeasy:verifier:encrypted:v1'];

    const result = await migrateV1ToV2(v2Original, deviceSecret);
    expect(result).toBe(v2Original); // Should return as-is
  });

  it('emits console.warn when decrypting v1 payload', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const deviceSecret = hexToBytes(randomHex(32));
    const verifier = createMockVerifier();
    const v1Payload = await createV1Payload(verifier, deviceSecret);

    // migrateV1ToV2 decrypts v1 which triggers the warning
    await migrateV1ToV2(v1Payload, deviceSecret);

    expect(warnSpy).toHaveBeenCalledWith(
      'Speakeasy: v1 encrypted payload detected. Call migrateV1ToV2() to upgrade to random-salt encryption.'
    );

    warnSpy.mockRestore();
  });

  it('fails with wrong device secret', async () => {
    const secret1 = hexToBytes(randomHex(32));
    const secret2 = hexToBytes(randomHex(32));
    const verifier = createMockVerifier();

    const v1Payload = await createV1Payload(verifier, secret1);

    // Decryption with wrong secret should throw (AES-GCM auth tag failure)
    await expect(migrateV1ToV2(v1Payload, secret2)).rejects.toThrow();
  });
});
