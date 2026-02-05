/**
 * Solana Aegis fetcher
 *
 * Fetches attestations from Cyntra's Aegis programs on Solana.
 *
 * ## Configuration
 *
 * Pass a `SolanaConfig` object to override defaults:
 *
 * ```ts
 * const config: SolanaConfig = {
 *   cluster: 'devnet',
 *   rpcUrl: 'https://my-custom-rpc.example.com',  // Custom RPC endpoint
 *   programIds: {
 *     registryProgramId: 'MyProgramId...',
 *   },
 * };
 *
 * const result = await fetchFromSolana(receiptHash, config);
 * ```
 *
 * @module
 */

import { Connection, PublicKey } from '@solana/web3.js';

/** Solana cluster type */
export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

/**
 * Program IDs for Aegis programs.
 */
export interface SolanaProgramIds {
  /** AegisRegistry program id (required) */
  registryProgramId: string;
  /** AegisFeeMarket program id (optional; not deployed in repo by default) */
  feeMarketProgramId?: string;
}

/**
 * Configuration for Solana verification.
 *
 * All fields except `cluster` are optional and have sensible defaults.
 */
export interface SolanaConfig {
  /** Solana cluster (required) */
  cluster: SolanaCluster;
  /** Custom RPC endpoint URL (optional; defaults to public cluster endpoint) */
  rpcUrl?: string;
  /** Custom program IDs (optional; defaults to known IDs for the cluster) */
  programIds?: Partial<SolanaProgramIds>;
  /** Connection commitment level (optional; defaults to 'confirmed') */
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

/** Default program IDs per cluster (source: infra/solana/program_ids.json) */
export const DEFAULT_PROGRAM_IDS: Partial<Record<SolanaCluster, SolanaProgramIds>> = {
  // Source of truth for this ID: infra/solana/program_ids.json
  devnet: {
    registryProgramId: '5612LDBwkX4voFX4PP3mwHnrVigveTEXDxH7tAaxN5P8',
  },
};

/** Default RPC endpoints per cluster */
export const DEFAULT_CLUSTER_ENDPOINTS: Record<SolanaCluster, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

// Legacy alias for backward compatibility
const CLUSTER_ENDPOINTS = DEFAULT_CLUSTER_ENDPOINTS;

export interface SolanaEntry {
  slot: number;
  receiptHash: string;
  verified: boolean;
  attestationCount: number;
  requiredQuorum: number;
  attesters: string[];
}

/** Normalize receipt hash by removing 0x prefix if present */
export function normalizeReceiptHash(receiptHash: string): string {
  return receiptHash.startsWith('0x') ? receiptHash.slice(2) : receiptHash;
}

/** Convert receipt hash hex string to bytes */
export function receiptHashToBytes(receiptHash: string): Uint8Array {
  const normalized = normalizeReceiptHash(receiptHash).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error(`Invalid receipt hash (expected 32 bytes hex): ${receiptHash}`);
  }
  return Uint8Array.from(Buffer.from(normalized, 'hex'));
}

/** Parse little-endian u32 from buffer */
export function parseU32LE(data: Uint8Array, offset: number): number {
  // Anchor uses little-endian u32 for string lengths.
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  ) >>> 0;
}

/**
 * Parse ReceiptAccount from raw account data.
 *
 * Layout offsets (matches infra/solana/programs/aegis_registry/src/lib.rs):
 *   0..8     discriminator
 *   8..40    submitter pubkey
 *   40..72   receipt_hash [u8;32]
 *   72..104  manifest_hash [u8;32]
 *   104..136 policy_hash [u8;32]
 *   136..168 bundle_hash [u8;32]
 *   168..372 bundle_uri: u32 len + 200 bytes
 *   372..404 ledger_root [u8;32]
 *   404..405 status u8 (0=Pending, 1=Verified, 2=Quarantined)
 *   405..406 attestation_count u8
 *   406..736 attestations: 10 * (pubkey(32) + verdict(1))
 */
export function parseReceiptAccount(data: Uint8Array): {
  receiptHash: string;
  status: 'pending' | 'verified' | 'quarantined';
  attestationCount: number;
  attesters: string[];
} {
  // Anchor account layout (see infra/solana/programs/aegis_registry/src/lib.rs):
  // 0..8   discriminator
  // 8..40  submitter pubkey
  // 40..72 receipt_hash [u8;32]
  // 72..104 manifest_hash [u8;32]
  // 104..136 policy_hash [u8;32]
  // 136..168 bundle_hash [u8;32]
  // 168..372 bundle_uri: u32 len + 200 bytes
  // 372..404 ledger_root [u8;32]
  // 404..405 status u8
  // 405..406 attestation_count u8
  // 406..736 attestations: 10 * (pubkey(32) + verdict(1))
  const DISCRIMINATOR = 8;
  const PUBKEY = 32;
  const HASH = 32;
  const MAX_URI_LEN = 200;
  const MAX_ATTESTATIONS = 10;
  const ATTESTATION_REF_LEN = 33;

  let offset = DISCRIMINATOR;
  offset += PUBKEY; // submitter

  const receiptHashBytes = data.slice(offset, offset + HASH);
  offset += HASH;

  offset += HASH; // manifest_hash
  offset += HASH; // policy_hash
  offset += HASH; // bundle_hash

  const bundleUriLen = parseU32LE(data, offset);
  if (bundleUriLen > MAX_URI_LEN) {
    throw new Error(`Invalid bundle_uri length: ${bundleUriLen}`);
  }
  offset += 4;
  // Skip over the inlined max-length buffer regardless of actual length.
  offset += MAX_URI_LEN;

  offset += HASH; // ledger_root

  const statusByte = data[offset];
  offset += 1;

  const attestationCount = data[offset];
  offset += 1;

  const status: 'pending' | 'verified' | 'quarantined' =
    statusByte === 1 ? 'verified' : statusByte === 2 ? 'quarantined' : 'pending';

  const attesters: string[] = [];
  const max = Math.min(attestationCount, MAX_ATTESTATIONS);
  for (let i = 0; i < max; i++) {
    const start = offset + i * ATTESTATION_REF_LEN;
    const verifierPk = new PublicKey(data.slice(start, start + 32));
    attesters.push(verifierPk.toBase58());
  }

  return {
    receiptHash: `0x${Buffer.from(receiptHashBytes).toString('hex')}`,
    status,
    attestationCount,
    attesters,
  };
}

/**
 * Parse RegistryConfig from raw account data.
 *
 * Layout offsets:
 *   0..8   discriminator
 *   8..40  authority pubkey
 *   40..72 default_policy_hash [u8;32]
 *   72..73 min_attestations u8
 */
export function parseRegistryConfig(data: Uint8Array): { minAttestations: number } {
  // Layout (see infra/solana/programs/aegis_registry/src/lib.rs):
  // 0..8 discriminator
  // 8..40 authority pubkey
  // 40..72 default_policy_hash [u8;32]
  // 72..73 min_attestations u8
  const offset = 8 + 32 + 32;
  return { minAttestations: data[offset] ?? 1 };
}

/**
 * Fetch attestation from Solana Aegis Registry.
 *
 * Supports two call signatures:
 *
 * 1. Config object (recommended):
 *    ```ts
 *    fetchFromSolana(receiptHash, {
 *      cluster: 'devnet',
 *      rpcUrl: 'https://my-rpc.example.com',
 *      programIds: { registryProgramId: '...' },
 *    });
 *    ```
 *
 * 2. Legacy (deprecated):
 *    ```ts
 *    fetchFromSolana(receiptHash, 'devnet', { registryProgramId: '...' });
 *    ```
 *
 * @param receiptHash - The receipt hash to look up (0x-prefixed or raw hex)
 * @param configOrCluster - SolanaConfig object or cluster string (legacy)
 * @param legacyProgramIds - Program IDs (only used with legacy cluster string)
 * @returns Solana entry or null if not found
 */
export async function fetchFromSolana(
  receiptHash: string,
  configOrCluster: SolanaConfig | SolanaCluster,
  legacyProgramIds?: Partial<SolanaProgramIds>,
): Promise<SolanaEntry | null> {
  // Normalize config: support both new config object and legacy signature
  const config: SolanaConfig =
    typeof configOrCluster === 'string'
      ? { cluster: configOrCluster, programIds: legacyProgramIds }
      : configOrCluster;

  const { cluster, rpcUrl, programIds, commitment = 'confirmed' } = config;

  const endpoint = rpcUrl ?? CLUSTER_ENDPOINTS[cluster];
  const connection = new Connection(endpoint, commitment);

  const ids = programIds?.registryProgramId
    ? (programIds as SolanaProgramIds)
    : DEFAULT_PROGRAM_IDS[cluster];
  if (!ids?.registryProgramId) {
    console.warn(`Solana program id not configured for cluster=${cluster}; skipping Solana check`);
    return null;
  }

  try {
    // Derive PDA for receipt account
    const receiptSeed = Buffer.from(receiptHashToBytes(receiptHash));
    const [receiptPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('receipt'), receiptSeed],
      new PublicKey(ids.registryProgramId),
    );

    // Fetch account data
    const accountInfo = await connection.getAccountInfo(receiptPDA);

    if (!accountInfo) {
      // Fee market not shipped by default (program id usually unset).
      if (ids.feeMarketProgramId) {
        return await fetchFromFeeMarket(connection, receiptHash, ids.feeMarketProgramId);
      }
      return null;
    }

    const parsed = parseReceiptAccount(
      accountInfo.data instanceof Uint8Array ? accountInfo.data : new Uint8Array(accountInfo.data),
    );

    // Fetch required quorum from config PDA.
    let requiredQuorum = 1;
    try {
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        new PublicKey(ids.registryProgramId),
      );
      const configInfo = await connection.getAccountInfo(configPDA);
      if (configInfo?.data) {
        requiredQuorum = parseRegistryConfig(
          configInfo.data instanceof Uint8Array ? configInfo.data : new Uint8Array(configInfo.data),
        ).minAttestations;
      }
    } catch {
      // Best-effort; quorum remains 1.
    }

    // Best-effort slot: most recent signature touching the receipt account.
    let slot = 0;
    try {
      const sigs = await connection.getSignaturesForAddress(receiptPDA, { limit: 1 });
      if (sigs.length > 0) slot = sigs[0].slot;
    } catch {
      // Best-effort; slot remains 0.
    }

    return {
      slot,
      receiptHash: parsed.receiptHash,
      verified: parsed.status === 'verified',
      attestationCount: parsed.attestationCount,
      requiredQuorum,
      attesters: parsed.attesters,
    };
  } catch (error) {
    console.error('Solana fetch error:', error);
    return null;
  }
}

/**
 * Fallback: fetch from fee market task account
 */
async function fetchFromFeeMarket(
  connection: Connection,
  receiptHash: string,
  feeMarketProgramId: string,
): Promise<SolanaEntry | null> {
  try {
    const receiptSeed = Buffer.from(receiptHashToBytes(receiptHash));
    const [taskPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('task'), receiptSeed],
      new PublicKey(feeMarketProgramId),
    );

    const accountInfo = await connection.getAccountInfo(taskPDA);

    if (!accountInfo) {
      return null;
    }

    // Fee market parsing is intentionally left as a follow-up once the program is deployed and
    // a stable account layout is finalized.
    return null;
  } catch {
    return null;
  }
}

/**
 * Get latest slot from Solana.
 *
 * @param configOrCluster - SolanaConfig object or cluster string
 * @returns Latest slot number or null on error
 */
export async function getLatestSlot(
  configOrCluster: SolanaConfig | SolanaCluster,
): Promise<number | null> {
  const config: SolanaConfig =
    typeof configOrCluster === 'string'
      ? { cluster: configOrCluster }
      : configOrCluster;

  const endpoint = config.rpcUrl ?? CLUSTER_ENDPOINTS[config.cluster];
  const connection = new Connection(endpoint, config.commitment ?? 'confirmed');

  try {
    return await connection.getSlot();
  } catch {
    return null;
  }
}

/**
 * Create a Solana connection from config.
 *
 * Useful for advanced use cases where you need direct connection access.
 *
 * @param config - SolanaConfig object
 * @returns Solana Connection instance
 */
export function createConnection(config: SolanaConfig): Connection {
  const endpoint = config.rpcUrl ?? CLUSTER_ENDPOINTS[config.cluster];
  return new Connection(endpoint, config.commitment ?? 'confirmed');
}

/**
 * Derive the receipt PDA for a given hash.
 *
 * This is a pure function that does not make network calls.
 * Useful for offline verification and testing.
 *
 * @param receiptHash - Receipt hash (0x-prefixed or raw hex)
 * @param programId - Registry program ID
 * @returns [PDA PublicKey, bump seed]
 */
export function deriveReceiptPDA(
  receiptHash: string,
  programId: string,
): [PublicKey, number] {
  const receiptSeed = Buffer.from(receiptHashToBytes(receiptHash));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('receipt'), receiptSeed],
    new PublicKey(programId),
  );
}

/**
 * Derive the config PDA for a program.
 *
 * This is a pure function that does not make network calls.
 *
 * @param programId - Registry program ID
 * @returns [PDA PublicKey, bump seed]
 */
export function deriveConfigPDA(programId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    new PublicKey(programId),
  );
}
