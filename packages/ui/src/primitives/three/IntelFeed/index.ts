/**
 * IntelFeed - Real-time threat intelligence visualization
 *
 * @example
 * ```tsx
 * import { IntelFeed } from "@backbay/bb-ui/primitives/three/IntelFeed";
 *
 * <IntelFeed items={items} sources={sources} layout="waterfall" />
 * ```
 */

export { IntelFeed } from "./IntelFeed";
export type { IntelFeedProps, IntelItem, IntelSource } from "./types";
export { INTEL_SEVERITY_COLORS, INTEL_TYPE_LABELS } from "./types";
