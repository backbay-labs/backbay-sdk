/**
 * AgentConsole Module
 *
 * Conversational agent interface layer with 3D avatar,
 * focus constellation, quick actions, and chat interface.
 */

// Main container
export { AgentConsole } from "./AgentConsole";

// Sub-components
export { GlyphAvatar } from "./GlyphAvatar";
export { ConsoleChat } from "./ConsoleChat";
export { QuickActions } from "./QuickActions";
export { FocusConstellation } from "./FocusConstellation";

// Types
export type {
  AgentState,
  AgentMode,
  MessageRole,
  Message,
  ToolCall,
  EntityRef,
  FocusNodeKind,
  FocusNode,
  QuickAction,
  GlyphAvatarProps,
  ConsoleChatProps,
  QuickActionsProps,
  FocusConstellationProps,
  AgentConsoleProps,
} from "./types";

// Visual configuration
export {
  AGENT_STATE_COLORS,
  AGENT_MODE_INTENSITY,
  FOCUS_NODE_COLORS,
  FOCUS_NODE_SHAPES,
} from "./types";
