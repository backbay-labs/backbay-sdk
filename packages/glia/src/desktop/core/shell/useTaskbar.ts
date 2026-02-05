/**
 * @backbay/glia Desktop OS - useTaskbar Hook
 *
 * Taskbar state management for button positions and hover previews.
 * Used for minimize/restore animations and window preview tooltips.
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { WindowId } from '../window/types';
import type {
  TaskbarButtonPosition,
  TaskbarPreviewState,
  TaskbarItem,
  UseTaskbarReturn,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

/** Delay before showing preview (ms) */
const PREVIEW_SHOW_DELAY = 200;

/** Delay before hiding preview - allows moving to preview (ms) */
const PREVIEW_HIDE_DELAY = 100;

// ═══════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════

interface TaskbarStore {
  buttonPositions: Map<string, TaskbarButtonPosition>;
  previewState: TaskbarPreviewState | null;
  pinnedApps: string[];
  _showPreviewTimeout: ReturnType<typeof setTimeout> | null;
  _hidePreviewTimeout: ReturnType<typeof setTimeout> | null;

  registerButtonPosition: (id: string, position: TaskbarButtonPosition) => void;
  unregisterButtonPosition: (id: string) => void;
  getButtonPosition: (id: string) => TaskbarButtonPosition | undefined;
  getButtonCenter: (id: string) => { x: number; y: number } | undefined;

  startPreviewHover: (windowId: WindowId, icon?: string) => void;
  endPreviewHover: () => void;
  cancelHidePreview: () => void;
  hidePreview: () => void;

  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════

export const useTaskbarStore = create<TaskbarStore>((set, get) => ({
  buttonPositions: new Map(),
  previewState: null,
  pinnedApps: [],
  _showPreviewTimeout: null,
  _hidePreviewTimeout: null,

  registerButtonPosition: (id, position) => {
    set((state) => {
      const newPositions = new Map(state.buttonPositions);
      newPositions.set(id, position);
      return { buttonPositions: newPositions };
    });
  },

  unregisterButtonPosition: (id) => {
    set((state) => {
      const newPositions = new Map(state.buttonPositions);
      newPositions.delete(id);
      return { buttonPositions: newPositions };
    });
  },

  getButtonPosition: (id) => {
    return get().buttonPositions.get(id);
  },

  getButtonCenter: (id) => {
    const pos = get().buttonPositions.get(id);
    if (!pos) return undefined;
    return {
      x: pos.x + pos.width / 2,
      y: pos.y + pos.height / 2,
    };
  },

  startPreviewHover: (windowId, icon) => {
    const state = get();

    // Clear any pending hide timeout
    if (state._hidePreviewTimeout) {
      clearTimeout(state._hidePreviewTimeout);
      set({ _hidePreviewTimeout: null });
    }

    // Clear any pending show timeout
    if (state._showPreviewTimeout) {
      clearTimeout(state._showPreviewTimeout);
    }

    // Start show timeout
    const timeout = setTimeout(() => {
      const currentState = get();
      const anchorRect = currentState.buttonPositions.get(windowId);
      if (anchorRect) {
        set({
          previewState: { windowId, anchorRect, icon },
          _showPreviewTimeout: null,
        });
      }
    }, PREVIEW_SHOW_DELAY);

    set({ _showPreviewTimeout: timeout });
  },

  endPreviewHover: () => {
    const state = get();

    // Clear any pending show timeout
    if (state._showPreviewTimeout) {
      clearTimeout(state._showPreviewTimeout);
      set({ _showPreviewTimeout: null });
    }

    // Start hide timeout (allows user to move mouse to preview)
    if (state._hidePreviewTimeout) {
      clearTimeout(state._hidePreviewTimeout);
    }

    const timeout = setTimeout(() => {
      set({ previewState: null, _hidePreviewTimeout: null });
    }, PREVIEW_HIDE_DELAY);

    set({ _hidePreviewTimeout: timeout });
  },

  cancelHidePreview: () => {
    const state = get();

    // Cancel any pending hide timeout (when user hovers over preview)
    if (state._hidePreviewTimeout) {
      clearTimeout(state._hidePreviewTimeout);
      set({ _hidePreviewTimeout: null });
    }
  },

  hidePreview: () => {
    const state = get();

    // Clear all timeouts
    if (state._showPreviewTimeout) {
      clearTimeout(state._showPreviewTimeout);
    }
    if (state._hidePreviewTimeout) {
      clearTimeout(state._hidePreviewTimeout);
    }

    set({
      previewState: null,
      _showPreviewTimeout: null,
      _hidePreviewTimeout: null,
    });
  },

  pinApp: (appId) => {
    set((state) => ({
      pinnedApps: state.pinnedApps.includes(appId)
        ? state.pinnedApps
        : [...state.pinnedApps, appId],
    }));
  },

  unpinApp: (appId) => {
    set((state) => ({
      pinnedApps: state.pinnedApps.filter((id) => id !== appId),
    }));
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Public Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for taskbar state management.
 *
 * Handles button position tracking for animations and hover preview state.
 *
 * @example
 * ```tsx
 * const { registerButtonPosition, startPreviewHover, endPreviewHover } = useTaskbar();
 *
 * // Register button position on mount
 * useEffect(() => {
 *   const rect = buttonRef.current?.getBoundingClientRect();
 *   if (rect) {
 *     registerButtonPosition(windowId, {
 *       x: rect.x, y: rect.y, width: rect.width, height: rect.height
 *     });
 *   }
 * }, []);
 *
 * // Handle hover
 * <button
 *   onMouseEnter={() => startPreviewHover(windowId)}
 *   onMouseLeave={endPreviewHover}
 * >
 *   {title}
 * </button>
 * ```
 */
export function useTaskbar(
  windows: Array<{ id: string; appId: string; title: string; icon?: string }> = [],
  activeWindowId: WindowId | null = null
): UseTaskbarReturn {
  const store = useTaskbarStore(
    useShallow((state) => ({
      buttonPositions: state.buttonPositions,
      previewState: state.previewState,
      pinnedApps: state.pinnedApps,
      registerButtonPosition: state.registerButtonPosition,
      unregisterButtonPosition: state.unregisterButtonPosition,
      getButtonCenter: state.getButtonCenter,
      startPreviewHover: state.startPreviewHover,
      endPreviewHover: state.endPreviewHover,
      cancelHidePreview: state.cancelHidePreview,
      hidePreview: state.hidePreview,
      pinApp: state.pinApp,
      unpinApp: state.unpinApp,
    }))
  );

  // Build taskbar items from windows and pinned apps (memoized to prevent unnecessary re-renders)
  const items = useMemo(() => {
    const result: TaskbarItem[] = [];

    // Add pinned apps (even if not running)
    for (const appId of store.pinnedApps) {
      const runningWindow = windows.find((w) => w.appId === appId);
      result.push({
        id: runningWindow?.id ?? `pinned-${appId}`,
        windowId: runningWindow?.id,
        appId,
        title: runningWindow?.title ?? appId,
        icon: runningWindow?.icon,
        isPinned: true,
        isActive: runningWindow?.id === activeWindowId,
      });
    }

    // Add running windows that aren't pinned
    for (const window of windows) {
      if (!store.pinnedApps.includes(window.appId)) {
        result.push({
          id: window.id,
          windowId: window.id,
          appId: window.appId,
          title: window.title,
          icon: window.icon,
          isPinned: false,
          isActive: window.id === activeWindowId,
        });
      }
    }

    return result;
  }, [windows, store.pinnedApps, activeWindowId]);

  return {
    items,
    activeWindowId,
    previewState: store.previewState,
    buttonPositions: store.buttonPositions,
    registerButtonPosition: store.registerButtonPosition,
    unregisterButtonPosition: store.unregisterButtonPosition,
    getButtonCenter: store.getButtonCenter,
    pin: store.pinApp,
    unpin: store.unpinApp,
    startPreviewHover: store.startPreviewHover,
    endPreviewHover: store.endPreviewHover,
    cancelHidePreview: store.cancelHidePreview,
    hidePreview: store.hidePreview,
  };
}
