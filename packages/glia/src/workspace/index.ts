/**
 * bb-ui Workspace System
 *
 * Provides the protocol and runtime for agent-composed UI.
 *
 * @example
 * ```tsx
 * import { WorkspaceRenderer, validateWorkspace } from "@backbay/glia/workspace";
 *
 * // Validate a spec from an agent
 * const result = validateWorkspace(agentSpec);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 *
 * // Render the workspace
 * <WorkspaceRenderer
 *   spec={agentSpec}
 *   onEvent={(event, payload) => sendToAgent(event, payload)}
 * />
 * ```
 */

export * from "./types.js";
export * from "./WorkspaceRenderer.js";
export * from "./validation.js";
export * from "./componentBindings.js";
export * from "./registry/index.js";
