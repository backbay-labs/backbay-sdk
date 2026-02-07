/**
 * @backbay/glia Desktop OS - Shell Components
 *
 * Styled shell components for the desktop OS layer.
 * These components use CSS variables for theming and can work
 * standalone or within the DesktopOSProvider context.
 *
 * @example
 * ```tsx
 * import { Taskbar, TaskbarButton, ContextMenu, Clock } from '@backbay/glia/desktop/components/shell';
 *
 * function MyTaskbar() {
 *   return (
 *     <Taskbar showClock={true}>
 *       <Taskbar.StartButton onClick={() => setStartMenuOpen(true)} />
 *       <Taskbar.Divider />
 *       <Taskbar.RunningApps>
 *         {windows.map(w => (
 *           <TaskbarButton key={w.id} windowId={w.id} title={w.title} />
 *         ))}
 *       </Taskbar.RunningApps>
 *     </Taskbar>
 *   );
 * }
 * ```
 */

// Main components
export { Taskbar, type TaskbarProps, type TaskbarStartButtonProps, type TaskbarDividerProps, type TaskbarSectionProps } from './Taskbar';
export { TaskbarButton, type TaskbarButtonProps } from './TaskbarButton';
export { ContextMenu, type ContextMenuProps } from './ContextMenu';
export { Clock, type ClockProps } from './Clock';
export { GlassMenubar, type GlassMenubarProps, type MenubarItem, type MenubarMenuItem } from './GlassMenubar';
export { StartMenu, type StartMenuProps } from './StartMenu';
export { SystemTray, type SystemTrayProps, type SystemTrayItem } from './SystemTray';
export { NotificationCenter, type NotificationCenterProps } from './NotificationCenter';
export { NotificationToast, type NotificationToastProps } from './NotificationToast';
