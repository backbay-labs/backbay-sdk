/**
 * EAS (Ethereum Attestation Service) test fixtures for offline verification testing.
 *
 * These fixtures mock GraphQL responses from EAS endpoints.
 */

export const TEST_RECEIPT_HASH =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
export const TEST_RUN_ID = 'run_test_123456';
export const TEST_ATTESTER = '0x1234567890123456789012345678901234567890';
export const TEST_SCHEMA_ID =
  '0xschema123456789012345678901234567890123456789012345678901234567890';
export const TEST_ATTESTATION_UID =
  '0xatt12345678901234567890123456789012345678901234567890123456789012';
export const TEST_TXID =
  '0xtx1234567890123456789012345678901234567890123456789012345678901234';

// EAS GraphQL endpoint map (matches fetchers/eas.ts)
export const EAS_GRAPHQL_ENDPOINTS: Record<number, string> = {
  1: 'https://easscan.org/graphql',
  10: 'https://optimism.easscan.org/graphql',
  42161: 'https://arbitrum.easscan.org/graphql',
  8453: 'https://base.easscan.org/graphql',
};

// Chain IDs for testing
export const CHAIN_IDS = {
  MAINNET: 1,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  BASE: 8453,
};

/**
 * Build a mock GraphQL attestation response.
 */
export function buildAttestationResponse(opts: {
  receiptHash?: string;
  runId?: string;
  attester?: string;
  schemaId?: string;
  uid?: string;
  txid?: string;
  time?: number;
} = {}): {
  data: {
    attestations: Array<{
      id: string;
      attester: string;
      recipient: string;
      refUID: string;
      revocable: boolean;
      revocationTime: number;
      expirationTime: number;
      time: number;
      txid: string;
      data: string;
      decodedDataJson: string;
      schemaId: string;
    }>;
  };
} {
  const receiptHash = opts.receiptHash ?? TEST_RECEIPT_HASH;
  const runId = opts.runId ?? TEST_RUN_ID;
  const attester = opts.attester ?? TEST_ATTESTER;
  const schemaId = opts.schemaId ?? TEST_SCHEMA_ID;
  const uid = opts.uid ?? TEST_ATTESTATION_UID;
  const txid = opts.txid ?? TEST_TXID;
  const time = opts.time ?? Math.floor(Date.now() / 1000);

  return {
    data: {
      attestations: [
        {
          id: uid,
          attester,
          recipient: '0x0000000000000000000000000000000000000000',
          refUID:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          revocable: true,
          revocationTime: 0,
          expirationTime: 0,
          time,
          txid,
          data: `0x${Buffer.from(
            JSON.stringify({ receiptHash, runId })
          ).toString('hex')}`,
          decodedDataJson: JSON.stringify({
            receiptHash,
            runId,
            verdict: 'passed',
          }),
          schemaId,
        },
      ],
    },
  };
}

/**
 * Build an empty GraphQL response (no attestations found).
 */
export function buildEmptyResponse(): {
  data: {
    attestations: never[];
  };
} {
  return {
    data: {
      attestations: [],
    },
  };
}

/**
 * Build a mock GraphQL schema query response.
 */
export function buildSchemaResponse(opts: {
  schemaId?: string;
  creator?: string;
} = {}): {
  data: {
    schemas: Array<{
      id: string;
      schema: string;
      creator: string;
      resolver: string;
      revocable: boolean;
    }>;
  };
} {
  const schemaId = opts.schemaId ?? TEST_SCHEMA_ID;
  const creator = opts.creator ?? 'cyntra.eth';

  return {
    data: {
      schemas: [
        {
          id: schemaId,
          schema:
            'bytes32 receiptHash,string runId,bool passed,string verdict',
          creator,
          resolver: '0x0000000000000000000000000000000000000000',
          revocable: true,
        },
      ],
    },
  };
}

/**
 * Fixture for a valid attestation on Base chain.
 */
export const BASE_ATTESTATION_FIXTURE = buildAttestationResponse({
  receiptHash: TEST_RECEIPT_HASH,
  runId: TEST_RUN_ID,
  attester: TEST_ATTESTER,
  time: 1704067200, // 2024-01-01
});

/**
 * Fixture for an empty (not found) response.
 */
export const EMPTY_ATTESTATION_FIXTURE = buildEmptyResponse();

/**
 * Fixture for Cyntra schema.
 */
export const CYNTRA_SCHEMA_FIXTURE = buildSchemaResponse({
  schemaId: TEST_SCHEMA_ID,
  creator: 'cyntra.eth',
});
