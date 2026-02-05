/**
 * Sentinel Types
 *
 * Type definitions for the Sentinel orb component system.
 */

import type { ReactNode, ComponentType } from 'react';

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------

export type SentinelPhase =
  | 'docked'      // Orb is in taskbar or at rim
  | 'summoning'   // Ascending animation
  | 'open'        // Cardinal menu visible
  | 'dismissing'  // Descending animation
  | 'throwing'    // Being dragged/thrown
  | 'avatar';     // Avatar mode active

export type Edge = 'top' | 'left' | 'right';

export type DockedPosition =
  | 'taskbar'
  | { edge: Edge; percent: number };  // 0-1 along edge

export type Cardinal = 'N' | 'E' | 'S' | 'W';

export type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface DocketItem {
  id: string;
  position?: Cardinal;  // only for tier-1
  icon: string;
  label: string;
  action?: () => void;
  children?: DocketItem[];
}

export interface OrbPosition {
  x: number;
  y: number;
}

// -----------------------------------------------------------------------------
// Store Interface
// -----------------------------------------------------------------------------

export interface SentinelState {
  // State
  phase: SentinelPhase;
  dockedPosition: DockedPosition;
  orbPosition: OrbPosition;
  targetPosition: OrbPosition;  // for animations
  expandedCardinal: Cardinal | null;
  expandedRadial: string | null;
  docket: DocketItem[];
  cameraPermission: 'prompt' | 'granted' | 'denied';
  avatarAnonMode: boolean;
  avatarMosaicSize: number;

  // Computed - taskbar origin for tether
  taskbarOrigin: OrbPosition;

  // Cardinal configuration state
  visibleCardinals: string[];

  // Conversation state
  conversationState: ConversationState;
  isTextInputEnabled: boolean;
  isMuted: boolean;

  // Caption state
  currentCaption: string | null;

  // Actions
  summon: () => void;
  dismiss: () => void;
  setPhase: (phase: SentinelPhase) => void;
  setOrbPosition: (pos: OrbPosition) => void;
  setTargetPosition: (pos: OrbPosition) => void;
  throwTo: (velocity: { x: number; y: number }) => void;
  dockAt: (position: DockedPosition) => void;
  expandCardinal: (direction: Cardinal | null) => void;
  expandRadial: (itemId: string | null) => void;
  setDocket: (items: DocketItem[]) => void;
  enterAvatarMode: () => void;
  exitAvatarMode: () => void;
  setCameraPermission: (status: 'prompt' | 'granted' | 'denied') => void;
  setTaskbarOrigin: (pos: OrbPosition) => void;
  setAvatarAnonMode: (enabled: boolean) => void;
  setAvatarMosaicSize: (value: number) => void;

  // Cardinal configuration actions
  setVisibleCardinals: (cardinals: string[]) => void;

  // Conversation actions
  setConversationState: (state: ConversationState) => void;
  toggleTextInput: () => void;
  toggleMute: () => void;

  // Caption actions
  setCurrentCaption: (text: string | null) => void;
}

// -----------------------------------------------------------------------------
// Component Props
// -----------------------------------------------------------------------------

/**
 * Props for injecting external dependencies into Sentinel components.
 * This allows the package to be reusable without hardcoded imports.
 */
export interface SentinelDependencies {
  /**
   * Optional icon renderer component.
   * Receives name, size, and color props.
   * If not provided, a simple fallback is used.
   */
  IconRenderer?: ComponentType<{
    name: string;
    size: number;
    color: string;
  }>;

  /**
   * Optional 3D glyph component for orb visualization.
   * Receives variant, scale, position, and state props.
   * If not provided, a simple sphere is rendered.
   */
  GlyphRenderer?: ComponentType<{
    variant?: string;
    scale?: number;
    position?: [number, number, number];
    state?: 'idle' | 'listening';
  }>;

  /**
   * Optional avatar renderer override for realistic avatar rendering.
   * Receives avatar motion props and camera stream when available.
   */
  AvatarRenderer?: ComponentType<AvatarRendererProps>;

  /**
   * Optional handler for opening processes.
   * Called when a cardinal menu item is clicked.
   */
  onOpenProcess?: (processId: string, options: Record<string, unknown>) => void;

  /**
   * Map of docket item IDs to process IDs.
   * Used by CardinalMenu to open processes.
   */
  processMap?: Record<string, string>;

  /**
   * Optional hook for avatar session management.
   * When provided, enables real-time avatar motion streaming.
   * The hook should be called with a userId to create a session.
   */
  useAvatarSession?: (options: { userId: string; autoConnect?: boolean }) => AvatarSessionReturn;
}

/**
 * Props for the SentinelOverlay component
 */
export interface SentinelOverlayProps {
  /** Optional custom class name */
  className?: string;
}

/**
 * Props for the SentinelOrb component
 */
export interface SentinelOrbProps {
  /** Optional custom class name */
  className?: string;
}

/**
 * Props for the SentinelTether component
 */
export interface SentinelTetherProps {
  /** Optional custom class name */
  className?: string;
}

/**
 * Props for the CardinalMenu component
 */
export interface CardinalMenuProps {
  /** Optional custom class name */
  className?: string;
  /**
   * Dynamic array of items to display in the 180-degree arc (top half).
   * If not provided, falls back to docket items with position.
   */
  items?: DocketItem[];
  /**
   * Optional callback when user clicks the "edit" link below the arc.
   * If not provided, the edit link is not rendered.
   */
  onEdit?: () => void;
}

/**
 * Props for the CardinalItem component
 */
export interface CardinalItemProps {
  icon: string;
  label: string;
  position: Cardinal;
  onClick?: () => void;
}

/**
 * Props for submenu items
 */
export interface SubmenuItem {
  id: string;
  icon: string;
  label: string;
  action?: () => void;
  children?: SubmenuItem[];
}

/**
 * Arc constraint for RadialSubmenu
 * - 'auto': Determine arc based on centerOffset (legacy behavior)
 * - 'semicircle': Force top 180-degree arc (left to right)
 */
export type ArcConstraint = 'auto' | 'semicircle';

/**
 * Props for the RadialSubmenu component
 */
export interface RadialSubmenuProps {
  items: SubmenuItem[];
  centerOffset: { x: number; y: number };
  /**
   * Constrains the arc placement.
   * - 'auto': Determine based on centerOffset (default)
   * - 'semicircle': Force top 180-degree arc
   */
  arcConstraint?: ArcConstraint;
  onItemClick: (item: SubmenuItem) => void;
  onItemHover: (itemId: string | null) => void;
  hoveredItemId: string | null;
}

/**
 * Props for the VerticalSubmenu component
 */
export interface VerticalSubmenuProps {
  items: SubmenuItem[];
  anchorPosition: { x: number; y: number };
  onItemClick: (item: SubmenuItem) => void;
}

/**
 * Props for the DockedMiniOrb component
 */
export interface DockedMiniOrbProps {
  /** Optional custom class name */
  className?: string;
}

/**
 * Props for the AvatarMode component
 */
export interface AvatarModeProps {
  /** Optional custom class name */
  className?: string;
}

/**
 * Motion data from avatar session
 */
export interface AvatarMotionData {
  blendshapes: Record<string, number>;
  headPose: [number, number, number]; // [rx, ry, rz] in radians
  timestamp: string;
}

/**
 * Return type for useAvatarSession hook (for dependency injection)
 */
export interface AvatarSessionReturn {
  sessionId: string | null;
  motionData: AvatarMotionData | null;
  renderFrame?: {
    image: string;
    timestamp?: string;
    contentType?: string;
    width?: number;
    height?: number;
    latencyMs?: number;
  } | null;
  isConnected: boolean;
  uploadFrame: (frameData: string) => Promise<void>;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Props for the AvatarRenderer component
 */
export interface AvatarRendererProps {
  /**
   * Whether the avatar is actively engaged (listening/speaking).
   * Affects animation intensity and glow.
   */
  isActive?: boolean;

  /**
   * ARKit-compatible blendshapes for facial expressions.
   * Values range from 0-1.
   * When provided, these override idle animations.
   */
  blendshapes?: Record<string, number>;

  /**
   * Head rotation in radians [rx, ry, rz].
   * When provided, this overrides idle head animation.
   */
  headPose?: [number, number, number];

  /**
   * Optional rendered frame from a neural avatar service.
   */
  renderFrame?: {
    image: string;
    timestamp?: string;
    contentType?: string;
    width?: number;
    height?: number;
    latencyMs?: number;
  };

  /**
   * Optional camera stream for real-time avatar rendering.
   */
  stream?: MediaStream | null;
}

/**
 * Props for the CameraPip component
 */
export interface CameraPipProps {
  stream: MediaStream | null;
  size?: number;
  onToggle?: () => void;
}

// -----------------------------------------------------------------------------
// Hook Types
// -----------------------------------------------------------------------------

export interface UseCameraPermissionReturn {
  permission: 'prompt' | 'granted' | 'denied';
  stream: MediaStream | null;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  stopStream: () => void;
}

export interface ThrowPhysicsOptions {
  onPositionUpdate: (pos: { x: number; y: number }) => void;
  onSettle: (position: { edge: Edge; percent: number }) => void;
  edgePadding?: number;
}

export interface ThrowPhysicsReturn {
  isDragging: boolean;
  startDrag: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  endDrag: (e: React.PointerEvent) => void;
}

// -----------------------------------------------------------------------------
// Provider Props
// -----------------------------------------------------------------------------

export interface SentinelProviderProps {
  children: ReactNode;
  /**
   * External dependencies to inject into Sentinel components
   */
  dependencies?: SentinelDependencies;
  /**
   * Initial docket items (optional, uses defaults if not provided)
   */
  initialDocket?: DocketItem[];
}

// -----------------------------------------------------------------------------
// Context Types
// -----------------------------------------------------------------------------

export interface SentinelContextValue {
  dependencies: SentinelDependencies;
}
