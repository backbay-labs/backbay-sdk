/**
 * @backbay/glia Desktop OS - StartMenu Component
 *
 * App launcher with search, pinned apps, categories, and keyboard navigation.
 * Positioned above the taskbar at the bottom-left of the screen.
 *
 * @example
 * ```tsx
 * <StartMenu
 *   isOpen={startMenuOpen}
 *   onClose={() => setStartMenuOpen(false)}
 *   apps={myApps}
 *   categories={myCategories}
 *   onLaunchApp={(appId) => processes.launch(appId)}
 * />
 * ```
 */

'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { StartMenuCategory, StartMenuApp } from '../../core/shell/types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface StartMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Called when the menu should close */
  onClose: () => void;
  /** App categories */
  categories?: StartMenuCategory[];
  /** All registered apps */
  apps?: StartMenuApp[];
  /** Called when an app is launched */
  onLaunchApp?: (appId: string) => void;
  /** Called when an app pin state changes */
  onPinApp?: (appId: string, pinned: boolean) => void;
  /** Footer content (e.g. power button, user info) */
  footer?: ReactNode;
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
    zIndex: 8998,
  },
  container: {
    position: 'fixed',
    bottom: 'var(--glia-spacing-taskbar-height, 48px)',
    left: '8px',
    width: '320px',
    maxHeight: '480px',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--glia-color-bg-elevated, rgba(10, 10, 10, 0.85))',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 'var(--glia-radius-md, 3px)',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(212, 168, 75, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
    zIndex: 8999,
    overflow: 'hidden',
  },
  searchContainer: {
    padding: '12px 12px 8px',
    borderBottom: '1px solid var(--glia-color-border, #333333)',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 'var(--glia-radius-sm, 2px)',
    color: 'var(--glia-color-text-primary, #ffffff)',
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  sectionLabel: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '10px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: 'var(--glia-color-text-soft, #888888)',
    padding: '10px 14px 6px',
  },
  pinnedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '4px',
    padding: '4px 10px 8px',
  },
  pinnedItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '8px 4px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--glia-radius-sm, 2px)',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  pinnedItemIcon: {
    fontSize: '22px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 'var(--glia-radius-sm, 2px)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    color: 'var(--glia-color-text-muted, #cccccc)',
  },
  pinnedItemLabel: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '9px',
    letterSpacing: '0.05em',
    color: 'var(--glia-color-text-soft, #888888)',
    textAlign: 'center' as const,
    maxWidth: '60px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  categoryBar: {
    display: 'flex',
    gap: '2px',
    padding: '4px 10px',
    borderBottom: '1px solid var(--glia-color-border, #333333)',
    overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const,
  },
  categoryButton: {
    padding: '4px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--glia-radius-sm, 2px)',
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '10px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.1s ease',
  },
  categoryButtonInactive: {
    color: 'var(--glia-color-text-soft, #888888)',
  },
  categoryButtonActive: {
    color: 'var(--glia-color-accent, #d4a84b)',
    background: 'var(--glia-glass-active-shadow, rgba(212, 168, 75, 0.2))',
  },
  appList: {
    flex: 1,
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    padding: '4px 6px',
  },
  appItem: {
    width: '100%',
    textAlign: 'left' as const,
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--glia-radius-sm, 2px)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  appItemNormal: {
    color: 'var(--glia-color-text-muted, #cccccc)',
  },
  appItemHighlighted: {
    color: 'var(--glia-color-text-primary, #ffffff)',
    background: 'var(--glia-glass-hover-bg, rgba(212, 168, 75, 0.10))',
  },
  appItemIcon: {
    fontSize: '16px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  appItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  appItemName: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
  appItemDescription: {
    fontFamily: 'var(--glia-font-body, var(--glia-font-mono))',
    fontSize: '10px',
    color: 'var(--glia-color-text-soft, #888888)',
    letterSpacing: '0.02em',
    textTransform: 'none' as const,
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--glia-color-text-soft, #888888)',
  },
  footer: {
    borderTop: '1px solid var(--glia-color-border, #333333)',
    padding: '8px 12px',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function StartMenu({
  isOpen,
  onClose,
  categories = [],
  apps = [],
  onLaunchApp,
  onPinApp,
  footer,
  className,
  style,
}: StartMenuProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Reset state when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategoryId(null);
      setHighlightedIndex(-1);
      // Auto-focus search after mount animation
      const timer = setTimeout(() => searchRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Derived: pinned apps
  const pinnedApps = useMemo(
    () => apps.filter((app) => app.pinned),
    [apps]
  );

  // Derived: filtered apps
  const filteredApps = useMemo(() => {
    let result = apps;

    if (selectedCategoryId) {
      result = result.filter((app) => app.categoryId === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [apps, selectedCategoryId, searchQuery]);

  // Launch app handler
  const handleLaunchApp = useCallback(
    (appId: string) => {
      onLaunchApp?.(appId);
      onClose();
    },
    [onLaunchApp, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredApps.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredApps.length - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredApps.length) {
            handleLaunchApp(filteredApps[highlightedIndex].id);
          }
          break;

        default:
          // Typing redirects to search
          if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            document.activeElement !== searchRef.current
          ) {
            searchRef.current?.focus();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredApps, highlightedIndex, handleLaunchApp]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="menuitem"]');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="start-menu-overlay"
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onContextMenu={handleContextMenu}
          />

          {/* Menu */}
          <motion.div
            key="start-menu"
            role="menu"
            aria-label="Start menu"
            style={{
              ...styles.container,
              ...style,
            }}
            className={className}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Search */}
            <div style={styles.searchContainer}>
              <input
                ref={searchRef}
                role="searchbox"
                aria-label="Search apps"
                style={styles.searchInput}
                placeholder="SEARCH APPS..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onFocus={(e) => {
                  const el = e.target as HTMLInputElement;
                  el.style.borderColor = 'var(--glia-color-accent, #d4a84b)';
                  el.style.boxShadow = '0 0 12px rgba(212, 168, 75, 0.15)';
                }}
                onBlur={(e) => {
                  const el = e.target as HTMLInputElement;
                  el.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  el.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Pinned apps */}
            {pinnedApps.length > 0 && !searchQuery && (
              <>
                <div style={styles.sectionLabel}>Pinned</div>
                <div style={styles.pinnedGrid}>
                  {pinnedApps.map((app) => (
                    <motion.button
                      key={app.id}
                      role="menuitem"
                      style={styles.pinnedItem}
                      onClick={() => handleLaunchApp(app.id)}
                      whileHover={{
                        background:
                          'var(--glia-glass-hover-bg, rgba(212, 168, 75, 0.10))',
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      <div style={styles.pinnedItemIcon}>
                        {app.icon ?? app.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={styles.pinnedItemLabel}>{app.name}</span>
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {/* Category tabs */}
            {categories.length > 0 && !searchQuery && (
              <div style={styles.categoryBar}>
                <motion.button
                  style={{
                    ...styles.categoryButton,
                    ...(selectedCategoryId === null
                      ? styles.categoryButtonActive
                      : styles.categoryButtonInactive),
                  }}
                  onClick={() => setSelectedCategoryId(null)}
                  whileHover={{
                    color: 'var(--glia-color-text-primary, #ffffff)',
                  }}
                  transition={{ duration: 0.1 }}
                >
                  All
                </motion.button>
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    style={{
                      ...styles.categoryButton,
                      ...(selectedCategoryId === cat.id
                        ? styles.categoryButtonActive
                        : styles.categoryButtonInactive),
                    }}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    whileHover={{
                      color: 'var(--glia-color-text-primary, #ffffff)',
                    }}
                    transition={{ duration: 0.1 }}
                  >
                    {cat.icon && <span>{cat.icon} </span>}
                    {cat.label}
                  </motion.button>
                ))}
              </div>
            )}

            {/* All apps section label */}
            <div style={styles.sectionLabel}>
              {searchQuery ? 'Results' : 'All Apps'}
            </div>

            {/* App list */}
            <div ref={listRef} style={styles.appList}>
              {filteredApps.length === 0 ? (
                <div style={styles.emptyState}>
                  {searchQuery ? 'No apps found' : 'No apps registered'}
                </div>
              ) : (
                filteredApps.map((app, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <motion.button
                      key={app.id}
                      role="menuitem"
                      aria-selected={isHighlighted}
                      style={{
                        ...styles.appItem,
                        ...(isHighlighted
                          ? styles.appItemHighlighted
                          : styles.appItemNormal),
                      }}
                      onClick={() => handleLaunchApp(app.id)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      whileHover={{
                        background:
                          'var(--glia-glass-hover-bg, rgba(212, 168, 75, 0.10))',
                        color: 'var(--glia-color-text-primary, #ffffff)',
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      <div style={styles.appItemIcon}>
                        {app.icon ?? app.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={styles.appItemInfo}>
                        <div style={styles.appItemName}>{app.name}</div>
                        {app.description && (
                          <div style={styles.appItemDescription}>
                            {app.description}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {footer && <div style={styles.footer}>{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
