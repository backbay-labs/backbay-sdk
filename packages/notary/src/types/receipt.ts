import { z } from "zod";

/**
 * RunReceipt - The core attestable object linking universe→world→run→artifacts→verdict
 *
 * This is the canonical schema for run receipts that get:
 * 1. Uploaded to IPFS with artifacts
 * 2. Attested via EAS (offchain + onchain anchor)
 * 3. Verified by external parties
 */
export const RunReceiptSchema = z.object({
  /** Schema version for forward compatibility */
  version: z.union([z.literal("0.1.0"), z.literal("2.0.0")]),
  /** Stable receipt identifier (defaults to run ID) */
  receipt_id: z.string().optional().describe("Receipt ID (defaults to run.id)"),

  /** Universe identification */
  universe: z.object({
    id: z.string().describe("Universe ID (e.g., 'cyntra-fab')"),
    name: z.string().describe("Human-readable universe name"),
  }),

  /** World identification within universe */
  world: z.object({
    id: z.string().describe("World ID (e.g., 'outora-library')"),
    name: z.string().describe("Human-readable world name"),
    version: z.string().optional().describe("Semantic version if applicable"),
  }),

  /** Run identification */
  run: z.object({
    id: z.string().describe("Unique run ID (e.g., '20231215-abc123')"),
    timestamp: z.string().datetime().describe("ISO 8601 timestamp of run start"),
    git_sha: z.string().length(40).describe("Full git commit SHA"),
    toolchain: z
      .string()
      .describe("Toolchain that executed the run (string; treat unknown values as valid)"),
  }),

  /** Artifacts produced by the run */
  artifacts: z.object({
    manifest_hash: z
      .string()
      .regex(/^0x[a-f0-9]{64}$/)
      .describe("SHA256 of run-manifest.json"),
    proof_hash: z
      .string()
      .regex(/^0x[a-f0-9]{64}$/)
      .optional()
      .describe("SHA256 of proof.json if present"),
    primary_asset_hash: z
      .string()
      .regex(/^0x[a-f0-9]{64}$/)
      .optional()
      .describe("SHA256 of primary output asset (e.g., .glb file)"),
    ledger_root: z
      .string()
      .regex(/^0x[a-f0-9]{64}$/)
      .optional()
      .describe("Merkle root of anchored ledger events"),
    bundle_hash: z
      .string()
      .regex(/^0x[a-f0-9]{64}$/)
      .optional()
      .describe("Hash of proof bundle manifest"),
    bundle_uri: z.string().optional().describe("URI of proof bundle"),
    bundle_size_bytes: z.number().int().optional(),
    bundle_sig: z.string().optional().describe("Signature over bundle hash"),
    ipfs_cid: z
      .string()
      .optional()
      .describe("IPFS CID of uploaded artifacts directory"),
  }),

  /** Gate verdict summary */
  verdict: z.object({
    passed: z.boolean().describe("Whether all gates passed"),
    gate_id: z.string().optional().describe("Gate config ID if fab pipeline"),
    scores: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Opaque score payload (may be nested; only verdict.passed is safety-critical)"),
    threshold: z.number().optional().describe("Minimum passing threshold"),
    risk_classification: z
      .enum(["low", "medium", "high", "critical"])
      .optional(),
  }),
  play: z
    .object({
      title_id: z.string().describe("Game title identifier"),
      title_version: z.string().optional().describe("Game title version"),
      engine: z.string().optional().describe("Runtime engine name"),
      engine_version: z.string().optional().describe("Runtime engine version"),
      session_id: z.string().describe("Play session identifier"),
      mode: z.enum(["cfo", "builder", "full"]).describe("Agent capability mode"),
      scenario_id: z.string().optional().describe("Scenario identifier"),
      park_name: z.string().optional().describe("Park name"),
      save_base_hash: z
        .string()
        .regex(/^0x[a-f0-9]{64}$/)
        .optional()
        .describe("Hash of base save snapshot"),
      save_final_hash: z
        .string()
        .regex(/^0x[a-f0-9]{64}$/)
        .optional()
        .describe("Hash of final save snapshot"),
      control_api_version: z.string().optional(),
      control_api_hash: z
        .string()
        .regex(/^0x[a-f0-9]{64}$/)
        .optional(),
      capability_grants_hash: z
        .string()
        .regex(/^0x[a-f0-9]{64}$/)
        .optional(),
      asset_pack_hash: z
        .string()
        .regex(/^0x[a-f0-9]{64}$/)
        .optional(),
      stream: z
        .object({
          provider: z.string(),
          room_id: z.string(),
        })
        .optional(),
    })
    .optional(),

  provenance: z
    .object({
      kernel_version: z.string().optional(),
      provider: z.string().optional(),
      provider_attestation: z.string().optional(),
      policy_hash: z.string().optional(),
      lease_hash: z
        .string()
        .regex(/^0x[a-f0-9]{64}$/)
        .optional(),
      violations: z
        .array(
          z.object({
            guard: z.string(),
            severity: z.string(),
            message: z.string(),
            action: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),

  signatures: z
    .object({
      kernel: z.string().optional(),
      verifier: z.string().optional(),
      provider: z.string().optional(),
    })
    .optional(),

  /** Attestation metadata (filled after EAS signing) */
  attestation: z
    .object({
      uid: z.string().describe("EAS attestation UID"),
      chain_id: z.number().describe("Chain ID where attested"),
      attester: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .describe("Ethereum address of attester"),
      timestamp: z.string().datetime().describe("Attestation timestamp"),
    })
    .optional(),

  transparency_log: z
    .object({
      log_id: z.string(),
      log_index: z.number().int(),
      inclusion_proof: z.string().optional(),
    })
    .optional(),
});

export type RunReceipt = z.infer<typeof RunReceiptSchema>;

/**
 * Partial receipt before attestation is added
 */
export type RunReceiptInput = Omit<RunReceipt, "attestation">;
