/**
 * SpeakeasyAuth
 *
 * MVP "doorman" verifier that:
 * - stores a derived verifier key (not raw gestures)
 * - verifies gesture-derived responses against stored verifier
 *
 * Note: In the MVP, leakage of the stored verifier key compromises the ritual.
 */

import type { Challenge, GestureSequence, GestureStep, Verifier } from '../types.js';
import {
  bytesToHex,
  concatBytes,
  hmacSha256,
  randomHex,
  sha256,
  timingSafeEqual,
  utf8ToBytes,
  hexToBytes,
} from './crypto.js';
import type { SpeakeasyStorage } from './storage.js';
import { createDefaultSpeakeasyStorage } from './storage.js';

export interface SpeakeasyAuthVerifyResult {
  ok: boolean;
  reason?: 'not_registered' | 'domain_mismatch' | 'invalid_gesture';
  response?: string;
}

export interface SpeakeasyAuthOptions {
  storage?: SpeakeasyStorage;
  /**
   * Domain binding for anti-phishing. Defaults to `location.origin` when available.
   */
  domain?: string;
  /**
   * Optional device-bound secret (host-provided). This should NOT be the raw gesture.
   */
  deviceSecret?: string | Uint8Array;
}

function defaultDomain(): string {
  if (typeof globalThis.location !== 'undefined' && globalThis.location?.origin) {
    return globalThis.location.origin;
  }
  return 'unknown';
}

function normalizeDeviceSecret(secret: string | Uint8Array | undefined): Uint8Array {
  if (!secret) {
    throw new Error('[Speakeasy] deviceSecret is required for secure verifier derivation');
  }
  if (typeof secret === 'string') return utf8ToBytes(secret);
  return secret;
}

function canonicalizeGestureStep(step: GestureStep): string {
  switch (step.type) {
    case 'tap':
      return `tap:${step.count}:${step.region}`;
    case 'hold': {
      const durationBucket = Math.round(step.durationMs / 50) * 50;
      return `hold:${durationBucket}:${step.region}`;
    }
    case 'radial_drag': {
      const from = Math.round(step.fromAngle);
      const to = Math.round(step.toAngle);
      return `radial:${from}:${to}:${step.notches}`;
    }
    case 'flick': {
      const velocityBucket = Math.round(step.velocity * 100) / 100;
      return `flick:${step.direction}:${velocityBucket}`;
    }
  }
}

function canonicalizeGestureSequence(sequence: GestureSequence): string {
  return sequence.steps.map(canonicalizeGestureStep).join('|');
}

export function fingerprintGestureSequence(sequence: GestureSequence): string {
  return canonicalizeGestureSequence(sequence);
}

function buildChallengeMessage(challenge: Challenge, rhythmHash: string): Uint8Array {
  // Validate nonce format: 32 bytes = 64 hex characters
  if (!/^[0-9a-fA-F]{64}$/.test(challenge.nonce)) {
    throw new Error('[Speakeasy] Invalid nonce: expected 64 hex characters');
  }
  // Validate salt format: 16 bytes = 32 hex characters
  if (!/^[0-9a-fA-F]{32}$/.test(challenge.salt)) {
    throw new Error('[Speakeasy] Invalid salt: expected 32 hex characters');
  }

  // Keep this stable and versioned. Avoid including raw step values.
  const message = `bb-ui:speakeasy:v1|nonce:${challenge.nonce}|salt:${challenge.salt}|rhythm:${rhythmHash}`;
  return utf8ToBytes(message);
}

async function deriveVerifierKeyBytes(options: {
  sequence: GestureSequence;
  domain: string;
  verifierSaltHex: string;
  deviceSecret: Uint8Array;
}): Promise<Uint8Array> {
  const canonical = canonicalizeGestureSequence(options.sequence);
  const header = `bb-ui:speakeasy:verifier:v1|domain:${options.domain}|salt:${options.verifierSaltHex}|`;
  const data = concatBytes(utf8ToBytes(header + canonical), options.deviceSecret);
  return sha256(data);
}

export class SpeakeasyAuth {
  private readonly storage: SpeakeasyStorage;
  private readonly domain: string;
  private readonly deviceSecret: Uint8Array;

  constructor(options: SpeakeasyAuthOptions & { deviceSecret: string | Uint8Array }) {
    // Validate deviceSecret at construction time - fail fast
    this.deviceSecret = normalizeDeviceSecret(options.deviceSecret);
    this.storage = options?.storage ?? createDefaultSpeakeasyStorage({ deviceSecret: this.deviceSecret });
    this.domain = options?.domain ?? defaultDomain();
  }

  async getVerifier(): Promise<Verifier | null> {
    return this.storage.getVerifier();
  }

  async isRegistered(): Promise<boolean> {
    return (await this.getVerifier()) !== null;
  }

  async clear(): Promise<void> {
    await this.storage.clearVerifier();
  }

  async registerGesture(sequence: GestureSequence): Promise<Verifier> {
    const salt = randomHex(16);
    const domain = this.domain;
    const keyBytes = await deriveVerifierKeyBytes({
      sequence,
      domain,
      verifierSaltHex: salt,
      deviceSecret: this.deviceSecret,
    });

    const verifier: Verifier = {
      hash: bytesToHex(keyBytes),
      salt,
      domain,
      createdAt: Date.now(),
      version: 1,
    };

    await this.storage.setVerifier(verifier);
    return verifier;
  }

  async computeResponse(sequence: GestureSequence, challenge: Challenge): Promise<string> {
    const verifier = await this.getVerifier();
    if (!verifier) {
      throw new Error('[Speakeasy] Not registered');
    }
    const keyBytes = await deriveVerifierKeyBytes({
      sequence,
      domain: verifier.domain,
      verifierSaltHex: verifier.salt,
      deviceSecret: this.deviceSecret,
    });
    const messageBytes = buildChallengeMessage(challenge, sequence.rhythmHash);
    const responseBytes = await hmacSha256(keyBytes, messageBytes);
    return bytesToHex(responseBytes);
  }

  async verifyGesture(sequence: GestureSequence, challenge: Challenge): Promise<SpeakeasyAuthVerifyResult> {
    const verifier = await this.getVerifier();
    if (!verifier) {
      return { ok: false, reason: 'not_registered' };
    }
    if (verifier.domain !== this.domain) {
      return { ok: false, reason: 'domain_mismatch' };
    }

    const storedKeyBytes = hexToBytes(verifier.hash);
    const keyBytes = await deriveVerifierKeyBytes({
      sequence,
      domain: verifier.domain,
      verifierSaltHex: verifier.salt,
      deviceSecret: this.deviceSecret,
    });

    const messageBytes = buildChallengeMessage(challenge, sequence.rhythmHash);
    const expected = await hmacSha256(storedKeyBytes, messageBytes);
    const response = await hmacSha256(keyBytes, messageBytes);

    const ok = timingSafeEqual(expected, response);
    if (!ok) {
      return { ok: false, reason: 'invalid_gesture' };
    }

    return { ok: true, response: bytesToHex(response) };
  }
}
