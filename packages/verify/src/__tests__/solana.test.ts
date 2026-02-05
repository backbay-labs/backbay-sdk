/**
 * Offline tests for Solana verification.
 *
 * These tests verify:
 * - PDA derivation logic (no RPC calls)
 * - Account layout parsing from fixture bytes
 * - Hash normalization utilities
 *
 * All tests use deterministic fixtures - no network calls.
 */
import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import {
  normalizeReceiptHash,
  receiptHashToBytes,
  parseU32LE,
  parseReceiptAccount,
  parseRegistryConfig,
} from '../fetchers/solana';
import {
  TEST_RECEIPT_HASH,
  TEST_REGISTRY_PROGRAM_ID,
  VERIFIED_RECEIPT_FIXTURE,
  PENDING_RECEIPT_FIXTURE,
  QUARANTINED_RECEIPT_FIXTURE,
  REGISTRY_CONFIG_FIXTURE,
  REGISTRY_CONFIG_HIGH_QUORUM_FIXTURE,
  buildReceiptAccountFixture,
  buildRegistryConfigFixture,
} from './fixtures/solana';

describe('Solana verification (offline)', () => {
  describe('normalizeReceiptHash', () => {
    it('removes 0x prefix', () => {
      const hash =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      expect(normalizeReceiptHash(hash)).toBe(
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      );
    });

    it('returns hash unchanged if no prefix', () => {
      const hash =
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      expect(normalizeReceiptHash(hash)).toBe(hash);
    });

    it('handles empty string', () => {
      expect(normalizeReceiptHash('')).toBe('');
    });
  });

  describe('receiptHashToBytes', () => {
    it('converts 0x-prefixed hash to bytes', () => {
      const hash =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const bytes = receiptHashToBytes(hash);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
      expect(bytes[0]).toBe(0xab);
      expect(bytes[1]).toBe(0xcd);
      expect(bytes[31]).toBe(0x90);
    });

    it('converts non-prefixed hash to bytes', () => {
      const hash =
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const bytes = receiptHashToBytes(hash);

      expect(bytes.length).toBe(32);
      expect(bytes[0]).toBe(0xab);
    });

    it('handles uppercase hex', () => {
      const hash =
        '0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890';
      const bytes = receiptHashToBytes(hash);

      expect(bytes[0]).toBe(0xab);
      expect(bytes[1]).toBe(0xcd);
    });

    it('throws for invalid hash length', () => {
      const shortHash = '0xabcdef';
      expect(() => receiptHashToBytes(shortHash)).toThrow(
        'Invalid receipt hash'
      );
    });

    it('throws for invalid hex characters', () => {
      const invalidHash =
        '0xghijkl1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      expect(() => receiptHashToBytes(invalidHash)).toThrow(
        'Invalid receipt hash'
      );
    });
  });

  describe('parseU32LE', () => {
    it('parses little-endian u32', () => {
      const data = new Uint8Array([0x01, 0x00, 0x00, 0x00]);
      expect(parseU32LE(data, 0)).toBe(1);
    });

    it('parses larger values', () => {
      const data = new Uint8Array([0xff, 0xff, 0x00, 0x00]);
      expect(parseU32LE(data, 0)).toBe(65535);
    });

    it('parses max u32', () => {
      const data = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
      expect(parseU32LE(data, 0)).toBe(4294967295);
    });

    it('respects offset', () => {
      const data = new Uint8Array([0x00, 0x00, 0x05, 0x00, 0x00, 0x00]);
      expect(parseU32LE(data, 2)).toBe(5);
    });
  });

  describe('PDA derivation', () => {
    it('derives receipt PDA deterministically', () => {
      const receiptHashBytes = receiptHashToBytes(TEST_RECEIPT_HASH);
      const programId = new PublicKey(TEST_REGISTRY_PROGRAM_ID);

      const [pda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('receipt'), Buffer.from(receiptHashBytes)],
        programId
      );

      // PDA should be deterministic - same inputs = same output
      const [pda2, bump2] = PublicKey.findProgramAddressSync(
        [Buffer.from('receipt'), Buffer.from(receiptHashBytes)],
        programId
      );

      expect(pda.toBase58()).toBe(pda2.toBase58());
      expect(bump).toBe(bump2);
      expect(bump).toBeLessThanOrEqual(255);
      expect(bump).toBeGreaterThanOrEqual(0);
    });

    it('different hashes produce different PDAs', () => {
      const programId = new PublicKey(TEST_REGISTRY_PROGRAM_ID);

      const hash1 = receiptHashToBytes(TEST_RECEIPT_HASH);
      const hash2 = receiptHashToBytes(
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      );

      const [pda1] = PublicKey.findProgramAddressSync(
        [Buffer.from('receipt'), Buffer.from(hash1)],
        programId
      );
      const [pda2] = PublicKey.findProgramAddressSync(
        [Buffer.from('receipt'), Buffer.from(hash2)],
        programId
      );

      expect(pda1.toBase58()).not.toBe(pda2.toBase58());
    });

    it('derives config PDA deterministically', () => {
      const programId = new PublicKey(TEST_REGISTRY_PROGRAM_ID);

      const [configPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        programId
      );

      // Config PDA should be deterministic
      const [configPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        programId
      );

      expect(configPda.toBase58()).toBe(configPda2.toBase58());
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('receipt seed prefix is exactly "receipt"', () => {
      // This test documents the seed used in the Anchor program
      // See: infra/solana/programs/aegis_registry/src/lib.rs
      const receiptSeed = Buffer.from('receipt');
      expect(receiptSeed.toString()).toBe('receipt');
      expect(receiptSeed.length).toBe(7);
    });

    it('config seed prefix is exactly "config"', () => {
      const configSeed = Buffer.from('config');
      expect(configSeed.toString()).toBe('config');
      expect(configSeed.length).toBe(6);
    });
  });

  describe('parseReceiptAccount', () => {
    it('parses verified receipt from fixture', () => {
      const parsed = parseReceiptAccount(VERIFIED_RECEIPT_FIXTURE);

      expect(parsed.status).toBe('verified');
      expect(parsed.attestationCount).toBe(2);
      expect(parsed.receiptHash).toBe(TEST_RECEIPT_HASH);
      expect(parsed.attesters.length).toBe(2);
    });

    it('parses pending receipt from fixture', () => {
      const parsed = parseReceiptAccount(PENDING_RECEIPT_FIXTURE);

      expect(parsed.status).toBe('pending');
      expect(parsed.attestationCount).toBe(0);
      expect(parsed.attesters.length).toBe(0);
    });

    it('parses quarantined receipt from fixture', () => {
      const parsed = parseReceiptAccount(QUARANTINED_RECEIPT_FIXTURE);

      expect(parsed.status).toBe('quarantined');
      expect(parsed.attestationCount).toBe(2);
    });

    it('extracts receipt hash at correct offset', () => {
      // Receipt hash is at offset 40 (after discriminator + submitter)
      const fixture = buildReceiptAccountFixture();
      const parsed = parseReceiptAccount(fixture);

      // Verify the extracted hash matches what we put in
      expect(parsed.receiptHash.toLowerCase()).toBe(
        TEST_RECEIPT_HASH.toLowerCase()
      );
    });

    it('handles attestation count correctly', () => {
      const fixture5 = buildReceiptAccountFixture({ attestationCount: 5 });
      const parsed5 = parseReceiptAccount(fixture5);
      expect(parsed5.attestationCount).toBe(5);

      const fixture0 = buildReceiptAccountFixture({
        attestationCount: 0,
        attesters: [],
      });
      const parsed0 = parseReceiptAccount(fixture0);
      expect(parsed0.attestationCount).toBe(0);
    });

    it('limits attesters to attestation_count', () => {
      // Even if there's data in later slots, only return up to attestation_count
      const fixture = buildReceiptAccountFixture({ attestationCount: 1 });
      const parsed = parseReceiptAccount(fixture);

      expect(parsed.attesters.length).toBe(1);
    });
  });

  describe('parseRegistryConfig', () => {
    it('parses min_attestations from fixture', () => {
      const parsed = parseRegistryConfig(REGISTRY_CONFIG_FIXTURE);
      expect(parsed.minAttestations).toBe(2);
    });

    it('parses higher quorum config', () => {
      const parsed = parseRegistryConfig(REGISTRY_CONFIG_HIGH_QUORUM_FIXTURE);
      expect(parsed.minAttestations).toBe(3);
    });

    it('extracts min_attestations at correct offset', () => {
      // min_attestations is at offset 72 (8 disc + 32 authority + 32 policy)
      const fixture = buildRegistryConfigFixture({ minAttestations: 5 });
      const parsed = parseRegistryConfig(fixture);
      expect(parsed.minAttestations).toBe(5);
    });

    it('defaults to 1 for missing data', () => {
      // If data is shorter than expected, should default to 1
      const shortData = new Uint8Array(72); // Just under min_attestations offset
      const parsed = parseRegistryConfig(shortData);
      expect(parsed.minAttestations).toBe(1);
    });
  });

  describe('byte offset layout verification', () => {
    // These tests lock down the exact byte offsets used for parsing
    // to catch any regressions if the layout changes

    it('ReceiptAccount: discriminator at offset 0, length 8', () => {
      const DISCRIMINATOR_OFFSET = 0;
      const DISCRIMINATOR_LEN = 8;

      const fixture = VERIFIED_RECEIPT_FIXTURE;
      const discriminator = fixture.slice(
        DISCRIMINATOR_OFFSET,
        DISCRIMINATOR_OFFSET + DISCRIMINATOR_LEN
      );

      // Our fixture uses 0xaa for discriminator
      expect(discriminator.every((b) => b === 0xaa)).toBe(true);
    });

    it('ReceiptAccount: submitter at offset 8, length 32', () => {
      const SUBMITTER_OFFSET = 8;
      const SUBMITTER_LEN = 32;

      const fixture = VERIFIED_RECEIPT_FIXTURE;
      const submitter = fixture.slice(
        SUBMITTER_OFFSET,
        SUBMITTER_OFFSET + SUBMITTER_LEN
      );

      expect(submitter.length).toBe(32);
    });

    it('ReceiptAccount: receipt_hash at offset 40, length 32', () => {
      const RECEIPT_HASH_OFFSET = 40;
      const RECEIPT_HASH_LEN = 32;

      const fixture = VERIFIED_RECEIPT_FIXTURE;
      const hashBytes = fixture.slice(
        RECEIPT_HASH_OFFSET,
        RECEIPT_HASH_OFFSET + RECEIPT_HASH_LEN
      );

      // First byte should be 0xab (from our test hash)
      expect(hashBytes[0]).toBe(0xab);
      expect(hashBytes[1]).toBe(0xcd);
    });

    it('ReceiptAccount: status at offset 404, length 1', () => {
      const STATUS_OFFSET = 404;

      const verifiedFixture = VERIFIED_RECEIPT_FIXTURE;
      expect(verifiedFixture[STATUS_OFFSET]).toBe(1); // Verified

      const pendingFixture = PENDING_RECEIPT_FIXTURE;
      expect(pendingFixture[STATUS_OFFSET]).toBe(0); // Pending

      const quarantinedFixture = QUARANTINED_RECEIPT_FIXTURE;
      expect(quarantinedFixture[STATUS_OFFSET]).toBe(2); // Quarantined
    });

    it('ReceiptAccount: attestation_count at offset 405, length 1', () => {
      const ATTESTATION_COUNT_OFFSET = 405;

      const fixture = VERIFIED_RECEIPT_FIXTURE;
      expect(fixture[ATTESTATION_COUNT_OFFSET]).toBe(2);
    });

    it('ReceiptAccount: attestations start at offset 406', () => {
      const ATTESTATIONS_OFFSET = 406;
      const ATTESTATION_REF_LEN = 33; // 32 pubkey + 1 verdict

      const fixture = VERIFIED_RECEIPT_FIXTURE;

      // First attester pubkey starts at offset 406
      const firstAttesterStart = ATTESTATIONS_OFFSET;
      const firstAttesterPubkey = fixture.slice(
        firstAttesterStart,
        firstAttesterStart + 32
      );
      expect(firstAttesterPubkey.length).toBe(32);

      // First verdict at offset 438 (406 + 32)
      const firstVerdictOffset = ATTESTATIONS_OFFSET + 32;
      expect(fixture[firstVerdictOffset]).toBe(1); // Approve

      // Second attester starts at offset 439 (406 + 33)
      const secondAttesterStart = ATTESTATIONS_OFFSET + ATTESTATION_REF_LEN;
      expect(secondAttesterStart).toBe(439);
    });

    it('RegistryConfig: min_attestations at offset 72, length 1', () => {
      const MIN_ATTESTATIONS_OFFSET = 72;

      const fixture = REGISTRY_CONFIG_FIXTURE;
      expect(fixture[MIN_ATTESTATIONS_OFFSET]).toBe(2);

      const highQuorumFixture = REGISTRY_CONFIG_HIGH_QUORUM_FIXTURE;
      expect(highQuorumFixture[MIN_ATTESTATIONS_OFFSET]).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles maximum attestations (10)', () => {
      const attesters = Array(10)
        .fill(null)
        .map((_, i) => ({
          pubkey: new Uint8Array(32).fill(i),
          verdict: i % 2 === 0 ? ('approve' as const) : ('reject' as const),
        }));

      const fixture = buildReceiptAccountFixture({
        attestationCount: 10,
        attesters,
      });

      const parsed = parseReceiptAccount(fixture);
      expect(parsed.attestationCount).toBe(10);
      expect(parsed.attesters.length).toBe(10);
    });

    it('handles zero-length bundle_uri', () => {
      // The parsing should handle bundle_uri with len=0
      const fixture = buildReceiptAccountFixture();
      // Modify the u32 length at offset 168 to be 0
      fixture[168] = 0;
      fixture[169] = 0;
      fixture[170] = 0;
      fixture[171] = 0;

      // Should still parse without error
      const parsed = parseReceiptAccount(fixture);
      expect(parsed.status).toBe('verified');
    });

    it('handles all status values', () => {
      const statuses = ['pending', 'verified', 'quarantined'] as const;

      for (const status of statuses) {
        const fixture = buildReceiptAccountFixture({ status });
        const parsed = parseReceiptAccount(fixture);
        expect(parsed.status).toBe(status);
      }
    });
  });
});
