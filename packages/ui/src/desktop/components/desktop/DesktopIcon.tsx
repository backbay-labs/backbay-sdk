/**
 * @backbay/bb-ui Desktop OS - Desktop Icon Component
 *
 * A desktop icon with selection, hover, and activation states.
 * Uses CSS variables for theming (--bb-color-*, --bb-font-*, etc.)
 */

import React, { useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface DesktopIconProps {
  /** Unique identifier */
  id: string;
  /** Icon element or string identifier */
  icon: React.ReactNode | string;
  /** Display label */
  label: string;
  /** Whether the icon is selected */
  selected?: boolean;
  /** Classification badge (CORE, SYS, NET, etc.) */
  classification?: string;
  /** Status indicator (ACTIVE, STANDBY, etc.) */
  status?: 'ACTIVE' | 'STANDBY' | 'PENDING' | 'LOCKED';
  /** Click handler (selection) */
  onClick?: (e: React.MouseEvent) => void;
  /** Double-click handler (activation) */
  onDoubleClick?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles (using CSS custom properties)
// ═══════════════════════════════════════════════════════════════════════════

const createWrapperStyles = (selected: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 10px',
  minWidth: '88px',
  borderRadius: 'var(--bb-radius-button, 3px)',
  background: selected ? 'var(--bb-color-icon-selected, rgba(212, 168, 75, 0.08))' : 'transparent',
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: 'all 350ms ease-out',
  position: 'relative',
  // Soft gold halo bloom when selected
  boxShadow: selected
    ? '0 0 24px 8px rgba(212, 168, 75, 0.12), 0 0 48px 16px rgba(212, 168, 75, 0.06)'
    : 'none',
  outline: 'none',
});

const createIconSymbolStyles = (selected: boolean): React.CSSProperties => ({
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: selected ? 'var(--bb-color-accent, #d4a84b)' : 'var(--bb-color-icon-text, #cccccc)',
  fontSize: '26px',
  transition: 'all 350ms ease-out',
  // Text shadow for selected state
  textShadow: selected
    ? '0 0 16px rgba(212, 168, 75, 0.35), 0 0 32px rgba(212, 168, 75, 0.2)'
    : 'none',
});

const createLabelStyles = (selected: boolean): React.CSSProperties => ({
  fontFamily: 'var(--bb-font-display, "Cinzel", serif)',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: selected ? 'var(--bb-color-accent, #d4a84b)' : 'var(--bb-color-icon-text, #cccccc)',
  textAlign: 'center' as const,
  whiteSpace: 'nowrap' as const,
  lineHeight: 1.2,
  transition: 'color 350ms ease-out',
  // Ensure no overflow
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const classificationTagStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '-18px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontFamily: 'var(--bb-font-mono, "JetBrains Mono", monospace)',
  fontSize: '9px',
  letterSpacing: '0.1em',
  whiteSpace: 'nowrap',
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 200ms ease-out',
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'ACTIVE':
      return 'var(--bb-color-accent, #d4a84b)';
    case 'STANDBY':
      return '#4a6fa5';
    case 'PENDING':
      return 'var(--bb-color-text-muted, #888888)';
    case 'LOCKED':
      return 'var(--bb-color-text-muted, #666666)';
    default:
      return 'var(--bb-color-text-muted, #888888)';
  }
};

const createDotStyles = (status: string): React.CSSProperties => ({
  display: 'inline-block',
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  margin: '0 4px',
  verticalAlign: 'middle',
  background: getStatusColor(status),
  boxShadow: status === 'ACTIVE' ? '0 0 4px rgba(212, 168, 75, 0.6)' : 'none',
});

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Desktop icon component.
 *
 * Supports:
 * - Selection state with gold halo effect
 * - Hover states with subtle glow
 * - Classification tags that fade in on hover
 * - Double-click activation
 *
 * @example
 * ```tsx
 * <DesktopIcon
 *   id="app-browser"
 *   icon={<BrowserIcon />}
 *   label="Browser"
 *   selected={selectedId === 'app-browser'}
 *   onClick={(e) => selectIcon('app-browser', e)}
 *   onDoubleClick={() => launchApp('browser')}
 * />
 * ```
 */
export function DesktopIcon({
  id,
  icon,
  label,
  selected = false,
  classification,
  status = 'ACTIVE',
  onClick,
  onDoubleClick,
  className,
  style,
}: DesktopIconProps) {
  // Track hover state for classification tag
  const [isHovered, setIsHovered] = React.useState(false);

  // Memoize styles to prevent recalculation
  const wrapperStyles = useMemo(
    () => createWrapperStyles(selected),
    [selected]
  );

  const iconSymbolStyles = useMemo(
    () => createIconSymbolStyles(selected),
    [selected]
  );

  const labelStyles = useMemo(
    () => createLabelStyles(selected),
    [selected]
  );

  // Handle hover styles dynamically
  const hoveredWrapperStyles = useMemo((): React.CSSProperties => {
    if (!isHovered) return {};
    return {
      background: 'rgba(212, 168, 75, 0.06)',
      boxShadow: '0 0 20px 4px rgba(212, 168, 75, 0.08)',
    };
  }, [isHovered]);

  const hoveredIconSymbolStyles = useMemo((): React.CSSProperties => {
    if (!isHovered || selected) return {};
    return {
      textShadow: '0 0 12px rgba(212, 168, 75, 0.25), 0 0 24px rgba(212, 168, 75, 0.15)',
      color: 'var(--bb-color-text-primary, #ffffff)',
    };
  }, [isHovered, selected]);

  const hoveredLabelStyles = useMemo((): React.CSSProperties => {
    if (!isHovered || selected) return {};
    return {
      color: 'var(--bb-color-text-primary, #ffffff)',
    };
  }, [isHovered, selected]);

  // Event handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDoubleClick?.();
      }
    },
    [onDoubleClick]
  );

  // Render icon content
  const iconContent = useMemo(() => {
    if (typeof icon === 'string') {
      // String icon - could be an emoji, character, or icon name
      return <span>{icon}</span>;
    }
    return icon;
  }, [icon]);

  return (
    <button
      type="button"
      className={className}
      style={{
        ...wrapperStyles,
        ...hoveredWrapperStyles,
        ...style,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      data-bb-desktop-icon
      data-id={id}
      data-selected={selected || undefined}
    >
      {/* Icon symbol */}
      <div
        style={{
          ...iconSymbolStyles,
          ...hoveredIconSymbolStyles,
        }}
        data-bb-icon-symbol
      >
        {iconContent}
      </div>

      {/* Label */}
      <span
        style={{
          ...labelStyles,
          ...hoveredLabelStyles,
        }}
        data-bb-icon-label
      >
        {label}
      </span>

      {/* Classification tag (fades in on hover) */}
      {classification && (
        <div
          style={{
            ...classificationTagStyles,
            opacity: isHovered ? 1 : 0,
            color: getStatusColor(status),
          }}
          data-bb-icon-classification
        >
          {classification}
          <span style={createDotStyles(status)} />
          {status}
        </div>
      )}
    </button>
  );
}
