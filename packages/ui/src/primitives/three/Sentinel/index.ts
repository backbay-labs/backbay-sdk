/**
 * Sentinel - A floating orb UI component system
 *
 * The Sentinel is a radial menu system that can be summoned, thrown, and docked.
 * It provides quick access to applications and features through a cardinal
 * direction-based menu with optional radial and vertical submenus.
 *
 * @example
 * ```tsx
 * import {
 *   SentinelProvider,
 *   SentinelOverlay,
 *   DockedMiniOrb,
 *   useSentinelStore,
 * } from '@backbay/bb-ui';
 *
 * // In your app root or layout:
 * function App() {
 *   return (
 *     <SentinelProvider
 *       dependencies={{
 *         IconRenderer: MyIconComponent,
 *         GlyphRenderer: MyGlyphComponent,
 *         onOpenProcess: (id, opts) => openApp(id, opts),
 *         processMap: { console: 'terminal', lens: 'viewer' },
 *       }}
 *     >
 *       <SentinelOverlay />
 *       <DockedMiniOrb />
 *       {children}
 *     </SentinelProvider>
 *   );
 * }
 *
 * // In your taskbar:
 * function TaskbarItem() {
 *   const summon = useSentinelStore((s) => s.summon);
 *   const setTaskbarOrigin = useSentinelStore((s) => s.setTaskbarOrigin);
 *
 *   const handleClick = (e: React.MouseEvent) => {
 *     const rect = e.currentTarget.getBoundingClientRect();
 *     setTaskbarOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
 *     summon();
 *   };
 *
 *   return <button onClick={handleClick}>Sentinel</button>;
 * }
 * ```
 */

// -----------------------------------------------------------------------------
// Core Components
// -----------------------------------------------------------------------------

export { SentinelOverlay } from './SentinelOverlay';
export { SentinelOrb } from './SentinelOrb';
export { SentinelTether } from './SentinelTether';
export { DockedMiniOrb } from './DockedMiniOrb';

// -----------------------------------------------------------------------------
// Menu Components
// -----------------------------------------------------------------------------

export { CardinalMenu } from './CardinalMenu';
export { CardinalItem } from './CardinalItem';
export { RadialSubmenu } from './RadialSubmenu';
export { VerticalSubmenu } from './VerticalSubmenu';

// -----------------------------------------------------------------------------
// Conversation Components
// -----------------------------------------------------------------------------

export { SentinelConversation } from './SentinelConversation';

// -----------------------------------------------------------------------------
// Avatar Components
// -----------------------------------------------------------------------------

export { AvatarMode } from './AvatarMode';
export { AvatarRenderer } from './AvatarRenderer';
export { CameraPip } from './CameraPip';

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------

export { useThrowPhysics } from './useThrowPhysics';
export { useCameraPermission } from './useCameraPermission';

// -----------------------------------------------------------------------------
// Provider and Context
// -----------------------------------------------------------------------------

export { SentinelProvider, useSentinelDependencies } from './SentinelProvider';

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export { useSentinelStore } from './sentinelStore';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type {
  // Core types
  SentinelPhase,
  Edge,
  DockedPosition,
  Cardinal,
  ConversationState,
  DocketItem,
  OrbPosition,
  SentinelState,

  // Component props
  SentinelDependencies,
  SentinelOverlayProps,
  SentinelOrbProps,
  SentinelTetherProps,
  CardinalMenuProps,
  CardinalItemProps,
  SubmenuItem,
  ArcConstraint,
  RadialSubmenuProps,
  VerticalSubmenuProps,
  DockedMiniOrbProps,
  AvatarModeProps,
  AvatarRendererProps,
  CameraPipProps,

  // Avatar types
  AvatarMotionData,
  AvatarSessionReturn,

  // Hook types
  UseCameraPermissionReturn,
  ThrowPhysicsOptions,
  ThrowPhysicsReturn,

  // Provider types
  SentinelProviderProps,
  SentinelContextValue,
} from './types';
