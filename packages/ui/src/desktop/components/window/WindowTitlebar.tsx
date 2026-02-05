'use client';

import React, { useCallback, memo } from 'react';
import type { WindowId, TilePosition } from '../../core/window/types';
import {
  useWindowActions,
} from '../../core/window/useWindowManager';

// ═══════════════════════════════════════════════════════════════════════════
// Styles - Using CSS custom properties from theme
// ═══════════════════════════════════════════════════════════════════════════

const titlebarContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 'var(--bb-spacing-titlebar-height, 36px)',
  padding: '0 12px',
  background: 'var(--bb-color-titlebar-bg, #111111)',
  borderBottom: '1px solid var(--bb-color-window-border, #333333)',
  userSelect: 'none',
};

const titleTextStyle = (focused: boolean): React.CSSProperties => ({
  fontFamily: 'var(--bb-font-display, sans-serif)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: focused
    ? 'var(--bb-color-text-primary, #ffffff)'
    : 'var(--bb-color-text-muted, #888888)',
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginLeft: '12px',
};

const controlButtonBaseStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '2px',
  background: 'var(--bb-color-window-border, #333333)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  padding: 0,
  border: 'none',
  cursor: 'pointer',
};

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface WindowTitlebarProps {
  /** Window ID */
  id: WindowId;
  /** Window title */
  title: string;
  /** Whether the window is maximized */
  isMaximized: boolean;
  /** Whether the window is in fullscreen */
  isFullscreen?: boolean;
  /** Whether the window is tiled */
  isTiled?: TilePosition;
  /** Whether the window is focused */
  isFocused: boolean;
  /** Group ID if window is part of a group (reserved for tab group UI) */
  groupId?: string;
  /** Custom close handler (for standalone mode) */
  onClose?: () => void;
  /** Custom minimize handler (for standalone mode) */
  onMinimize?: () => void;
  /** Custom maximize handler (for standalone mode) */
  onMaximize?: () => void;
  /** Custom restore handler (for standalone mode) */
  onRestore?: () => void;
  /** Custom fullscreen handler (for standalone mode) */
  onFullscreen?: () => void;
  /** Custom exit fullscreen handler (for standalone mode) */
  onExitFullscreen?: () => void;
  /** Hide window control buttons */
  hideControls?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Additional content to render in the titlebar */
  children?: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// Control Button Component
// ═══════════════════════════════════════════════════════════════════════════

interface ControlButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  variant?: 'close' | 'default';
  children: React.ReactNode;
}

function ControlButton({ onClick, title, variant, children }: ControlButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...controlButtonBaseStyle,
        background: isHovered
          ? variant === 'close'
            ? 'var(--bb-color-destructive, #c44444)'
            : 'var(--bb-color-text-muted, #888888)'
          : 'var(--bb-color-window-border, #333333)',
      }}
    >
      <svg
        viewBox="0 0 10 10"
        fill="none"
        stroke="var(--bb-color-text-primary, #ffffff)"
        style={{
          width: '8px',
          height: '8px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        {children}
      </svg>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Window Titlebar Component
// ═══════════════════════════════════════════════════════════════════════════

function WindowTitlebarInner({
  id,
  title,
  isMaximized,
  isFullscreen,
  isTiled,
  isFocused,
  groupId: _groupId,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  onFullscreen,
  onExitFullscreen,
  hideControls = false,
  className,
  style,
  children,
}: WindowTitlebarProps) {
  // Get actions from the window manager store
  const actions = useWindowActions();

  // Handlers - use props if provided (standalone mode), otherwise use store actions
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClose) {
        onClose();
      } else {
        actions.close(id);
      }
    },
    [id, onClose, actions]
  );

  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onMinimize) {
        onMinimize();
      } else {
        actions.minimize(id);
      }
    },
    [id, onMinimize, actions]
  );

  const handleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMaximized) {
        if (onRestore) {
          onRestore();
        } else {
          actions.restore(id);
        }
      } else if (isTiled) {
        // Untile first
        actions.untile(id);
      } else {
        if (onMaximize) {
          onMaximize();
        } else {
          actions.maximize(id);
        }
      }
    },
    [id, isMaximized, isTiled, onRestore, onMaximize, actions]
  );

  const handleFullscreen = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isFullscreen) {
        if (onExitFullscreen) {
          onExitFullscreen();
        } else {
          actions.exitFullscreen();
        }
      } else {
        if (onFullscreen) {
          onFullscreen();
        } else {
          actions.fullscreen(id);
        }
      }
    },
    [id, isFullscreen, onFullscreen, onExitFullscreen, actions]
  );

  // Double-click titlebar to maximize/restore/untile (standard UX pattern)
  const handleDoubleClick = useCallback(() => {
    if (isMaximized) {
      if (onRestore) {
        onRestore();
      } else {
        actions.restore(id);
      }
    } else if (isTiled) {
      actions.untile(id);
    } else {
      if (onMaximize) {
        onMaximize();
      } else {
        actions.maximize(id);
      }
    }
  }, [id, isMaximized, isTiled, onRestore, onMaximize, actions]);

  return (
    <div
      className={`window-drag-handle ${className ?? ''}`}
      style={{ ...titlebarContainerStyle, ...style }}
      onDoubleClick={handleDoubleClick}
      data-bb-titlebar
    >
      <span style={titleTextStyle(isFocused)}>{title}</span>

      {/* Custom content (e.g., tabs) */}
      {children}

      {/* Window controls */}
      {!hideControls && (
        <div style={controlsStyle}>
          {/* Minimize */}
          <ControlButton onClick={handleMinimize} title="Minimize">
            <line x1="2" y1="5" x2="8" y2="5" strokeWidth="1.5" />
          </ControlButton>

          {/* Maximize/Restore */}
          <ControlButton
            onClick={handleMaximize}
            title={isMaximized || isTiled ? 'Restore' : 'Maximize'}
          >
            {isMaximized || isTiled ? (
              <>
                <rect x="1" y="3" width="5" height="5" strokeWidth="1" />
                <path d="M3 3V1h6v6h-2" strokeWidth="1" />
              </>
            ) : (
              <rect x="2" y="2" width="6" height="6" strokeWidth="1.5" />
            )}
          </ControlButton>

          {/* Fullscreen */}
          <ControlButton
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
          >
            {isFullscreen ? (
              // Exit fullscreen icon (corners pointing inward)
              <>
                <path d="M1 4H3V2" strokeWidth="1" />
                <path d="M9 4H7V2" strokeWidth="1" />
                <path d="M1 6H3V8" strokeWidth="1" />
                <path d="M9 6H7V8" strokeWidth="1" />
              </>
            ) : (
              // Enter fullscreen icon (corners pointing outward)
              <>
                <path d="M1 3V1H3" strokeWidth="1" />
                <path d="M7 1H9V3" strokeWidth="1" />
                <path d="M9 7V9H7" strokeWidth="1" />
                <path d="M3 9H1V7" strokeWidth="1" />
              </>
            )}
          </ControlButton>

          {/* Close */}
          <ControlButton onClick={handleClose} title="Close" variant="close">
            <line x1="2" y1="2" x2="8" y2="8" strokeWidth="1.5" />
            <line x1="8" y1="2" x2="2" y2="8" strokeWidth="1.5" />
          </ControlButton>
        </div>
      )}
    </div>
  );
}

/**
 * WindowTitlebar - A styled titlebar for windows with standard controls.
 *
 * Works in dual mode:
 * - **Standalone**: Pass all event handlers (onClose, onMinimize, etc.)
 * - **With Provider**: Uses useWindowManager() automatically
 *
 * @example Standalone mode
 * ```tsx
 * <WindowTitlebar
 *   id="my-window"
 *   title="My Window"
 *   isMaximized={false}
 *   isFocused={true}
 *   onClose={() => setIsOpen(false)}
 *   onMinimize={() => setIsMinimized(true)}
 * />
 * ```
 *
 * @example With DesktopOSProvider
 * ```tsx
 * <WindowTitlebar
 *   id={windowId}
 *   title={window.title}
 *   isMaximized={window.isMaximized}
 *   isFocused={window.isFocused}
 * />
 * ```
 */
export const WindowTitlebar = memo(WindowTitlebarInner);
