/**
 * Tests for bb-protocol schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateManifest,
  parseManifest,
  validateCapability,
  validateEntitySchema,
  BBManifestSchema,
} from '../../src/protocol/schema.js';

describe('BBManifestSchema', () => {
  const validManifest = {
    version: '1.0' as const,
    name: 'Test Site',
    description: 'A test site for validation',
    capabilities: [
      {
        id: 'search-products',
        type: 'query' as const,
        description: 'Search the product catalog',
        selector: '[data-bb-action="search"]',
      },
    ],
  };

  describe('validateManifest', () => {
    it('should validate a minimal valid manifest', () => {
      const result = validateManifest(validManifest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Site');
        expect(result.data.capabilities).toHaveLength(1);
      }
    });

    it('should validate a full manifest', () => {
      const fullManifest = {
        ...validManifest,
        icon: 'https://example.com/icon.png',
        contact: 'support@example.com',
        documentation: 'https://docs.example.com',
        capabilities: [
          {
            id: 'search-products',
            type: 'query' as const,
            description: 'Search the product catalog',
            selector: '[data-bb-action="search"]',
            entry: '/products',
            inputs: [
              { name: 'query', type: 'string' as const, required: true },
              { name: 'category', type: 'select' as const, options: ['all', 'electronics'] },
            ],
            outputs: [
              { name: 'results', type: 'product[]', selector: '[data-bb-output="results"]' },
            ],
            cost: { risk: 'low' as const },
            latency: { typical: 500, max: 2000 },
          },
          {
            id: 'checkout',
            type: 'workflow' as const,
            description: 'Complete purchase',
            selector: '[data-bb-action="checkout"]',
            steps: ['shipping', 'payment', 'confirm'],
            requires: ['authenticated'],
            confirmation: 'required' as const,
            cost: { usd: 'variable', risk: 'high' as const },
          },
        ],
        entities: {
          product: {
            selector: '[data-bb-entity="product"]',
            fields: {
              id: 'data-bb-entity-id',
              name: '[data-bb-field="name"]',
              price: '[data-bb-field="price"]',
            },
            actions: ['add-to-cart'],
          },
        },
        auth: {
          type: 'session' as const,
          loginUrl: '/login',
          logoutUrl: '/logout',
          indicator: '[data-bb-auth="logged-in"]',
        },
        constraints: {
          rateLimit: { requests: 60, window: '1m' },
          requiresHuman: ['checkout.confirm'],
          allowedAgents: ['OpenAI-Operator/*'],
        },
      };

      const result = validateManifest(fullManifest);
      expect(result.success).toBe(true);
    });

    it('should reject manifest without version', () => {
      const invalid = { ...validManifest, version: undefined };
      const result = validateManifest(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject manifest without capabilities', () => {
      const invalid = { ...validManifest, capabilities: [] };
      const result = validateManifest(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject manifest with invalid capability ID', () => {
      const invalid = {
        ...validManifest,
        capabilities: [
          {
            id: 'Invalid ID!', // Must be kebab-case
            type: 'query',
            description: 'Test',
            selector: '[data-bb-action]',
          },
        ],
      };
      const result = validateManifest(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject workflow without steps', () => {
      const invalid = {
        ...validManifest,
        capabilities: [
          {
            id: 'checkout',
            type: 'workflow',
            description: 'Checkout flow',
            selector: '[data-bb-action="checkout"]',
            // Missing steps
          },
        ],
      };
      const result = validateManifest(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('parseManifest', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify(validManifest);
      const result = parseManifest(json);
      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const result = parseManifest('{ invalid json }');
      expect(result.success).toBe(false);
    });
  });

  describe('validateCapability', () => {
    it('should validate a query capability', () => {
      const capability = {
        id: 'search',
        type: 'query',
        description: 'Search something',
        selector: '[data-bb-action="search"]',
      };
      const result = validateCapability(capability);
      expect(result.success).toBe(true);
    });

    it('should validate a mutation capability', () => {
      const capability = {
        id: 'add-to-cart',
        type: 'mutation',
        description: 'Add item to cart',
        selector: '[data-bb-action="add-to-cart"]',
        inputs: [{ name: 'productId', type: 'string', required: true }],
        cost: { usd: 0, risk: 'low' },
        confirmation: 'none',
      };
      const result = validateCapability(capability);
      expect(result.success).toBe(true);
    });
  });

  describe('validateEntitySchema', () => {
    it('should validate a valid entity schema', () => {
      const entity = {
        selector: '[data-bb-entity="product"]',
        fields: {
          id: 'data-bb-entity-id',
          name: '[data-bb-field="name"]',
        },
      };
      const result = validateEntitySchema(entity);
      expect(result.success).toBe(true);
    });

    it('should reject entity without selector', () => {
      const entity = {
        fields: { id: 'data-bb-entity-id' },
      };
      const result = validateEntitySchema(entity);
      expect(result.success).toBe(false);
    });
  });

  describe('rate limit window validation', () => {
    it('should accept valid window formats', () => {
      const validWindows = ['60s', '5m', '1h', '1d'];
      for (const window of validWindows) {
        const manifest = {
          ...validManifest,
          constraints: { rateLimit: { requests: 100, window } },
        };
        const result = validateManifest(manifest);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid window formats', () => {
      const invalidWindows = ['60', 'minute', '1 hour', '1w'];
      for (const window of invalidWindows) {
        const manifest = {
          ...validManifest,
          constraints: { rateLimit: { requests: 100, window } },
        };
        const result = validateManifest(manifest);
        expect(result.success).toBe(false);
      }
    });
  });
});
