/**
 * @backbay/glia Desktop OS - ContextMenu Component
 *
 * Right-click context menu with smooth animations.
 * Supports nested items, separators, keyboard navigation, and shortcuts.
 *
 * Can be controlled externally or used with the useContextMenu hook.
 *
 * @example
 * ```tsx
 * // Controlled usage
 * <ContextMenu
 *   isOpen={menuOpen}
 *   position={{ x: 100, y: 200 }}
 *   items={[
 *     { id: 'open', label: 'Open', action: () => handleOpen() },
 *     { id: 'sep', separator: true },
 *     { id: 'delete', label: 'Delete', danger: true, action: () => handleDelete() },
 *   ]}
 *   onClose={() => setMenuOpen(false)}
 * />
 * ```
 */

import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ContextMenuItem } from '../../core/shell/types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ContextMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Menu position */
  position: { x: number; y: number };
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Called when menu should close */
  onClose: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 999998,
  },
  menu: {
    position: 'fixed',
    minWidth: '200px',
    background: 'var(--bb-color-context-menu-bg, #111111)',
    border: '1px solid var(--bb-color-window-border, #333333)',
    backdropFilter: 'var(--bb-blur-backdrop, blur(12px))',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(212, 168, 75, 0.15)',
    padding: '6px',
    zIndex: 999999,
    borderRadius: 'var(--bb-radius-menu, 3px)',
  },
  item: {
    width: '100%',
    textAlign: 'left' as const,
    padding: '8px 12px',
    background: 'transparent',
    border: 0,
    fontFamily: 'var(--bb-font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    cursor: 'default',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.1s ease',
  },
  itemNormal: {
    color: 'var(--bb-color-text-secondary, #cccccc)',
  },
  itemDestructive: {
    color: 'var(--bb-color-destructive, #c44444)',
  },
  itemDisabled: {
    opacity: 0.4,
    pointerEvents: 'none' as const,
  },
  itemIcon: {
    fontSize: '14px',
    width: '18px',
    textAlign: 'center' as const,
  },
  itemShortcut: {
    marginLeft: 'auto',
    fontSize: '10px',
    opacity: 0.6,
  },
  separator: {
    height: '1px',
    margin: '5px 8px',
    background: 'var(--bb-color-window-border, #333333)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function ContextMenu({
  isOpen,
  position,
  items,
  onClose,
  className,
  style,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
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

  // Calculate menu position to keep within viewport
  const getMenuPosition = useCallback(() => {
    const estimatedHeight = items.length * 40 + 20;
    const estimatedWidth = 220;

    // Use globalThis for SSR safety
    const viewportWidth = typeof globalThis !== 'undefined' ? globalThis.innerWidth : 1920;
    const viewportHeight = typeof globalThis !== 'undefined' ? globalThis.innerHeight : 1080;

    return {
      x: Math.min(position.x, viewportWidth - estimatedWidth),
      y: Math.min(position.y, viewportHeight - estimatedHeight),
    };
  }, [position, items.length]);

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled || item.separator) return;
      item.action?.();
      onClose();
    },
    [onClose]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  const menuPos = getMenuPosition();

  return (
    <AnimatePresence>
      {/* Overlay to capture clicks outside */}
      <motion.div
        key="context-menu-overlay"
        style={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onContextMenu={handleContextMenu}
      />

      {/* Menu */}
      <motion.div
        ref={menuRef}
        key="context-menu"
        style={{
          ...styles.menu,
          left: menuPos.x,
          top: menuPos.y,
          ...style,
        }}
        className={className}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item, idx) => {
          // Separator
          if (item.separator) {
            return <div key={item.id || `sep-${idx}`} style={styles.separator} />;
          }

          // Regular item
          const itemStyle = {
            ...styles.item,
            ...(item.danger ? styles.itemDestructive : styles.itemNormal),
            ...(item.disabled ? styles.itemDisabled : {}),
          };

          return (
            <motion.button
              key={item.id}
              style={itemStyle}
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
              whileHover={{
                background: item.danger
                  ? 'rgba(196, 92, 92, 0.12)'
                  : 'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
                color: item.danger
                  ? '#d77777'
                  : 'var(--bb-color-text-primary, #ffffff)',
              }}
              transition={{ duration: 0.1 }}
            >
              {item.icon && <span style={styles.itemIcon}>{item.icon}</span>}
              {item.label}
              {item.shortcut && (
                <span style={styles.itemShortcut}>{item.shortcut}</span>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
