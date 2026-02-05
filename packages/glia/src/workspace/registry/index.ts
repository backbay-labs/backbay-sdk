/**
 * bb-ui Component Registry
 *
 * Provides discovery, query, and composition APIs for agents
 * to work with UI components.
 *
 * @example
 * ```ts
 * import { registry } from "@backbay/glia/workspace";
 *
 * // Search for components
 * const results = registry.search("button with glow");
 *
 * // List by category
 * const atoms = registry.list({ category: "atoms" });
 *
 * // Check composition validity
 * const canNest = registry.canCompose("glass-panel", "glow-button");
 * ```
 */

export * from "./types.js";
export * from "./registry.js";
export * from "./manifests/index.js";
