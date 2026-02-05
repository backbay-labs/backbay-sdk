/**
 * Solana test fixtures for offline verification testing.
 *
 * These fixtures match the Anchor account layout from:
 *   infra/solana/programs/aegis_registry/src/lib.rs
 *
 * Layout constants (ReceiptAccount):
 *   - 8 bytes: discriminator
 *   - 32 bytes: submitter pubkey
 *   - 32 bytes: receipt_hash
 *   - 32 bytes: manifest_hash
 *   - 32 bytes: policy_hash
 *   - 32 bytes: bundle_hash
 *   - 4 + 200 bytes: bundle_uri (u32 len + max 200 chars)
 *   - 32 bytes: ledger_root
 *   - 1 byte: status (0=Pending, 1=Verified, 2=Quarantined)
 *   - 1 byte: attestation_count
 *   - 330 bytes: attestations (10 * (32 pubkey + 1 verdict))
 *   - 8 bytes: created_at
 *   - 8 bytes: updated_at
 *   - 1 byte: bump
 *   Total: 753 bytes
 *
 * Layout constants (RegistryConfig):
 *   - 8 bytes: discriminator
 *   - 32 bytes: authority pubkey
 *   - 32 bytes: default_policy_hash
 *   - 1 byte: min_attestations
 *   - 8 bytes: total_receipts
 *   - 8 bytes: created_at
 *   - 8 bytes: updated_at
 *   - 1 byte: bump
 *   Total: 98 bytes
 */

// Known test values (deterministic for testing)
export const TEST_RECEIPT_HASH =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
export const TEST_MANIFEST_HASH =
  '0x1111111111111111111111111111111111111111111111111111111111111111';
export const TEST_POLICY_HASH =
  '0x2222222222222222222222222222222222222222222222222222222222222222';
export const TEST_BUNDLE_HASH =
  '0x3333333333333333333333333333333333333333333333333333333333333333';
export const TEST_LEDGER_ROOT =
  '0x4444444444444444444444444444444444444444444444444444444444444444';
export const TEST_BUNDLE_URI = 'ipfs://QmTest123456789';
export const TEST_SUBMITTER_B58 = '11111111111111111111111111111111';
export const TEST_VERIFIER1_B58 = '22222222222222222222222222222222';
export const TEST_VERIFIER2_B58 = '33333333333333333333333333333333';

// Registry program ID (from infra/solana/program_ids.json)
export const TEST_REGISTRY_PROGRAM_ID =
  '5612LDBwkX4voFX4PP3mwHnrVigveTEXDxH7tAaxN5P8';

// Expected PDA for TEST_RECEIPT_HASH (deterministic)
// Computed via: PublicKey.findProgramAddressSync(
//   [Buffer.from('receipt'), Buffer.from(receiptHashBytes)],
//   new PublicKey(TEST_REGISTRY_PROGRAM_ID)
// )
// NOTE: The actual value depends on the receipt hash bytes
export const TEST_RECEIPT_PDA = 'FEBXvbCZDJjbmq1fhU2YQzJoWVnHzHMqKGSAZvGwnK7P';

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function pubkeyBytes(base58: string): Uint8Array {
  // For test fixtures, we use deterministic pubkey bytes
  // In real code, we'd use @solana/web3.js PublicKey
  // For testing, we fill with the character repeated
  const char = base58[0];
  const bytes = new Uint8Array(32);
  const val = char === '1' ? 0 : char === '2' ? 1 : char === '3' ? 2 : 0;
  bytes.fill(val);
  return bytes;
}

function writeU32LE(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  bytes[0] = value & 0xff;
  bytes[1] = (value >> 8) & 0xff;
  bytes[2] = (value >> 16) & 0xff;
  bytes[3] = (value >> 24) & 0xff;
  return bytes;
}

function writeI64LE(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number((value >> BigInt(i * 8)) & BigInt(0xff));
  }
  return bytes;
}

/**
 * Build a mock ReceiptAccount buffer matching the Anchor layout.
 */
export function buildReceiptAccountFixture(opts: {
  status?: 'pending' | 'verified' | 'quarantined';
  attestationCount?: number;
  attesters?: Array<{ pubkey: Uint8Array; verdict: 'approve' | 'reject' }>;
} = {}): Uint8Array {
  const status = opts.status ?? 'verified';
  const attestationCount = opts.attestationCount ?? 2;
  const attesters = opts.attesters ?? [
    { pubkey: pubkeyBytes(TEST_VERIFIER1_B58), verdict: 'approve' as const },
    { pubkey: pubkeyBytes(TEST_VERIFIER2_B58), verdict: 'approve' as const },
  ];

  // Total size: 753 bytes
  const buffer = new Uint8Array(753);
  let offset = 0;

  // Discriminator (8 bytes) - Anchor uses a hash of the account name
  const discriminator = new Uint8Array(8).fill(0xaa);
  buffer.set(discriminator, offset);
  offset += 8;

  // Submitter (32 bytes)
  buffer.set(pubkeyBytes(TEST_SUBMITTER_B58), offset);
  offset += 32;

  // Receipt hash (32 bytes)
  buffer.set(hexToBytes(TEST_RECEIPT_HASH), offset);
  offset += 32;

  // Manifest hash (32 bytes)
  buffer.set(hexToBytes(TEST_MANIFEST_HASH), offset);
  offset += 32;

  // Policy hash (32 bytes)
  buffer.set(hexToBytes(TEST_POLICY_HASH), offset);
  offset += 32;

  // Bundle hash (32 bytes)
  buffer.set(hexToBytes(TEST_BUNDLE_HASH), offset);
  offset += 32;

  // Bundle URI (4 bytes len + 200 bytes data)
  const uriBytes = new TextEncoder().encode(TEST_BUNDLE_URI);
  buffer.set(writeU32LE(uriBytes.length), offset);
  offset += 4;
  buffer.set(uriBytes, offset);
  offset += 200; // Always 200 bytes reserved

  // Ledger root (32 bytes)
  buffer.set(hexToBytes(TEST_LEDGER_ROOT), offset);
  offset += 32;

  // Status (1 byte)
  const statusByte =
    status === 'verified' ? 1 : status === 'quarantined' ? 2 : 0;
  buffer[offset] = statusByte;
  offset += 1;

  // Attestation count (1 byte)
  buffer[offset] = attestationCount;
  offset += 1;

  // Attestations (10 * 33 = 330 bytes)
  for (let i = 0; i < 10; i++) {
    const att = attesters[i];
    if (att) {
      buffer.set(att.pubkey, offset);
      offset += 32;
      buffer[offset] = att.verdict === 'approve' ? 1 : 0;
      offset += 1;
    } else {
      // Empty attestation slot
      offset += 33;
    }
  }

  // created_at (8 bytes) - timestamp
  buffer.set(writeI64LE(BigInt(1704067200)), offset); // 2024-01-01
  offset += 8;

  // updated_at (8 bytes) - timestamp
  buffer.set(writeI64LE(BigInt(1704153600)), offset); // 2024-01-02
  offset += 8;

  // bump (1 byte)
  buffer[offset] = 255;

  return buffer;
}

/**
 * Build a mock RegistryConfig buffer matching the Anchor layout.
 */
export function buildRegistryConfigFixture(opts: {
  minAttestations?: number;
} = {}): Uint8Array {
  const minAttestations = opts.minAttestations ?? 2;

  // Total size: 98 bytes
  const buffer = new Uint8Array(98);
  let offset = 0;

  // Discriminator (8 bytes)
  const discriminator = new Uint8Array(8).fill(0xbb);
  buffer.set(discriminator, offset);
  offset += 8;

  // Authority (32 bytes)
  buffer.set(pubkeyBytes(TEST_SUBMITTER_B58), offset);
  offset += 32;

  // Default policy hash (32 bytes)
  buffer.set(hexToBytes(TEST_POLICY_HASH), offset);
  offset += 32;

  // Min attestations (1 byte)
  buffer[offset] = minAttestations;
  offset += 1;

  // Total receipts (8 bytes) - u64
  buffer.set(writeI64LE(BigInt(42)), offset);
  offset += 8;

  // created_at (8 bytes)
  buffer.set(writeI64LE(BigInt(1704067200)), offset);
  offset += 8;

  // updated_at (8 bytes)
  buffer.set(writeI64LE(BigInt(1704153600)), offset);
  offset += 8;

  // bump (1 byte)
  buffer[offset] = 254;

  return buffer;
}

/**
 * Fixture for a verified receipt with 2 attestations meeting quorum.
 */
export const VERIFIED_RECEIPT_FIXTURE = buildReceiptAccountFixture({
  status: 'verified',
  attestationCount: 2,
});

/**
 * Fixture for a pending receipt with no attestations.
 */
export const PENDING_RECEIPT_FIXTURE = buildReceiptAccountFixture({
  status: 'pending',
  attestationCount: 0,
  attesters: [],
});

/**
 * Fixture for a quarantined receipt (rejected).
 */
export const QUARANTINED_RECEIPT_FIXTURE = buildReceiptAccountFixture({
  status: 'quarantined',
  attestationCount: 2,
  attesters: [
    { pubkey: pubkeyBytes(TEST_VERIFIER1_B58), verdict: 'reject' },
    { pubkey: pubkeyBytes(TEST_VERIFIER2_B58), verdict: 'reject' },
  ],
});

/**
 * Fixture for registry config with min_attestations = 2.
 */
export const REGISTRY_CONFIG_FIXTURE = buildRegistryConfigFixture({
  minAttestations: 2,
});

/**
 * Fixture for registry config with min_attestations = 3 (higher quorum).
 */
export const REGISTRY_CONFIG_HIGH_QUORUM_FIXTURE = buildRegistryConfigFixture({
  minAttestations: 3,
});
