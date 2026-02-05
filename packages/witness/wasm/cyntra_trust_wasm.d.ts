/* tslint:disable */
/* eslint-disable */

/**
 * Compute Merkle root from leaf hashes.
 *
 * # Arguments
 * * `leaf_hashes_json` - JSON array of hex-encoded leaf hashes
 *
 * # Returns
 * Hex-encoded Merkle root (with 0x prefix)
 */
export function compute_merkle_root(leaf_hashes_json: string): string;

/**
 * Generate a Merkle proof for a specific leaf index.
 *
 * # Arguments
 * * `leaf_hashes_json` - JSON array of hex-encoded leaf hashes
 * * `leaf_index` - Index of the leaf to prove (0-based)
 *
 * # Returns
 * JSON-serialized MerkleProof
 */
export function generate_merkle_proof(leaf_hashes_json: string, leaf_index: number): string;

/**
 * Get the canonical JSON representation of a receipt.
 * This is the exact bytes that are signed.
 *
 * # Arguments
 * * `receipt_json` - JSON-serialized RunReceipt
 *
 * # Returns
 * Canonical JSON string (sorted keys, no extra whitespace)
 */
export function get_canonical_json(receipt_json: string): string;

/**
 * Compute Keccak-256 hash of data (Ethereum-compatible).
 *
 * # Arguments
 * * `data` - The bytes to hash
 *
 * # Returns
 * Hex-encoded hash with 0x prefix (66 characters)
 */
export function hash_keccak256(data: Uint8Array): string;

/**
 * Hash a RunReceipt to get its canonical hash.
 *
 * # Arguments
 * * `receipt_json` - JSON-serialized RunReceipt (unsigned)
 * * `algorithm` - "sha256" or "keccak256"
 *
 * # Returns
 * Hex-encoded hash with 0x prefix
 */
export function hash_receipt(receipt_json: string, algorithm: string): string;

/**
 * Compute SHA-256 hash of data.
 *
 * # Arguments
 * * `data` - The bytes to hash
 *
 * # Returns
 * Hex-encoded hash (64 characters, no prefix)
 */
export function hash_sha256(data: Uint8Array): string;

/**
 * Compute SHA-256 hash with 0x prefix.
 */
export function hash_sha256_prefixed(data: Uint8Array): string;

/**
 * Initialize the WASM module (call once at startup)
 */
export function init(): void;

/**
 * Verify an Ed25519 signature over a message.
 *
 * # Arguments
 * * `public_key_hex` - Hex-encoded public key (32 bytes, with or without 0x prefix)
 * * `message` - The message bytes that were signed
 * * `signature_hex` - Hex-encoded signature (64 bytes, with or without 0x prefix)
 *
 * # Returns
 * `true` if the signature is valid, `false` otherwise
 */
export function verify_ed25519(public_key_hex: string, message: Uint8Array, signature_hex: string): boolean;

/**
 * Verify a Merkle inclusion proof.
 *
 * # Arguments
 * * `leaf_hash_hex` - Hex-encoded leaf hash
 * * `proof_json` - JSON-serialized MerkleProof
 * * `root_hex` - Hex-encoded expected root hash
 *
 * # Returns
 * `true` if the proof is valid, `false` otherwise
 */
export function verify_merkle_proof(leaf_hash_hex: string, proof_json: string, root_hex: string): boolean;

/**
 * Verify a signed RunReceipt.
 *
 * # Arguments
 * * `receipt_json` - JSON-serialized SignedRunReceipt
 * * `kernel_pubkey_hex` - Hex-encoded kernel public key
 * * `verifier_pubkey_hex` - Optional hex-encoded verifier public key
 * * `provider_pubkey_hex` - Optional hex-encoded provider public key
 *
 * # Returns
 * JavaScript object with verification result:
 * ```json
 * {
 *   "valid": true,
 *   "kernel_sig_valid": true,
 *   "verifier_sig_valid": true,
 *   "provider_sig_valid": null,
 *   "errors": []
 * }
 * ```
 */
export function verify_receipt(receipt_json: string, kernel_pubkey_hex: string, verifier_pubkey_hex?: string | null, provider_pubkey_hex?: string | null): any;

/**
 * Get version information about this WASM module.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly compute_merkle_root: (a: number, b: number) => [number, number, number, number];
  readonly generate_merkle_proof: (a: number, b: number, c: number) => [number, number, number, number];
  readonly get_canonical_json: (a: number, b: number) => [number, number, number, number];
  readonly hash_keccak256: (a: number, b: number) => [number, number];
  readonly hash_receipt: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly hash_sha256: (a: number, b: number) => [number, number];
  readonly hash_sha256_prefixed: (a: number, b: number) => [number, number];
  readonly verify_ed25519: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly verify_merkle_proof: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly verify_receipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
  readonly version: () => [number, number];
  readonly init: () => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
