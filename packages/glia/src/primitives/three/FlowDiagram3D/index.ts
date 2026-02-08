/**
 * FlowDiagram3D - 3D workflow/pipeline visualization
 *
 * @example
 * ```tsx
 * import { FlowDiagram3D } from "@backbay/glia/primitives/three/FlowDiagram3D";
 *
 * <FlowDiagram3D
 *   stages={pipelineStages}
 *   connections={stageConnections}
 *   layout="linear"
 *   direction="horizontal"
 *   onStageClick={(id) => console.log('Clicked:', id)}
 * />
 * ```
 */

export { FlowDiagram3D } from "./FlowDiagram3D";
export type {
  StageStatus,
  FlowStage,
  FlowConnection,
  FlowDiagram3DProps,
} from "./types";
export { STATUS_COLORS, STATUS_LABELS } from "./types";
