'use client';

/**
 * @backbay/glia Desktop OS - NotificationToast Component
 *
 * Brief popup toast for new notifications, positioned bottom-right above the taskbar.
 * Auto-dismisses with a progress bar countdown.
 *
 * @example
 * ```tsx
 * <NotificationToast
 *   notification={latestNotification}
 *   onDismiss={(id) => dismiss(id)}
 *   duration={5000}
 * />
 * ```
 */

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Notification, NotificationAction } from '../../core/shell/notificationTypes';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationToastProps {
  /** The notification to display */
  notification: Notification | null;
  /** Called when the toast is dismissed */
  onDismiss: (id: string) => void;
  /** Called when the notification is clicked/read */
  onRead?: (id: string) => void;
  /** Auto-dismiss duration in ms (uses notification.autoDismissMs or defaults to 5000) */
  duration?: number;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_DURATION = 5000;

const TYPE_ICONS: Record<string, string> = {
  info: '\u2139\uFE0F',
  warning: '\u26A0\uFE0F',
  error: '\u274C',
  success: '\u2705',
};

const TYPE_COLORS: Record<string, string> = {
  info: 'var(--bb-color-text-muted, #888888)',
  warning: 'var(--bb-color-warning, #e6a817)',
  error: 'var(--bb-color-destructive, #c44444)',
  success: 'var(--bb-color-success, #44c444)',
};

const TYPE_BAR_COLORS: Record<string, string> = {
  info: 'rgba(136, 136, 136, 0.5)',
  warning: 'rgba(230, 168, 23, 0.5)',
  error: 'rgba(196, 68, 68, 0.5)',
  success: 'rgba(68, 196, 68, 0.5)',
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    right: 16,
    bottom: 'calc(var(--bb-spacing-taskbar-height, 48px) + 12px)',
    width: '340px',
    maxWidth: 'calc(100vw - 32px)',
    zIndex: 9997,
  },
  toast: {
    background: 'var(--bb-color-context-menu-bg, rgba(17, 17, 17, 0.95))',
    backdropFilter: 'var(--bb-blur-backdrop, blur(12px))',
    border: '1px solid var(--bb-color-window-border, #333333)',
    borderRadius: 'var(--bb-radius-menu, 3px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(212, 168, 75, 0.15)',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  body: {
    display: 'flex',
    gap: '10px',
    padding: '12px 14px',
    alignItems: 'flex-start',
  },
  typeIcon: {
    fontSize: '16px',
    flexShrink: 0,
    marginTop: '1px',
    width: '20px',
    textAlign: 'center' as const,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  toastTitle: {
    fontFamily: 'var(--bb-font-body, sans-serif)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--bb-color-text-primary, #ffffff)',
    margin: 0,
    lineHeight: 1.3,
  },
  toastMessage: {
    fontFamily: 'var(--bb-font-body, sans-serif)',
    fontSize: '12px',
    color: 'var(--bb-color-text-secondary, #cccccc)',
    margin: '3px 0 0',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  toastActions: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
  },
  actionButton: {
    fontFamily: 'var(--bb-font-mono)',
    fontSize: '10px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    padding: '4px 10px',
    borderRadius: '3px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  actionPrimary: {
    background: 'var(--bb-color-accent-glow, rgba(212, 168, 75, 0.2))',
    color: 'var(--bb-color-accent, #d4a84b)',
  },
  actionSecondary: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--bb-color-text-secondary, #cccccc)',
  },
  dismissButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--bb-color-text-muted, #888888)',
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: '12px',
    lineHeight: 1,
    flexShrink: 0,
    borderRadius: '3px',
    transition: 'all 0.1s ease',
    opacity: 0.5,
  },
  progressBar: {
    height: '2px',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  progressFill: {
    height: '100%',
    borderRadius: '0 1px 1px 0',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function NotificationToast({
  notification,
  onDismiss,
  onRead,
  duration,
  className,
  style,
}: NotificationToastProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const effectiveDuration =
    notification?.autoDismissMs ?? duration ?? DEFAULT_DURATION;

  // Auto-dismiss timer with progress
  useEffect(() => {
    if (!notification || isPaused) return;

    const startTime = Date.now();
    const startProgress = progress;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = elapsed / (effectiveDuration * (startProgress / 100));
      const remaining = Math.max(0, startProgress - startProgress * fraction);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(notification.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification?.id, isPaused, effectiveDuration, onDismiss]);

  // Reset progress when notification changes
  useEffect(() => {
    if (notification) {
      setProgress(100);
      setIsPaused(false);
    }
  }, [notification?.id]);

  const handleClick = useCallback(() => {
    if (notification) {
      onRead?.(notification.id);
      onDismiss(notification.id);
    }
  }, [notification, onRead, onDismiss]);

  const handleAction = useCallback(
    (action: NotificationAction) => {
      action.action();
      if (notification) {
        onRead?.(notification.id);
        onDismiss(notification.id);
      }
    },
    [notification, onRead, onDismiss]
  );

  return (
    <div style={{ ...styles.container, ...style }} className={className}>
      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            key={notification.id}
            style={styles.toast}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onClick={handleClick}
          >
            {/* Body */}
            <div style={styles.body}>
              {/* Type icon */}
              <div style={{ ...styles.typeIcon, color: TYPE_COLORS[notification.type] }}>
                {notification.icon ?? TYPE_ICONS[notification.type]}
              </div>

              {/* Content */}
              <div style={styles.content}>
                <p style={styles.toastTitle}>{notification.title}</p>
                {notification.message && (
                  <p style={styles.toastMessage}>{notification.message}</p>
                )}
                {notification.actions && notification.actions.length > 0 && (
                  <div style={styles.toastActions}>
                    {notification.actions.map((action) => (
                      <button
                        key={action.id}
                        style={{
                          ...styles.actionButton,
                          ...(action.primary
                            ? styles.actionPrimary
                            : styles.actionSecondary),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(action);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dismiss */}
              <button
                style={styles.dismissButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                title="Dismiss"
              >
                {'\u2715'}
              </button>
            </div>

            {/* Progress bar */}
            <div style={styles.progressBar}>
              <motion.div
                style={{
                  ...styles.progressFill,
                  background: TYPE_BAR_COLORS[notification.type] ?? TYPE_BAR_COLORS.info,
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.05, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
