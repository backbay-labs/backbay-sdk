/**
 * BayChat Identity Management
 *
 * Ed25519 keypair generation, storage, and recovery using BIP39 seed phrases.
 * Keys are stored in IndexedDB with optional encryption.
 */

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { deriveSigil } from './sigil';
import type { BayChatIdentity, SerializedIdentity, SpeakeasySigil } from './types';

// =============================================================================
// Constants
// =============================================================================

const IDENTITY_DB_NAME = 'baychat-identity';
const IDENTITY_STORE_NAME = 'identity';
const IDENTITY_KEY = 'primary';

// =============================================================================
// Key Generation
// =============================================================================

/**
 * Generate a new BayChat identity with Ed25519 keypair
 *
 * @returns New identity with seed phrase (show once to user!)
 */
export async function generateIdentity(): Promise<BayChatIdentity> {
  // Generate 24-word mnemonic (256 bits of entropy)
  const mnemonic = generateMnemonic(wordlist, 256);
  const seedPhrase = mnemonic.split(' ');

  // Derive Ed25519 keypair from seed
  const seed = mnemonicToSeedSync(mnemonic);
  // Use first 32 bytes of seed as Ed25519 private key
  const privateKey = seed.slice(0, 32);
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  // Full secret key is private key + public key (64 bytes total for Ed25519)
  const secretKey = new Uint8Array(64);
  secretKey.set(privateKey);
  secretKey.set(publicKey, 32);

  const publicKeyHex = bytesToHex(publicKey);
  const fingerprint = computeFingerprint(publicKeyHex);
  const sigil = deriveSigil(fingerprint);

  return {
    publicKey: publicKeyHex,
    secretKey: bytesToHex(secretKey),
    fingerprint,
    sigil,
    seedPhrase,
    createdAt: Date.now(),
  };
}

/**
 * Recover identity from seed phrase
 *
 * @param seedPhrase - 24-word BIP39 mnemonic
 * @returns Recovered identity
 * @throws If seed phrase is invalid
 */
export async function recoverIdentity(seedPhrase: string[]): Promise<BayChatIdentity> {
  const mnemonic = seedPhrase.join(' ');

  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid seed phrase');
  }

  const seed = mnemonicToSeedSync(mnemonic);
  const privateKey = seed.slice(0, 32);
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  const secretKey = new Uint8Array(64);
  secretKey.set(privateKey);
  secretKey.set(publicKey, 32);

  const publicKeyHex = bytesToHex(publicKey);
  const fingerprint = computeFingerprint(publicKeyHex);
  const sigil = deriveSigil(fingerprint);

  return {
    publicKey: publicKeyHex,
    secretKey: bytesToHex(secretKey),
    fingerprint,
    sigil,
    // Don't return seed phrase - user already has it
    createdAt: Date.now(),
  };
}

/**
 * Create a view-only identity from a public key (for displaying other users)
 *
 * @param publicKey - Ed25519 public key (hex)
 * @param nickname - Optional nickname
 */
export function createPeerIdentity(publicKey: string, nickname?: string): BayChatIdentity {
  const fingerprint = computeFingerprint(publicKey);
  const sigil = deriveSigil(fingerprint);

  return {
    publicKey,
    fingerprint,
    sigil,
    nickname,
    createdAt: Date.now(),
  };
}

// =============================================================================
// Fingerprint
// =============================================================================

/**
 * Compute fingerprint from public key
 *
 * @param publicKey - Ed25519 public key (hex)
 * @returns 16-character hex fingerprint
 */
export function computeFingerprint(publicKey: string): string {
  const hash = sha256(hexToBytes(publicKey));
  return bytesToHex(hash).slice(0, 16);
}

/**
 * Format fingerprint for display (groups of 4)
 *
 * @param fingerprint - 16-character hex fingerprint
 * @returns Formatted string like "a1b2-c3d4-e5f6-g7h8"
 */
export function formatFingerprint(fingerprint: string): string {
  return fingerprint.match(/.{1,4}/g)?.join('-') ?? fingerprint;
}

// =============================================================================
// Storage (IndexedDB)
// =============================================================================

/**
 * Open the identity database
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDENTITY_DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDENTITY_STORE_NAME)) {
        db.createObjectStore(IDENTITY_STORE_NAME);
      }
    };
  });
}

/**
 * Save identity to IndexedDB
 *
 * @param identity - Identity to save (secret key is stored)
 */
export async function saveIdentity(identity: BayChatIdentity): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IDENTITY_STORE_NAME);

    // Store without seed phrase (user should have backed it up)
    const toStore: Omit<BayChatIdentity, 'seedPhrase'> = {
      publicKey: identity.publicKey,
      secretKey: identity.secretKey,
      fingerprint: identity.fingerprint,
      sigil: identity.sigil,
      nickname: identity.nickname,
      createdAt: identity.createdAt,
    };

    const request = store.put(toStore, IDENTITY_KEY);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Load identity from IndexedDB
 *
 * @returns Stored identity or null if not found
 */
export async function loadIdentity(): Promise<BayChatIdentity | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE_NAME, 'readonly');
    const store = transaction.objectStore(IDENTITY_STORE_NAME);

    const request = store.get(IDENTITY_KEY);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? null);
  });
}

/**
 * Check if an identity exists in storage
 */
export async function hasIdentity(): Promise<boolean> {
  const identity = await loadIdentity();
  return identity !== null;
}

/**
 * Delete identity from storage
 */
export async function deleteIdentity(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IDENTITY_STORE_NAME);

    const request = store.delete(IDENTITY_KEY);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// =============================================================================
// Serialization
// =============================================================================

/**
 * Serialize identity for sharing (excludes secret key)
 */
export function serializeIdentity(identity: BayChatIdentity): SerializedIdentity {
  return {
    publicKey: identity.publicKey,
    fingerprint: identity.fingerprint,
    sigil: identity.sigil,
    nickname: identity.nickname,
    createdAt: identity.createdAt,
  };
}

/**
 * Deserialize identity (creates peer identity without secret key)
 */
export function deserializeIdentity(data: SerializedIdentity): BayChatIdentity {
  return {
    publicKey: data.publicKey,
    fingerprint: data.fingerprint,
    sigil: data.sigil,
    nickname: data.nickname,
    createdAt: data.createdAt,
  };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Check if identity has signing capability (has secret key)
 */
export function canSign(identity: BayChatIdentity): boolean {
  return identity.secretKey !== undefined && identity.secretKey.length > 0;
}

/**
 * Get public key bytes from identity
 */
export function getPublicKeyBytes(identity: BayChatIdentity): Uint8Array {
  return hexToBytes(identity.publicKey);
}

/**
 * Get secret key bytes from identity (first 32 bytes)
 */
export function getSecretKeyBytes(identity: BayChatIdentity): Uint8Array {
  if (!identity.secretKey) {
    throw new Error('Identity does not have signing capability');
  }
  // Return first 32 bytes (private key portion)
  return hexToBytes(identity.secretKey).slice(0, 32);
}

/**
 * Shorten public key for display
 *
 * @param publicKey - Full public key (hex)
 * @returns Shortened form like "a1b2...c3d4"
 */
export function shortenPublicKey(publicKey: string): string {
  if (publicKey.length <= 12) return publicKey;
  return `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
}
