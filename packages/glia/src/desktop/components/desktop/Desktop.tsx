/**
 * @backbay/glia Desktop OS - Desktop Component
 *
 * Main desktop surface that renders icons and provides window snap zone previews.
 * Uses CSS variables for theming (--bb-color-*, --bb-spacing-*, etc.)
 */

import React, { useCallback, useState } from 'react';
import type { DesktopIcon as DesktopIconType } from '../../core/desktop/types';
import { useSnapZones } from '../../core/desktop/useSnapZones';
import { DesktopIcon } from './DesktopIcon';
import { SnapZoneOverlay } from './SnapZoneOverlay';

// ═══════════════════════════════════════════════════════════════════════════
// Styles (using CSS custom properties)
// ═══════════════════════════════════════════════════════════════════════════

const containerStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bb-color-desktop-bg, #010100)',
  overflow: 'hidden',
};

const desktopAreaStyles: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  padding: '16px',
  paddingBottom: 'calc(16px + var(--bb-spacing-taskbar-height, 48px))',
};

const iconGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, var(--bb-spacing-icon-size, 80px))',
  gridAutoRows: 'var(--bb-spacing-icon-size, 80px)',
  gap: 'var(--bb-spacing-icon-gap, 16px)',
  padding: '8px',
  alignContent: 'start',
  height: '100%',
  overflow: 'auto',
};

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface DesktopProps {
  /** Windows render here */
  children?: React.ReactNode;
  /** Desktop icons to display */
  icons?: DesktopIconType[];
  /** Callback when an icon is activated (double-click) */
  onIconActivate?: (iconId: string) => void;
  /** Whether to show snap zone overlays during window dragging */
  showSnapZones?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Icon renderer - allows custom icon component */
  renderIcon?: (icon: DesktopIconType, props: {
    selected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onDoubleClick: () => void;
  }) => React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Desktop surface component.
 *
 * Renders the main desktop area with:
 * - Icon grid for desktop shortcuts
 * - Snap zone overlays for window tiling
 * - Children (windows) layered on top
 *
 * @example
 * ```tsx
 * <Desktop
 *   icons={myIcons}
 *   onIconActivate={(id) => launchApp(id)}
 *   showSnapZones={isDragging}
 * >
 *   {windows.map(w => <Window key={w.id} {...w} />)}
 * </Desktop>
 * ```
 */
export function Desktop({
  children,
  icons = [],
  onIconActivate,
  showSnapZones = true,
  className,
  style,
  renderIcon,
}: DesktopProps) {
  const { activeZone } = useSnapZones();
  const [selectedIconIds, setSelectedIconIds] = useState<Set<string>>(new Set());

  // Handle icon click (selection)
  const handleIconClick = useCallback(
    (iconId: string, e: React.MouseEvent) => {
      setSelectedIconIds((prev) => {
        const next = new Set(prev);
        const additive = e.metaKey || e.ctrlKey;

        if (additive) {
          // Toggle selection
          if (next.has(iconId)) {
            next.delete(iconId);
          } else {
            next.add(iconId);
          }
        } else {
          // Replace selection
          next.clear();
          next.add(iconId);
        }
        return next;
      });
    },
    []
  );

  // Handle icon double-click (activation)
  const handleIconDoubleClick = useCallback(
    (iconId: string) => {
      onIconActivate?.(iconId);
    },
    [onIconActivate]
  );

  // Clear selection when clicking desktop background
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      // Only clear if clicking the desktop area itself, not children
      if (e.target === e.currentTarget) {
        setSelectedIconIds(new Set());
      }
    },
    []
  );

  return (
    <div
      className={className}
      style={{ ...containerStyles, ...style }}
      data-bb-desktop
    >
      {/* Desktop area with icons */}
      <div
        style={desktopAreaStyles}
        onClick={handleBackgroundClick}
        data-bb-desktop-area
      >
        {/* Icon grid */}
        {icons.length > 0 && (
          <div style={iconGridStyles} data-bb-icon-grid>
            {icons.map((icon) => {
              const isSelected = selectedIconIds.has(icon.id);
              const clickHandler = (e: React.MouseEvent) => handleIconClick(icon.id, e);
              const doubleClickHandler = () => handleIconDoubleClick(icon.id);

              if (renderIcon) {
                return (
                  <React.Fragment key={icon.id}>
                    {renderIcon(icon, {
                      selected: isSelected,
                      onClick: clickHandler,
                      onDoubleClick: doubleClickHandler,
                    })}
                  </React.Fragment>
                );
              }

              return (
                <DesktopIcon
                  key={icon.id}
                  id={icon.id}
                  icon={icon.icon}
                  label={icon.label}
                  selected={isSelected}
                  onClick={clickHandler}
                  onDoubleClick={doubleClickHandler}
                />
              );
            })}
          </div>
        )}

        {/* Windows render on top */}
        {children}
      </div>

      {/* Snap zone overlay (visible during window drag) */}
      {showSnapZones && activeZone && <SnapZoneOverlay />}
    </div>
  );
}
