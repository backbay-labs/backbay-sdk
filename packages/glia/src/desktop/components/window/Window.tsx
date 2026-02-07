'use client';

import React, { useCallback, useRef, useMemo, useState, useEffect, memo } from 'react';
import { Rnd, type DraggableData } from 'react-rnd';
import { motion, type Transition, type Variants, AnimatePresence } from 'motion/react';
import type { WindowId, TilePosition, WindowState } from '../../core/window/types';
import {
  useWindow,
  useIsWindowFocused,
  useIsWindowFullscreen,
  useWindowGroup,
  useWindowActions,
  useWindowManagerStore,
} from '../../core/window/useWindowManager';
import { WindowTitlebar } from './WindowTitlebar';
import { GliaErrorBoundary } from '../../../primitives/atoms/GliaErrorBoundary';

// ═══════════════════════════════════════════════════════════════════════════
// Hyprland-style animation configurations
// Fast, smooth springs with minimal overshoot for that polished feel
// ═══════════════════════════════════════════════════════════════════════════

const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
  mass: 0.8,
};

const SPRING_SMOOTH: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Minimize animation - fast ease-out curve
const MINIMIZE_TRANSITION: Transition = {
  type: 'tween',
  duration: 0.3,
  ease: [0.32, 0, 0.67, 0],
};

// Restore animation - spring physics for that snappy feel
const RESTORE_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

/**
 * Get animation config based on window variant
 */
function getWindowAnimations(variant: 'default' | 'prominent' = 'default') {
  if (variant === 'prominent') {
    // Prominent: dramatic slide-up with scale, like opening a workspace
    return {
      initial: { opacity: 0, scale: 0.92, y: 40 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.96, y: 20 },
      transition: SPRING_SMOOTH,
    };
  }
  // Default: snappy pop-in from center
  return {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: SPRING_SNAPPY,
  };
}

/**
 * Calculate animation variants for minimize/restore based on target position.
 */
function getMinimizeRestoreVariants(
  windowRect: { x: number; y: number; width: number; height: number },
  targetCenter?: { x: number; y: number }
): Variants {
  const windowCenterX = windowRect.x + windowRect.width / 2;
  const windowCenterY = windowRect.y + windowRect.height / 2;

  if (!targetCenter) {
    return {
      minimized: {
        opacity: 0,
        scale: 0.1,
        y: 200,
        transition: MINIMIZE_TRANSITION,
      },
      visible: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: RESTORE_TRANSITION,
      },
    };
  }

  const deltaX = targetCenter.x - windowCenterX;
  const deltaY = targetCenter.y - windowCenterY;

  return {
    minimized: {
      opacity: 0,
      scale: 0.1,
      x: deltaX,
      y: deltaY,
      transition: MINIMIZE_TRANSITION,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: RESTORE_TRANSITION,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles - Using CSS custom properties from theme
// ═══════════════════════════════════════════════════════════════════════════

const windowFrameStyle = (
  focused: boolean,
  variant: 'default' | 'prominent',
  isFullscreen: boolean
): React.CSSProperties => ({
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--glia-color-bg-panel, #0a0a0a)',
  border: isFullscreen
    ? 'none'
    : `var(--glia-spacing-window-border-width, 2px) solid ${
        variant === 'prominent' && focused
          ? 'var(--glia-glass-active-border, rgba(212, 168, 75, 0.25))'
          : 'var(--glia-color-border, #333333)'
      }`,
  borderRadius: isFullscreen ? 0 : 'var(--glia-radius-lg, 3px)',
  overflow: 'visible',
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  // GPU acceleration
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  contain: 'layout paint',
  // Shadow
  boxShadow:
    variant === 'prominent'
      ? focused
        ? 'var(--glia-shadow-modal, 0 32px 80px -12px rgba(0, 0, 0, 0.6))'
        : 'var(--glia-shadow-hud-panel, 0 8px 32px rgba(0, 0, 0, 0.6))'
      : 'var(--glia-shadow-hud-panel, 0 8px 32px rgba(0, 0, 0, 0.6))',
  // Dim unfocused prominent windows
  filter: variant === 'prominent' && !focused ? 'brightness(0.92)' : undefined,
  width: '100%',
  height: '100%',
});

const windowContentStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  position: 'relative',
};

const groupDropZoneStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(212, 168, 75, 0.08)',
  border: '2px dashed rgba(212, 168, 75, 0.4)',
  borderRadius: 'var(--glia-radius-lg, 3px)',
};

const groupDropZoneLabelStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--glia-color-bg-panel, #0a0a0a)',
  border: '1px solid var(--glia-color-accent, #d4a84b)',
  borderRadius: 'var(--glia-radius-lg, 3px)',
  fontFamily: 'var(--glia-font-display, sans-serif)',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--glia-color-accent, #d4a84b)',
};

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface WindowProps {
  /** Window ID (required) */
  id: WindowId;
  /** Window content */
  children: React.ReactNode;

  // === Standalone mode props (optional when using provider) ===
  /** Window title (standalone mode) */
  title?: string;
  /** Window position (standalone mode) */
  position?: { x: number; y: number };
  /** Window size (standalone mode) */
  size?: { width: number; height: number };
  /** Minimum window size */
  minSize?: { width: number; height: number };
  /** Maximum window size */
  maxSize?: { width: number; height: number };
  /** Z-index for stacking */
  zIndex?: number;
  /** Whether window is minimized */
  isMinimized?: boolean;
  /** Whether window is maximized */
  isMaximized?: boolean;
  /** Whether window is in fullscreen */
  isFullscreen?: boolean;
  /** Whether window is focused */
  isFocused?: boolean;
  /** Tile position if snapped */
  tilePosition?: TilePosition;

  // === Styling ===
  /** Visual variant */
  variant?: 'default' | 'prominent';
  /** Hide the titlebar */
  hideTitlebar?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;

  // === Standalone mode event handlers ===
  /** Position change handler (standalone mode) */
  onPositionChange?: (position: { x: number; y: number }) => void;
  /** Size change handler (standalone mode) */
  onSizeChange?: (size: { width: number; height: number }) => void;
  /** Focus handler (standalone mode) */
  onFocus?: () => void;
  /** Close handler (standalone mode) */
  onClose?: () => void;
  /** Minimize handler (standalone mode) */
  onMinimize?: () => void;
  /** Maximize handler (standalone mode) */
  onMaximize?: () => void;
  /** Restore handler (standalone mode) */
  onRestore?: () => void;

  // === Advanced ===
  /** Minimize animation target position */
  minimizeTarget?: { x: number; y: number };
  /** Bounds for dragging (CSS selector or 'parent' or 'window') */
  bounds?: string | Element;
  /** Disable dragging */
  disableDragging?: boolean;
  /** Disable resizing */
  disableResizing?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Window Error Fallback
// ═══════════════════════════════════════════════════════════════════════════

function WindowErrorFallback({
  error,
  reset,
  windowId,
  title,
}: {
  error: Error;
  reset: () => void;
  windowId: string;
  title: string;
}) {
  const { close } = useWindowActions();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 24,
        gap: 16,
        background: 'rgba(20, 20, 30, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 100, 100, 0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          {title || 'Window'} crashed
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 12, lineHeight: 1.4, maxWidth: 280, wordBreak: 'break-word' }}>
          {error.message}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={reset}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            padding: '6px 14px',
            color: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Retry
        </button>
        <button
          onClick={() => close(windowId)}
          style={{
            background: 'rgba(255, 60, 60, 0.15)',
            border: '1px solid rgba(255, 60, 60, 0.25)',
            borderRadius: 6,
            padding: '6px 14px',
            color: 'rgba(255, 100, 100, 0.9)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Close Window
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Window Component
// ═══════════════════════════════════════════════════════════════════════════

function WindowInner({
  id,
  children,
  // Standalone props
  title: titleProp,
  position: positionProp,
  size: sizeProp,
  minSize: minSizeProp,
  maxSize: maxSizeProp,
  zIndex: zIndexProp,
  isMinimized: isMinimizedProp,
  isMaximized: isMaximizedProp,
  isFullscreen: isFullscreenProp,
  isFocused: isFocusedProp,
  tilePosition: tilePositionProp,
  // Styling
  variant = 'default',
  hideTitlebar = false,
  className,
  style,
  // Standalone handlers
  onPositionChange,
  onSizeChange,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  // Advanced
  minimizeTarget,
  bounds = 'parent',
  disableDragging: disableDraggingProp,
  disableResizing: disableResizingProp,
}: WindowProps) {
  // ─────────────────────────────────────────────────────────────────────────
  // Try to get window state from store (provider mode)
  // ─────────────────────────────────────────────────────────────────────────
  const windowFromStore = useWindow(id);
  const isFocusedFromStore = useIsWindowFocused(id);
  const isFullscreenFromStore = useIsWindowFullscreen(id);
  const group = useWindowGroup(windowFromStore?.groupId);
  const actions = useWindowActions();

  // Determine if we're in standalone mode (no provider) or provider mode
  const isStandaloneMode = !windowFromStore;

  // ─────────────────────────────────────────────────────────────────────────
  // Resolve props - use prop values in standalone mode, store in provider mode
  // ─────────────────────────────────────────────────────────────────────────
  const resolvedWindow: Partial<WindowState> = isStandaloneMode
    ? {
        id,
        title: titleProp ?? 'Window',
        position: positionProp ?? { x: 100, y: 100 },
        size: sizeProp ?? { width: 640, height: 480 },
        minSize: minSizeProp ?? { width: 320, height: 240 },
        maxSize: maxSizeProp,
        zIndex: zIndexProp ?? 1,
        isMinimized: isMinimizedProp ?? false,
        isMaximized: isMaximizedProp ?? false,
        isFullscreen: isFullscreenProp ?? false,
        isFocused: isFocusedProp ?? true,
        tilePosition: tilePositionProp,
      }
    : windowFromStore;

  const isFocused = isStandaloneMode ? (isFocusedProp ?? true) : isFocusedFromStore;
  const isFullscreen = isStandaloneMode ? (isFullscreenProp ?? false) : isFullscreenFromStore;

  // ─────────────────────────────────────────────────────────────────────────
  // Local state for animations
  // ─────────────────────────────────────────────────────────────────────────
  const rndRef = useRef<Rnd>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [isMinimizeAnimating, setIsMinimizeAnimating] = useState(false);
  const [minimizeAnimationState, setMinimizeAnimationState] = useState<'visible' | 'minimized'>('visible');
  const prevMinimized = useRef(resolvedWindow.isMinimized ?? false);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevMaximized = useRef(resolvedWindow.isMaximized);
  const prevTiled = useRef(resolvedWindow.tilePosition);

  const [showGroupDropZone, setShowGroupDropZone] = useState(false);

  // Get dragging window ID from store for group drop detection
  const draggingWindowId = useWindowManagerStore((state) => {
    // This would need to be added to the store - for now we'll skip this feature
    return null;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handle minimize/restore animation state
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const wasMinimized = prevMinimized.current;
    const isMinimizedNow = resolvedWindow.isMinimized ?? false;

    if (wasMinimized !== isMinimizedNow) {
      prevMinimized.current = isMinimizedNow;
      setIsMinimizeAnimating(true);
      setMinimizeAnimationState(isMinimizedNow ? 'minimized' : 'visible');
    }
  }, [resolvedWindow.isMinimized]);

  // Handle maximize/tile state changes for smooth Rnd transitions
  useEffect(() => {
    if (
      prevMaximized.current !== resolvedWindow.isMaximized ||
      prevTiled.current !== resolvedWindow.tilePosition
    ) {
      setIsTransitioning(true);
      prevMaximized.current = resolvedWindow.isMaximized;
      prevTiled.current = resolvedWindow.tilePosition;
      const timer = setTimeout(() => setIsTransitioning(false), 350);
      return () => clearTimeout(timer);
    }
  }, [resolvedWindow.isMaximized, resolvedWindow.tilePosition]);

  // Handle fullscreen keyboard shortcuts
  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (isStandaloneMode) {
          // No-op in standalone unless handler provided
        } else {
          actions.exitFullscreen();
        }
      }
      if (e.key === 'f' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isFullscreen) {
          if (isStandaloneMode) {
            // No-op
          } else {
            actions.exitFullscreen();
          }
        } else {
          if (isStandaloneMode) {
            // No-op
          } else {
            actions.fullscreen(id);
          }
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isFullscreen, isStandaloneMode, actions, id]);

  // ─────────────────────────────────────────────────────────────────────────
  // Animation config
  // ─────────────────────────────────────────────────────────────────────────
  const animations = useMemo(() => getWindowAnimations(variant), [variant]);

  const minimizeVariants = useMemo(() => {
    const pos = resolvedWindow.position ?? { x: 100, y: 100 };
    const sz = resolvedWindow.size ?? { width: 640, height: 480 };
    return getMinimizeRestoreVariants(
      { x: pos.x, y: pos.y, width: sz.width, height: sz.height },
      minimizeTarget
    );
  }, [resolvedWindow.position, resolvedWindow.size, minimizeTarget]);

  const handleMinimizeAnimationComplete = useCallback(() => {
    setIsMinimizeAnimating(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Drag handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(() => {
    // Untile if tiled when drag starts
    if (resolvedWindow.tilePosition && !isStandaloneMode) {
      actions.untile(id);
    }
  }, [id, resolvedWindow.tilePosition, isStandaloneMode, actions]);

  const handleDragStop = useCallback(
    (_e: unknown, d: DraggableData) => {
      if (isStandaloneMode) {
        onPositionChange?.({ x: d.x, y: d.y });
      } else {
        actions.move(id, { x: d.x, y: d.y });
      }
    },
    [id, isStandaloneMode, onPositionChange, actions]
  );

  const handleResizeStop = useCallback(
    (
      _e: unknown,
      _direction: unknown,
      ref: HTMLElement,
      _delta: unknown,
      position: { x: number; y: number }
    ) => {
      const newWidth = parseInt(ref.style.width, 10);
      const newHeight = parseInt(ref.style.height, 10);

      if (isStandaloneMode) {
        onSizeChange?.({ width: newWidth, height: newHeight });
        onPositionChange?.(position);
      } else {
        actions.resize(id, { width: newWidth, height: newHeight });
        actions.move(id, position);
      }
    },
    [id, isStandaloneMode, onSizeChange, onPositionChange, actions]
  );

  const handleMouseDown = useCallback(() => {
    if (isStandaloneMode) {
      onFocus?.();
    } else {
      actions.focus(id);
    }
  }, [id, isStandaloneMode, onFocus, actions]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render conditions
  // ─────────────────────────────────────────────────────────────────────────

  // For grouped windows, only render the active tab
  if (resolvedWindow.groupId && !resolvedWindow.isGroupActive) {
    return null;
  }

  // Hide when minimized and not animating
  const isVisible = !resolvedWindow.isMinimized || isMinimizeAnimating;
  if (!isVisible) return null;

  const hasGroup = !!group && group.windowIds.length > 1;
  const pos = resolvedWindow.position ?? { x: 100, y: 100 };
  const sz = resolvedWindow.size ?? { width: 640, height: 480 };
  const minSz = resolvedWindow.minSize ?? { width: 320, height: 240 };
  const title = resolvedWindow.title ?? titleProp ?? 'Window';

  // Disable dragging for maximized/fullscreen windows
  const disableDragging =
    disableDraggingProp ?? resolvedWindow.isMaximized ?? isFullscreen ?? isMinimizeAnimating;

  // Disable resizing for maximized/tiled/fullscreen windows
  const enableResizing = !(
    disableResizingProp ??
    resolvedWindow.isMaximized ??
    resolvedWindow.tilePosition ??
    isFullscreen ??
    isMinimizeAnimating
  );

  // Transition style for smooth maximize/restore
  const transitionStyle = isTransitioning
    ? { transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }
    : undefined;

  const useMinimizeAnimation = isMinimizeAnimating && minimizeVariants;

  return (
    <Rnd
      ref={rndRef}
      position={{ x: pos.x, y: pos.y }}
      size={{ width: sz.width, height: sz.height }}
      minWidth={isFullscreen ? undefined : minSz.width}
      minHeight={isFullscreen ? undefined : minSz.height}
      maxWidth={resolvedWindow.maxSize?.width}
      maxHeight={resolvedWindow.maxSize?.height}
      disableDragging={disableDragging}
      enableResizing={enableResizing}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={handleMouseDown}
      dragHandleClassName="window-drag-handle"
      bounds={isFullscreen ? undefined : bounds}
      style={{
        zIndex: resolvedWindow.zIndex ?? zIndexProp ?? 1,
        display: 'flex',
        pointerEvents: isMinimizeAnimating && minimizeAnimationState === 'minimized' ? 'none' : 'auto',
        ...(isFullscreen
          ? {
              position: 'fixed' as const,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              borderRadius: 0,
            }
          : {}),
        ...transitionStyle,
        ...style,
      }}
      className={className}
    >
      <motion.div
        ref={frameRef}
        variants={useMinimizeAnimation ? minimizeVariants : undefined}
        initial={useMinimizeAnimation ? undefined : animations.initial}
        animate={useMinimizeAnimation ? minimizeAnimationState : animations.animate}
        onAnimationComplete={useMinimizeAnimation ? handleMinimizeAnimationComplete : undefined}
        style={windowFrameStyle(isFocused, variant, isFullscreen)}
        role="dialog"
        aria-label={title}
        aria-hidden={resolvedWindow.isMinimized ? true : undefined}
        data-bb-window
        data-bb-window-id={id}
        data-bb-window-variant={variant}
        data-bb-window-fullscreen={isFullscreen ? 'true' : undefined}
      >
        {/* Titlebar */}
        {!hideTitlebar && !isFullscreen && (
          <WindowTitlebar
            id={id}
            title={title}
            isMaximized={resolvedWindow.isMaximized ?? false}
            isFullscreen={isFullscreen}
            isTiled={resolvedWindow.tilePosition}
            isFocused={isFocused}
            groupId={resolvedWindow.groupId}
            onClose={isStandaloneMode ? onClose : undefined}
            onMinimize={isStandaloneMode ? onMinimize : undefined}
            onMaximize={isStandaloneMode ? onMaximize : undefined}
            onRestore={isStandaloneMode ? onRestore : undefined}
          />
        )}

        {/* Window content */}
        <div style={windowContentStyle} data-bb-window-content>
          <GliaErrorBoundary
            variant="card"
            fallback={({ error, reset }) => (
              <WindowErrorFallback error={error} reset={reset} windowId={id} title={title} />
            )}
          >
            {children}
          </GliaErrorBoundary>
        </div>

        {/* Group drop zone overlay */}
        <AnimatePresence>
          {showGroupDropZone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={groupDropZoneStyle}
            >
              <div style={groupDropZoneLabelStyle}>Group Windows</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Rnd>
  );
}

/**
 * Window - A draggable, resizable window component with full state management.
 *
 * Works in dual mode:
 * - **Standalone**: Control all state via props and event handlers
 * - **With Provider**: Auto-managed via useWindowManager()
 *
 * @example Standalone mode
 * ```tsx
 * const [position, setPosition] = useState({ x: 100, y: 100 });
 * const [size, setSize] = useState({ width: 800, height: 600 });
 *
 * <Window
 *   id="my-window"
 *   title="My App"
 *   position={position}
 *   size={size}
 *   onPositionChange={setPosition}
 *   onSizeChange={setSize}
 *   onClose={() => setIsOpen(false)}
 * >
 *   <MyAppContent />
 * </Window>
 * ```
 *
 * @example With DesktopOSProvider
 * ```tsx
 * // Window state is managed by the provider
 * const { windows } = useWindowManager();
 *
 * {windows.map(w => (
 *   <Window key={w.id} id={w.id}>
 *     <AppContent appId={w.appId} />
 *   </Window>
 * ))}
 * ```
 */
export const Window = memo(WindowInner);
