/**
 * Device secret provider
 *
 * Hosts can implement this using a keychain/secure enclave and inject it into
 * SpeakeasyProvider / SpeakeasyConsentDialog.
 */

import { bytesToHex, hexToBytes, randomHex } from './crypto.js';

export interface SpeakeasyDeviceSecretProvider {
  getOrCreateDeviceSecret: () => Promise<Uint8Array>;
  clearDeviceSecret: () => Promise<void>;
}

export function createInMemoryDeviceSecretProvider(): SpeakeasyDeviceSecretProvider {
  let secret: Uint8Array | null = null;
  return {
    async getOrCreateDeviceSecret() {
      if (!secret) {
        secret = hexToBytes(randomHex(32));
      }
      return secret;
    },
    async clearDeviceSecret() {
      secret = null;
    },
  };
}

export function createLocalStorageDeviceSecretProvider(options?: {
  key?: string;
}): SpeakeasyDeviceSecretProvider {
  const storageKey = options?.key ?? 'bb-ui:speakeasy:device-secret:v1';

  return {
    async getOrCreateDeviceSecret() {
      if (typeof globalThis.localStorage === 'undefined') {
        throw new Error('[Speakeasy] localStorage is not available');
      }
      const existing = globalThis.localStorage.getItem(storageKey);
      if (existing) {
        return hexToBytes(existing);
      }
      const created = randomHex(32);
      globalThis.localStorage.setItem(storageKey, created);
      return hexToBytes(created);
    },
    async clearDeviceSecret() {
      try {
        if (typeof globalThis.localStorage === 'undefined') return;
        globalThis.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    },
  };
}

export function createDefaultDeviceSecretProvider(): SpeakeasyDeviceSecretProvider {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return createLocalStorageDeviceSecretProvider();
    }
  } catch {
    // ignore
  }
  return createInMemoryDeviceSecretProvider();
}

export function encodeDeviceSecretHex(secret: Uint8Array): string {
  return bytesToHex(secret);
}

