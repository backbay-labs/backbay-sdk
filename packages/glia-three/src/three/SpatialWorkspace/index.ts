/**
 * SpatialWorkspace Module Exports
 */

export { SpatialWorkspace } from "./SpatialWorkspace";
export type { SpatialWorkspaceProps } from "./types";

export { JobCluster } from "./JobCluster";
export type { JobClusterProps } from "./types";

export { NodeGraph } from "./NodeGraph";
export type { NodeGraphProps } from "./types";

export { ReceiptOrbit } from "./ReceiptOrbit";
export type { ReceiptOrbitProps } from "./types";

export { TrustRings } from "./TrustRings";
export type { TrustRingsProps } from "./types";

export type {
  WorkspaceLayout,
  WorkspaceLayoutOptions,
  EntityVisual,
  EntityPosition,
  WorkspaceFilter,
  WorkspaceSelection,
  DisputeSeverity,
  DisputeBeaconProps,
} from "./types";

export {
  JOB_VISUALS,
  NODE_VISUALS,
  NODE_STATUS_MODIFIERS,
  RECEIPT_VISUALS,
  TRUST_RING_CONFIG,
  DISPUTE_SEVERITY_VISUALS,
  DEFAULT_WORKSPACE_CONFIG,
  getDisputeSeverity,
} from "./types";

// Entity Adapters - map Backbay entities to CrystallineOrganism props
export {
  jobAdapter,
  nodeAdapter,
  receiptAdapter,
  disputeAdapter,
  jobsToOrganisms,
  nodesToOrganisms,
  receiptsToOrganisms,
  disputesToOrganisms,
  // Cyntra entity adapters
  cyntraWorkcellAdapter,
  cyntraRunAdapter,
  cyntraIssueAdapter,
  workcellsToOrganisms,
  runsToOrganisms,
  issuesToOrganisms,
} from "./adapters";

export type {
  EntityAdapter,
  CyntraKernelStatus,
  CyntraWorkcellStatus,
  CyntraRunStatus,
  CyntraIssueStatus,
} from "./adapters";

// CyntraWorkspace - visualize Cyntra kernel status
export { CyntraWorkspace } from "./CyntraWorkspace";
export type { CyntraWorkspaceProps } from "./CyntraWorkspace";

// Nexus adapters - map NexusItems to CrystallineOrganism props
export {
  nexusAdapter,
  nexusItemsToOrganisms,
  getNexusOrganismScale,
  canSprawlInto,
} from "./nexusAdapter";

export type {
  NexusItem,
  NexusItemType,
  NexusItemStatus,
} from "./nexusAdapter";
