/**
 * @backbay/bb-ui Desktop OS - Snap Zone Overlay Component
 *
 * Visual feedback overlay showing the target snap zone during window dragging.
 * Uses CSS variables for theming (--bb-color-*, etc.)
 */

import React, { useMemo } from 'react';
import { useSnapZones, getSnapZoneDimensions } from '../../core/desktop/useSnapZones';
import type { SnapZone } from '../../core/desktop/types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SnapZoneOverlayProps {
  /** Override the active zone (uses hook state by default) */
  zone?: SnapZone | null;
  /** Custom color for the overlay */
  color?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles (using CSS custom properties)
// ═══════════════════════════════════════════════════════════════════════════

const containerStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 9998, // Just below windows being dragged
};

const createPreviewStyles = (
  dimensions: { x: number; y: number; width: number; height: number },
  color?: string
): React.CSSProperties => ({
  position: 'absolute',
  left: dimensions.x,
  top: dimensions.y,
  width: dimensions.width,
  height: dimensions.height,
  background: color ?? 'var(--bb-color-accent-glow, rgba(212, 168, 75, 0.15))',
  border: `2px solid ${color ?? 'var(--bb-color-accent, #d4a84b)'}`,
  borderRadius: 'var(--bb-radius-window, 3px)',
  transition: 'all 150ms var(--bb-easing-spring, cubic-bezier(0.34, 1.56, 0.64, 1))',
  // Add subtle inner glow
  boxShadow: `
    inset 0 0 60px 10px ${color ?? 'var(--bb-color-accent-glow, rgba(212, 168, 75, 0.1))'},
    0 0 40px 5px ${color ?? 'var(--bb-color-accent-glow, rgba(212, 168, 75, 0.1))'}
  `,
});

// Zone label styles (shows which zone is being targeted)
const labelStyles: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontFamily: 'var(--bb-font-mono, "JetBrains Mono", monospace)',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--bb-color-accent, #d4a84b)',
  opacity: 0.6,
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get human-readable label for snap zone.
 */
function getZoneLabel(zone: SnapZone): string {
  switch (zone) {
    case 'maximize':
      return 'Maximize';
    case 'left':
      return 'Left Half';
    case 'right':
      return 'Right Half';
    case 'top-left':
      return 'Top Left';
    case 'top-right':
      return 'Top Right';
    case 'bottom-left':
      return 'Bottom Left';
    case 'bottom-right':
      return 'Bottom Right';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Snap zone overlay component.
 *
 * Displays a semi-transparent preview rectangle showing where a window
 * will snap to when released during a drag operation.
 *
 * @example Using with hook state (automatic)
 * ```tsx
 * const { activeZone } = useSnapZones();
 *
 * return (
 *   <>
 *     {activeZone && <SnapZoneOverlay />}
 *   </>
 * );
 * ```
 *
 * @example Manual control
 * ```tsx
 * <SnapZoneOverlay
 *   zone="left"
 *   color="rgba(0, 255, 128, 0.2)"
 * />
 * ```
 */
export function SnapZoneOverlay({
  zone: zoneProp,
  color,
  className,
  style,
}: SnapZoneOverlayProps) {
  const { activeZone: hookZone } = useSnapZones();
  const zone = zoneProp ?? hookZone;

  // Calculate preview dimensions
  const dimensions = useMemo(() => {
    if (!zone) return null;
    return getSnapZoneDimensions(zone);
  }, [zone]);

  // Create preview styles
  const previewStyles = useMemo(() => {
    if (!dimensions) return null;
    return createPreviewStyles(dimensions, color);
  }, [dimensions, color]);

  // Don't render if no active zone
  if (!zone || !dimensions || !previewStyles) {
    return null;
  }

  return (
    <div
      className={className}
      style={{ ...containerStyles, ...style }}
      data-bb-snap-zone-overlay
      data-zone={zone}
    >
      {/* Preview rectangle */}
      <div style={previewStyles} data-bb-snap-preview>
        {/* Zone label */}
        <span style={labelStyles} data-bb-snap-label>
          {getZoneLabel(zone)}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Standalone Preview (for use without hooks)
// ═══════════════════════════════════════════════════════════════════════════

export interface SnapZonePreviewProps {
  /** The snap zone to preview */
  zone: SnapZone;
  /** Custom color for the overlay */
  color?: string;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Standalone snap zone preview without hook dependency.
 *
 * Useful for testing or custom implementations.
 *
 * @example
 * ```tsx
 * <SnapZonePreview zone="left" showLabel={false} />
 * ```
 */
export function SnapZonePreview({
  zone,
  color,
  showLabel = true,
  className,
  style,
}: SnapZonePreviewProps) {
  const dimensions = useMemo(() => getSnapZoneDimensions(zone), [zone]);
  const previewStyles = useMemo(
    () => createPreviewStyles(dimensions, color),
    [dimensions, color]
  );

  return (
    <div
      className={className}
      style={{ ...containerStyles, ...style }}
      data-bb-snap-zone-preview
      data-zone={zone}
    >
      <div style={previewStyles} data-bb-snap-preview>
        {showLabel && (
          <span style={labelStyles} data-bb-snap-label>
            {getZoneLabel(zone)}
          </span>
        )}
      </div>
    </div>
  );
}
