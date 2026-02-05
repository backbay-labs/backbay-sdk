/**
 * @backbay/witness - Browser-side verification of Backbay attestations
 *
 * This package provides cryptographic verification of Backbay RunReceipts
 * directly in the browser using WebAssembly, enabling trustless verification.
 *
 * @example
 * ```ts
 * import { initWasm, verifyReceipt, fetchAndVerifyChain } from '@backbay/witness';
 *
 * // Initialize WASM (call once at startup)
 * await initWasm();
 *
 * // Verify a signed receipt
 * const result = await verifyReceipt(receipt, {
 *   kernel: '0x...',
 *   verifier: '0x...',
 * });
 *
 * if (result.valid) {
 *   console.log('Receipt verified!');
 * }
 *
 * // Verify complete attestation chain
 * const chain = await fetchAndVerifyChain(receipt, {
 *   rekor: true,
 *   eas: { chainId: 8453 },  // Base
 *   solana: { cluster: 'mainnet-beta' },
 * });
 * ```
 */

import { getWasm, initWasm, isWasmInitialized } from './wasm';
import type {
  SignedRunReceipt,
  VerificationResult,
  PublicKeySet,
  MerkleProof,
  AttestationChain,
  ChainVerificationOptions,
} from './types';

// Re-export WASM loader
export { initWasm, isWasmInitialized, getWasmVersion } from './wasm';

// Re-export types
export * from './types';

/**
 * Verify a signed RunReceipt.
 *
 * @param receipt - The signed receipt to verify
 * @param publicKeys - Public keys for verification
 * @returns Verification result with details
 *
 * @example
 * ```ts
 * const result = verifyReceipt(signedReceipt, {
 *   kernel: '0xabc123...',
 *   verifier: '0xdef456...',
 * });
 *
 * if (result.valid) {
 *   console.log('All signatures valid');
 * } else {
 *   console.error('Verification failed:', result.errors);
 * }
 * ```
 */
export function verifyReceipt(
  receipt: SignedRunReceipt,
  publicKeys: PublicKeySet,
): VerificationResult {
  const wasm = getWasm();
  return wasm.verify_receipt(
    JSON.stringify(receipt),
    publicKeys.kernel,
    publicKeys.verifier ?? null,
    publicKeys.provider ?? null,
  );
}

/**
 * Verify a Merkle inclusion proof.
 *
 * @param leafHash - Hash of the leaf to verify (hex)
 * @param proof - Merkle proof
 * @param root - Expected Merkle root (hex)
 * @returns true if proof is valid
 */
export function verifyMerkleProof(
  leafHash: string,
  proof: MerkleProof,
  root: string,
): boolean {
  const wasm = getWasm();
  return wasm.verify_merkle_proof(leafHash, JSON.stringify(proof), root);
}

/**
 * Compute SHA-256 hash of data.
 *
 * @param data - Data to hash
 * @returns Hex-encoded hash (no prefix)
 */
export function sha256(data: Uint8Array): string {
  const wasm = getWasm();
  return wasm.hash_sha256(data);
}

/**
 * Compute SHA-256 hash with 0x prefix.
 *
 * @param data - Data to hash
 * @returns Hex-encoded hash with 0x prefix
 */
export function sha256Prefixed(data: Uint8Array): string {
  const wasm = getWasm();
  return wasm.hash_sha256_prefixed(data);
}

/**
 * Compute Keccak-256 hash (Ethereum-compatible).
 *
 * @param data - Data to hash
 * @returns Hex-encoded hash with 0x prefix
 */
export function keccak256(data: Uint8Array): string {
  const wasm = getWasm();
  return wasm.hash_keccak256(data);
}

/**
 * Verify an Ed25519 signature.
 *
 * @param publicKey - Hex-encoded public key (32 bytes)
 * @param message - Message bytes
 * @param signature - Hex-encoded signature (64 bytes)
 * @returns true if signature is valid
 */
export function verifySignature(
  publicKey: string,
  message: Uint8Array,
  signature: string,
): boolean {
  const wasm = getWasm();
  return wasm.verify_ed25519(publicKey, message, signature);
}

/**
 * Compute Merkle root from leaf hashes.
 *
 * @param leafHashes - Array of hex-encoded leaf hashes
 * @returns Hex-encoded Merkle root with 0x prefix
 */
export function computeMerkleRoot(leafHashes: string[]): string {
  const wasm = getWasm();
  return wasm.compute_merkle_root(JSON.stringify(leafHashes));
}

/**
 * Generate a Merkle proof for a specific leaf.
 *
 * @param leafHashes - Array of hex-encoded leaf hashes
 * @param leafIndex - Index of the leaf to prove (0-based)
 * @returns Merkle proof
 */
export function generateMerkleProof(
  leafHashes: string[],
  leafIndex: number,
): MerkleProof {
  const wasm = getWasm();
  const proofJson = wasm.generate_merkle_proof(
    JSON.stringify(leafHashes),
    leafIndex,
  );
  return JSON.parse(proofJson);
}

/**
 * Hash a receipt to get its canonical hash.
 *
 * @param receipt - Unsigned receipt
 * @param algorithm - 'sha256' or 'keccak256'
 * @returns Hex-encoded hash with 0x prefix
 */
export function hashReceipt(
  receipt: SignedRunReceipt['receipt'],
  algorithm: 'sha256' | 'keccak256' = 'sha256',
): string {
  const wasm = getWasm();
  return wasm.hash_receipt(JSON.stringify(receipt), algorithm);
}

/**
 * Get canonical JSON representation of a receipt.
 * This is the exact bytes that are signed.
 *
 * @param receipt - Receipt to serialize
 * @returns Canonical JSON string
 */
export function getCanonicalJson(receipt: SignedRunReceipt['receipt']): string {
  const wasm = getWasm();
  return wasm.get_canonical_json(JSON.stringify(receipt));
}

/**
 * Encode a string to UTF-8 bytes.
 * Utility function for hashing strings.
 */
export function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Fetch and verify a complete attestation chain.
 *
 * This fetches attestations from multiple sources (Rekor, EAS, Solana)
 * and verifies each one locally using WASM.
 *
 * @param receipt - Receipt hash (hex) or receipt object to verify
 * @param options - Which chains to verify
 * @returns Complete verification result
 *
 * @example
 * ```ts
 * const chain = await fetchAndVerifyChain('0x...', {
 *   rekor: true,
 *   eas: { chainId: 8453 },
 *   solana: { cluster: 'mainnet-beta' },
 * });
 *
 * if (chain.allValid) {
 *   console.log('All attestations verified!');
 * }
 * ```
 */
type ReceiptInput = string | SignedRunReceipt['receipt'] | SignedRunReceipt;

function resolveReceiptContext(receipt: ReceiptInput): {
  receiptHash: string;
  runId?: string;
} {
  if (typeof receipt === 'string') {
    return { receiptHash: receipt };
  }

  const normalizedReceipt = 'receipt' in receipt ? receipt.receipt : receipt;
  return {
    receiptHash: hashReceipt(normalizedReceipt),
    runId: normalizedReceipt.run?.id,
  };
}

export async function fetchAndVerifyChain(
  receipt: ReceiptInput,
  options: ChainVerificationOptions,
): Promise<AttestationChain> {
  // Lazy import fetchers to reduce bundle size when not used
  if (typeof receipt !== 'string' && !isWasmInitialized()) {
    await initWasm();
  }
  const { receiptHash, runId } = resolveReceiptContext(receipt);
  const chain: AttestationChain = {
    receiptHash,
    receipt: null,
    rekor: null,
    eas: null,
    solana: null,
    allValid: false,
  };

  const tasks: Promise<void>[] = [];

  if (options.rekor) {
    tasks.push(
      (async () => {
        const { fetchFromRekor } = await import('./fetchers/rekor');
        const result = await fetchFromRekor(receiptHash);
        if (result) {
          chain.rekor = {
            logIndex: result.logIndex,
            inclusionProof: result.inclusionProof,
            verified: verifyMerkleProof(
              result.leafHash,
              result.inclusionProof,
              result.treeRoot,
            ),
            timestamp: result.integratedTime,
          };
        }
      })(),
    );
  }

  if (options.eas) {
    tasks.push(
      (async () => {
        const { fetchFromEAS } = await import('./fetchers/eas');
        const result = await fetchFromEAS(
          receiptHash,
          {
            chainId: options.eas!.chainId,
            schemaId: options.eas!.schemaId,
            graphqlUrl: options.eas!.graphqlUrl,
            rpcUrl: options.eas!.rpcUrl,
          },
          runId,
        );
        if (result) {
          const expectedSchema = options.eas!.schemaId?.toLowerCase();
          const schemaOk = !expectedSchema || result.schemaId.toLowerCase() === expectedSchema;

          const attestedHash = result.receiptHash?.toLowerCase();
          const receiptHashOk = !!attestedHash && attestedHash === receiptHash.toLowerCase();

          const revoked = (result.revocationTime ?? 0) > 0;
          chain.eas = {
            uid: result.uid,
            attester: result.attester,
            verified: schemaOk && receiptHashOk && !revoked,
            chainId: options.eas!.chainId,
            blockNumber: result.blockNumber,
            schemaId: result.schemaId,
            revoked,
            receiptHash: result.receiptHash,
          };
        }
      })(),
    );
  }

  if (options.solana) {
    tasks.push(
      (async () => {
        const { fetchFromSolana } = await import('./fetchers/solana');
        const result = await fetchFromSolana(receiptHash, {
          cluster: options.solana!.cluster,
          rpcUrl: options.solana!.rpcUrl,
          programIds: options.solana!.programIds,
          commitment: options.solana!.commitment,
        });
        if (result) {
          chain.solana = {
            slot: result.slot,
            receiptHash: result.receiptHash,
            verified: result.verified,
            quorumMet: result.attestationCount >= result.requiredQuorum,
          };
        }
      })(),
    );
  }

  await Promise.all(tasks);

  // Compute overall validity
  const results = [
    chain.rekor?.verified,
    chain.eas?.verified,
    chain.solana?.verified,
  ].filter((v) => v !== null && v !== undefined);

  chain.allValid = results.length > 0 && results.every((v) => v === true);

  return chain;
}
