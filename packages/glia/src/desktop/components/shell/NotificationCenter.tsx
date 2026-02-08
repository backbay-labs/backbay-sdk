'use client';

/**
 * @backbay/glia Desktop OS - NotificationCenter Component
 *
 * Slide-out panel displaying all notifications, grouped by key or date.
 * Supports unread indicators, action buttons, dismiss, and mark-all-read.
 *
 * @example
 * ```tsx
 * const { isPanelOpen, closePanel } = useNotifications();
 *
 * <NotificationCenter
 *   isOpen={isPanelOpen}
 *   onClose={closePanel}
 * />
 * ```
 */

import { useCallback, useEffect, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '../../core/shell/useNotifications';
import type { Notification, NotificationAction } from '../../core/shell/notificationTypes';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationCenterProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Called when the panel should close */
  onClose: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const TYPE_ICONS: Record<string, string> = {
  info: '\u2139\uFE0F',
  warning: '\u26A0\uFE0F',
  error: '\u274C',
  success: '\u2705',
};

const TYPE_COLORS: Record<string, string> = {
  info: 'var(--glia-color-text-soft, #888888)',
  warning: 'var(--glia-color-accent-warning, #e6a817)',
  error: 'var(--glia-color-accent-destructive, #c44444)',
  success: 'var(--glia-color-accent-positive, #44c444)',
};

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
  },
  panel: {
    position: 'fixed',
    right: 0,
    bottom: 'var(--glia-spacing-taskbar-height, 48px)',
    top: 0,
    width: '380px',
    maxWidth: '100vw',
    background: 'var(--glia-color-bg-elevated, rgba(10, 10, 10, 0.85))',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.4), inset 1px 0 0 rgba(255, 255, 255, 0.02)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--glia-color-border, #333333)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--glia-color-text-primary, #ffffff)',
    margin: 0,
  },
  badge: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--glia-color-accent, #d4a84b)',
    background: 'var(--glia-glass-active-shadow, rgba(212, 168, 75, 0.2))',
    borderRadius: '10px',
    padding: '2px 7px',
    minWidth: '18px',
    textAlign: 'center' as const,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  headerButton: {
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '10px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: 'var(--glia-color-text-soft, #888888)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '3px',
    transition: 'all 0.1s ease',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--glia-color-text-soft, #888888)',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '3px',
    fontSize: '16px',
    lineHeight: 1,
    transition: 'all 0.1s ease',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    scrollbarWidth: 'thin' as const,
  },
  groupHeader: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '10px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--glia-color-text-soft, #888888)',
    padding: '12px 16px 6px',
    margin: 0,
  },
  notificationItem: {
    display: 'flex',
    gap: '10px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    cursor: 'default',
    transition: 'background 0.1s ease',
    position: 'relative' as const,
  },
  unreadIndicator: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
    background: 'var(--glia-color-accent, #d4a84b)',
    borderRadius: '0 2px 2px 0',
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
  notifTitle: {
    fontFamily: 'var(--glia-font-body, sans-serif)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--glia-color-text-primary, #ffffff)',
    margin: 0,
    lineHeight: 1.3,
  },
  notifMessage: {
    fontFamily: 'var(--glia-font-body, sans-serif)',
    fontSize: '12px',
    color: 'var(--glia-color-text-muted, #cccccc)',
    margin: '3px 0 0',
    lineHeight: 1.4,
  },
  notifMeta: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '10px',
    color: 'var(--glia-color-text-soft, #888888)',
    marginTop: '5px',
  },
  notifActions: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
  },
  actionButton: {
    fontFamily: 'var(--glia-font-mono)',
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
    background: 'var(--glia-glass-active-shadow, rgba(212, 168, 75, 0.2))',
    color: 'var(--glia-color-accent, #d4a84b)',
  },
  actionSecondary: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--glia-color-text-muted, #cccccc)',
  },
  dismissButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--glia-color-text-soft, #888888)',
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: '12px',
    lineHeight: 1,
    flexShrink: 0,
    borderRadius: '3px',
    transition: 'all 0.1s ease',
    opacity: 0.5,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '32px',
    opacity: 0.3,
  },
  emptyText: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '12px',
    color: 'var(--glia-color-text-soft, #888888)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 16px',
    borderTop: '1px solid var(--glia-color-border, #333333)',
    flexShrink: 0,
  },
  clearAllButton: {
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '10px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: 'var(--glia-color-accent-destructive, #c44444)',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: '3px',
    transition: 'all 0.1s ease',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

function NotificationItem({
  notification,
  onDismiss,
  onMarkRead,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const handleClick = useCallback(() => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  }, [notification.id, notification.read, onMarkRead]);

  const handleAction = useCallback(
    (action: NotificationAction) => {
      action.action();
      onMarkRead(notification.id);
    },
    [notification.id, onMarkRead]
  );

  return (
    <motion.div
      style={styles.notificationItem}
      onClick={handleClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, padding: 0 }}
      transition={{ duration: 0.15 }}
      whileHover={{ background: 'rgba(255, 255, 255, 0.04)', boxShadow: '0 0 20px rgba(34, 211, 238, 0.04)' }}
    >
      {/* Unread indicator */}
      {!notification.read && <div style={styles.unreadIndicator} />}

      {/* Type icon */}
      <div style={{ ...styles.typeIcon, color: TYPE_COLORS[notification.type] }}>
        {notification.icon ?? TYPE_ICONS[notification.type]}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <p style={styles.notifTitle}>{notification.title}</p>
        {notification.message && (
          <p style={styles.notifMessage}>{notification.message}</p>
        )}
        <div style={styles.notifMeta}>
          {formatRelativeTime(notification.timestamp)}
          {notification.appId && ` \u00B7 ${notification.appId}`}
        </div>
        {notification.actions && notification.actions.length > 0 && (
          <div style={styles.notifActions}>
            {notification.actions.map((action) => (
              <button
                key={action.id}
                style={{
                  ...styles.actionButton,
                  ...(action.primary ? styles.actionPrimary : styles.actionSecondary),
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

      {/* Dismiss button */}
      <button
        style={styles.dismissButton}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        title="Dismiss"
      >
        \u2715
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function NotificationCenter({
  isOpen,
  onClose,
  className,
  style,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    groups,
    dismiss,
    markRead,
    markAllRead,
    clearAll,
  } = useNotifications();

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="notification-overlay"
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="notification-panel"
            style={{ ...styles.panel, ...style }}
            className={className}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          >
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <h2 style={styles.title}>Notifications</h2>
                {unreadCount > 0 && (
                  <span style={styles.badge}>{unreadCount}</span>
                )}
              </div>
              <div style={styles.headerActions}>
                {unreadCount > 0 && (
                  <button
                    style={styles.headerButton}
                    onClick={markAllRead}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--glia-color-text-primary, #ffffff)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--glia-color-text-soft, #888888)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  style={styles.closeButton}
                  onClick={onClose}
                  title="Close"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--glia-color-text-primary, #ffffff)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--glia-color-text-soft, #888888)';
                  }}
                >
                  {'\u2715'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={styles.scrollArea}>
              {notifications.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>{'\uD83D\uDD14'}</div>
                  <span style={styles.emptyText}>No notifications</span>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {groups.map((group) => (
                    <div key={group.key}>
                      <h3 style={styles.groupHeader}>{group.label}</h3>
                      {group.notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onDismiss={dismiss}
                          onMarkRead={markRead}
                        />
                      ))}
                    </div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={styles.footer}>
                <button
                  style={styles.clearAllButton}
                  onClick={clearAll}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(196, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
