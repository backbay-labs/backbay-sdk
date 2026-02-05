/**
 * AttackGraph - MITRE ATT&CK attack chain visualization
 *
 * @example
 * ```tsx
 * import { AttackGraph } from "@backbay/bb-ui/primitives/three/AttackGraph";
 *
 * <AttackGraph chains={chains} layout="killchain" showMitreIds />
 * ```
 */

export { AttackGraph } from "./AttackGraph";
export type { AttackGraphProps, AttackChain, AttackTechnique, AttackTactic } from "./types";
export {
  ATTACK_TACTIC_ORDER,
  ATTACK_TACTIC_LABELS,
  ATTACK_CHAIN_STATUS_COLORS,
  ATTACK_DETECTION_COLORS,
} from "./types";
