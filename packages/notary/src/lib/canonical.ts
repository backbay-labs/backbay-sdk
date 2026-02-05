import { keccak256, toHex } from "viem";

/**
 * Canonicalize a JSON value for deterministic hashing/signatures.
 *
 * CCJ v1 = RFC 8785 (JCS). After key-sorting, ECMAScript `JSON.stringify()`
 * provides the required number formatting and string escaping.
 *
 * Important: do NOT rely on `JSON.stringify()` to preserve object key order.
 * JavaScript enumerates "array index" keys (e.g. "2", "10") in numeric order,
 * which would violate JCS lexicographic sorting. We therefore render objects
 * manually.
 */
export function canonicalize(value: unknown): string {
  return canonicalizeValue(value);
}

/**
 * Render a value as CCJ v1 canonical JSON.
 */
function canonicalizeValue(value: unknown, path = "$"): string {
  if (value === null) return "null";
  if (value === undefined) throw new Error(`CCJ: undefined is not valid JSON at ${path}`);

  if (Array.isArray(value)) {
    const items = value.map((v, i) => canonicalizeValue(v, `${path}[${i}]`));
    return `[${items.join(",")}]`;
  }

  if (typeof value === "object") {
    // Reject non-plain objects (Date, Map, Buffer, etc) to keep canonicalization predictable.
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new Error(`CCJ: non-plain object at ${path}`);
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();

    const pairs: string[] = [];
    for (const key of keys) {
      const v = record[key];
      // JSON.stringify omits `undefined` object properties; treat it as "absent".
      if (v === undefined) continue;
      pairs.push(`${JSON.stringify(key)}:${canonicalizeValue(v, `${path}.${key}`)}`);
    }
    return `{${pairs.join(",")}}`;
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`CCJ: non-finite number at ${path}`);
    }
    // JSON.stringify(number) implements ECMAScript number serialization.
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "bigint") {
    throw new Error(`CCJ: bigint is not valid JSON at ${path}`);
  }

  if (typeof value === "function" || typeof value === "symbol") {
    throw new Error(`CCJ: unsupported type at ${path}`);
  }

  throw new Error(`CCJ: unsupported type at ${path}: ${typeof value}`);
}

/**
 * Compute keccak256 hash of canonicalized JSON
 *
 * @param obj - Object to hash
 * @returns 0x-prefixed hex string (66 chars)
 */
export function hashObject(obj: unknown): `0x${string}` {
  const canonical = canonicalize(obj);
  const bytes = new TextEncoder().encode(canonical);
  return keccak256(toHex(bytes));
}

/**
 * Compute SHA256 hash of a string or buffer
 *
 * @param data - String or Uint8Array to hash
 * @returns 0x-prefixed hex string (66 chars)
 */
export async function sha256(data: string | Uint8Array): Promise<`0x${string}`> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const normalized = new Uint8Array(bytes);
  const hashBuffer = await crypto.subtle.digest("SHA-256", normalized.buffer);
  const hashArray = new Uint8Array(hashBuffer);
  return `0x${Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Verify that a hash matches the expected value for an object
 */
export function verifyHash(obj: unknown, expectedHash: string): boolean {
  const actualHash = hashObject(obj);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}
