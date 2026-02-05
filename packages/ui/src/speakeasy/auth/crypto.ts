/**
 * Speakeasy crypto helpers (browser-first WebCrypto)
 */

export function utf8ToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(normalized)) {
    throw new Error('[Speakeasy] Invalid hex');
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function randomHex(byteLength: number): string {
  if (
    typeof globalThis.crypto === 'undefined' ||
    typeof globalThis.crypto.getRandomValues !== 'function'
  ) {
    throw new Error('[Speakeasy] crypto.getRandomValues is required');
  }
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function requireSubtle(): Promise<SubtleCrypto> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('[Speakeasy] crypto.subtle is required');
  }
  return subtle;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const subtle = await requireSubtle();
  const hash = await subtle.digest('SHA-256', data as unknown as BufferSource);
  return new Uint8Array(hash);
}

export async function hmacSha256(
  keyBytes: Uint8Array,
  messageBytes: Uint8Array
): Promise<Uint8Array> {
  const subtle = await requireSubtle();
  const key = await subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await subtle.sign('HMAC', key, messageBytes as unknown as BufferSource);
  return new Uint8Array(sig);
}

