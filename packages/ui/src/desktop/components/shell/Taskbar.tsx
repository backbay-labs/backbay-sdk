/**
 * @backbay/bb-ui Desktop OS - Taskbar Component
 *
 * Main taskbar container that renders at the bottom of the screen.
 * Provides sections for start button, running apps, pinned apps, and system tray.
 *
 * Can be used standalone or within the DesktopOSProvider context.
 * When standalone, you control the state via props. When in context,
 * it automatically connects to the window manager.
 *
 * @example Standalone usage
 * ```tsx
 * <Taskbar showClock={true}>
 *   <Taskbar.StartButton onClick={() => setStartMenuOpen(true)} />
 *   <Taskbar.Divider />
 *   <Taskbar.RunningApps>
 *     {windows.map(w => (
 *       <TaskbarButton key={w.id} {...w} />
 *     ))}
 *   </Taskbar.RunningApps>
 * </Taskbar>
 * ```
 *
 * @example With custom content
 * ```tsx
 * <Taskbar showClock={true}>
 *   <Taskbar.StartButton icon={<MyLogo />} />
 *   <Taskbar.Divider />
 *   <Taskbar.Section flex={1}>
 *     {runningWindows}
 *   </Taskbar.Section>
 *   <Taskbar.Divider />
 *   <Taskbar.SystemTray>
 *     <WifiIndicator />
 *     <BatteryIndicator />
 *   </Taskbar.SystemTray>
 * </Taskbar>
 * ```
 */

import { type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Clock, type ClockProps } from './Clock';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskbarProps {
  /** Content sections to render in the taskbar */
  children?: ReactNode;
  /** Whether to show the system clock */
  showClock?: boolean;
  /** Clock configuration */
  clockProps?: ClockProps;
  /** Whether the taskbar is hidden (e.g., fullscreen mode) */
  hidden?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

export interface TaskbarStartButtonProps {
  /** Whether the start menu is open/active */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Custom icon (defaults to Backbay logo) */
  icon?: ReactNode;
  /** Title/tooltip */
  title?: string;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

export interface TaskbarDividerProps {
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

export interface TaskbarSectionProps {
  /** Content */
  children?: ReactNode;
  /** Flex grow value */
  flex?: number;
  /** Gap between items */
  gap?: string | number;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'var(--bb-spacing-taskbar-height, 48px)',
    background: 'var(--bb-color-taskbar-bg, rgba(17, 17, 17, 0.8))',
    backdropFilter: 'var(--bb-blur-backdrop, blur(12px))',
    borderTop: '1px solid var(--bb-color-window-border, #333333)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    zIndex: 9000,
    gap: '4px',
  },
  startButton: {
    width: '40px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--bb-radius-button, 2px)',
    fontSize: '18px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--bb-duration-fast, 100ms) ease',
  },
  startButtonActive: {
    color: 'var(--bb-color-accent, #d4a84b)',
    background: 'var(--bb-color-accent-glow, rgba(212, 168, 75, 0.2))',
  },
  startButtonInactive: {
    color: 'var(--bb-color-text-muted, #888888)',
    background: 'transparent',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: 'var(--bb-color-window-border, #333333)',
    margin: '0 4px',
  },
  section: {
    display: 'flex',
    alignItems: 'center',
  },
  runningApps: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    overflowX: 'auto',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
  },
  pinnedApps: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  systemTray: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  centerSection: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start menu button.
 */
function StartButton({
  active = false,
  onClick,
  icon,
  title = 'Start Menu',
  className,
  style,
}: TaskbarStartButtonProps) {
  // Default Backbay-style logo
  const defaultIcon = (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 2L2 16l14 14 14-14L16 2zm0 4.5L26.5 16 16 25.5 5.5 16 16 6.5z" />
      <circle cx="16" cy="16" r="4" />
    </svg>
  );

  return (
    <motion.button
      style={{
        ...styles.startButton,
        ...(active ? styles.startButtonActive : styles.startButtonInactive),
        ...style,
      }}
      className={className}
      onClick={onClick}
      title={title}
      whileHover={{
        background: 'var(--bb-color-context-menu-hover, #1a1a1a)',
        color: 'var(--bb-color-accent, #d4a84b)',
      }}
      transition={{ duration: 0.15 }}
    >
      {icon ?? defaultIcon}
    </motion.button>
  );
}

/**
 * Vertical divider between sections.
 */
function Divider({ className, style }: TaskbarDividerProps) {
  return <div style={{ ...styles.divider, ...style }} className={className} />;
}

/**
 * Generic section container.
 */
function Section({
  children,
  flex,
  gap = '2px',
  className,
  style,
}: TaskbarSectionProps) {
  return (
    <div
      style={{
        ...styles.section,
        flex,
        gap: typeof gap === 'number' ? `${gap}px` : gap,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Running apps section (scrollable).
 */
function RunningApps({ children, className, style }: TaskbarSectionProps) {
  return (
    <div
      style={{
        ...styles.runningApps,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Pinned apps section.
 */
function PinnedApps({ children, className, style }: TaskbarSectionProps) {
  return (
    <div
      style={{
        ...styles.pinnedApps,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * System tray section (right side).
 */
function SystemTray({ children, className, style }: TaskbarSectionProps) {
  return (
    <div
      style={{
        ...styles.systemTray,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Absolute center section (for centered content like sentinel agents).
 */
function CenterSection({ children, className, style }: TaskbarSectionProps) {
  return (
    <div
      style={{
        ...styles.centerSection,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main taskbar component.
 *
 * Compose using sub-components:
 * - `Taskbar.StartButton` - Start menu button
 * - `Taskbar.Divider` - Vertical separator
 * - `Taskbar.Section` - Generic flexbox section
 * - `Taskbar.RunningApps` - Scrollable running apps area
 * - `Taskbar.PinnedApps` - Pinned apps section
 * - `Taskbar.SystemTray` - System tray on the right
 * - `Taskbar.CenterSection` - Absolutely centered content
 */
export function Taskbar({
  children,
  showClock = true,
  clockProps,
  hidden = false,
  className,
  style,
}: TaskbarProps) {
  if (hidden) {
    return null;
  }

  return (
    <div
      style={{ ...styles.container, ...style }}
      className={className}
      data-shell-target="taskbar"
    >
      {children}

      {/* Auto-add clock to system tray if no children provided */}
      {!children && showClock && (
        <>
          <div style={{ flex: 1 }} />
          <SystemTray>
            <Clock {...clockProps} />
          </SystemTray>
        </>
      )}

      {/* If children provided, append clock to end */}
      {children && showClock && <Clock {...clockProps} />}
    </div>
  );
}

// Attach sub-components
Taskbar.StartButton = StartButton;
Taskbar.Divider = Divider;
Taskbar.Section = Section;
Taskbar.RunningApps = RunningApps;
Taskbar.PinnedApps = PinnedApps;
Taskbar.SystemTray = SystemTray;
Taskbar.CenterSection = CenterSection;
Taskbar.Clock = Clock;
