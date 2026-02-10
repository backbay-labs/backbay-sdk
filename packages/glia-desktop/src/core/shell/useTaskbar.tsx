/**
 * @backbay/glia Desktop OS - useTaskbar Hook
 *
 * Taskbar state management for button positions and hover previews.
 * Used for minimize/restore animations and window preview tooltips.
 */

import { useMemo, createContext, useContext, useState, type ReactNode } from 'react';
import { create, createStore, useStore, type StoreApi } from 'zustand';
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
// Store Factory
// ═══════════════════════════════════════════════════════════════════════════

function createTaskbarStoreImpl(set: StoreApi<TaskbarStore>["setState"], get: StoreApi<TaskbarStore>["getState"]): TaskbarStore {
  return {
    buttonPositions: new Map(),
    previewState: null,
    pinnedApps: [],
    _showPreviewTimeout: null,
    _hidePreviewTimeout: null,

    registerButtonPosition: (id, position) => {
      set((state: TaskbarStore) => {
        const newPositions = new Map(state.buttonPositions);
        newPositions.set(id, position);
        return { buttonPositions: newPositions };
      });
    },

    unregisterButtonPosition: (id) => {
      set((state: TaskbarStore) => {
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

      if (state._hidePreviewTimeout) {
        clearTimeout(state._hidePreviewTimeout);
        set({ _hidePreviewTimeout: null });
      }

      if (state._showPreviewTimeout) {
        clearTimeout(state._showPreviewTimeout);
      }

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

      if (state._showPreviewTimeout) {
        clearTimeout(state._showPreviewTimeout);
        set({ _showPreviewTimeout: null });
      }

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

      if (state._hidePreviewTimeout) {
        clearTimeout(state._hidePreviewTimeout);
        set({ _hidePreviewTimeout: null });
      }
    },

    hidePreview: () => {
      const state = get();

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
      set((state: TaskbarStore) => ({
        pinnedApps: state.pinnedApps.includes(appId)
          ? state.pinnedApps
          : [...state.pinnedApps, appId],
      }));
    },

    unpinApp: (appId) => {
      set((state: TaskbarStore) => ({
        pinnedApps: state.pinnedApps.filter((id: string) => id !== appId),
      }));
    },
  };
}

/** Factory: creates an isolated Taskbar store instance. */
export function createTaskbarStore() {
  return createStore<TaskbarStore>((set, get) => createTaskbarStoreImpl(set, get));
}

export type TaskbarStoreApi = ReturnType<typeof createTaskbarStore>;

const TaskbarStoreContext = createContext<TaskbarStoreApi | null>(null);

/** Provider that creates an isolated Taskbar store for its subtree. */
export function TaskbarStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createTaskbarStore());
  return (
    <TaskbarStoreContext.Provider value={store}>
      {children}
    </TaskbarStoreContext.Provider>
  );
}

// Legacy singleton
export const useTaskbarStore = create<TaskbarStore>((set, get) => createTaskbarStoreImpl(set, get));

// ═══════════════════════════════════════════════════════════════════════════
// Context-aware store resolver
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Context-aware store resolver.
 *
 * Checks for a <TaskbarStoreProvider> ancestor first. If none is found,
 * falls back to the module-level singleton. This lets consumers choose:
 *
 *   - **Provider mode** (isolated): wrap a subtree in <TaskbarStoreProvider>
 *   - **Singleton mode** (shared): import useTaskbar directly, no provider needed
 *
 * SSR: the singleton persists across requests. Use Provider mode in SSR.
 */
function useResolvedTaskbarStore(): import('zustand').StoreApi<TaskbarStore> {
  const contextStore = useContext(TaskbarStoreContext);
  return contextStore ?? useTaskbarStore;
}

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
  const resolvedStore = useResolvedTaskbarStore();
  const store = useStore(
    resolvedStore,
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
    })),
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
