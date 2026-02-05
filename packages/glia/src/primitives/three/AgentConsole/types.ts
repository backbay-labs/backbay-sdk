/**
 * AgentConsole Types
 *
 * Type definitions for the conversational agent interface layer.
 * Integrates with Backbay domain entities for context-aware interactions.
 */

import type { TrustTier } from "@backbay/contract";

// -----------------------------------------------------------------------------
// Agent State
// -----------------------------------------------------------------------------

/**
 * Current state of the agent avatar
 */
export type AgentState =
  | "idle"
  | "listening"
  | "thinking"
  | "responding"
  | "error";

/**
 * Agent mode determining behavior and visual treatment
 */
export type AgentMode =
  | "conversational" // Standard chat interaction
  | "monitoring" // Passive observation of workspace
  | "focused" // Deep focus on specific entity
  | "commanding"; // Executing commands/actions

// -----------------------------------------------------------------------------
// Message Types
// -----------------------------------------------------------------------------

export type MessageRole = "user" | "agent" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  /** Optional entity references in this message */
  entityRefs?: EntityRef[];
  /** Thinking/reasoning content (for agent messages) */
  thinking?: string;
  /** Tool calls made during this message */
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "completed" | "failed";
}

export interface EntityRef {
  type: "job" | "node" | "receipt";
  id: string;
}

// -----------------------------------------------------------------------------
// Focus Constellation
// -----------------------------------------------------------------------------

export type FocusNodeKind =
  | "job"
  | "node"
  | "receipt"
  | "context"
  | "action"
  | "warning";

export interface FocusNode {
  id: string;
  label: string;
  kind: FocusNodeKind;
  /** 0-1, affects size and prominence */
  importance?: number;
  /** Visual indicator for unread/new */
  hasUnread?: boolean;
  /** Associated entity if applicable */
  entityRef?: EntityRef;
  /** Optional tooltip/description */
  description?: string;
}

// -----------------------------------------------------------------------------
// Quick Actions
// -----------------------------------------------------------------------------

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Action is currently available */
  enabled?: boolean;
  /** Visual category */
  category?: "primary" | "secondary" | "danger";
}

// -----------------------------------------------------------------------------
// Component Props
// -----------------------------------------------------------------------------

export interface GlyphAvatarProps {
  /** Current agent state */
  state: AgentState;
  /** Current agent mode */
  mode?: AgentMode;
  /** User's trust tier affects avatar appearance */
  trustTier?: TrustTier;
  /** Size scale factor */
  scale?: number;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Click handler */
  onClick?: () => void;
}

export interface ConsoleChatProps {
  /** Message history */
  messages: Message[];
  /** Agent is currently typing/generating */
  isTyping?: boolean;
  /** Placeholder text for input */
  placeholder?: string;
  /** Submit handler */
  onSubmit: (text: string) => void;
  /** Entity click handler */
  onEntityClick?: (ref: EntityRef) => void;
  /** Maximum visible messages */
  maxVisibleMessages?: number;
  /** Position in 3D space */
  position?: [number, number, number];
}

export interface QuickActionsProps {
  /** Available actions */
  actions: QuickAction[];
  /** Action click handler */
  onAction: (actionId: string) => void;
  /** Layout direction */
  direction?: "horizontal" | "vertical" | "radial";
  /** Position in 3D space */
  position?: [number, number, number];
}

export interface FocusConstellationProps {
  /** Focus nodes to display */
  nodes: FocusNode[];
  /** Currently focused node ID */
  focusedId?: string | null;
  /** Node click handler */
  onNodeClick?: (id: string) => void;
  /** Node hover handler */
  onNodeHover?: (id: string | null) => void;
  /** Orbit radius */
  radius?: number;
  /** Position in 3D space */
  position?: [number, number, number];
}

// -----------------------------------------------------------------------------
// Agent Console Container
// -----------------------------------------------------------------------------

export interface AgentConsoleProps {
  /** Current agent state */
  agentState: AgentState;
  /** Current agent mode */
  agentMode?: AgentMode;
  /** User's trust tier */
  trustTier?: TrustTier;
  /** Whether agent is typing */
  isTyping?: boolean;
  /** Message history */
  messages: Message[];
  /** Focus constellation nodes */
  focusNodes?: FocusNode[];
  /** Quick actions */
  quickActions?: QuickAction[];
  /** Currently focused node */
  focusedNodeId?: string | null;
  /** Prompt submit handler */
  onPromptSubmit: (text: string) => void;
  /** Focus node click handler */
  onFocusNodeClick?: (id: string) => void;
  /** Quick action handler */
  onQuickAction?: (actionId: string) => void;
  /** Entity reference click handler */
  onEntityClick?: (ref: EntityRef) => void;
  /** Avatar click handler */
  onAvatarClick?: () => void;
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

// -----------------------------------------------------------------------------
// Visual Configuration
// -----------------------------------------------------------------------------

export const AGENT_STATE_COLORS: Record<AgentState, string> = {
  idle: "#6366f1", // Indigo - calm, ready
  listening: "#22c55e", // Green - active, receiving
  thinking: "#eab308", // Yellow - processing
  responding: "#3b82f6", // Blue - outputting
  error: "#ef4444", // Red - problem
};

export const AGENT_MODE_INTENSITY: Record<AgentMode, number> = {
  conversational: 0.6,
  monitoring: 0.3,
  focused: 0.8,
  commanding: 1.0,
};

export const FOCUS_NODE_COLORS: Record<FocusNodeKind, string> = {
  job: "#06b6d4", // Cyan
  node: "#8b5cf6", // Purple
  receipt: "#10b981", // Emerald
  context: "#6366f1", // Indigo
  action: "#f59e0b", // Amber
  warning: "#ef4444", // Red
};

export const FOCUS_NODE_SHAPES: Record<FocusNodeKind, "sphere" | "box" | "octahedron" | "diamond"> = {
  job: "sphere",
  node: "octahedron",
  receipt: "diamond",
  context: "sphere",
  action: "box",
  warning: "octahedron",
};
