/**
 * Message Signing and Verification
 *
 * Ed25519 signatures for BayChat messages.
 */

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

import { getSecretKeyBytes } from './identity';
import type { AnyMessage, BaseMessage, BayChatIdentity, VerificationResult } from './types';

// =============================================================================
// Message Hashing
// =============================================================================

/**
 * Compute message hash for signing
 *
 * Hash is computed over: type + sender + timestamp + nonce + content-specific fields
 *
 * @param message - Message to hash (without signature)
 * @returns SHA256 hash as hex string
 */
export function computeMessageHash(message: Omit<BaseMessage, 'signature' | 'id'>): string {
  // Build canonical string representation
  const parts: string[] = [
    message.type,
    message.sender,
    message.timestamp.toString(),
    message.nonce,
  ];

  // Add type-specific content
  const msg = message as AnyMessage;
  switch (msg.type) {
    case 'chat':
      parts.push(msg.content);
      if (msg.replyTo) parts.push(msg.replyTo);
      break;
    case 'sentinel_request':
      parts.push(msg.sentinel, msg.prompt);
      break;
    case 'sentinel_response':
      parts.push(msg.replyTo, msg.content, msg.capsuleId, msg.capsuleUri);
      break;
    case 'bounty_created':
      parts.push(msg.bountyId, msg.description, msg.reward, msg.deadline.toString());
      break;
    case 'bounty_claimed':
      parts.push(msg.bountyId, msg.claimer);
      break;
    case 'bounty_submitted':
      parts.push(msg.bountyId, msg.capsuleId);
      break;
    case 'bounty_verified':
      parts.push(msg.bountyId, msg.verifier, msg.verdict);
      break;
    case 'bounty_settled':
      parts.push(msg.bountyId, msg.winner);
      break;
    case 'presence':
      parts.push(msg.status);
      break;
    case 'typing':
      parts.push(msg.speakeasyId, msg.isTyping.toString());
      break;
  }

  const canonical = parts.join('|');
  const hash = sha256(utf8ToBytes(canonical));
  return bytesToHex(hash);
}

/**
 * Compute message ID
 *
 * ID is the hash of the message content (used before signing)
 */
export function computeMessageId(message: Omit<BaseMessage, 'signature' | 'id'>): string {
  return computeMessageHash(message);
}

// =============================================================================
// Signing
// =============================================================================

/**
 * Sign a message with identity's secret key
 *
 * @param message - Message to sign (without signature)
 * @param identity - Identity with secret key
 * @returns Signature as hex string
 */
export async function signMessage(
  message: Omit<BaseMessage, 'signature' | 'id'>,
  identity: BayChatIdentity
): Promise<string> {
  const secretKey = getSecretKeyBytes(identity);
  const hash = computeMessageHash(message);
  const hashBytes = hexToBytes(hash);

  const signature = await ed.signAsync(hashBytes, secretKey);
  return bytesToHex(signature);
}

/**
 * Create a complete signed message
 *
 * Adds id, nonce, timestamp, and signature to message content
 */
export async function createSignedMessage<T extends Omit<BaseMessage, 'signature' | 'id' | 'timestamp' | 'nonce' | 'sender'>>(
  content: T,
  identity: BayChatIdentity
): Promise<T & BaseMessage> {
  const timestamp = Date.now();
  const nonce = generateNonce();

  const message = {
    ...content,
    sender: identity.publicKey,
    timestamp,
    nonce,
  };

  const id = computeMessageId(message);
  const signature = await signMessage(message, identity);

  return {
    ...message,
    id,
    signature,
  } as T & BaseMessage;
}

// =============================================================================
// Verification
// =============================================================================

/**
 * Verify a message signature
 *
 * @param message - Complete signed message
 * @returns Verification result
 */
export async function verifyMessage(message: BaseMessage): Promise<VerificationResult> {
  try {
    // Recompute hash from message content
    const { signature, id, ...content } = message;
    const hash = computeMessageHash(content);

    // Verify the computed ID matches
    if (id !== hash) {
      return { valid: false, reason: 'id_mismatch' };
    }

    // Verify signature
    const hashBytes = hexToBytes(hash);
    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(message.sender);

    const valid = await ed.verifyAsync(signatureBytes, hashBytes, publicKeyBytes);

    if (!valid) {
      return { valid: false, reason: 'invalid_signature' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: `verification_error: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }
}

/**
 * Verify a sentinel response signature
 *
 * Additionally checks that sender matches known sentinel public key
 *
 * @param message - Sentinel response message
 * @param knownSentinels - Map of sentinel name to public key
 */
export async function verifySentinelResponse(
  message: BaseMessage & { capsuleId: string },
  knownSentinels: Record<string, string>
): Promise<VerificationResult> {
  // First verify the message signature
  const result = await verifyMessage(message);
  if (!result.valid) {
    return result;
  }

  // Find which sentinel this is from
  const sentinel = Object.entries(knownSentinels).find(
    ([_, pubkey]) => pubkey === message.sender
  );

  if (!sentinel) {
    return { valid: false, reason: 'unknown_sentinel' };
  }

  return { valid: true, sentinel: sentinel[0] };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate a random nonce
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Check if a message timestamp is recent (within tolerance)
 *
 * @param timestamp - Message timestamp in ms
 * @param toleranceMs - Tolerance in ms (default 5 minutes)
 */
export function isTimestampRecent(timestamp: number, toleranceMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const age = Math.abs(now - timestamp);
  return age <= toleranceMs;
}

/**
 * Sign arbitrary data with identity
 *
 * @param data - Data to sign (will be SHA256 hashed)
 * @param identity - Identity with secret key
 * @returns Signature as hex string
 */
export async function signData(data: Uint8Array, identity: BayChatIdentity): Promise<string> {
  const secretKey = getSecretKeyBytes(identity);
  const hash = sha256(data);
  const signature = await ed.signAsync(hash, secretKey);
  return bytesToHex(signature);
}

/**
 * Verify arbitrary data signature
 *
 * @param data - Original data
 * @param signature - Signature to verify (hex)
 * @param publicKey - Signer's public key (hex)
 */
export async function verifyData(
  data: Uint8Array,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const hash = sha256(data);
    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(publicKey);
    return await ed.verifyAsync(signatureBytes, hash, publicKeyBytes);
  } catch {
    return false;
  }
}
