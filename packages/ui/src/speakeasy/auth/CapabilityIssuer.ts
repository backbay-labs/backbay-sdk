/**
 * CapabilityIssuer (MVP)
 *
 * Issues locally-verifiable capability tokens using HMAC-SHA256.
 *
 * This intentionally mirrors the structure of Backbay capability tokens, but
 * avoids adding Ed25519 dependencies inside bb-ui.
 */

import type { CapabilityToken } from '../types.js';
import { bytesToHex, hmacSha256, randomHex, timingSafeEqual, utf8ToBytes, hexToBytes } from './crypto.js';

function createTokenId(): string {
  try {
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return randomHex(16);
}

function canonicalizePayload(payload: Omit<CapabilityToken, 'signature'>): string {
  // Ensure stable key order by constructing a new object in fixed order.
  const canonical: Omit<CapabilityToken, 'signature'> = {
    tokenId: payload.tokenId,
    issuer: payload.issuer,
    scopes: payload.scopes,
    notBefore: payload.notBefore,
    expiresAt: payload.expiresAt,
    constraints: payload.constraints,
  };
  return JSON.stringify(canonical);
}

export async function createCapabilityToken(options: {
  verifierKeyHex: string;
  issuer: string;
  scopes: string[];
  ttlMs: number;
  constraints?: CapabilityToken['constraints'];
}): Promise<CapabilityToken> {
  const notBefore = Date.now();
  const expiresAt = notBefore + options.ttlMs;

  const payload: Omit<CapabilityToken, 'signature'> = {
    tokenId: createTokenId(),
    issuer: options.issuer,
    scopes: options.scopes,
    notBefore,
    expiresAt,
    constraints: options.constraints,
  };

  const msg = utf8ToBytes(canonicalizePayload(payload));
  const keyBytes = hexToBytes(options.verifierKeyHex);
  const sigBytes = await hmacSha256(keyBytes, msg);

  return {
    ...payload,
    signature: bytesToHex(sigBytes),
  };
}

export async function verifyCapabilityToken(options: {
  token: CapabilityToken;
  verifierKeyHex: string;
  now?: number;
}): Promise<boolean> {
  const { token, verifierKeyHex } = options;
  const now = options.now ?? Date.now();
  if (now < token.notBefore || now > token.expiresAt) return false;

  const payload: Omit<CapabilityToken, 'signature'> = {
    tokenId: token.tokenId,
    issuer: token.issuer,
    scopes: token.scopes,
    notBefore: token.notBefore,
    expiresAt: token.expiresAt,
    constraints: token.constraints,
  };

  const msg = utf8ToBytes(canonicalizePayload(payload));
  const keyBytes = hexToBytes(verifierKeyHex);
  const expected = await hmacSha256(keyBytes, msg);
  const actual = hexToBytes(token.signature);
  return timingSafeEqual(expected, actual);
}
