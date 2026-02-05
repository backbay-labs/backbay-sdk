/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const compute_merkle_root: (a: number, b: number) => [number, number, number, number];
export const generate_merkle_proof: (a: number, b: number, c: number) => [number, number, number, number];
export const get_canonical_json: (a: number, b: number) => [number, number, number, number];
export const hash_keccak256: (a: number, b: number) => [number, number];
export const hash_receipt: (a: number, b: number, c: number, d: number) => [number, number, number, number];
export const hash_sha256: (a: number, b: number) => [number, number];
export const hash_sha256_prefixed: (a: number, b: number) => [number, number];
export const verify_ed25519: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
export const verify_merkle_proof: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
export const verify_receipt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
export const version: () => [number, number];
export const init: () => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
