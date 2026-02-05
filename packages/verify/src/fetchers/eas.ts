/**
 * Ethereum Attestation Service (EAS) fetcher
 *
 * Fetches attestations from EAS on supported chains.
 *
 * ## Configuration
 *
 * Pass an `EASConfig` object to override defaults:
 *
 * ```ts
 * const config: EASConfig = {
 *   chainId: 8453,
 *   graphqlUrl: 'https://my-graphql.example.com/graphql',  // Custom GraphQL endpoint
 *   rpcUrl: 'https://my-rpc.example.com',                   // Custom RPC for tx lookups
 * };
 *
 * const result = await fetchFromEAS(receiptHash, config);
 * ```
 *
 * @module
 */

import { createPublicClient, http, type Chain } from 'viem';
import { base, arbitrum, optimism, mainnet } from 'viem/chains';

/** Supported EAS chain IDs */
export type EASChainId = 1 | 10 | 42161 | 8453;

/**
 * Configuration for EAS verification.
 */
export interface EASConfig {
  /** Chain ID (required) */
  chainId: number;
  /** Expected schema id (optional; used for higher-level verification logic). */
  schemaId?: string;
  /** Custom GraphQL endpoint URL (optional; defaults to public EASScan endpoint) */
  graphqlUrl?: string;
  /** Custom RPC URL for transaction lookups (optional; defaults to public RPC) */
  rpcUrl?: string;
}

/** Default EAS GraphQL endpoints per chain */
export const DEFAULT_EAS_GRAPHQL: Record<number, string> = {
  1: 'https://easscan.org/graphql',
  10: 'https://optimism.easscan.org/graphql',
  42161: 'https://arbitrum.easscan.org/graphql',
  8453: 'https://base.easscan.org/graphql',
};

// Legacy alias for backward compatibility
const EAS_GRAPHQL = DEFAULT_EAS_GRAPHQL;

/** Viem chain configs per chain ID */
export const EAS_CHAINS: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  42161: arbitrum,
  8453: base,
};

// Legacy alias
const CHAINS = EAS_CHAINS;

export interface EASEntry {
  uid: string;
  attester: string;
  data: string;
  blockNumber: number;
  timestamp: string;
  schemaId: string;
  /** Decoded data JSON from EASScan (best-effort parsing). */
  decoded?: Record<string, unknown>;
  /** Attested receipt hash extracted from decoded data (0x-prefixed). */
  receiptHash?: string;
  /** Attested run id extracted from decoded data (if present). */
  runId?: string;
  /** Revocation time (0 = not revoked). */
  revocationTime?: number;
  /** Expiration time (0 = no expiration). */
  expirationTime?: number;

  /**
   * Legacy compatibility fields (do not treat as cryptographic verification).
   *
   * EAS attestations are ECDSA-signed transactions; signature verification is a chain concern.
   * These are kept only to avoid breaking older consumers.
   */
  attesterPubkey?: string;
  signature?: string;
}

/**
 * Fetch an EAS attestation by receipt hash.
 *
 * Supports two call signatures:
 *
 * 1. Config object (recommended):
 *    ```ts
 *    fetchFromEAS(receiptHash, {
 *      chainId: 8453,
 *      graphqlUrl: 'https://my-graphql.example.com',
 *      rpcUrl: 'https://my-rpc.example.com',
 *    }, runId);
 *    ```
 *
 * 2. Legacy:
 *    ```ts
 *    fetchFromEAS(receiptHash, 8453, runId);
 *    ```
 *
 * @param receiptHash - The receipt hash to look up (0x-prefixed or raw hex)
 * @param configOrChainId - EASConfig object or chain ID number (legacy)
 * @param runId - Optional run ID for fallback search
 * @returns EAS entry or null if not found
 */
export async function fetchFromEAS(
  receiptHash: string,
  configOrChainId: EASConfig | number,
  runId?: string,
): Promise<EASEntry | null> {
  // Normalize config: support both new config object and legacy signature
  const config: EASConfig =
    typeof configOrChainId === 'number'
      ? { chainId: configOrChainId }
      : configOrChainId;

  const { chainId, graphqlUrl, rpcUrl } = config;

  const effectiveGraphqlUrl = graphqlUrl ?? EAS_GRAPHQL[chainId];
  if (!effectiveGraphqlUrl) {
    console.error(`EAS not available on chain ${chainId}`);
    return null;
  }

  const normalizedHash = receiptHash.startsWith('0x')
    ? receiptHash
    : `0x${receiptHash}`;

  try {
    const attByHash = await fetchAttestationByValue(
      effectiveGraphqlUrl,
      normalizedHash,
    );
    const attByRunId =
      !attByHash && runId && runId !== normalizedHash
        ? await fetchAttestationByValue(effectiveGraphqlUrl, runId)
        : null;

    const att = attByHash ?? attByRunId;

    if (!att) {
      return null;
    }

    const decoded = safeParseJson(att.decodedDataJson);
    const attestedReceiptHash = normalizeHex32(decoded?.['receiptHash']);

    // Never accept an attestation unless it binds to the expected receipt hash.
    // (We may use runId as a fallback search key, but receiptHash is the binding.)
    if (!attestedReceiptHash || attestedReceiptHash !== normalizedHash.toLowerCase()) {
      return null;
    }

    // Get block number from transaction
    const chain = CHAINS[chainId];
    const transport = rpcUrl ? http(rpcUrl) : http();
    const client = createPublicClient({
      chain,
      transport,
    });

    let blockNumber = 0;
    try {
      const tx = await client.getTransaction({ hash: att.txid as `0x${string}` });
      blockNumber = Number(tx.blockNumber);
    } catch {
      // Ignore transaction fetch errors
    }

    return {
      uid: att.id,
      attester: att.attester,
      data: att.data,
      blockNumber,
      timestamp: new Date(att.time * 1000).toISOString(),
      schemaId: att.schemaId,
      decoded: decoded ?? undefined,
      receiptHash: attestedReceiptHash,
      runId: typeof decoded?.['runId'] === 'string' ? (decoded['runId'] as string) : undefined,
      revocationTime: att.revocationTime,
      expirationTime: att.expirationTime,

      // Legacy compatibility
      attesterPubkey: att.attester,
      signature: att.data,
    };
  } catch (error) {
    console.error('EAS fetch error:', error);
    return null;
  }
}

async function fetchAttestationByValue(
  graphqlUrl: string,
  value: string,
): Promise<{
  id: string;
  attester: string;
  txid: string;
  data: string;
  decodedDataJson: string;
  revocationTime: number;
  expirationTime: number;
  time: number;
  schemaId: string;
} | null> {
  const query = `
    query GetAttestation($value: String!) {
      attestations(
        where: {
          decodedDataJson: { _contains: $value }
        }
        first: 1
        orderBy: time
        orderDirection: desc
      ) {
        id
        attester
        recipient
        refUID
        revocable
        revocationTime
        expirationTime
        time
        txid
        data
        decodedDataJson
        schemaId
      }
    }
  `;

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { value },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  const attestations = result.data?.attestations;

  if (!attestations || attestations.length === 0) {
    return null;
  }

  return attestations[0];
}

function safeParseJson(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeHex32(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const prefixed = value.startsWith('0x') ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) return null;
  return prefixed.toLowerCase();
}

/**
 * Get EAS schema for Cyntra RunReceipt.
 *
 * @param configOrChainId - EASConfig object or chain ID number
 * @returns Schema ID or null if not found
 */
export async function getCyntraSchema(
  configOrChainId: EASConfig | number,
): Promise<string | null> {
  const config: EASConfig =
    typeof configOrChainId === 'number'
      ? { chainId: configOrChainId }
      : configOrChainId;

  const graphqlUrl = config.graphqlUrl ?? EAS_GRAPHQL[config.chainId];
  if (!graphqlUrl) {
    return null;
  }

  try {
    const query = `
      query GetSchemas {
        schemas(
          where: {
            creator: "cyntra.eth"
          }
        ) {
          id
          schema
          creator
          resolver
          revocable
        }
      }
    `;

    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const schemas = result.data?.schemas;

    if (!schemas || schemas.length === 0) {
      return null;
    }

    return schemas[0].id;
  } catch {
    return null;
  }
}
