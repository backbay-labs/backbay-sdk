/**
 * @backbay/glia Desktop OS - useWindowManager Hook
 *
 * Core window management hook using Zustand.
 * Provides all window lifecycle, focus, and state management operations.
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  WindowId,
  WindowState,
  WindowGroup,
  WindowOpenConfig,
  UseWindowManagerReturn,
  TilePosition,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_TASKBAR_HEIGHT = 48;
const CASCADE_OFFSET = 32;
const MAX_CASCADE_STEPS = 8;

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique window ID using crypto.randomUUID() for SSR safety.
 * Falls back to timestamp-based generation if crypto is unavailable.
 */
function generateWindowId(): WindowId {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `window-${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  return `window-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Generate a unique group ID using crypto.randomUUID() for SSR safety.
 * Falls back to timestamp-based generation if crypto is unavailable.
 */
function generateGroupId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `group-${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getViewportSize() {
  if (typeof globalThis.innerWidth === 'undefined') {
    return { width: 1920, height: 1080 };
  }
  return {
    width: globalThis.innerWidth,
    height: globalThis.innerHeight - DEFAULT_TASKBAR_HEIGHT,
  };
}

function getTileDimensions(position: TilePosition) {
  const { width: screenWidth, height: screenHeight } = getViewportSize();
  const halfWidth = screenWidth / 2;
  const halfHeight = screenHeight / 2;

  switch (position) {
    case 'left':
      return { x: 0, y: 0, width: halfWidth, height: screenHeight };
    case 'right':
      return { x: halfWidth, y: 0, width: halfWidth, height: screenHeight };
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

function calculateInitialPosition(
  config: WindowOpenConfig,
  windowCount: number
): { x: number; y: number } {
  if (config.position) {
    return config.position;
  }

  const viewport = getViewportSize();
  const width = config.size?.width ?? 640;
  const height = config.size?.height ?? 480;
  const offset = (windowCount % MAX_CASCADE_STEPS) * CASCADE_OFFSET;

  return {
    x: Math.max(60, (viewport.width - width) / 2 + offset),
    y: Math.max(60, (viewport.height - height) / 2 + offset),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════

interface WindowManagerStore {
  windows: Map<WindowId, WindowState>;
  groups: Map<string, WindowGroup>;
  focusedId: WindowId | null;
  fullscreenId: WindowId | null;
  nextZIndex: number;

  // Internal actions (not exposed in hook return)
  _open: (config: WindowOpenConfig) => WindowId;
  _close: (id: WindowId) => void;
  _focus: (id: WindowId) => void;
  _minimize: (id: WindowId) => void;
  _maximize: (id: WindowId) => void;
  _restore: (id: WindowId) => void;
  _fullscreen: (id: WindowId) => void;
  _exitFullscreen: () => void;
  _move: (id: WindowId, position: { x: number; y: number }) => void;
  _resize: (id: WindowId, size: { width: number; height: number }) => void;
  _tile: (id: WindowId, position: TilePosition) => void;
  _untile: (id: WindowId) => void;
  _cycleFocusNext: () => void;
  _createGroup: (windowId1: WindowId, windowId2: WindowId) => string | null;
  _addToGroup: (groupId: string, windowId: WindowId) => void;
  _removeFromGroup: (windowId: WindowId) => void;
  _setActiveTab: (groupId: string, windowId: WindowId) => void;
  _minimizeAll: () => void;
  _closeAll: () => void;
  _cascade: () => void;
  _tileAll: (layout: 'horizontal' | 'vertical' | 'grid') => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════

export const useWindowManagerStore = create<WindowManagerStore>((set, get) => ({
  windows: new Map(),
  groups: new Map(),
  focusedId: null,
  fullscreenId: null,
  nextZIndex: 1,

  _open: (config) => {
    const { windows, nextZIndex } = get();
    const id = generateWindowId();
    const position = calculateInitialPosition(config, windows.size);

    const newWindow: WindowState = {
      id,
      title: config.title,
      icon: config.icon,
      position,
      size: config.size ?? { width: 640, height: 480 },
      minSize: config.minSize ?? { width: 320, height: 240 },
      maxSize: config.maxSize,
      isMinimized: config.isMinimized ?? false,
      isMaximized: config.isMaximized ?? false,
      isFullscreen: false,
      isFocused: true,
      zIndex: nextZIndex,
    };

    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.set(id, newWindow);
      return {
        windows: newWindows,
        focusedId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    });

    return id;
  },

  _close: (id) => {
    const { windows, groups, fullscreenId } = get();
    const window = windows.get(id);
    if (!window) return;

    const wasFullscreen = fullscreenId === id || window.isFullscreen;

    // Handle browser fullscreen exit
    if (wasFullscreen && typeof document !== 'undefined') {
      document.exitFullscreen?.().catch(() => {});
    }

    // Handle group cleanup
    if (window.groupId) {
      const group = groups.get(window.groupId);
      if (group && group.windowIds.length <= 2) {
        const remainingWindowId = group.windowIds.find((wId) => wId !== id);
        if (remainingWindowId) {
          get()._removeFromGroup(remainingWindowId);
        }
      } else {
        get()._removeFromGroup(id);
      }
    }

    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.delete(id);

      // Focus topmost remaining window
      let newFocusedId = state.focusedId;
      if (state.focusedId === id) {
        const remaining = Array.from(newWindows.values());
        if (remaining.length > 0) {
          newFocusedId = remaining.reduce((a, b) =>
            a.zIndex > b.zIndex ? a : b
          ).id;
        } else {
          newFocusedId = null;
        }
      }

      return {
        windows: newWindows,
        focusedId: newFocusedId,
        fullscreenId: wasFullscreen ? null : state.fullscreenId,
      };
    });
  },

  _focus: (id) => {
    const { windows, nextZIndex, focusedId, groups } = get();
    const window = windows.get(id);

    if (!window || id === focusedId) return;

    // Restore if minimized
    if (window.isMinimized) {
      get()._restore(id);
      return;
    }

    // If in a group, also set as active tab
    if (window.groupId) {
      const group = groups.get(window.groupId);
      if (group && group.activeWindowId !== id) {
        get()._setActiveTab(window.groupId, id);
        return;
      }
    }

    set((state) => {
      const newWindows = new Map(state.windows);
      const w = newWindows.get(id);
      if (w) {
        newWindows.set(id, { ...w, zIndex: nextZIndex, isFocused: true });
      }
      // Unfocus previous window
      if (state.focusedId && state.focusedId !== id) {
        const prev = newWindows.get(state.focusedId);
        if (prev) {
          newWindows.set(state.focusedId, { ...prev, isFocused: false });
        }
      }
      return {
        windows: newWindows,
        focusedId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    });
  },

  _minimize: (id) => {
    const { windows, groups } = get();
    const window = windows.get(id);
    if (!window) return;

    // If in a group, minimize all windows in the group
    const windowsToMinimize = window.groupId
      ? groups.get(window.groupId)?.windowIds ?? [id]
      : [id];

    set((state) => {
      const newWindows = new Map(state.windows);
      for (const windowId of windowsToMinimize) {
        const w = newWindows.get(windowId);
        if (w) {
          newWindows.set(windowId, { ...w, isMinimized: true });
        }
      }

      // Focus next topmost non-minimized window
      const visible = Array.from(newWindows.values()).filter(
        (w) => !w.isMinimized
      );
      const newFocusedId =
        visible.length > 0
          ? visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
          : null;

      return { windows: newWindows, focusedId: newFocusedId };
    });
  },

  _maximize: (id) => {
    const { windows, groups } = get();
    const window = windows.get(id);
    if (!window || window.isMaximized) return;

    const viewport = getViewportSize();
    const windowsToMaximize = window.groupId
      ? groups.get(window.groupId)?.windowIds ?? [id]
      : [id];

    set((state) => {
      const newWindows = new Map(state.windows);
      for (const windowId of windowsToMaximize) {
        const w = newWindows.get(windowId);
        if (w && !w.isMaximized) {
          newWindows.set(windowId, {
            ...w,
            isMaximized: true,
            preMaximize: {
              x: w.position.x,
              y: w.position.y,
              width: w.size.width,
              height: w.size.height,
            },
            position: { x: 0, y: 0 },
            size: { width: viewport.width, height: viewport.height },
          });
        }
      }
      return { windows: newWindows };
    });
  },

  _restore: (id) => {
    const { windows, groups, nextZIndex } = get();
    const window = windows.get(id);
    if (!window) return;

    const windowsToRestore = window.groupId
      ? groups.get(window.groupId)?.windowIds ?? [id]
      : [id];

    set((state) => {
      const newWindows = new Map(state.windows);
      for (const windowId of windowsToRestore) {
        const w = newWindows.get(windowId);
        if (w) {
          if (w.isMaximized && w.preMaximize) {
            newWindows.set(windowId, {
              ...w,
              isMaximized: false,
              isMinimized: false,
              position: { x: w.preMaximize.x, y: w.preMaximize.y },
              size: { width: w.preMaximize.width, height: w.preMaximize.height },
              preMaximize: undefined,
              zIndex: nextZIndex,
            });
          } else {
            newWindows.set(windowId, {
              ...w,
              isMinimized: false,
              zIndex: nextZIndex,
            });
          }
        }
      }

      const group = window.groupId ? state.groups.get(window.groupId) : null;
      return {
        windows: newWindows,
        focusedId: group?.activeWindowId ?? id,
        nextZIndex: state.nextZIndex + 1,
      };
    });
  },

  _fullscreen: (id) => {
    const { windows, fullscreenId } = get();
    const window = windows.get(id);
    if (!window) return;

    // Exit current fullscreen first
    if (fullscreenId && fullscreenId !== id) {
      get()._exitFullscreen();
    }

    if (window.isFullscreen) return;

    // Request browser fullscreen
    if (typeof document !== 'undefined') {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }

    const screenWidth =
      typeof globalThis.innerWidth !== 'undefined'
        ? globalThis.innerWidth
        : 1920;
    const screenHeight =
      typeof globalThis.innerHeight !== 'undefined'
        ? globalThis.innerHeight
        : 1080;

    set((state) => {
      const newWindows = new Map(state.windows);
      const w = newWindows.get(id);
      if (w) {
        newWindows.set(id, {
          ...w,
          isFullscreen: true,
          isMaximized: false,
          tilePosition: undefined,
          preFullscreen: {
            x: w.position.x,
            y: w.position.y,
            width: w.size.width,
            height: w.size.height,
          },
          position: { x: 0, y: 0 },
          size: { width: screenWidth, height: screenHeight },
          zIndex: 10000,
        });
      }
      return {
        windows: newWindows,
        fullscreenId: id,
        focusedId: id,
      };
    });
  },

  _exitFullscreen: () => {
    const { windows, fullscreenId, nextZIndex } = get();
    if (!fullscreenId) return;

    const window = windows.get(fullscreenId);
    if (!window) return;

    // Exit browser fullscreen
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    set((state) => {
      const newWindows = new Map(state.windows);
      const w = newWindows.get(fullscreenId);
      if (w) {
        const pre = w.preFullscreen;
        newWindows.set(fullscreenId, {
          ...w,
          isFullscreen: false,
          position: { x: pre?.x ?? 100, y: pre?.y ?? 100 },
          size: { width: pre?.width ?? 800, height: pre?.height ?? 600 },
          preFullscreen: undefined,
          zIndex: nextZIndex,
        });
      }
      return {
        windows: newWindows,
        fullscreenId: null,
        nextZIndex: state.nextZIndex + 1,
      };
    });
  },

  _move: (id, position) => {
    const { windows, groups } = get();
    const window = windows.get(id);
    if (!window || window.isMaximized) return;

    const windowsToMove = window.groupId
      ? groups.get(window.groupId)?.windowIds ?? [id]
      : [id];

    set((state) => {
      const newWindows = new Map(state.windows);
      for (const windowId of windowsToMove) {
        const w = newWindows.get(windowId);
        if (w) {
          newWindows.set(windowId, { ...w, position });
        }
      }
      return { windows: newWindows };
    });
  },

  _resize: (id, size) => {
    const { windows, groups } = get();
    const window = windows.get(id);
    if (!window || window.isMaximized) return;

    const windowsToResize = window.groupId
      ? groups.get(window.groupId)?.windowIds ?? [id]
      : [id];

    set((state) => {
      const newWindows = new Map(state.windows);
      for (const windowId of windowsToResize) {
        const w = newWindows.get(windowId);
        if (w) {
          newWindows.set(windowId, { ...w, size });
        }
      }
      return { windows: newWindows };
    });
  },

  _tile: (id, position) => {
    const { windows, groups } = get();
    const window = windows.get(id);
    if (!window) return;

    const tileDims = getTileDimensions(position);
    const windowsToTile = window.groupId
      ? groups.get(window.groupId)?.windowIds ?? [id]
      : [id];

    set((state) => {
      const newWindows = new Map(state.windows);
      for (const windowId of windowsToTile) {
        const w = newWindows.get(windowId);
        if (w) {
          const preTile = w.tilePosition
            ? w.preTile
            : {
                x: w.position.x,
                y: w.position.y,
                width: w.size.width,
                height: w.size.height,
              };

          newWindows.set(windowId, {
            ...w,
            position: { x: tileDims.x, y: tileDims.y },
            size: { width: tileDims.width, height: tileDims.height },
            tilePosition: position,
            preTile,
            isMaximized: false,
            preMaximize: undefined,
          });
        }
      }
      return { windows: newWindows };
    });
  },

  _untile: (id) => {
    const { windows, groups } = get();
    const window = windows.get(id);
    if (!window || !window.tilePosition || !window.preTile) return;

    const windowsToUntile = window.groupId
      ? groups.get(window.groupId)?.windowIds ?? [id]
      : [id];

    set((state) => {
      const newWindows = new Map(state.windows);
      for (const windowId of windowsToUntile) {
        const w = newWindows.get(windowId);
        if (w && w.tilePosition && w.preTile) {
          newWindows.set(windowId, {
            ...w,
            position: { x: w.preTile.x, y: w.preTile.y },
            size: { width: w.preTile.width, height: w.preTile.height },
            tilePosition: undefined,
            preTile: undefined,
          });
        }
      }
      return { windows: newWindows };
    });
  },

  _cycleFocusNext: () => {
    const { windows, focusedId } = get();
    const windowList = Array.from(windows.values())
      .filter((w) => !w.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex);

    if (windowList.length <= 1) return;

    const currentIndex = windowList.findIndex((w) => w.id === focusedId);
    const nextIndex = (currentIndex + 1) % windowList.length;
    get()._focus(windowList[nextIndex].id);
  },

  _createGroup: (windowId1, windowId2) => {
    const { windows } = get();
    const window1 = windows.get(windowId1);
    const window2 = windows.get(windowId2);

    if (!window1 || !window2 || windowId1 === windowId2) return null;

    // If either window is already in a group, add to that group
    if (window1.groupId) {
      get()._addToGroup(window1.groupId, windowId2);
      return window1.groupId;
    }
    if (window2.groupId) {
      get()._addToGroup(window2.groupId, windowId1);
      return window2.groupId;
    }

    const groupId = generateGroupId();
    const newGroup: WindowGroup = {
      id: groupId,
      windowIds: [windowId1, windowId2],
      activeWindowId: windowId1,
    };

    set((state) => {
      const newWindows = new Map(state.windows);
      const newGroups = new Map(state.groups);

      // Use window2's position/size as the container
      newWindows.set(windowId1, {
        ...window1,
        groupId,
        isGroupActive: true,
        position: { ...window2.position },
        size: { ...window2.size },
      });

      newWindows.set(windowId2, {
        ...window2,
        groupId,
        isGroupActive: false,
      });

      newGroups.set(groupId, newGroup);

      return {
        windows: newWindows,
        groups: newGroups,
        focusedId: windowId1,
        nextZIndex: state.nextZIndex + 1,
      };
    });

    return groupId;
  },

  _addToGroup: (groupId, windowId) => {
    const { windows, groups } = get();
    const window = windows.get(windowId);
    const group = groups.get(groupId);

    if (!window || !group || window.groupId === groupId) return;

    // Remove from existing group first
    if (window.groupId) {
      get()._removeFromGroup(windowId);
    }

    set((state) => {
      const newWindows = new Map(state.windows);
      const newGroups = new Map(state.groups);
      const currentGroup = state.groups.get(groupId);
      if (!currentGroup) return state;

      const existingMember = state.windows.get(currentGroup.windowIds[0]);
      if (!existingMember) return state;

      newWindows.set(windowId, {
        ...window,
        groupId,
        isGroupActive: false,
        position: { ...existingMember.position },
        size: { ...existingMember.size },
      });

      newGroups.set(groupId, {
        ...currentGroup,
        windowIds: [...currentGroup.windowIds, windowId],
      });

      return { windows: newWindows, groups: newGroups };
    });
  },

  _removeFromGroup: (windowId) => {
    const { windows, groups } = get();
    const window = windows.get(windowId);

    if (!window || !window.groupId) return;

    const group = groups.get(window.groupId);
    if (!group) return;

    set((state) => {
      const newWindows = new Map(state.windows);
      const newGroups = new Map(state.groups);
      const currentGroup = state.groups.get(window.groupId!);
      if (!currentGroup) return state;

      const remainingWindowIds = currentGroup.windowIds.filter(
        (id) => id !== windowId
      );

      // Clear group info from this window
      newWindows.set(windowId, {
        ...window,
        groupId: undefined,
        isGroupActive: undefined,
      });

      if (remainingWindowIds.length <= 1) {
        // Dissolve the group
        for (const wId of remainingWindowIds) {
          const w = newWindows.get(wId);
          if (w) {
            newWindows.set(wId, {
              ...w,
              groupId: undefined,
              isGroupActive: undefined,
            });
          }
        }
        newGroups.delete(window.groupId!);
      } else {
        let newActiveId = currentGroup.activeWindowId;
        if (currentGroup.activeWindowId === windowId) {
          newActiveId = remainingWindowIds[0];
          for (const wId of remainingWindowIds) {
            const w = newWindows.get(wId);
            if (w) {
              newWindows.set(wId, {
                ...w,
                isGroupActive: wId === newActiveId,
              });
            }
          }
        }

        newGroups.set(window.groupId!, {
          ...currentGroup,
          windowIds: remainingWindowIds,
          activeWindowId: newActiveId,
        });
      }

      return { windows: newWindows, groups: newGroups };
    });
  },

  _setActiveTab: (groupId, windowId) => {
    const { windows, groups, nextZIndex } = get();
    const group = groups.get(groupId);
    const window = windows.get(windowId);

    if (!group || !window) return;
    if (!group.windowIds.includes(windowId)) return;
    if (group.activeWindowId === windowId) return;

    set((state) => {
      const newWindows = new Map(state.windows);
      const newGroups = new Map(state.groups);
      const currentGroup = state.groups.get(groupId);
      if (!currentGroup) return state;

      for (const wId of currentGroup.windowIds) {
        const w = newWindows.get(wId);
        if (w) {
          newWindows.set(wId, {
            ...w,
            isGroupActive: wId === windowId,
            zIndex: wId === windowId ? nextZIndex : w.zIndex,
          });
        }
      }

      newGroups.set(groupId, {
        ...currentGroup,
        activeWindowId: windowId,
      });

      return {
        windows: newWindows,
        groups: newGroups,
        focusedId: windowId,
        nextZIndex: state.nextZIndex + 1,
      };
    });
  },

  _minimizeAll: () => {
    set((state) => {
      const newWindows = new Map(state.windows);
      for (const [id, w] of newWindows) {
        newWindows.set(id, { ...w, isMinimized: true });
      }
      return { windows: newWindows, focusedId: null };
    });
  },

  _closeAll: () => {
    // Exit fullscreen first
    get()._exitFullscreen();
    set(() => ({
      windows: new Map(),
      groups: new Map(),
      focusedId: null,
      fullscreenId: null,
    }));
  },

  _cascade: () => {
    const { windows, nextZIndex } = get();
    const windowList = Array.from(windows.values())
      .filter((w) => !w.isMinimized)
      .sort((a, b) => a.zIndex - b.zIndex);

    set((state) => {
      const newWindows = new Map(state.windows);
      let z = nextZIndex;
      windowList.forEach((w, i) => {
        const offset = i * CASCADE_OFFSET;
        newWindows.set(w.id, {
          ...w,
          position: { x: 50 + offset, y: 50 + offset },
          isMaximized: false,
          tilePosition: undefined,
          zIndex: z++,
        });
      });
      return { windows: newWindows, nextZIndex: z };
    });
  },

  _tileAll: (layout) => {
    const { windows } = get();
    const windowList = Array.from(windows.values()).filter(
      (w) => !w.isMinimized
    );
    if (windowList.length === 0) return;

    const viewport = getViewportSize();

    set((state) => {
      const newWindows = new Map(state.windows);
      const count = windowList.length;

      if (layout === 'horizontal') {
        const width = viewport.width / count;
        windowList.forEach((w, i) => {
          newWindows.set(w.id, {
            ...w,
            position: { x: i * width, y: 0 },
            size: { width, height: viewport.height },
            isMaximized: false,
            tilePosition: undefined,
          });
        });
      } else if (layout === 'vertical') {
        const height = viewport.height / count;
        windowList.forEach((w, i) => {
          newWindows.set(w.id, {
            ...w,
            position: { x: 0, y: i * height },
            size: { width: viewport.width, height },
            isMaximized: false,
            tilePosition: undefined,
          });
        });
      } else {
        // Grid
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const cellWidth = viewport.width / cols;
        const cellHeight = viewport.height / rows;

        windowList.forEach((w, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          newWindows.set(w.id, {
            ...w,
            position: { x: col * cellWidth, y: row * cellHeight },
            size: { width: cellWidth, height: cellHeight },
            isMaximized: false,
            tilePosition: undefined,
          });
        });
      }

      return { windows: newWindows };
    });
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Public Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for window management.
 *
 * Provides all window lifecycle, focus, and state management operations.
 *
 * @example
 * ```tsx
 * const { windows, open, close, focus } = useWindowManager();
 *
 * const handleOpenWindow = () => {
 *   const id = open({ title: 'My Window', size: { width: 800, height: 600 } });
 *   console.log('Opened window:', id);
 * };
 * ```
 */
export function useWindowManager(): UseWindowManagerReturn {
  const store = useWindowManagerStore(
    useShallow((state) => ({
      windows: state.windows,
      groups: state.groups,
      focusedId: state.focusedId,
      fullscreenId: state.fullscreenId,
      open: state._open,
      close: state._close,
      focus: state._focus,
      minimize: state._minimize,
      maximize: state._maximize,
      restore: state._restore,
      fullscreen: state._fullscreen,
      exitFullscreen: state._exitFullscreen,
      move: state._move,
      resize: state._resize,
      tile: state._tile,
      untile: state._untile,
      cycleFocusNext: state._cycleFocusNext,
      createGroup: state._createGroup,
      addToGroup: state._addToGroup,
      removeFromGroup: state._removeFromGroup,
      setActiveTab: state._setActiveTab,
      minimizeAll: state._minimizeAll,
      closeAll: state._closeAll,
      cascade: state._cascade,
      tileAll: state._tileAll,
    }))
  );

  return {
    windows: Array.from(store.windows.values()),
    focusedId: store.focusedId,
    fullscreenId: store.fullscreenId,
    groups: Array.from(store.groups.values()),
    open: store.open,
    close: store.close,
    focus: store.focus,
    cycleFocusNext: store.cycleFocusNext,
    minimize: store.minimize,
    maximize: store.maximize,
    restore: store.restore,
    fullscreen: store.fullscreen,
    exitFullscreen: store.exitFullscreen,
    move: store.move,
    resize: store.resize,
    tile: store.tile,
    untile: store.untile,
    createGroup: store.createGroup,
    addToGroup: store.addToGroup,
    removeFromGroup: store.removeFromGroup,
    setActiveTab: store.setActiveTab,
    minimizeAll: store.minimizeAll,
    closeAll: store.closeAll,
    cascade: store.cascade,
    tileAll: store.tileAll,
    getWindow: (id) => store.windows.get(id),
    getWindowGroup: (windowId) => {
      const w = store.windows.get(windowId);
      return w?.groupId ? store.groups.get(w.groupId) : undefined;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Optimized Selector Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get array of window IDs - only re-renders when IDs change.
 *
 * @returns Array of all window IDs in the system
 *
 * @example
 * ```tsx
 * const windowIds = useWindowIds();
 * return windowIds.map(id => <WindowListItem key={id} windowId={id} />);
 * ```
 */
export function useWindowIds(): WindowId[] {
  return useWindowManagerStore(
    useShallow((state) => Array.from(state.windows.keys()))
  );
}

/**
 * Get a single window by ID - only re-renders when that window changes.
 *
 * @param id - The window ID to retrieve
 * @returns The window state or undefined if not found
 *
 * @example
 * ```tsx
 * const window = useWindow(windowId);
 * if (!window) return null;
 * return <div>{window.title}</div>;
 * ```
 */
export function useWindow(id: WindowId): WindowState | undefined {
  return useWindowManagerStore((state) => state.windows.get(id));
}

/**
 * Check if a specific window is focused.
 *
 * @param id - The window ID to check
 * @returns True if the window is currently focused
 *
 * @example
 * ```tsx
 * const isFocused = useIsWindowFocused(windowId);
 * return <div className={isFocused ? 'focused' : ''}>...</div>;
 * ```
 */
export function useIsWindowFocused(id: WindowId): boolean {
  return useWindowManagerStore((state) => state.focusedId === id);
}

/**
 * Check if a specific window is fullscreen.
 *
 * @param id - The window ID to check
 * @returns True if the window is in fullscreen mode
 */
export function useIsWindowFullscreen(id: WindowId): boolean {
  return useWindowManagerStore((state) => state.fullscreenId === id);
}

/**
 * Check if any window is in fullscreen mode.
 *
 * @returns True if any window is currently fullscreen
 *
 * @example
 * ```tsx
 * const isFullscreen = useIsFullscreenActive();
 * return isFullscreen ? <FullscreenOverlay /> : <Taskbar />;
 * ```
 */
export function useIsFullscreenActive(): boolean {
  return useWindowManagerStore((state) => state.fullscreenId !== null);
}

/**
 * Get window actions with stable references.
 * Useful when you only need actions without subscribing to state changes.
 *
 * @returns Object containing all window action methods
 *
 * @example
 * ```tsx
 * const { close, minimize, maximize } = useWindowActions();
 * return <button onClick={() => close(windowId)}>Close</button>;
 * ```
 */
export function useWindowActions() {
  return useWindowManagerStore(
    useShallow((state) => ({
      open: state._open,
      close: state._close,
      focus: state._focus,
      minimize: state._minimize,
      maximize: state._maximize,
      restore: state._restore,
      move: state._move,
      resize: state._resize,
      tile: state._tile,
      untile: state._untile,
      fullscreen: state._fullscreen,
      exitFullscreen: state._exitFullscreen,
    }))
  );
}

/**
 * Get a window group by ID.
 *
 * @param groupId - The group ID to retrieve, or undefined
 * @returns The window group or undefined if not found
 *
 * @example
 * ```tsx
 * const group = useWindowGroup(window.groupId);
 * if (group) {
 *   return <TabBar windowIds={group.windowIds} activeId={group.activeWindowId} />;
 * }
 * ```
 */
export function useWindowGroup(groupId: string | undefined): WindowGroup | undefined {
  return useWindowManagerStore((state) =>
    groupId ? state.groups.get(groupId) : undefined
  );
}
