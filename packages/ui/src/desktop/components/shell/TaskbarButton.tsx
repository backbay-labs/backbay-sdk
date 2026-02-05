/**
 * @backbay/bb-ui Desktop OS - TaskbarButton Component
 *
 * Individual button representing a window on the taskbar.
 * Handles click to focus/minimize, hover for preview, and position tracking
 * for minimize/restore animations.
 *
 * @example
 * ```tsx
 * // Within Taskbar
 * <TaskbarButton
 *   windowId="window-1"
 *   title="Terminal"
 *   icon="terminal"
 *   isActive={true}
 *   isFocused={true}
 *   onClick={() => handleClick('window-1')}
 * />
 * ```
 */

import {
  useEffect,
  useRef,
  useCallback,
  memo,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import type { TaskbarButtonPosition } from '../../core/shell/types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskbarButtonProps {
  /** Window ID this button represents */
  windowId: string;
  /** Button title/label */
  title: string;
  /** Icon to display (emoji, URL, or component name) */
  icon?: string;
  /** Whether the window is active (not minimized) */
  isActive?: boolean;
  /** Whether the window is currently focused */
  isFocused?: boolean;
  /** Click handler */
  onClick?: (windowId: string) => void;
  /** Mouse enter handler (for preview) */
  onMouseEnter?: (windowId: string, icon?: string) => void;
  /** Mouse leave handler (for preview) */
  onMouseLeave?: () => void;
  /** Register button position for animations */
  onRegisterPosition?: (windowId: string, position: TaskbarButtonPosition) => void;
  /** Unregister button position */
  onUnregisterPosition?: (windowId: string) => void;
  /** Custom icon render function */
  renderIcon?: (icon: string) => React.ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const createStyles = (isActive: boolean, isFocused: boolean): Record<string, CSSProperties> => ({
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    height: '36px',
    background: isActive ? 'var(--bb-color-context-menu-hover, #1a1a1a)' : 'transparent',
    borderRadius: 'var(--bb-radius-button, 2px)',
    fontFamily: 'var(--bb-font-display)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: isFocused ? 'var(--bb-color-accent, #d4a84b)' : 'var(--bb-color-text-muted, #888888)',
    cursor: 'pointer',
    position: 'relative' as const,
    border: 'none',
    outline: 'none',
  },
  focusIndicator: {
    content: '""',
    position: 'absolute' as const,
    bottom: '2px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: isFocused ? '60%' : '0',
    height: '2px',
    background: 'var(--bb-color-accent, #d4a84b)',
    borderRadius: '1px',
    transition: 'width var(--bb-duration-fast, 100ms) ease',
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

function TaskbarButtonInner({
  windowId,
  title,
  icon,
  isActive = false,
  isFocused = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onRegisterPosition,
  onUnregisterPosition,
  renderIcon,
  className,
  style,
}: TaskbarButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const styles = createStyles(isActive, isFocused);

  // Update button position for minimize/restore animations
  const updatePosition = useCallback(() => {
    if (!buttonRef.current || !onRegisterPosition) return;

    const rect = buttonRef.current.getBoundingClientRect();
    onRegisterPosition(windowId, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }, [windowId, onRegisterPosition]);

  // Register/unregister position on mount/unmount
  useEffect(() => {
    updatePosition();

    // Update on resize
    const handleResize = () => updatePosition();
    globalThis.addEventListener('resize', handleResize);

    return () => {
      globalThis.removeEventListener('resize', handleResize);
      onUnregisterPosition?.(windowId);
    };
  }, [windowId, updatePosition, onUnregisterPosition]);

  // Update position after render (for layout shifts)
  useEffect(() => {
    const timer = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(timer);
  });

  const handleClick = useCallback(() => {
    onClick?.(windowId);
  }, [windowId, onClick]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(windowId, icon);
  }, [windowId, icon, onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.();
  }, [onMouseLeave]);

  // Render icon based on type
  const renderedIcon = icon ? (
    renderIcon ? (
      renderIcon(icon)
    ) : (
      <span style={styles.icon}>{icon}</span>
    )
  ) : null;

  return (
    <motion.button
      ref={buttonRef}
      style={{ ...styles.button, ...style }}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-taskbar-button={windowId}
      whileHover={{
        background: 'var(--bb-color-context-menu-hover, #1a1a1a)',
        color: 'var(--bb-color-text-secondary, #cccccc)',
      }}
      transition={{ duration: 0.15 }}
    >
      {renderedIcon}
      {title}
      <span style={styles.focusIndicator} />
    </motion.button>
  );
}

// Memoize to prevent unnecessary re-renders from parent
export const TaskbarButton = memo(TaskbarButtonInner);
