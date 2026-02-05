/**
 * Offline tests for EAS verification.
 *
 * These tests verify:
 * - GraphQL response parsing
 * - Hash normalization
 * - Chain ID configuration
 *
 * Network calls are mocked - no actual GraphQL or RPC requests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TEST_RECEIPT_HASH,
  TEST_RUN_ID,
  TEST_ATTESTER,
  TEST_ATTESTATION_UID,
  TEST_SCHEMA_ID,
  TEST_TXID,
  EAS_GRAPHQL_ENDPOINTS,
  CHAIN_IDS,
  buildAttestationResponse,
  buildEmptyResponse,
  buildSchemaResponse,
  BASE_ATTESTATION_FIXTURE,
  EMPTY_ATTESTATION_FIXTURE,
  CYNTRA_SCHEMA_FIXTURE,
} from './fixtures/eas';

// Mock global fetch for GraphQL requests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock viem's createPublicClient
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getTransaction: vi.fn().mockResolvedValue({
        blockNumber: BigInt(12345678),
      }),
    })),
  };
});

describe('EAS verification (offline)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GraphQL endpoint configuration', () => {
    it('has correct endpoints for supported chains', () => {
      expect(EAS_GRAPHQL_ENDPOINTS[1]).toBe('https://easscan.org/graphql');
      expect(EAS_GRAPHQL_ENDPOINTS[10]).toBe(
        'https://optimism.easscan.org/graphql'
      );
      expect(EAS_GRAPHQL_ENDPOINTS[42161]).toBe(
        'https://arbitrum.easscan.org/graphql'
      );
      expect(EAS_GRAPHQL_ENDPOINTS[8453]).toBe(
        'https://base.easscan.org/graphql'
      );
    });

    it('does not have endpoints for unsupported chains', () => {
      // Polygon, BSC, Avalanche not supported
      expect(EAS_GRAPHQL_ENDPOINTS[137]).toBeUndefined();
      expect(EAS_GRAPHQL_ENDPOINTS[56]).toBeUndefined();
      expect(EAS_GRAPHQL_ENDPOINTS[43114]).toBeUndefined();
    });
  });

  describe('response parsing', () => {
    it('parses valid attestation response', async () => {
      const response = buildAttestationResponse();
      const attestation = response.data.attestations[0];

      expect(attestation.id).toBe(TEST_ATTESTATION_UID);
      expect(attestation.attester).toBe(TEST_ATTESTER);
      expect(attestation.schemaId).toBe(TEST_SCHEMA_ID);
      expect(attestation.txid).toBe(TEST_TXID);
    });

    it('parses decodedDataJson correctly', () => {
      const response = buildAttestationResponse({
        receiptHash: TEST_RECEIPT_HASH,
        runId: TEST_RUN_ID,
      });
      const attestation = response.data.attestations[0];
      const decoded = JSON.parse(attestation.decodedDataJson);

      expect(decoded.receiptHash).toBe(TEST_RECEIPT_HASH);
      expect(decoded.runId).toBe(TEST_RUN_ID);
      expect(decoded.verdict).toBe('passed');
    });

    it('handles empty attestations array', () => {
      const response = buildEmptyResponse();

      expect(response.data.attestations).toEqual([]);
      expect(response.data.attestations.length).toBe(0);
    });

    it('converts timestamp to ISO string correctly', () => {
      const unixTime = 1704067200; // 2024-01-01 00:00:00 UTC
      const response = buildAttestationResponse({ time: unixTime });
      const attestation = response.data.attestations[0];

      const isoString = new Date(attestation.time * 1000).toISOString();
      expect(isoString).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('hash normalization', () => {
    it('handles 0x-prefixed hash', () => {
      const hash =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const normalized = hash.startsWith('0x') ? hash : `0x${hash}`;

      expect(normalized).toBe(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      );
    });

    it('adds 0x prefix to non-prefixed hash', () => {
      const hash =
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const normalized = hash.startsWith('0x') ? hash : `0x${hash}`;

      expect(normalized).toBe(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      );
    });
  });

  describe('schema query', () => {
    it('parses schema response', () => {
      const response = buildSchemaResponse();
      const schema = response.data.schemas[0];

      expect(schema.id).toBe(TEST_SCHEMA_ID);
      expect(schema.creator).toBe('cyntra.eth');
      expect(schema.schema).toContain('receiptHash');
      expect(schema.schema).toContain('runId');
    });

    it('handles empty schema response', () => {
      const response = { data: { schemas: [] } };
      expect(response.data.schemas.length).toBe(0);
    });
  });

  describe('fetchFromEAS (mocked)', () => {
    it('returns attestation when found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => BASE_ATTESTATION_FIXTURE,
      });

      const { fetchFromEAS } = await import('../fetchers/eas');
      const result = await fetchFromEAS(TEST_RECEIPT_HASH, CHAIN_IDS.BASE);

      expect(result).not.toBeNull();
      expect(result?.uid).toBe(TEST_ATTESTATION_UID);
      expect(result?.attester).toBe(TEST_ATTESTER);
    });

    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => EMPTY_ATTESTATION_FIXTURE,
      });

      const { fetchFromEAS } = await import('../fetchers/eas');
      const result = await fetchFromEAS(TEST_RECEIPT_HASH, CHAIN_IDS.BASE);

      expect(result).toBeNull();
    });

    it('returns null for unsupported chain', async () => {
      const { fetchFromEAS } = await import('../fetchers/eas');

      // Chain ID 999 is not supported
      const result = await fetchFromEAS(TEST_RECEIPT_HASH, 999);
      expect(result).toBeNull();
    });

    it('falls back to runId search when receiptHash not found', async () => {
      // First call returns empty (no match for receiptHash)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => EMPTY_ATTESTATION_FIXTURE,
      });
      // Second call returns attestation (matched by runId)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => BASE_ATTESTATION_FIXTURE,
      });

      const { fetchFromEAS } = await import('../fetchers/eas');
      const result = await fetchFromEAS(
        TEST_RECEIPT_HASH,
        CHAIN_IDS.BASE,
        TEST_RUN_ID
      );

      expect(result).not.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('rejects attestations that do not bind to the requested receiptHash', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          buildAttestationResponse({
            receiptHash:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
          }),
      });

      const { fetchFromEAS } = await import('../fetchers/eas');
      const result = await fetchFromEAS(TEST_RECEIPT_HASH, CHAIN_IDS.BASE);

      expect(result).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { fetchFromEAS } = await import('../fetchers/eas');
      const result = await fetchFromEAS(TEST_RECEIPT_HASH, CHAIN_IDS.BASE);

      expect(result).toBeNull();
    });

    it('handles non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { fetchFromEAS } = await import('../fetchers/eas');
      const result = await fetchFromEAS(TEST_RECEIPT_HASH, CHAIN_IDS.BASE);

      expect(result).toBeNull();
    });
  });

  describe('fetchAndVerifyChain (EAS-only)', () => {
    it('requires schemaId match when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => BASE_ATTESTATION_FIXTURE,
      });

      const { fetchAndVerifyChain } = await import('../index');
      const chain = await fetchAndVerifyChain(TEST_RECEIPT_HASH, {
        eas: {
          chainId: CHAIN_IDS.BASE,
          schemaId: '0xdeadbeef',
        },
      });

      expect(chain.eas?.verified).toBe(false);
      expect(chain.eas?.schemaId).toBe(TEST_SCHEMA_ID);
      expect(chain.eas?.receiptHash).toBe(TEST_RECEIPT_HASH);
    });
  });

  describe('getCyntraSchema (mocked)', () => {
    it('returns schema ID when found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => CYNTRA_SCHEMA_FIXTURE,
      });

      const { getCyntraSchema } = await import('../fetchers/eas');
      const result = await getCyntraSchema(CHAIN_IDS.BASE);

      expect(result).toBe(TEST_SCHEMA_ID);
    });

    it('returns null when schema not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { schemas: [] } }),
      });

      const { getCyntraSchema } = await import('../fetchers/eas');
      const result = await getCyntraSchema(CHAIN_IDS.BASE);

      expect(result).toBeNull();
    });

    it('returns null for unsupported chain', async () => {
      const { getCyntraSchema } = await import('../fetchers/eas');
      const result = await getCyntraSchema(999);

      expect(result).toBeNull();
    });
  });

  describe('GraphQL query structure', () => {
    it('sends correct query for attestation lookup', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => BASE_ATTESTATION_FIXTURE,
      });

      const { fetchFromEAS } = await import('../fetchers/eas');
      await fetchFromEAS(TEST_RECEIPT_HASH, CHAIN_IDS.BASE);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toBe(EAS_GRAPHQL_ENDPOINTS[CHAIN_IDS.BASE]);
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.query).toContain('attestations');
      expect(body.query).toContain('decodedDataJson');
      expect(body.variables.value).toBe(TEST_RECEIPT_HASH);
    });
  });

  describe('chain-specific behavior', () => {
    it.each([
      [CHAIN_IDS.MAINNET, 'https://easscan.org/graphql'],
      [CHAIN_IDS.OPTIMISM, 'https://optimism.easscan.org/graphql'],
      [CHAIN_IDS.ARBITRUM, 'https://arbitrum.easscan.org/graphql'],
      [CHAIN_IDS.BASE, 'https://base.easscan.org/graphql'],
    ])('uses correct endpoint for chain %i', async (chainId, expectedUrl) => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => BASE_ATTESTATION_FIXTURE,
      });

      const { fetchFromEAS } = await import('../fetchers/eas');
      await fetchFromEAS(TEST_RECEIPT_HASH, chainId);

      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
