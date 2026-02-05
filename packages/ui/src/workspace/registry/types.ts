/**
 * AG-UI Component Registry Types
 *
 * Defines the schema for component manifests that enable agents
 * to discover, understand, and compose UI components.
 */

import type { ComponentType } from "react";

// ============================================================================
// Core Registry Types
// ============================================================================

/**
 * Component categories for organization and filtering
 */
export type ComponentCategory =
  | "atoms" // Basic building blocks (buttons, inputs, badges)
  | "molecules" // Composite components (cards, toasts, stats)
  | "organisms" // Complex components (command palette, grids)
  | "layouts" // Layout primitives (panels, splits, stacks)
  | "three" // Three.js/WebGL components
  | "ambient"; // Background/atmospheric effects

/**
 * Semantic purpose tags that help agents select appropriate components
 */
export type ComponentPurpose =
  // Actions
  | "call-to-action"
  | "navigation"
  | "confirmation"
  | "destructive-action"
  // Display
  | "data-display"
  | "status-indicator"
  | "progress-feedback"
  | "notification"
  // Input
  | "text-input"
  | "selection"
  | "toggle"
  // Layout
  | "container"
  | "grid-layout"
  | "overlay"
  | "modal"
  // Visual
  | "background"
  | "decoration"
  | "visualization"
  | "animation";

/**
 * Interaction patterns the component supports
 */
export type InteractionPattern =
  | "click"
  | "hover"
  | "focus"
  | "drag"
  | "keyboard"
  | "touch"
  | "scroll"
  | "resize";

/**
 * Accessibility features the component implements
 */
export type A11yFeature =
  | "aria-labels"
  | "keyboard-nav"
  | "focus-visible"
  | "screen-reader"
  | "reduced-motion"
  | "high-contrast";

/**
 * Visual style characteristics
 */
export type VisualStyle =
  | "minimal"
  | "glassmorphism"
  | "neon"
  | "cyberpunk"
  | "retro"
  | "3d"
  | "animated"
  | "gradient";

// ============================================================================
// Prop Schema Types (JSON Schema subset)
// ============================================================================

export type PropType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "function"
  | "ReactNode"
  | "enum";

export interface PropSchema {
  type: PropType;
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
  items?: PropSchema; // For arrays
  properties?: Record<string, PropSchema>; // For objects
}

// ============================================================================
// Component Manifest
// ============================================================================

/**
 * Complete manifest for a component in the registry.
 * This is the "contract" agents use to understand and compose components.
 */
export interface ComponentManifest {
  // Identity
  id: string; // Unique identifier (e.g., "glow-button")
  name: string; // Display name (e.g., "GlowButton")
  version: string; // Semantic version
  category: ComponentCategory;

  // Semantic Understanding (for agent selection)
  purpose: ComponentPurpose[];
  description: string;
  bestFor: string[]; // Use cases where this shines
  avoid: string[]; // Anti-patterns / when NOT to use

  // Props Schema
  props: Record<string, PropSchema>;

  // Composition Rules
  slots?: SlotDefinition[]; // Named slots for children
  validParents?: string[]; // Components this can be placed inside
  validChildren?: string[]; // Components that can be placed inside this
  incompatibleWith?: string[]; // Components that conflict

  // Styling
  styles: VisualStyle[];
  supportsTheme: boolean;
  cssVariables?: string[]; // CSS custom properties it respects

  // Interaction & Accessibility
  interactions: InteractionPattern[];
  a11y: A11yFeature[];

  // Examples for Few-Shot Learning
  examples: ComponentExample[];

  // Metadata
  source: string; // File path relative to package
  storybook?: string; // Storybook story ID
  tags: string[]; // Additional searchable tags
}

/**
 * Slot definition for component composition
 */
export interface SlotDefinition {
  name: string;
  description: string;
  accepts: string[]; // Component IDs that can fill this slot
  required?: boolean;
  multiple?: boolean; // Can accept multiple children
}

/**
 * Example usage for few-shot prompting
 */
export interface ComponentExample {
  name: string;
  description: string;
  props: Record<string, unknown>;
  context?: string; // When to use this configuration
  code?: string; // Optional JSX snippet
}

// ============================================================================
// Registry API Types
// ============================================================================

/**
 * Query options for searching the registry
 */
export interface RegistryQuery {
  category?: ComponentCategory;
  purpose?: ComponentPurpose | ComponentPurpose[];
  style?: VisualStyle | VisualStyle[];
  search?: string; // Free-text search
  tags?: string[];
  hasSlots?: boolean;
  supportsChildren?: boolean;
  limit?: number;
}

/**
 * Registry search result with relevance scoring
 */
export interface RegistrySearchResult {
  component: ComponentManifest;
  score: number; // Relevance score 0-1
  matchedOn: string[]; // What fields matched
}

/**
 * The component registry interface
 */
export interface ComponentRegistry {
  // Query methods
  get(id: string): ComponentManifest | undefined;
  list(query?: RegistryQuery): ComponentManifest[];
  search(query: string): RegistrySearchResult[];

  // Composition validation
  canCompose(parentId: string, childId: string): boolean;
  getValidChildren(parentId: string): ComponentManifest[];
  getValidParents(childId: string): ComponentManifest[];

  // Metadata
  categories(): ComponentCategory[];
  purposes(): ComponentPurpose[];
  tags(): string[];
  count(): number;
}

// ============================================================================
// Runtime Component Map
// ============================================================================

/**
 * Maps component IDs to actual React components for rendering
 */
export type ComponentMap = Map<string, ComponentType<Record<string, unknown>>>;

/**
 * Registry with runtime components attached
 */
export interface RuntimeRegistry extends ComponentRegistry {
  getComponent(id: string): ComponentType<Record<string, unknown>> | undefined;
  render(id: string, props: Record<string, unknown>): React.ReactElement | null;
}
