/**
 * bb-ui core entrypoint
 *
 * A lighter-weight import path that avoids pulling in optional/heavy modules.
 *
 * @example
 * import { BBProvider, useAgentRun } from "@backbay/bb-ui/core";
 * import { Graph3D } from "@backbay/bb-ui/primitives";
 */

// Protocol (Discovery + Execution)
export * from "./protocol/index.js";

// Components (Core)
export {
  BBProvider,
  useBBContext,
  useBBContextOptional,
  type BBProviderProps,
} from "./components/BBProvider.js";

export {
  SyncDocument,
  type SyncDocumentProps,
  type SyncDocumentRenderProps,
} from "./components/SyncDocument.js";

export { AgentPanel, type AgentPanelProps, type QuickPrompt } from "./components/AgentPanel.js";

export {
  PlaySession,
  type PlaySessionProps,
  type PlaySessionRenderProps,
} from "./components/PlaySession.js";

// Hooks
export * from "./hooks/index.js";

// Workspace
export * from "./workspace/index.js";

// Theme
export * from "./theme/index.js";

// Utilities
export * from "./lib/utils.js";

