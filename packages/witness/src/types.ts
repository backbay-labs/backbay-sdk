/**
 * Cyntra Verify Types
 */

/**
 * WASM module interface (matches wasm-bindgen output)
 */
export interface CyntraTrustWasm {
  verify_ed25519(publicKeyHex: string, message: Uint8Array, signatureHex: string): boolean;
  hash_sha256(data: Uint8Array): string;
  hash_sha256_prefixed(data: Uint8Array): string;
  hash_keccak256(data: Uint8Array): string;
  verify_merkle_proof(leafHashHex: string, proofJson: string, rootHex: string): boolean;
  compute_merkle_root(leafHashesJson: string): string;
  generate_merkle_proof(leafHashesJson: string, leafIndex: number): string;
  verify_receipt(
    receiptJson: string,
    kernelPubkeyHex: string,
    verifierPubkeyHex: string | null,
    providerPubkeyHex: string | null,
  ): VerificationResult;
  hash_receipt(receiptJson: string, algorithm: string): string;
  get_canonical_json(receiptJson: string): string;
  version(): string;
}

/**
 * Result of receipt verification
 */
export interface VerificationResult {
  valid: boolean;
  kernel_sig_valid: boolean;
  verifier_sig_valid: boolean | null;
  provider_sig_valid: boolean | null;
  errors: string[];
}

/**
 * Set of public keys for verification
 */
export interface PublicKeySet {
  /** Kernel public key (hex, required) */
  kernel: string;
  /** Verifier public key (hex, optional) */
  verifier?: string;
  /** Provider public key (hex, optional) */
  provider?: string;
}

/**
 * Merkle inclusion proof
 */
export interface MerkleProof {
  leaf_hash: string;
  siblings: string[];
  path_bits: boolean[];
  root: string;
}

/**
 * Toolchain identifier.
 *
 * Backbay/Cyntra receipts treat toolchains as an open string (new toolchains must remain parseable).
 */
export type Toolchain = string;

/**
 * Risk level enum
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Provider enum
 */
export type Provider = 'local' | 'e2b' | 'modal' | 'mcp';

/**
 * Universe reference
 */
export interface UniverseRef {
  id: string;
  name: string;
}

/**
 * World reference
 */
export interface WorldRef {
  id: string;
  name: string;
  version?: string;
}

/**
 * Run reference
 */
export interface RunRef {
  id: string;
  timestamp: string;
  git_sha: string;
  toolchain: Toolchain;
}

/**
 * Artifact hashes
 */
export interface Artifacts {
  manifest_hash: string;
  proof_hash?: string;
  primary_asset_hash?: string;
  ledger_root?: string;
  bundle_hash?: string;
  bundle_uri?: string;
  bundle_size_bytes?: number;
  bundle_sig?: string;
  ipfs_cid?: string;
}

/**
 * Verdict result
 */
export interface Verdict {
  passed: boolean;
  gate_id?: string;
  scores?: Record<string, unknown>;
  threshold?: number;
  risk_classification?: RiskLevel;
}

/**
 * Violation reference
 */
export interface ViolationRef {
  guard: string;
  severity: string;
  message: string;
  action?: string;
}

/**
 * Provenance information
 */
export interface Provenance {
  kernel_version?: string;
  provider?: Provider | string;
  provider_attestation?: string;
  policy_hash?: string;
  lease_hash?: string;
  violations?: ViolationRef[];
}

/**
 * External attestation reference
 */
export interface AttestationRef {
  uid: string;
  chain_id: number;
  attester: string;
  timestamp: string;
}

/**
 * Transparency log entry
 */
export interface TransparencyLogRef {
  log_id: string;
  log_index: number;
  inclusion_proof: string;
}

/**
 * RunReceipt v2 (unsigned)
 */
export interface RunReceipt {
  version: string;
  receipt_id: string;
  universe: UniverseRef;
  world: WorldRef;
  run: RunRef;
  artifacts: Artifacts;
  verdict: Verdict;
  provenance?: Provenance;
  signatures?: Signatures;
  attestation?: AttestationRef;
  transparency_log?: TransparencyLogRef;
}

/**
 * Signatures on a receipt
 */
export interface Signatures {
  kernel: string;
  verifier?: string;
  provider?: string;
}

/**
 * Signed RunReceipt
 */
export interface SignedRunReceipt {
  receipt: RunReceipt;
  signatures: Signatures;
}

/**
 * Options for chain verification.
 *
 * Each chain verifier supports both simple and advanced configuration.
 *
 * @example Simple configuration
 * ```ts
 * const options: ChainVerificationOptions = {
 *   rekor: true,
 *   eas: { chainId: 8453 },
 *   solana: { cluster: 'devnet' },
 * };
 * ```
 *
 * @example Advanced configuration with custom endpoints
 * ```ts
 * const options: ChainVerificationOptions = {
 *   rekor: true,
 *   eas: {
 *     chainId: 8453,
 *     graphqlUrl: 'https://my-graphql.example.com',
 *     rpcUrl: 'https://my-rpc.example.com',
 *   },
 *   solana: {
 *     cluster: 'mainnet-beta',
 *     rpcUrl: 'https://my-solana-rpc.example.com',
 *     programIds: {
 *       registryProgramId: 'MyProgramId...',
 *     },
 *   },
 * };
 * ```
 */
export interface ChainVerificationOptions {
  /** Check Sigstore Rekor */
  rekor?: boolean;
  /** Check Ethereum Attestation Service */
  eas?: {
    /** Chain ID (required) */
    chainId: number;
    /**
     * Expected schema id (optional).
     *
     * If provided, verification requires the fetched attestation's schemaId to match.
     * This is a discovery hardening check; cryptographic binding remains `receiptHash`.
     */
    schemaId?: string;
    /** Custom GraphQL endpoint URL (optional) */
    graphqlUrl?: string;
    /** Custom RPC URL for transaction lookups (optional) */
    rpcUrl?: string;
  };
  /** Check Solana Aegis */
  solana?: {
    /** Solana cluster (required) */
    cluster: 'mainnet-beta' | 'devnet' | 'testnet';
    /** Custom RPC endpoint URL (optional) */
    rpcUrl?: string;
    /** Custom program IDs (optional) */
    programIds?: {
      registryProgramId?: string;
      feeMarketProgramId?: string;
    };
    /** Connection commitment level (optional) */
    commitment?: 'processed' | 'confirmed' | 'finalized';
  };
}

/**
 * Rekor verification result
 */
export interface RekorVerification {
  logIndex: number;
  inclusionProof: MerkleProof;
  verified: boolean;
  timestamp: string;
}

/**
 * EAS verification result
 */
export interface EASVerification {
  uid: string;
  attester: string;
  verified: boolean;
  chainId: number;
  blockNumber: number;
  schemaId?: string;
  revoked?: boolean;
  receiptHash?: string;
}

/**
 * Solana verification result
 */
export interface SolanaVerification {
  slot: number;
  receiptHash: string;
  verified: boolean;
  quorumMet: boolean;
}

/**
 * Complete attestation chain verification result
 */
export interface AttestationChain {
  receiptHash: string;
  receipt: SignedRunReceipt | null;
  rekor: RekorVerification | null;
  eas: EASVerification | null;
  solana: SolanaVerification | null;
  allValid: boolean;
}
