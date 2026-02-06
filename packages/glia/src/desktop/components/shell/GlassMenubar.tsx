'use client';

/**
 * @backbay/glia Desktop OS - GlassMenubar Component
 *
 * App-level menubar (File, Edit, View, Help) with dropdown menus.
 * Supports nested submenus, keyboard navigation, shortcuts, and checkboxes.
 *
 * @example
 * ```tsx
 * <GlassMenubar
 *   menus={[
 *     {
 *       id: 'file',
 *       label: 'File',
 *       items: [
 *         { id: 'new', label: 'New', shortcut: 'Ctrl+N', action: () => {} },
 *         { id: 'sep', label: '', separator: true },
 *         { id: 'exit', label: 'Exit', danger: true, action: () => {} },
 *       ],
 *     },
 *   ]}
 *   onAction={(menuId, itemId) => console.log(menuId, itemId)}
 * />
 * ```
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface MenubarMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  checked?: boolean;
  separator?: boolean;
  children?: MenubarMenuItem[];
  action?: () => void;
}

export interface MenubarItem {
  id: string;
  label: string;
  disabled?: boolean;
  items: MenubarMenuItem[];
}

export interface GlassMenubarProps {
  menus: MenubarItem[];
  onAction?: (menuId: string, itemId: string) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, CSSProperties> = {
  menubar: {
    display: 'flex',
    alignItems: 'center',
    height: '28px',
    background: 'transparent',
    userSelect: 'none',
  },
  trigger: {
    height: '28px',
    padding: '0 10px',
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--bb-font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--bb-color-text-muted, #888888)',
    cursor: 'default',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '3px',
    transition: 'all 0.1s ease',
  },
  triggerActive: {
    background: 'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
    color: 'var(--bb-color-text-primary, #ffffff)',
  },
  triggerDisabled: {
    opacity: 0.4,
    pointerEvents: 'none' as const,
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
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
  submenu: {
    position: 'absolute' as const,
    top: '-6px',
    left: '100%',
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
  itemFocused: {
    background: 'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))',
    color: 'var(--bb-color-text-primary, #ffffff)',
  },
  itemFocusedDanger: {
    background: 'rgba(196, 92, 92, 0.12)',
    color: '#d77777',
  },
  itemIcon: {
    fontSize: '14px',
    width: '18px',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  itemShortcut: {
    marginLeft: 'auto',
    fontSize: '10px',
    color: 'var(--bb-color-text-muted, #888888)',
    fontFamily: 'var(--bb-font-mono)',
    flexShrink: 0,
  },
  itemCheck: {
    width: '14px',
    flexShrink: 0,
    textAlign: 'center' as const,
    fontSize: '10px',
    color: 'var(--bb-color-accent, #d4a84b)',
  },
  submenuArrow: {
    marginLeft: 'auto',
    fontSize: '10px',
    color: 'var(--bb-color-text-muted, #888888)',
    flexShrink: 0,
  },
  separator: {
    height: '1px',
    margin: '5px 8px',
    background: 'var(--bb-color-window-border, #333333)',
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 999998,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Submenu Component
// ═══════════════════════════════════════════════════════════════════════════

interface SubmenuProps {
  items: MenubarMenuItem[];
  menuId: string;
  focusedIndex: number;
  onAction: (itemId: string) => void;
  onFocusIndex: (index: number) => void;
  onOpenSubmenu: (itemId: string) => void;
  onCloseSubmenu: () => void;
  openSubmenuId: string | null;
}

function Submenu({
  items,
  menuId,
  focusedIndex,
  onAction,
  onFocusIndex,
  onOpenSubmenu,
  onCloseSubmenu,
  openSubmenuId,
}: SubmenuProps) {
  const actionableItems = items.filter((i) => !i.separator);

  return (
    <>
      {items.map((item) => {
        if (item.separator) {
          return <div key={item.id} style={styles.separator} role="separator" />;
        }

        const actionableIndex = actionableItems.indexOf(item);
        const isFocused = actionableIndex === focusedIndex;
        const hasChildren = item.children && item.children.length > 0;
        const isSubmenuOpen = openSubmenuId === item.id;

        const itemStyle: CSSProperties = {
          ...styles.item,
          ...(item.danger ? styles.itemDestructive : styles.itemNormal),
          ...(item.disabled ? styles.itemDisabled : {}),
          ...(isFocused
            ? item.danger
              ? styles.itemFocusedDanger
              : styles.itemFocused
            : {}),
        };

        return (
          <div
            key={item.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => {
              onFocusIndex(actionableIndex);
              if (hasChildren) {
                onOpenSubmenu(item.id);
              }
            }}
            onMouseLeave={() => {
              if (hasChildren && !isSubmenuOpen) {
                // keep submenu open while hovering
              }
            }}
          >
            <button
              style={itemStyle}
              role={item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
              aria-checked={item.checked}
              aria-disabled={item.disabled}
              aria-haspopup={hasChildren ? 'menu' : undefined}
              aria-expanded={hasChildren ? isSubmenuOpen : undefined}
              disabled={item.disabled}
              onClick={() => {
                if (hasChildren) {
                  onOpenSubmenu(item.id);
                } else {
                  onAction(item.id);
                }
              }}
            >
              {item.checked !== undefined && (
                <span style={styles.itemCheck}>
                  {item.checked ? '\u2713' : ''}
                </span>
              )}
              {item.icon && <span style={styles.itemIcon}>{item.icon}</span>}
              {item.label}
              {item.shortcut && (
                <span style={styles.itemShortcut}>{item.shortcut}</span>
              )}
              {hasChildren && (
                <span style={styles.submenuArrow}>{'\u25B8'}</span>
              )}
            </button>

            {/* Nested submenu */}
            <AnimatePresence>
              {hasChildren && isSubmenuOpen && (
                <SubmenuDropdown
                  items={item.children!}
                  menuId={menuId}
                  onAction={onAction}
                  onClose={onCloseSubmenu}
                />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Submenu Dropdown (recursive)
// ═══════════════════════════════════════════════════════════════════════════

interface SubmenuDropdownProps {
  items: MenubarMenuItem[];
  menuId: string;
  onAction: (itemId: string) => void;
  onClose: () => void;
}

function SubmenuDropdown({
  items,
  menuId,
  onAction,
  onClose,
}: SubmenuDropdownProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);

  return (
    <motion.div
      style={styles.submenu}
      role="menu"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.12 }}
    >
      <Submenu
        items={items}
        menuId={menuId}
        focusedIndex={focusedIndex}
        onAction={onAction}
        onFocusIndex={setFocusedIndex}
        onOpenSubmenu={setOpenSubmenuId}
        onCloseSubmenu={() => setOpenSubmenuId(null)}
        openSubmenuId={openSubmenuId}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function GlassMenubar({
  menus,
  onAction,
  disabled = false,
  className,
  style,
}: GlassMenubarProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isMenuWalking, setIsMenuWalking] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeMenu = menus.find((m) => m.id === activeMenuId);
  const activeMenuItems = activeMenu?.items.filter((i) => !i.separator) ?? [];

  const closeAll = useCallback(() => {
    setActiveMenuId(null);
    setIsMenuWalking(false);
    setFocusedItemIndex(-1);
    setOpenSubmenuId(null);
  }, []);

  const handleTriggerClick = useCallback(
    (menuId: string) => {
      if (disabled) return;
      if (activeMenuId === menuId) {
        closeAll();
      } else {
        setActiveMenuId(menuId);
        setIsMenuWalking(true);
        setFocusedItemIndex(-1);
        setOpenSubmenuId(null);
      }
    },
    [activeMenuId, disabled, closeAll]
  );

  const handleTriggerHover = useCallback(
    (menuId: string) => {
      if (disabled) return;
      if (isMenuWalking && activeMenuId !== menuId) {
        setActiveMenuId(menuId);
        setFocusedItemIndex(-1);
        setOpenSubmenuId(null);
      }
    },
    [disabled, isMenuWalking, activeMenuId]
  );

  const handleItemAction = useCallback(
    (itemId: string) => {
      if (!activeMenu) return;
      const item = findItem(activeMenu.items, itemId);
      if (!item || item.disabled) return;
      item.action?.();
      onAction?.(activeMenu.id, itemId);
      closeAll();
    },
    [activeMenu, onAction, closeAll]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!activeMenuId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentMenuIndex = menus.findIndex((m) => m.id === activeMenuId);

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          if (openSubmenuId) {
            setOpenSubmenuId(null);
          } else {
            closeAll();
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (openSubmenuId) {
            setOpenSubmenuId(null);
          } else {
            const prevIndex =
              (currentMenuIndex - 1 + menus.length) % menus.length;
            setActiveMenuId(menus[prevIndex].id);
            setFocusedItemIndex(-1);
            setOpenSubmenuId(null);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (
            focusedItemIndex >= 0 &&
            activeMenuItems[focusedItemIndex]?.children?.length
          ) {
            setOpenSubmenuId(activeMenuItems[focusedItemIndex].id);
          } else {
            const nextIndex = (currentMenuIndex + 1) % menus.length;
            setActiveMenuId(menus[nextIndex].id);
            setFocusedItemIndex(-1);
            setOpenSubmenuId(null);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          setFocusedItemIndex((prev) => {
            let next = prev + 1;
            while (
              next < activeMenuItems.length &&
              activeMenuItems[next]?.disabled
            ) {
              next++;
            }
            return next < activeMenuItems.length ? next : prev;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedItemIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && activeMenuItems[next]?.disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
          break;

        case 'Enter':
          e.preventDefault();
          if (focusedItemIndex >= 0 && activeMenuItems[focusedItemIndex]) {
            const item = activeMenuItems[focusedItemIndex];
            if (item.children?.length) {
              setOpenSubmenuId(item.id);
            } else {
              handleItemAction(item.id);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    activeMenuId,
    menus,
    activeMenuItems,
    focusedItemIndex,
    openSubmenuId,
    closeAll,
    handleItemAction,
  ]);

  const menubarStyle: CSSProperties = {
    ...styles.menubar,
    ...(disabled ? { opacity: 0.4, pointerEvents: 'none' as const } : {}),
    ...style,
  };

  return (
    <>
      {/* Click-outside overlay */}
      {activeMenuId && (
        <div
          style={styles.overlay}
          onClick={closeAll}
          onContextMenu={(e) => {
            e.preventDefault();
            closeAll();
          }}
        />
      )}

      <div
        ref={menubarRef}
        style={menubarStyle}
        className={className}
        role="menubar"
      >
        {menus.map((menu) => {
          const isActive = activeMenuId === menu.id;

          const triggerStyle: CSSProperties = {
            ...styles.trigger,
            ...(isActive ? styles.triggerActive : {}),
            ...(menu.disabled ? styles.triggerDisabled : {}),
          };

          return (
            <div key={menu.id} style={{ position: 'relative' }}>
              <button
                ref={(el) => {
                  if (el) triggerRefs.current.set(menu.id, el);
                }}
                style={triggerStyle}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={isActive}
                aria-disabled={menu.disabled}
                disabled={menu.disabled}
                onClick={() => handleTriggerClick(menu.id)}
                onMouseEnter={() => handleTriggerHover(menu.id)}
              >
                {menu.label}
              </button>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    style={styles.dropdown}
                    role="menu"
                    aria-label={menu.label}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Submenu
                      items={menu.items}
                      menuId={menu.id}
                      focusedIndex={focusedItemIndex}
                      onAction={handleItemAction}
                      onFocusIndex={setFocusedItemIndex}
                      onOpenSubmenu={setOpenSubmenuId}
                      onCloseSubmenu={() => setOpenSubmenuId(null)}
                      openSubmenuId={openSubmenuId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function findItem(
  items: MenubarMenuItem[],
  id: string
): MenubarMenuItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}
