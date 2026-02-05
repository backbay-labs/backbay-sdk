/**
 * @backbay/bb-ui Desktop OS - useSnapZones Hook
 *
 * Snap zone detection for window tiling (Hyprland-style).
 * Detects when windows are dragged to screen edges/corners.
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { WindowId } from '../window/types';
import type { SnapZone, UseSnapZonesReturn } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

/** Pixels from edge for left/right/top snap detection */
export const EDGE_THRESHOLD = 20;

/** Corner zone size in pixels */
export const CORNER_SIZE = 60;

/** Default taskbar height */
const DEFAULT_TASKBAR_HEIGHT = 48;

// ═══════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════

interface SnapZoneStore {
  activeZone: SnapZone | null;
  draggingWindowId: WindowId | null;

  setActiveZone: (zone: SnapZone | null) => void;
  setDraggingWindow: (id: WindowId | null) => void;
  detectSnapZone: (cursorX: number, cursorY: number) => SnapZone | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════

export const useSnapZoneStore = create<SnapZoneStore>((set, get) => ({
  activeZone: null,
  draggingWindowId: null,

  setActiveZone: (zone) => set({ activeZone: zone }),

  setDraggingWindow: (id) =>
    set({ draggingWindowId: id, activeZone: id ? get().activeZone : null }),

  detectSnapZone: (cursorX, cursorY) => {
    const screenWidth =
      typeof globalThis.innerWidth !== 'undefined'
        ? globalThis.innerWidth
        : 1920;
    const screenHeight =
      typeof globalThis.innerHeight !== 'undefined'
        ? globalThis.innerHeight
        : 1080;
    const usableHeight = screenHeight - DEFAULT_TASKBAR_HEIGHT;

    // Check corners first (they take priority)
    const isNearLeft = cursorX <= CORNER_SIZE;
    const isNearRight = cursorX >= screenWidth - CORNER_SIZE;
    const isNearTop = cursorY <= CORNER_SIZE;
    const isNearBottom =
      cursorY >= usableHeight - CORNER_SIZE && cursorY < usableHeight;

    // Corner detection (60x60 zones)
    if (isNearLeft && isNearTop) return 'top-left';
    if (isNearRight && isNearTop) return 'top-right';
    if (isNearLeft && isNearBottom) return 'bottom-left';
    if (isNearRight && isNearBottom) return 'bottom-right';

    // Edge detection (20px threshold)
    if (cursorX <= EDGE_THRESHOLD) return 'left';
    if (cursorX >= screenWidth - EDGE_THRESHOLD) return 'right';
    if (cursorY <= EDGE_THRESHOLD) return 'maximize';

    return null;
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get snap zone dimensions for preview rendering.
 */
export function getSnapZoneDimensions(zone: SnapZone): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const screenWidth =
    typeof globalThis.innerWidth !== 'undefined' ? globalThis.innerWidth : 1920;
  const screenHeight =
    typeof globalThis.innerHeight !== 'undefined'
      ? globalThis.innerHeight
      : 1080;
  const usableHeight = screenHeight - DEFAULT_TASKBAR_HEIGHT;
  const halfWidth = screenWidth / 2;
  const halfHeight = usableHeight / 2;

  switch (zone) {
    case 'maximize':
      return { x: 0, y: 0, width: screenWidth, height: usableHeight };
    case 'left':
      return { x: 0, y: 0, width: halfWidth, height: usableHeight };
    case 'right':
      return { x: halfWidth, y: 0, width: halfWidth, height: usableHeight };
    case 'top-left':
      return { x: 0, y: 0, width: halfWidth, height: halfHeight };
    case 'top-right':
      return { x: halfWidth, y: 0, width: halfWidth, height: halfHeight };
    case 'bottom-left':
      return { x: 0, y: halfHeight, width: halfWidth, height: halfHeight };
    case 'bottom-right':
      return { x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Public Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for snap zone detection during window dragging.
 *
 * @example
 * ```tsx
 * const { activeZone, detectSnapZone, setActiveZone } = useSnapZones();
 *
 * const handleDrag = (e: MouseEvent) => {
 *   const zone = detectSnapZone(e.clientX, e.clientY);
 *   setActiveZone(zone);
 * };
 *
 * const handleDragEnd = () => {
 *   if (activeZone) {
 *     // Apply snap
 *   }
 *   setActiveZone(null);
 * };
 * ```
 */
export function useSnapZones(): UseSnapZonesReturn {
  const store = useSnapZoneStore(
    useShallow((state) => ({
      activeZone: state.activeZone,
      draggingWindowId: state.draggingWindowId,
      setActiveZone: state.setActiveZone,
      setDraggingWindow: state.setDraggingWindow,
      detectSnapZone: state.detectSnapZone,
    }))
  );

  return {
    activeZone: store.activeZone,
    draggingWindowId: store.draggingWindowId,
    setActiveZone: store.setActiveZone,
    setDraggingWindow: store.setDraggingWindow,
    detectSnapZone: store.detectSnapZone,
    getSnapZoneDimensions,
  };
}
