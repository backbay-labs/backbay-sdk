import { z } from 'zod';

// =============================================================================
// Primitives
// =============================================================================

const Signal01 = z.number().min(0).max(1);

const CognitiveModeSchema = z.enum([
  'idle',
  'listening',
  'deliberating',
  'acting',
  'explaining',
  'recovering',
  'blocked',
]);

const CognitiveSubmodeSchema = z.enum([
  'reading',
  'searching',
  'verifying',
  'waiting',
  'writing',
  'tool_call',
]);

const AVOSchema = z.object({
  arousal: Signal01,
  valence: Signal01,
  openness: Signal01,
});

// =============================================================================
// Sub-objects
// =============================================================================

const TrapWarningSchema = z.object({
  stateId: z.string(),
  reason: z.string(),
  recommendation: z.string(),
  severity: z.enum(['info', 'warning', 'danger']).optional(),
});

const DetailedBalanceSchema = z.object({
  chi2PerNdf: z.number(),
  passed: z.boolean(),
  threshold: z.number(),
});

const DynamicsStateSchema = z.object({
  potentialV: z.number().optional(),
  actionRate: Signal01.optional(),
  detailedBalance: DetailedBalanceSchema.optional(),
  traps: z.array(TrapWarningSchema).optional(),
});

const PersonalityConfigSchema = z.object({
  style: z.enum(['professional', 'casual', 'terse', 'verbose']),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  autonomy: z.enum(['low', 'medium', 'high', 'full']),
});

const PolicyConfigSchema = z.object({
  safetyMode: z.boolean(),
  trustTier: z.string().optional(),
});

// =============================================================================
// CognitionState
// =============================================================================

export const CognitionStateSchema = z.object({
  mode: CognitiveModeSchema,
  submode: CognitiveSubmodeSchema.optional(),
  focusRunId: z.string().optional(),

  attention: Signal01,
  workload: Signal01,
  timePressure: Signal01,
  planDrift: Signal01,
  costPressure: Signal01,
  risk: Signal01,
  uncertainty: Signal01,
  confidence: Signal01,
  errorStress: Signal01,

  personaAnchor: Signal01,
  personaDriftRisk: Signal01,
  personaStyle: z.array(z.string()).optional(),

  dynamics: DynamicsStateSchema.optional(),
  personality: PersonalityConfigSchema.optional(),
  policy: PolicyConfigSchema.optional(),

  moodAVO: AVOSchema,
  emotionAVO: AVOSchema,
});

// =============================================================================
// CognitionSnapshot
// =============================================================================

export const CognitionSnapshotSchema = z.object({
  version: z.literal('1.0'),
  timestamp: z.number(),
  state: CognitionStateSchema,
  recentEvents: z
    .array(
      z.object({
        t: z.number(),
        event: z.record(z.unknown()),
      })
    )
    .optional(),
});

// =============================================================================
// Validation helpers
// =============================================================================

export type CognitionSnapshotInput = z.input<typeof CognitionSnapshotSchema>;
export type CognitionSnapshotOutput = z.output<typeof CognitionSnapshotSchema>;

export interface CognitionSnapshotValidationResult {
  success: boolean;
  data?: CognitionSnapshotOutput;
  error?: z.ZodError;
}

export function validateCognitionSnapshot(
  input: unknown
): CognitionSnapshotValidationResult {
  const result = CognitionSnapshotSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
