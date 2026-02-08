/**
 * ResourceMeter - 3D cylindrical gauge visualization
 *
 * @example
 * ```tsx
 * import { ResourceMeter } from "@backbay/glia/primitives/three/ResourceMeter";
 *
 * <ResourceMeter
 *   value={65}
 *   label="MEMORY"
 *   unit="GB"
 *   maxValue={8}
 *   currentValue={5.2}
 * />
 * ```
 */

export { ResourceMeter } from "./ResourceMeter";
export type { ResourceMeterProps } from "./types";
