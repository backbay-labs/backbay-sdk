/**
 * Sigstore Rekor fetcher
 *
 * Fetches transparency log entries from Rekor public instance.
 */

import type { MerkleProof } from '../types';

const REKOR_API = 'https://rekor.sigstore.dev/api/v1';

export interface RekorEntry {
  logIndex: number;
  leafHash: string;
  treeRoot: string;
  inclusionProof: MerkleProof;
  integratedTime: string;
  body: string;
}

function normalizeReceiptHash(receiptHash: string): string {
  return receiptHash.startsWith('0x') ? receiptHash.slice(2) : receiptHash;
}

/**
 * Fetch a Rekor entry by receipt hash.
 *
 * @param receiptHash - The receipt hash to look up
 * @returns Rekor entry or null if not found
 */
export async function fetchFromRekor(
  receiptHash: string,
): Promise<RekorEntry | null> {
  try {
    const normalizedHash = normalizeReceiptHash(receiptHash);

    // Search by receipt hash in the body
    // Rekor stores entries as base64-encoded JSON in rekord format
    const searchUrl = `${REKOR_API}/index/retrieve`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: `sha256:${normalizedHash}`,
      }),
    });

    if (!searchResponse.ok) {
      // Try searching by UUID pattern
      const uuidSearchResponse = await fetch(
        `${REKOR_API}/log/entries/retrieve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryUUIDs: [receiptHash],
          }),
        },
      );

      if (!uuidSearchResponse.ok) {
        return null;
      }

      const entries = await uuidSearchResponse.json();
      if (!entries || entries.length === 0) {
        return null;
      }

      return parseRekorEntry(entries[0]);
    }

    const uuids = await searchResponse.json();
    if (!uuids || uuids.length === 0) {
      return null;
    }

    // Fetch full entry
    const entryResponse = await fetch(
      `${REKOR_API}/log/entries/${uuids[0]}`,
    );

    if (!entryResponse.ok) {
      return null;
    }

    const entry = await entryResponse.json();
    return parseRekorEntry(entry);
  } catch (error) {
    console.error('Rekor fetch error:', error);
    return null;
  }
}

function parseRekorEntry(entry: Record<string, unknown>): RekorEntry | null {
  try {
    // Entry is { uuid: { logIndex, body, verification: { inclusionProof } } }
    const uuid = Object.keys(entry)[0];
    const data = entry[uuid] as Record<string, unknown>;

    const verification = data.verification as Record<string, unknown>;
    const proof = verification?.inclusionProof as Record<string, unknown>;

    if (!proof) {
      return null;
    }

    const hashes = (proof.hashes as string[]) || [];
    const logIndex = (proof.logIndex as number) || (data.logIndex as number);
    const treeSize = proof.treeSize as number;

    // Convert Rekor proof format to our MerkleProof format
    // Rekor uses RFC 6962 proof format
    const merkleProof: MerkleProof = {
      leaf_hash: proof.leafHash as string,
      siblings: hashes,
      path_bits: computePathBits(logIndex, treeSize),
      root: proof.rootHash as string,
    };

    return {
      logIndex,
      leafHash: proof.leafHash as string,
      treeRoot: proof.rootHash as string,
      inclusionProof: merkleProof,
      integratedTime: new Date(
        (data.integratedTime as number) * 1000,
      ).toISOString(),
      body: data.body as string,
    };
  } catch {
    return null;
  }
}

/**
 * Compute path bits for RFC 6962 Merkle audit proof
 */
function computePathBits(index: number, treeSize: number): boolean[] {
  const bits: boolean[] = [];
  let idx = index;
  let size = treeSize;

  while (size > 1) {
    bits.push(idx % 2 === 1);
    idx = Math.floor(idx / 2);
    size = Math.floor((size + 1) / 2);
  }

  return bits;
}

/**
 * Get Rekor tree info for verification
 */
export async function getRekorTreeInfo(): Promise<{
  treeSize: number;
  rootHash: string;
} | null> {
  try {
    const response = await fetch(`${REKOR_API}/log`);
    if (!response.ok) {
      return null;
    }

    const info = await response.json();
    return {
      treeSize: info.treeSize,
      rootHash: info.rootHash,
    };
  } catch {
    return null;
  }
}
