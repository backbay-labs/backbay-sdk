/**
 * Zod schemas for bb-protocol validation
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const CapabilityTypeSchema = z.enum(['query', 'mutation', 'workflow']);
export const RiskLevelSchema = z.enum(['low', 'medium', 'high']);
export const InputTypeSchema = z.enum(['string', 'number', 'boolean', 'date', 'file', 'select']);
export const AuthTypeSchema = z.enum(['none', 'session', 'oauth', 'api-key']);
export const ConfirmationTypeSchema = z.enum(['none', 'optional', 'required']);
export const BBStateSchema = z.enum([
  'idle',
  'loading',
  'success',
  'error',
  'disabled',
  'hidden',
  'requires-auth',
]);

// =============================================================================
// Nested Schemas
// =============================================================================

export const InputFieldSchema = z.object({
  name: z.string().min(1),
  type: InputTypeSchema,
  required: z.boolean().optional(),
  default: z.unknown().optional(),
  options: z.array(z.string()).optional(),
  from: z.string().optional(),
  selector: z.string().optional(),
});

export const OutputFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  selector: z.string().optional(),
});

export const CostEstimateSchema = z.object({
  usd: z.union([z.number(), z.literal('variable')]).optional(),
  tokens: z.number().optional(),
  risk: RiskLevelSchema,
});

export const LatencyEstimateSchema = z.object({
  typical: z.number().positive(),
  max: z.number().positive().optional(),
});

export const CapabilitySchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z][a-z0-9-]*$/, 'ID must be kebab-case'),
    type: CapabilityTypeSchema,
    description: z.string().min(1),
    entry: z.string().optional(),
    selector: z.string().min(1),
    inputs: z.array(InputFieldSchema).optional(),
    outputs: z.array(OutputFieldSchema).optional(),
    cost: CostEstimateSchema.optional(),
    latency: LatencyEstimateSchema.optional(),
    requires: z.array(z.string()).optional(),
    confirmation: ConfirmationTypeSchema.optional(),
    steps: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Workflows should have steps
      if (data.type === 'workflow' && (!data.steps || data.steps.length === 0)) {
        return false;
      }
      return true;
    },
    { message: 'Workflow capabilities must have steps defined' }
  );

export const EntitySchemaSchema = z.object({
  selector: z.string().min(1),
  fields: z.record(z.string(), z.string()),
  actions: z.array(z.string()).optional(),
});

export const AuthConfigSchema = z.object({
  type: AuthTypeSchema,
  loginUrl: z.string().optional(),
  logoutUrl: z.string().optional(),
  indicator: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  header: z.string().optional(),
  documentationUrl: z.string().optional(),
});

export const RateLimitSchema = z.object({
  requests: z.number().positive(),
  window: z.string().regex(/^\d+[smhd]$/, 'Window must be like "60s", "5m", "1h", "1d"'),
});

export const ConstraintConfigSchema = z.object({
  rateLimit: RateLimitSchema.optional(),
  requiresHuman: z.array(z.string()).optional(),
  blockedAgents: z.array(z.string()).optional(),
  allowedAgents: z.array(z.string()).optional(),
});

// =============================================================================
// Main Manifest Schema
// =============================================================================

export const BBManifestSchema = z.object({
  version: z.literal('1.0'),
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().url().optional(),
  contact: z.string().optional(),
  documentation: z.string().url().optional(),
  capabilities: z.array(CapabilitySchema).min(1),
  entities: z.record(z.string(), EntitySchemaSchema).optional(),
  auth: AuthConfigSchema.optional(),
  constraints: ConstraintConfigSchema.optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// Validation Functions
// =============================================================================

export type ManifestValidationResult =
  | { success: true; data: z.infer<typeof BBManifestSchema> }
  | { success: false; errors: z.ZodError };

/**
 * Validate a manifest object against the schema
 */
export function validateManifest(manifest: unknown): ManifestValidationResult {
  const result = BBManifestSchema.safeParse(manifest);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Parse and validate a manifest JSON string
 */
export function parseManifest(json: string): ManifestValidationResult {
  try {
    const parsed = JSON.parse(json);
    return validateManifest(parsed);
  } catch (error) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: [],
          message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]),
    };
  }
}

/**
 * Validate a single capability
 */
export function validateCapability(capability: unknown) {
  return CapabilitySchema.safeParse(capability);
}

/**
 * Validate an entity schema
 */
export function validateEntitySchema(entity: unknown) {
  return EntitySchemaSchema.safeParse(entity);
}

// =============================================================================
// Type Exports
// =============================================================================

export type BBManifestInput = z.input<typeof BBManifestSchema>;
export type BBManifestOutput = z.output<typeof BBManifestSchema>;
export type CapabilityInput = z.input<typeof CapabilitySchema>;
export type EntitySchemaInput = z.input<typeof EntitySchemaSchema>;
