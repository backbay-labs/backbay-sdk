/**
 * Signing & Verification Tests
 *
 * Tests for Ed25519 message signing, verification, arbitrary data
 * signing, message hashing, and related utilities.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { utf8ToBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';

import { generateIdentity, createPeerIdentity } from '../core/identity';
import {
  signMessage,
  verifyMessage,
  createSignedMessage,
  computeMessageHash,
  computeMessageId,
  signData,
  verifyData,
  generateNonce,
  isTimestampRecent,
  verifySentinelResponse,
} from '../core/signing';
import type { BaseMessage, BayChatIdentity, ChatMessage } from '../core/types';

// @noble/ed25519 v2 requires sha512 to be configured for Node.js
beforeAll(() => {
  ed.etc.sha512Sync = sha512;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal unsigned chat message for signing tests. */
function buildUnsignedChat(
  sender: string,
  content: string,
  overrides: Partial<Omit<ChatMessage, 'signature' | 'id'>> = {},
): Omit<ChatMessage, 'signature' | 'id'> {
  return {
    type: 'chat' as const,
    sender,
    timestamp: Date.now(),
    nonce: generateNonce(),
    content,
    ...overrides,
  };
}

// ===========================================================================
// signMessage / verifyMessage round-trip
// ===========================================================================

describe('signMessage + verifyMessage', () => {
  let identity: BayChatIdentity;

  beforeAll(async () => {
    identity = await generateIdentity();
  });

  it('should sign and verify a chat message', async () => {
    const unsigned = buildUnsignedChat(identity.publicKey, 'hello speakeasy');
    const signature = await signMessage(unsigned, identity);
    expect(signature).toBeTruthy();
    expect(typeof signature).toBe('string');
    // Ed25519 signatures are 64 bytes = 128 hex chars
    expect(signature.length).toBe(128);

    // Build the full signed message
    const id = computeMessageId(unsigned);
    const signed: BaseMessage = { ...unsigned, id, signature };
    const result = await verifyMessage(signed);
    expect(result.valid).toBe(true);
  });

  it('should reject verification when signature is from a different key', async () => {
    const other = await generateIdentity();
    const unsigned = buildUnsignedChat(identity.publicKey, 'some message');
    // Sign with the *other* identity but claim sender is `identity`
    const signature = await signMessage(unsigned, other);
    const id = computeMessageId(unsigned);
    const signed: BaseMessage = { ...unsigned, id, signature };

    const result = await verifyMessage(signed);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid_signature');
  });

  it('should reject verification when message content is tampered', async () => {
    const unsigned = buildUnsignedChat(identity.publicKey, 'original content');
    const signature = await signMessage(unsigned, identity);
    const id = computeMessageId(unsigned);

    // Tamper with the content after signing
    const tampered: ChatMessage = {
      ...unsigned,
      id,
      signature,
      content: 'tampered content',
    };

    const result = await verifyMessage(tampered);
    expect(result.valid).toBe(false);
    // ID will no longer match the recomputed hash
    expect(result.reason).toBe('id_mismatch');
  });

  it('should reject verification when the id field is wrong', async () => {
    const unsigned = buildUnsignedChat(identity.publicKey, 'test');
    const signature = await signMessage(unsigned, identity);
    const signed: BaseMessage = {
      ...unsigned,
      id: 'deadbeef'.repeat(8), // wrong id
      signature,
    };

    const result = await verifyMessage(signed);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('id_mismatch');
  });

  it('should reject verification with a corrupted signature', async () => {
    const unsigned = buildUnsignedChat(identity.publicKey, 'test data');
    const signature = await signMessage(unsigned, identity);
    const id = computeMessageId(unsigned);

    // Flip some bytes in the signature
    const corruptedSig =
      'ff' + signature.slice(2, 126) + 'ff';

    const signed: BaseMessage = { ...unsigned, id, signature: corruptedSig };
    const result = await verifyMessage(signed);
    expect(result.valid).toBe(false);
  });
});

// ===========================================================================
// createSignedMessage (high-level helper)
// ===========================================================================

describe('createSignedMessage', () => {
  let identity: BayChatIdentity;

  beforeAll(async () => {
    identity = await generateIdentity();
  });

  it('should produce a fully-formed signed message', async () => {
    const signed = await createSignedMessage(
      { type: 'chat' as const, content: 'hello from createSignedMessage' },
      identity,
    );

    expect(signed.sender).toBe(identity.publicKey);
    expect(signed.id).toBeTruthy();
    expect(signed.signature).toBeTruthy();
    expect(signed.nonce).toBeTruthy();
    expect(signed.timestamp).toBeGreaterThan(0);

    // Round-trip verification
    const result = await verifyMessage(signed as BaseMessage);
    expect(result.valid).toBe(true);
  });

  it('should produce unique nonces for consecutive messages', async () => {
    const a = await createSignedMessage(
      { type: 'chat' as const, content: 'msg a' },
      identity,
    );
    const b = await createSignedMessage(
      { type: 'chat' as const, content: 'msg b' },
      identity,
    );
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.id).not.toBe(b.id);
  });
});

// ===========================================================================
// signData / verifyData (arbitrary binary payloads)
// ===========================================================================

describe('signData + verifyData', () => {
  let identity: BayChatIdentity;

  beforeAll(async () => {
    identity = await generateIdentity();
  });

  it('should sign and verify arbitrary binary data', async () => {
    const data = utf8ToBytes('arbitrary payload');
    const sig = await signData(data, identity);
    expect(sig.length).toBe(128); // 64 bytes hex

    const valid = await verifyData(data, sig, identity.publicKey);
    expect(valid).toBe(true);
  });

  it('should return false for wrong public key', async () => {
    const data = utf8ToBytes('payload');
    const sig = await signData(data, identity);

    const other = await generateIdentity();
    const valid = await verifyData(data, sig, other.publicKey);
    expect(valid).toBe(false);
  });

  it('should return false for tampered data', async () => {
    const data = utf8ToBytes('original');
    const sig = await signData(data, identity);

    const tampered = utf8ToBytes('modified');
    const valid = await verifyData(tampered, sig, identity.publicKey);
    expect(valid).toBe(false);
  });

  it('should handle empty data', async () => {
    const data = new Uint8Array(0);
    const sig = await signData(data, identity);
    const valid = await verifyData(data, sig, identity.publicKey);
    expect(valid).toBe(true);
  });

  it('should handle large data', async () => {
    const data = new Uint8Array(100_000).fill(0xab);
    const sig = await signData(data, identity);
    const valid = await verifyData(data, sig, identity.publicKey);
    expect(valid).toBe(true);
  });

  it('should return false (not throw) for malformed signature hex', async () => {
    const data = utf8ToBytes('hello');
    const valid = await verifyData(data, 'not-valid-hex', identity.publicKey);
    expect(valid).toBe(false);
  });
});

// ===========================================================================
// computeMessageHash
// ===========================================================================

describe('computeMessageHash', () => {
  it('should be deterministic (same input -> same hash)', () => {
    const msg = buildUnsignedChat('aabbccdd', 'determinism check');
    const h1 = computeMessageHash(msg);
    const h2 = computeMessageHash(msg);
    expect(h1).toBe(h2);
  });

  it('should produce a 64-char hex string (SHA-256)', () => {
    const msg = buildUnsignedChat('aabbccdd', 'length check');
    const hash = computeMessageHash(msg);
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should differ when content changes', () => {
    const base = {
      type: 'chat' as const,
      sender: 'aabb',
      timestamp: 1000,
      nonce: 'deadbeef',
      content: 'alpha',
    };
    const h1 = computeMessageHash(base);
    const h2 = computeMessageHash({ ...base, content: 'beta' });
    expect(h1).not.toBe(h2);
  });

  it('should differ when nonce changes', () => {
    const base = {
      type: 'chat' as const,
      sender: 'aabb',
      timestamp: 1000,
      nonce: 'aaaa',
      content: 'same',
    };
    const h1 = computeMessageHash(base);
    const h2 = computeMessageHash({ ...base, nonce: 'bbbb' });
    expect(h1).not.toBe(h2);
  });

  it('should differ when timestamp changes', () => {
    const base = {
      type: 'chat' as const,
      sender: 'aabb',
      timestamp: 1000,
      nonce: 'deadbeef',
      content: 'same',
    };
    const h1 = computeMessageHash(base);
    const h2 = computeMessageHash({ ...base, timestamp: 2000 });
    expect(h1).not.toBe(h2);
  });

  it('should handle presence message type', () => {
    const msg = {
      type: 'presence' as const,
      sender: 'aabb',
      timestamp: 1000,
      nonce: 'deadbeef',
      status: 'online' as const,
    };
    const hash = computeMessageHash(msg);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle typing message type', () => {
    const msg = {
      type: 'typing' as const,
      sender: 'aabb',
      timestamp: 1000,
      nonce: 'deadbeef',
      speakeasyId: 'room1',
      isTyping: true,
    };
    const hash = computeMessageHash(msg);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('computeMessageId should equal computeMessageHash', () => {
    const msg = buildUnsignedChat('aabb', 'id vs hash');
    expect(computeMessageId(msg)).toBe(computeMessageHash(msg));
  });
});

// ===========================================================================
// verifySentinelResponse
// ===========================================================================

describe('verifySentinelResponse', () => {
  let sentinel: BayChatIdentity;
  let unknown: BayChatIdentity;

  beforeAll(async () => {
    sentinel = await generateIdentity();
    unknown = await generateIdentity();
  });

  it('should accept a validly-signed sentinel response', async () => {
    const signed = await createSignedMessage(
      {
        type: 'sentinel_response' as const,
        replyTo: 'abc123',
        content: 'AI answer',
        capsuleId: 'cap1',
        capsuleUri: 'ipfs://xyz',
        evidenceTier: 'T1' as const,
      },
      sentinel,
    );

    const knownSentinels = { opus: sentinel.publicKey };
    const result = await verifySentinelResponse(signed as any, knownSentinels);
    expect(result.valid).toBe(true);
    expect(result.sentinel).toBe('opus');
  });

  it('should reject when sender is not a known sentinel', async () => {
    const signed = await createSignedMessage(
      {
        type: 'sentinel_response' as const,
        replyTo: 'abc123',
        content: 'imposter',
        capsuleId: 'cap2',
        capsuleUri: 'ipfs://fake',
        evidenceTier: 'T0' as const,
      },
      unknown,
    );

    const knownSentinels = { opus: sentinel.publicKey };
    const result = await verifySentinelResponse(signed as any, knownSentinels);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('unknown_sentinel');
  });
});

// ===========================================================================
// generateNonce
// ===========================================================================

describe('generateNonce', () => {
  it('should return a 32-char hex string (16 bytes)', () => {
    const nonce = generateNonce();
    expect(nonce.length).toBe(32);
    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should produce unique values on each call', () => {
    const nonces = new Set(Array.from({ length: 100 }, () => generateNonce()));
    expect(nonces.size).toBe(100);
  });
});

// ===========================================================================
// isTimestampRecent
// ===========================================================================

describe('isTimestampRecent', () => {
  it('should return true for current timestamp', () => {
    expect(isTimestampRecent(Date.now())).toBe(true);
  });

  it('should return true within default tolerance (5 min)', () => {
    const fourMinAgo = Date.now() - 4 * 60 * 1000;
    expect(isTimestampRecent(fourMinAgo)).toBe(true);
  });

  it('should return false outside default tolerance', () => {
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    expect(isTimestampRecent(tenMinAgo)).toBe(false);
  });

  it('should support custom tolerance', () => {
    const twoSecAgo = Date.now() - 2000;
    expect(isTimestampRecent(twoSecAgo, 1000)).toBe(false);
    expect(isTimestampRecent(twoSecAgo, 5000)).toBe(true);
  });

  it('should handle future timestamps within tolerance', () => {
    const inTwoMin = Date.now() + 2 * 60 * 1000;
    expect(isTimestampRecent(inTwoMin)).toBe(true);
  });

  it('should reject far-future timestamps', () => {
    const inTenMin = Date.now() + 10 * 60 * 1000;
    expect(isTimestampRecent(inTenMin)).toBe(false);
  });
});
