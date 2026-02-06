'use client';

/**
 * @backbay/glia Desktop OS - SystemTray Component
 *
 * System tray area that sits in the right side of the taskbar.
 * Renders tray icons with optional badges, a notification indicator,
 * overflow chevron, and the system clock.
 *
 * @example
 * ```tsx
 * <SystemTray
 *   items={[
 *     { id: 'wifi', icon: <WifiIcon />, tooltip: 'Wi-Fi Connected' },
 *     { id: 'battery', icon: <BatteryIcon />, tooltip: 'Battery: 85%' },
 *   ]}
 *   showClock
 *   notificationCount={3}
 *   onNotificationClick={() => openNotifications()}
 * />
 * ```
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, type ClockProps } from './Clock';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SystemTrayItem {
  id: string;
  icon: ReactNode;
  tooltip?: string;
  badge?: number;
  onClick?: () => void;
  visible?: boolean;
  order?: number;
}

export interface SystemTrayProps {
  /** Tray items to display */
  items?: SystemTrayItem[];
  /** Show a notification bell indicator */
  showNotificationIndicator?: boolean;
  /** Notification badge count */
  notificationCount?: number;
  /** Callback when notification indicator is clicked */
  onNotificationClick?: () => void;
  /** Whether to show the clock */
  showClock?: boolean;
  /** Props passed to Clock component */
  clockProps?: ClockProps;
  /** Show the overflow chevron when items exceed maxVisibleItems */
  showOverflowChevron?: boolean;
  /** Maximum items visible before overflow */
  maxVisibleItems?: number;
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
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '100%',
  },
  trayIcon: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--bb-radius-button, 2px)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--bb-color-text-muted, #888888)',
    fontSize: '16px',
    position: 'relative',
    padding: 0,
    transition: 'all var(--bb-duration-fast, 100ms) ease',
  },
  badge: {
    position: 'absolute',
    top: '1px',
    right: '1px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: 'var(--bb-color-accent, #d4a84b)',
    color: 'var(--bb-color-window-bg, #111111)',
    fontSize: '9px',
    fontFamily: 'var(--bb-font-mono)',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    pointerEvents: 'none',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '8px',
    padding: '6px 10px',
    background: 'var(--bb-color-context-menu-bg, #111111)',
    border: '1px solid var(--bb-color-window-border, #333333)',
    borderRadius: 'var(--bb-radius-menu, 3px)',
    fontFamily: 'var(--bb-font-mono)',
    fontSize: '11px',
    color: 'var(--bb-color-text-secondary, #cccccc)',
    whiteSpace: 'nowrap',
    boxShadow: 'var(--bb-shadow-tooltip)',
    zIndex: 10000,
    pointerEvents: 'none',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: 'var(--bb-color-window-border, #333333)',
    margin: '0 4px',
  },
  overflowButton: {
    width: '20px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--bb-radius-button, 2px)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--bb-color-text-muted, #888888)',
    fontSize: '10px',
    padding: 0,
    transition: 'all var(--bb-duration-fast, 100ms) ease',
  },
  overflowPanel: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: '8px',
    minWidth: '160px',
    background: 'var(--bb-color-context-menu-bg, #111111)',
    border: '1px solid var(--bb-color-window-border, #333333)',
    backdropFilter: 'var(--bb-blur-backdrop, blur(12px))',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(212, 168, 75, 0.15)',
    padding: '6px',
    zIndex: 10001,
    borderRadius: 'var(--bb-radius-menu, 3px)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  notificationBell: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--bb-radius-button, 2px)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--bb-color-text-muted, #888888)',
    fontSize: '16px',
    position: 'relative',
    padding: 0,
    transition: 'all var(--bb-duration-fast, 100ms) ease',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TrayIcon Sub-Component
// ═══════════════════════════════════════════════════════════════════════════

interface TrayIconProps {
  item: SystemTrayItem;
}

function TrayIcon({ item }: TrayIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      style={{
        ...styles.trayIcon,
        ...(isHovered
          ? {
              color: 'var(--bb-color-text-secondary, #cccccc)',
              background:
                'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
            }
          : {}),
      }}
      role="button"
      aria-label={item.tooltip ?? item.id}
      onClick={item.onClick}
      onMouseEnter={() => {
        setShowTooltip(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setIsHovered(false);
      }}
      whileHover={{
        color: 'var(--bb-color-text-secondary, #cccccc)',
        background:
          'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
      }}
      transition={{ duration: 0.1 }}
    >
      {item.icon}
      {item.badge != null && item.badge > 0 && (
        <span style={styles.badge} aria-live="polite">
          {item.badge > 99 ? '99' : item.badge}
        </span>
      )}
      {item.tooltip && showTooltip && (
        <div style={styles.tooltip}>{item.tooltip}</div>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NotificationBell Sub-Component
// ═══════════════════════════════════════════════════════════════════════════

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

function NotificationBell({ count = 0, onClick }: NotificationBellProps) {
  const [isHovered, setIsHovered] = useState(false);

  const bellIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  return (
    <motion.button
      style={{
        ...styles.notificationBell,
        ...(isHovered
          ? {
              color: 'var(--bb-color-text-secondary, #cccccc)',
              background:
                'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
            }
          : {}),
      }}
      role="button"
      aria-label={
        count > 0 ? `${count} notification${count > 1 ? 's' : ''}` : 'Notifications'
      }
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        color: 'var(--bb-color-text-secondary, #cccccc)',
        background:
          'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
      }}
      transition={{ duration: 0.1 }}
    >
      {bellIcon}
      {count > 0 && (
        <span style={styles.badge} aria-live="polite">
          {count > 99 ? '99' : count}
        </span>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function SystemTray({
  items = [],
  showNotificationIndicator = false,
  notificationCount = 0,
  onNotificationClick,
  showClock = true,
  clockProps,
  showOverflowChevron = true,
  maxVisibleItems = 5,
  className,
  style,
}: SystemTrayProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Filter visible items and sort by order
  const visibleItems = items
    .filter((item) => item.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const hasOverflow = visibleItems.length > maxVisibleItems;
  const displayedItems = hasOverflow
    ? visibleItems.slice(0, maxVisibleItems)
    : visibleItems;
  const overflowItems = hasOverflow
    ? visibleItems.slice(maxVisibleItems)
    : [];

  // Close overflow on outside click
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(e.target as Node)
      ) {
        setOverflowOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (overflowOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [overflowOpen, handleClickOutside]);

  // Close overflow on Escape
  useEffect(() => {
    if (!overflowOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [overflowOpen]);

  const chevronIcon = (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );

  return (
    <div
      style={{ ...styles.container, ...style }}
      className={className}
      role="toolbar"
      aria-label="System tray"
    >
      {/* Overflow chevron (placed before items when there are hidden items) */}
      {showOverflowChevron && hasOverflow && (
        <div style={{ position: 'relative' }} ref={overflowRef}>
          <motion.button
            style={styles.overflowButton}
            onClick={() => setOverflowOpen((prev) => !prev)}
            aria-expanded={overflowOpen}
            aria-haspopup="true"
            aria-label={`${overflowItems.length} more items`}
            whileHover={{
              color: 'var(--bb-color-text-secondary, #cccccc)',
              background:
                'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
            }}
            transition={{ duration: 0.1 }}
          >
            {chevronIcon}
          </motion.button>

          <AnimatePresence>
            {overflowOpen && (
              <motion.div
                style={styles.overflowPanel}
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.12 }}
              >
                {overflowItems.map((item) => (
                  <TrayIcon key={item.id} item={item} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Visible tray icons */}
      {displayedItems.map((item) => (
        <TrayIcon key={item.id} item={item} />
      ))}

      {/* Notification bell */}
      {showNotificationIndicator && (
        <NotificationBell
          count={notificationCount}
          onClick={onNotificationClick}
        />
      )}

      {/* Divider before clock */}
      {showClock && (displayedItems.length > 0 || showNotificationIndicator) && (
        <div style={styles.divider} />
      )}

      {/* Clock */}
      {showClock && <Clock {...clockProps} />}
    </div>
  );
}
