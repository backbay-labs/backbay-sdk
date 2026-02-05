/**
 * @backbay/bb-ui Desktop OS
 *
 * Reusable desktop OS components for React applications.
 * Includes window management, taskbar, context menus, and more.
 *
 * @example Basic usage with provider
 * ```tsx
 * import { DesktopOSProvider, Window, Taskbar, Desktop } from '@backbay/bb-ui/desktop';
 *
 * function App() {
 *   return (
 *     <DesktopOSProvider
 *       processes={myApps}
 *       theme={{ colors: { accent: '#00ff88' } }}
 *     >
 *       <Desktop />
 *       <Taskbar />
 *     </DesktopOSProvider>
 *   );
 * }
 * ```
 *
 * @example Power user path with headless hooks
 * ```tsx
 * import { useWindowManager, useTaskbar } from '@backbay/bb-ui/desktop/core';
 *
 * function MyWindowManager() {
 *   const { windows, open, close, focus } = useWindowManager();
 *   // Build your own UI
 * }
 * ```
 */

// Core (headless hooks and types)
// Note: DesktopIcon type is exported as DesktopIconDef to avoid conflict with DesktopIcon component
export {
  // Window types
  type WindowId,
  type TilePosition,
  type WindowState,
  type WindowGroup,
  type WindowOpenConfig,
  type UseWindowManagerReturn,
  // Window hooks
  useWindowManager,
  useWindowManagerStore,
  useWindowIds,
  useWindow,
  useIsWindowFocused,
  useIsWindowFullscreen,
  useIsFullscreenActive,
  useWindowActions,
  useWindowGroup,
  // Shell types
  type TaskbarButtonPosition,
  type TaskbarItem,
  type TaskbarPreviewState,
  type UseTaskbarReturn,
  type ContextMenuTargetType,
  type ContextMenuTarget,
  type ContextMenuItem,
  type UseContextMenuReturn,
  type StartMenuCategory,
  type StartMenuApp,
  type UseStartMenuReturn,
  // Shell hooks
  useTaskbar,
  useTaskbarStore,
  // Desktop types
  type ProcessDefinition,
  type ProcessInstance,
  type DesktopIcon as DesktopIconDef,
  type UseDesktopReturn,
  type UseProcessRegistryReturn,
  type SnapZone,
  type UseSnapZonesReturn,
  type DesktopOSConfig,
  // Desktop hooks
  useSnapZones,
  useSnapZoneStore,
  getSnapZoneDimensions,
  EDGE_THRESHOLD,
  CORNER_SIZE,
} from './core';

// Themes
export * from './themes';

// Providers
export * from './providers';

// Components (styled)
export * from './components/desktop';
export * from './components/window';
export * from './components/shell';
