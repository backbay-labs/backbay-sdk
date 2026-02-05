/**
 * WorkspaceSpec Types
 *
 * Defines the declarative schema agents use to compose UI workspaces.
 * This is the "grammar" that enables agent-driven generative UI.
 */

// ============================================================================
// Layout Types
// ============================================================================

/**
 * Layout direction for splits and stacks
 */
export type LayoutDirection = "horizontal" | "vertical";

/**
 * Alignment options
 */
export type Alignment = "start" | "center" | "end" | "stretch";

/**
 * Justify options for main axis
 */
export type Justify = "start" | "center" | "end" | "between" | "around";

/**
 * Size specification - can be fixed, percentage, or flex
 */
export type SizeSpec =
  | number // Fixed pixels
  | `${number}%` // Percentage
  | `${number}fr` // Flex units
  | "auto" // Auto-size
  | "fill"; // Fill remaining

/**
 * Base layout node interface
 */
export interface LayoutNodeBase {
  id?: string;
  minSize?: SizeSpec;
  maxSize?: SizeSpec;
}

/**
 * Split layout - divides space into resizable sections
 */
export interface SplitLayout extends LayoutNodeBase {
  type: "split";
  direction: LayoutDirection;
  sizes?: SizeSpec[]; // Size for each child
  children: LayoutNode[];
}

/**
 * Stack layout - flexbox-style arrangement
 */
export interface StackLayout extends LayoutNodeBase {
  type: "stack";
  direction: LayoutDirection;
  gap?: number;
  align?: Alignment;
  justify?: Justify;
  wrap?: boolean;
  children: LayoutNode[];
}

/**
 * Tabs layout - tabbed content switching
 */
export interface TabsLayout extends LayoutNodeBase {
  type: "tabs";
  orientation?: "horizontal" | "vertical";
  defaultTab?: string;
  children: TabDefinition[];
}

/**
 * Tab definition within tabs layout
 */
export interface TabDefinition {
  id: string;
  label: string;
  icon?: string; // Icon component ID or name
  disabled?: boolean;
  content: LayoutNode;
}

/**
 * Grid layout - CSS grid-based arrangement
 */
export interface GridLayout extends LayoutNodeBase {
  type: "grid";
  columns?: number | string; // Number or template
  rows?: number | string;
  gap?: number | [number, number];
  children: GridItem[];
}

/**
 * Grid item with position
 */
export interface GridItem {
  id?: string;
  column?: number | string; // Column position or span
  row?: number | string;
  colSpan?: number;
  rowSpan?: number;
  content: LayoutNode;
}

/**
 * Panel - leaf node containing a component
 */
export interface PanelNode extends LayoutNodeBase {
  type: "panel";
  component: string; // Component ID from registry
  props?: Record<string, unknown>;
  children?: PanelNode[]; // For components with slots
}

/**
 * Slot - placeholder for dynamic content
 */
export interface SlotNode extends LayoutNodeBase {
  type: "slot";
  name: string;
  fallback?: LayoutNode;
}

/**
 * Union of all layout node types
 */
export type LayoutNode =
  | SplitLayout
  | StackLayout
  | TabsLayout
  | GridLayout
  | PanelNode
  | SlotNode;

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Color specification
 */
export type ColorSpec = string; // CSS color or variable reference

/**
 * Theme overrides for workspace
 */
export interface ThemeOverrides {
  // Colors
  background?: ColorSpec;
  foreground?: ColorSpec;
  accent?: ColorSpec;
  muted?: ColorSpec;

  // Typography
  fontFamily?: string;
  fontSize?: number;

  // Spacing
  spacing?: number; // Base spacing unit

  // Borders
  borderRadius?: number;
  borderColor?: ColorSpec;

  // Effects
  glowColor?: ColorSpec;
  glowIntensity?: number;

  // Custom CSS variables
  variables?: Record<string, string>;
}

// ============================================================================
// Event Binding Types
// ============================================================================

/**
 * Event types that can be bound
 */
export type EventType =
  | "click"
  | "submit"
  | "change"
  | "focus"
  | "blur"
  | "keydown"
  | "hover"
  | "custom";

/**
 * Action types for event handlers
 */
export type ActionType =
  | "navigate" // Navigate to URL/route
  | "emit" // Emit event to agent
  | "update" // Update workspace state
  | "invoke" // Invoke agent tool
  | "dismiss" // Dismiss/close element
  | "custom"; // Custom handler

/**
 * Event binding - connects UI events to agent actions
 */
export interface EventBinding {
  /** Source element ID or selector */
  source: string;
  /** Event type to listen for */
  event: EventType;
  /** Action to perform */
  action: ActionType;
  /** Action payload/configuration */
  payload?: Record<string, unknown>;
  /** Prevent default behavior */
  preventDefault?: boolean;
  /** Stop event propagation */
  stopPropagation?: boolean;
}

// ============================================================================
// Workspace State Types
// ============================================================================

/**
 * State binding - connects component props to workspace state
 */
export interface StateBinding {
  /** State key path (dot notation) */
  path: string;
  /** Default value */
  default?: unknown;
  /** Transform function name */
  transform?: string;
}

/**
 * Workspace state definition
 */
export interface WorkspaceState {
  /** Initial state values */
  initial: Record<string, unknown>;
  /** Computed/derived values */
  computed?: Record<string, string>; // Expression strings
  /** Persistence config */
  persist?: {
    key: string;
    storage?: "local" | "session" | "none";
  };
}

// ============================================================================
// Main WorkspaceSpec Type
// ============================================================================

/**
 * Complete workspace specification.
 * This is what agents generate to compose UI.
 */
export interface WorkspaceSpec {
  /** Unique workspace identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Workspace description for agent context */
  description?: string;

  /** Semantic version */
  version?: string;

  /** Root layout node */
  layout: LayoutNode;

  /** Theme customizations */
  theme?: ThemeOverrides;

  /** Event bindings */
  bindings?: EventBinding[];

  /** Workspace state */
  state?: WorkspaceState;

  /** Metadata for agent context */
  meta?: {
    /** Purpose/intent of this workspace */
    purpose?: string;
    /** Target surface (desktop, mobile, etc) */
    surface?: string;
    /** Tags for categorization */
    tags?: string[];
    /** Generation context */
    context?: Record<string, unknown>;
  };
}

// ============================================================================
// Workspace Operations
// ============================================================================

/**
 * Patch operation for updating workspaces
 */
export interface WorkspacePatch {
  op: "add" | "remove" | "replace" | "move" | "copy";
  path: string; // JSON Pointer path
  value?: unknown;
  from?: string; // For move/copy
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// Rendering Context
// ============================================================================

/**
 * Context provided to workspace renderer
 */
export interface RenderContext {
  /** Component registry */
  registry: unknown; // ComponentRegistry from registry types

  /** Current theme */
  theme: ThemeOverrides;

  /** Workspace state */
  state: Record<string, unknown>;

  /** State update function */
  setState: (path: string, value: unknown) => void;

  /** Event emission function */
  emit: (event: string, payload?: unknown) => void;

  /** Slot content map */
  slots?: Record<string, React.ReactNode>;

  /** Surface type (desktop, mobile, etc) */
  surface?: string;
}
