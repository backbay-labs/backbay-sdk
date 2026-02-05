/**
 * Speakeasy storage abstractions.
 *
 * bb-ui is browser-first; hosts can inject stronger storage (keychain, enclave, etc).
 */

import type { Verifier } from '../types.js';
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from './crypto.js';

export interface SpeakeasyStorage {
  getVerifier: () => Promise<Verifier | null>;
  setVerifier: (verifier: Verifier) => Promise<void>;
  clearVerifier: () => Promise<void>;
}

export function createInMemorySpeakeasyStorage(): SpeakeasyStorage {
  let verifier: Verifier | null = null;
  return {
    async getVerifier() {
      return verifier;
    },
    async setVerifier(next) {
      verifier = next;
    },
    async clearVerifier() {
      verifier = null;
    },
  };
}

export function createLocalStorageSpeakeasyStorage(options?: {
  key?: string;
}): SpeakeasyStorage {
  const storageKey = options?.key ?? 'bb-ui:speakeasy:verifier:v1';

  return {
    async getVerifier() {
      try {
        if (typeof globalThis.localStorage === 'undefined') return null;
        const raw = globalThis.localStorage.getItem(storageKey);
        if (!raw) return null;
        return JSON.parse(raw) as Verifier;
      } catch {
        return null;
      }
    },
    async setVerifier(verifier) {
      if (typeof globalThis.localStorage === 'undefined') {
        throw new Error('[Speakeasy] localStorage is not available');
      }
      globalThis.localStorage.setItem(storageKey, JSON.stringify(verifier));
    },
    async clearVerifier() {
      try {
        if (typeof globalThis.localStorage === 'undefined') return;
        globalThis.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    },
  };
}

export function createIndexedDbSpeakeasyStorage(options?: {
  dbName?: string;
  storeName?: string;
  key?: string;
}): SpeakeasyStorage {
  const dbName = options?.dbName ?? 'bb-ui-speakeasy';
  const storeName = options?.storeName ?? 'speakeasy';
  const recordKey = options?.key ?? 'verifier';

  async function openDb(): Promise<IDBDatabase> {
    if (typeof globalThis.indexedDB === 'undefined') {
      throw new Error('[Speakeasy] indexedDB is not available');
    }

    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  }

  return {
    async getVerifier() {
      try {
        const db = await openDb();
        return await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.get(recordKey);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve((req.result ?? null) as Verifier | null);
        });
      } catch {
        return null;
      }
    },
    async setVerifier(verifier) {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(verifier, recordKey);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    },
    async clearVerifier() {
      try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.delete(recordKey);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve();
        });
      } catch {
        // ignore
      }
    },
  };
}

export function createDefaultSpeakeasyStorage(options: {
  deviceSecret: Uint8Array;
}): SpeakeasyStorage {
  // deviceSecret is required for secure storage
  if (!options?.deviceSecret?.length) {
    throw new Error('[Speakeasy] deviceSecret is required for secure storage');
  }

  // Use encrypted storage with the provided deviceSecret
  if (typeof globalThis.indexedDB !== 'undefined') {
    return createEncryptedIndexedDbSpeakeasyStorage({ deviceSecret: options.deviceSecret });
  }
  if (typeof globalThis.localStorage !== 'undefined') {
    return createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret: options.deviceSecret });
  }

  // No persistent storage available - throw error (in-memory is not secure)
  throw new Error('[Speakeasy] No secure persistent storage available (requires IndexedDB or localStorage)');
}

// =============================================================================
// Encrypted Storage (AES-256-GCM)
// =============================================================================

interface EncryptedPayload {
  /** Version for forward compatibility (1 = fixed salt, 2 = random salt) */
  v: 1 | 2;
  /** IV (12 bytes, hex) */
  iv: string;
  /** Ciphertext (hex) */
  ct: string;
  /** Random salt for PBKDF2 (16 bytes, hex) - only present in v2 */
  salt?: string;
}

async function deriveEncryptionKey(
  deviceSecret: Uint8Array,
  salt: Uint8Array
): Promise<CryptoKey> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('[Speakeasy] crypto.subtle is required for encrypted storage');
  }

  // Import device secret as key material
  // Cast to BufferSource to satisfy TypeScript with bun-types
  const keyMaterial = await subtle.importKey('raw', deviceSecret as unknown as BufferSource, 'PBKDF2', false, [
    'deriveKey',
  ]);

  // Derive AES-256-GCM key using PBKDF2
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 600_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptVerifier(
  verifier: Verifier,
  deviceSecret: Uint8Array
): Promise<EncryptedPayload> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('[Speakeasy] crypto.subtle is required for encrypted storage');
  }

  // Generate random IV (12 bytes for AES-GCM)
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);

  // Generate random salt (16 bytes) for PBKDF2 - v2 uses per-encryption salt
  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);

  const key = await deriveEncryptionKey(deviceSecret, salt);

  const plaintext = utf8ToBytes(JSON.stringify(verifier));
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, plaintext as unknown as BufferSource);

  return {
    v: 2,
    iv: bytesToHex(iv),
    ct: bytesToHex(new Uint8Array(ciphertext)),
    salt: bytesToHex(salt),
  };
}

async function decryptVerifier(
  payload: EncryptedPayload,
  deviceSecret: Uint8Array
): Promise<Verifier> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('[Speakeasy] crypto.subtle is required for encrypted storage');
  }

  if (payload.v !== 1 && payload.v !== 2) {
    throw new Error(`[Speakeasy] Unsupported encrypted payload version: ${payload.v}`);
  }

  const iv = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ct);

  // v1: legacy fixed salt, v2: random salt stored in payload
  let salt: Uint8Array;
  if (payload.v === 2 && payload.salt) {
    salt = hexToBytes(payload.salt);
  } else {
    // Legacy v1 fallback: use fixed salt
    salt = utf8ToBytes('bb-ui:speakeasy:encrypted-storage:v1');
  }

  const key = await deriveEncryptionKey(deviceSecret, salt);

  const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, ciphertext as unknown as BufferSource);
  const json = new TextDecoder().decode(plaintext);

  return JSON.parse(json) as Verifier;
}

/**
 * Create encrypted localStorage storage.
 *
 * The verifier is encrypted with AES-256-GCM using a key derived from the
 * device secret via PBKDF2 (100k iterations).
 *
 * @param options.deviceSecret - The device secret to derive the encryption key from
 * @param options.key - localStorage key for the encrypted payload
 */
export function createEncryptedLocalStorageSpeakeasyStorage(options: {
  deviceSecret: Uint8Array;
  key?: string;
}): SpeakeasyStorage {
  const storageKey = options.key ?? 'bb-ui:speakeasy:verifier:encrypted:v1';
  const { deviceSecret } = options;

  return {
    async getVerifier() {
      try {
        if (typeof globalThis.localStorage === 'undefined') return null;
        const raw = globalThis.localStorage.getItem(storageKey);
        if (!raw) return null;

        const payload = JSON.parse(raw) as EncryptedPayload;
        return await decryptVerifier(payload, deviceSecret);
      } catch (err) {
        console.warn('[Speakeasy] Failed to decrypt verifier:', err);
        return null;
      }
    },

    async setVerifier(verifier) {
      if (typeof globalThis.localStorage === 'undefined') {
        throw new Error('[Speakeasy] localStorage is not available');
      }

      const payload = await encryptVerifier(verifier, deviceSecret);
      globalThis.localStorage.setItem(storageKey, JSON.stringify(payload));
    },

    async clearVerifier() {
      try {
        if (typeof globalThis.localStorage === 'undefined') return;
        globalThis.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Create encrypted IndexedDB storage.
 *
 * The verifier is encrypted with AES-256-GCM using a key derived from the
 * device secret via PBKDF2 (100k iterations).
 *
 * @param options.deviceSecret - The device secret to derive the encryption key from
 * @param options.dbName - IndexedDB database name
 * @param options.storeName - IndexedDB store name
 * @param options.key - Record key within the store
 */
export function createEncryptedIndexedDbSpeakeasyStorage(options: {
  deviceSecret: Uint8Array;
  dbName?: string;
  storeName?: string;
  key?: string;
}): SpeakeasyStorage {
  const dbName = options.dbName ?? 'bb-ui-speakeasy-encrypted';
  const storeName = options.storeName ?? 'speakeasy';
  const recordKey = options.key ?? 'verifier';
  const { deviceSecret } = options;

  async function openDb(): Promise<IDBDatabase> {
    if (typeof globalThis.indexedDB === 'undefined') {
      throw new Error('[Speakeasy] indexedDB is not available');
    }

    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  }

  return {
    async getVerifier() {
      try {
        const db = await openDb();
        const payload = await new Promise<EncryptedPayload | null>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.get(recordKey);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve((req.result ?? null) as EncryptedPayload | null);
        });

        if (!payload) return null;
        return await decryptVerifier(payload, deviceSecret);
      } catch (err) {
        console.warn('[Speakeasy] Failed to decrypt verifier:', err);
        return null;
      }
    },

    async setVerifier(verifier) {
      const db = await openDb();
      const payload = await encryptVerifier(verifier, deviceSecret);

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(payload, recordKey);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    },

    async clearVerifier() {
      try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.delete(recordKey);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve();
        });
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Create encrypted storage with automatic backend selection.
 *
 * Prefers IndexedDB, falls back to localStorage, then in-memory.
 *
 * @param deviceSecret - The device secret to derive the encryption key from
 */
export function createEncryptedSpeakeasyStorage(
  deviceSecret: Uint8Array
): SpeakeasyStorage {
  try {
    if (typeof globalThis.indexedDB !== 'undefined') {
      return createEncryptedIndexedDbSpeakeasyStorage({ deviceSecret });
    }
    if (typeof globalThis.localStorage !== 'undefined') {
      return createEncryptedLocalStorageSpeakeasyStorage({ deviceSecret });
    }
  } catch {
    // ignore
  }
  // Fall back to in-memory (no encryption needed since it's ephemeral)
  return createInMemorySpeakeasyStorage();
}
