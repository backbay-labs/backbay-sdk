/**
 * Identity Generation & Recovery Tests
 *
 * Tests for Ed25519 keypair generation via BIP39 seed phrases,
 * identity recovery, fingerprint computation, sigil derivation,
 * serialization, and utility helpers.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { hexToBytes } from '@noble/hashes/utils';

import {
  generateIdentity,
  recoverIdentity,
  createPeerIdentity,
  computeFingerprint,
  formatFingerprint,
  serializeIdentity,
  deserializeIdentity,
  canSign,
  getPublicKeyBytes,
  getSecretKeyBytes,
  shortenPublicKey,
} from '../core/identity';
import { deriveSigil, SIGILS, isValidSigil } from '../core/sigil';
import type { BayChatIdentity } from '../core/types';

// @noble/ed25519 v2 requires sha512 to be configured for Node.js
beforeAll(() => {
  ed.etc.sha512Sync = sha512;
});

// ===========================================================================
// generateIdentity
// ===========================================================================

describe('generateIdentity', () => {
  it('should generate a valid identity with all required fields', async () => {
    const id = await generateIdentity();

    expect(id.publicKey).toBeTruthy();
    expect(id.secretKey).toBeTruthy();
    expect(id.fingerprint).toBeTruthy();
    expect(id.sigil).toBeTruthy();
    expect(id.seedPhrase).toBeTruthy();
    expect(id.createdAt).toBeGreaterThan(0);
  });

  it('should produce a 64-char hex public key (32 bytes)', async () => {
    const id = await generateIdentity();
    expect(id.publicKey.length).toBe(64);
    expect(id.publicKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce a 128-char hex secret key (64 bytes)', async () => {
    const id = await generateIdentity();
    expect(id.secretKey!.length).toBe(128);
    expect(id.secretKey!).toMatch(/^[0-9a-f]{128}$/);
  });

  it('should produce a 24-word BIP39 seed phrase', async () => {
    const id = await generateIdentity();
    expect(id.seedPhrase).toBeDefined();
    expect(id.seedPhrase!.length).toBe(24);
    // Each word should be a non-empty string
    for (const word of id.seedPhrase!) {
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it('should produce a valid sigil from the SIGILS set', async () => {
    const id = await generateIdentity();
    expect(isValidSigil(id.sigil)).toBe(true);
  });

  it('should produce a 16-char hex fingerprint', async () => {
    const id = await generateIdentity();
    expect(id.fingerprint.length).toBe(16);
    expect(id.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should generate unique identities on each call', async () => {
    const a = await generateIdentity();
    const b = await generateIdentity();
    expect(a.publicKey).not.toBe(b.publicKey);
    expect(a.secretKey).not.toBe(b.secretKey);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });

  it('should embed the public key in the second half of the secret key', async () => {
    const id = await generateIdentity();
    // Secret key is privateKey(32) + publicKey(32)
    const secretBytes = hexToBytes(id.secretKey!);
    const embeddedPub = secretBytes.slice(32);
    const pubBytes = hexToBytes(id.publicKey);
    expect(Buffer.from(embeddedPub).equals(Buffer.from(pubBytes))).toBe(true);
  });
});

// ===========================================================================
// recoverIdentity  (determinism & round-trip)
// ===========================================================================

describe('recoverIdentity', () => {
  it('should recover the same public key from a seed phrase', async () => {
    const original = await generateIdentity();
    const recovered = await recoverIdentity(original.seedPhrase!);

    expect(recovered.publicKey).toBe(original.publicKey);
  });

  it('should recover the same secret key from a seed phrase', async () => {
    const original = await generateIdentity();
    const recovered = await recoverIdentity(original.seedPhrase!);

    expect(recovered.secretKey).toBe(original.secretKey);
  });

  it('should recover the same fingerprint and sigil', async () => {
    const original = await generateIdentity();
    const recovered = await recoverIdentity(original.seedPhrase!);

    expect(recovered.fingerprint).toBe(original.fingerprint);
    expect(recovered.sigil).toBe(original.sigil);
  });

  it('should NOT include seedPhrase in the recovered identity', async () => {
    const original = await generateIdentity();
    const recovered = await recoverIdentity(original.seedPhrase!);

    // Per the source: "Don't return seed phrase - user already has it"
    expect(recovered.seedPhrase).toBeUndefined();
  });

  it('should throw on an invalid seed phrase', async () => {
    const bad = Array(24).fill('invalidword');
    await expect(recoverIdentity(bad)).rejects.toThrow('Invalid seed phrase');
  });

  it('should throw on a too-short seed phrase', async () => {
    const short = ['abandon', 'abandon', 'abandon'];
    await expect(recoverIdentity(short)).rejects.toThrow();
  });

  it('should be deterministic: multiple recoveries yield identical keys', async () => {
    const original = await generateIdentity();
    const r1 = await recoverIdentity(original.seedPhrase!);
    const r2 = await recoverIdentity(original.seedPhrase!);

    expect(r1.publicKey).toBe(r2.publicKey);
    expect(r1.secretKey).toBe(r2.secretKey);
    expect(r1.fingerprint).toBe(r2.fingerprint);
    expect(r1.sigil).toBe(r2.sigil);
  });
});

// ===========================================================================
// Key derivation is deterministic
// ===========================================================================

describe('key derivation determinism', () => {
  it('should derive the same keypair from the same mnemonic across calls', async () => {
    const id = await generateIdentity();
    const phrase = id.seedPhrase!;

    // Recover twice and compare
    const a = await recoverIdentity(phrase);
    const b = await recoverIdentity(phrase);

    expect(a.publicKey).toBe(b.publicKey);
    expect(a.secretKey).toBe(b.secretKey);
  });
});

// ===========================================================================
// createPeerIdentity
// ===========================================================================

describe('createPeerIdentity', () => {
  it('should create a view-only identity without secret key', () => {
    const pubKey = 'a'.repeat(64);
    const peer = createPeerIdentity(pubKey);

    expect(peer.publicKey).toBe(pubKey);
    expect(peer.secretKey).toBeUndefined();
    expect(peer.fingerprint).toBeTruthy();
    expect(peer.sigil).toBeTruthy();
    expect(peer.createdAt).toBeGreaterThan(0);
  });

  it('should accept an optional nickname', () => {
    const peer = createPeerIdentity('b'.repeat(64), 'Alice');
    expect(peer.nickname).toBe('Alice');
  });

  it('should derive the correct fingerprint', () => {
    const pubKey = 'abcdef1234567890'.repeat(4);
    const peer = createPeerIdentity(pubKey);
    const expected = computeFingerprint(pubKey);
    expect(peer.fingerprint).toBe(expected);
  });
});

// ===========================================================================
// computeFingerprint
// ===========================================================================

describe('computeFingerprint', () => {
  it('should return a 16-char hex string', () => {
    const fp = computeFingerprint('aa'.repeat(32));
    expect(fp.length).toBe(16);
    expect(fp).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should be deterministic', () => {
    const pubKey = 'cc'.repeat(32);
    expect(computeFingerprint(pubKey)).toBe(computeFingerprint(pubKey));
  });

  it('should differ for different public keys', () => {
    const a = computeFingerprint('aa'.repeat(32));
    const b = computeFingerprint('bb'.repeat(32));
    expect(a).not.toBe(b);
  });
});

// ===========================================================================
// formatFingerprint
// ===========================================================================

describe('formatFingerprint', () => {
  it('should format into dash-separated groups of 4', () => {
    const formatted = formatFingerprint('abcdef1234567890');
    expect(formatted).toBe('abcd-ef12-3456-7890');
  });

  it('should handle short strings gracefully', () => {
    const formatted = formatFingerprint('abcd');
    expect(formatted).toBe('abcd');
  });
});

// ===========================================================================
// deriveSigil
// ===========================================================================

describe('deriveSigil', () => {
  it('should return a valid sigil for any fingerprint', () => {
    // Try all 256 possible first-byte values
    for (let i = 0; i < 256; i++) {
      const hex = i.toString(16).padStart(2, '0') + '00'.repeat(7);
      const sigil = deriveSigil(hex);
      expect(SIGILS).toContain(sigil);
    }
  });

  it('should be deterministic', () => {
    const fp = 'abcdef1234567890';
    expect(deriveSigil(fp)).toBe(deriveSigil(fp));
  });

  it('should map first byte modulo 8 to the correct sigil index', () => {
    // 0x00 % 8 = 0 -> 'diamond'
    expect(deriveSigil('00' + '00'.repeat(7))).toBe('diamond');
    // 0x01 % 8 = 1 -> 'eye'
    expect(deriveSigil('01' + '00'.repeat(7))).toBe('eye');
    // 0x08 % 8 = 0 -> 'diamond'
    expect(deriveSigil('08' + '00'.repeat(7))).toBe('diamond');
    // 0x07 % 8 = 7 -> 'moon'
    expect(deriveSigil('07' + '00'.repeat(7))).toBe('moon');
  });
});

// ===========================================================================
// isValidSigil
// ===========================================================================

describe('isValidSigil', () => {
  it('should return true for all known sigils', () => {
    for (const s of SIGILS) {
      expect(isValidSigil(s)).toBe(true);
    }
  });

  it('should return false for unknown strings', () => {
    expect(isValidSigil('triangle')).toBe(false);
    expect(isValidSigil('')).toBe(false);
  });
});

// ===========================================================================
// canSign
// ===========================================================================

describe('canSign', () => {
  it('should return true for identity with secret key', async () => {
    const id = await generateIdentity();
    expect(canSign(id)).toBe(true);
  });

  it('should return false for peer identity without secret key', () => {
    const peer = createPeerIdentity('aa'.repeat(32));
    expect(canSign(peer)).toBe(false);
  });

  it('should return false for identity with empty secret key', () => {
    const id: BayChatIdentity = {
      publicKey: 'aa'.repeat(32),
      secretKey: '',
      fingerprint: 'aabb'.repeat(4),
      sigil: 'diamond',
      createdAt: Date.now(),
    };
    expect(canSign(id)).toBe(false);
  });
});

// ===========================================================================
// getPublicKeyBytes / getSecretKeyBytes
// ===========================================================================

describe('getPublicKeyBytes', () => {
  it('should return 32 bytes from a valid identity', async () => {
    const id = await generateIdentity();
    const bytes = getPublicKeyBytes(id);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);
  });
});

describe('getSecretKeyBytes', () => {
  it('should return the first 32 bytes (private key portion)', async () => {
    const id = await generateIdentity();
    const bytes = getSecretKeyBytes(id);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);
  });

  it('should throw for identity without secret key', () => {
    const peer = createPeerIdentity('aa'.repeat(32));
    expect(() => getSecretKeyBytes(peer)).toThrow(
      'Identity does not have signing capability',
    );
  });
});

// ===========================================================================
// serializeIdentity / deserializeIdentity
// ===========================================================================

describe('serializeIdentity + deserializeIdentity', () => {
  it('should round-trip public fields', async () => {
    const id = await generateIdentity();
    id.nickname = 'TestNick';

    const serialized = serializeIdentity(id);

    expect(serialized.publicKey).toBe(id.publicKey);
    expect(serialized.fingerprint).toBe(id.fingerprint);
    expect(serialized.sigil).toBe(id.sigil);
    expect(serialized.nickname).toBe('TestNick');
    expect(serialized.createdAt).toBe(id.createdAt);
    // Must NOT contain secret key
    expect((serialized as any).secretKey).toBeUndefined();
    expect((serialized as any).seedPhrase).toBeUndefined();

    const deserialized = deserializeIdentity(serialized);
    expect(deserialized.publicKey).toBe(id.publicKey);
    expect(deserialized.fingerprint).toBe(id.fingerprint);
    expect(deserialized.sigil).toBe(id.sigil);
    expect(deserialized.nickname).toBe('TestNick');
  });

  it('deserialized identity should NOT have signing capability', async () => {
    const id = await generateIdentity();
    const serialized = serializeIdentity(id);
    const deserialized = deserializeIdentity(serialized);
    expect(canSign(deserialized)).toBe(false);
  });
});

// ===========================================================================
// shortenPublicKey
// ===========================================================================

describe('shortenPublicKey', () => {
  it('should shorten a 64-char key to "aabbcc...xxyy" format', () => {
    const key = 'abcdef1234567890'.repeat(4); // 64 chars
    const short = shortenPublicKey(key);
    expect(short).toBe('abcdef...7890');
  });

  it('should return short keys unchanged', () => {
    expect(shortenPublicKey('abcd1234')).toBe('abcd1234');
  });

  it('should return keys <= 12 chars unchanged', () => {
    expect(shortenPublicKey('123456789012')).toBe('123456789012');
  });

  it('should shorten keys > 12 chars', () => {
    const result = shortenPublicKey('1234567890123');
    expect(result).toBe('123456...0123');
  });
});

// ===========================================================================
// End-to-end: generate -> sign -> verify -> recover -> sign -> verify
// ===========================================================================

describe('end-to-end identity lifecycle', () => {
  it('should allow sign/verify with original and recovered identity', async () => {
    // 1. Generate identity
    const original = await generateIdentity();
    expect(canSign(original)).toBe(true);

    // 2. Import signing functions
    const { signMessage, verifyMessage, computeMessageId, generateNonce } =
      await import('../core/signing');

    // 3. Sign a message with the original identity
    const msg = {
      type: 'chat' as const,
      sender: original.publicKey,
      timestamp: Date.now(),
      nonce: generateNonce(),
      content: 'lifecycle test',
    };
    const sig1 = await signMessage(msg, original);
    const id = computeMessageId(msg);
    const signed1 = { ...msg, id, signature: sig1 };

    const result1 = await verifyMessage(signed1);
    expect(result1.valid).toBe(true);

    // 4. Recover identity from seed phrase
    const recovered = await recoverIdentity(original.seedPhrase!);
    expect(recovered.publicKey).toBe(original.publicKey);

    // 5. Sign a different message with the recovered identity
    const msg2 = {
      type: 'chat' as const,
      sender: recovered.publicKey,
      timestamp: Date.now(),
      nonce: generateNonce(),
      content: 'recovered identity message',
    };
    const sig2 = await signMessage(msg2, recovered);
    const id2 = computeMessageId(msg2);
    const signed2 = { ...msg2, id: id2, signature: sig2 };

    const result2 = await verifyMessage(signed2);
    expect(result2.valid).toBe(true);
  });
});
