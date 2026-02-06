/**
 * @backbay/glia Desktop OS - useSystemTray Hook
 *
 * System tray state management for registering/unregistering tray icons,
 * tracking badge counts, and controlling the overflow panel.
 *
 * @example
 * ```tsx
 * const { items, registerItem, unregisterItem } = useSystemTray();
 *
 * // Register a tray icon on mount
 * useEffect(() => {
 *   registerItem({ id: 'wifi', icon: <WifiIcon />, tooltip: 'Wi-Fi' });
 *   return () => unregisterItem('wifi');
 * }, []);
 * ```
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SystemTrayItem {
  id: string;
  icon: ReactNode;
  tooltip?: string;
  badge?: number;
  onClick?: () => void;
  visible?: boolean;
  order?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════

interface SystemTrayStore {
  items: Map<string, SystemTrayItem>;
  isExpanded: boolean;

  registerItem: (item: SystemTrayItem) => void;
  unregisterItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<SystemTrayItem>) => void;
  toggleExpanded: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════

export const useSystemTrayStore = create<SystemTrayStore>((set) => ({
  items: new Map(),
  isExpanded: false,

  registerItem: (item) => {
    set((state) => {
      const newItems = new Map(state.items);
      newItems.set(item.id, { visible: true, order: 0, ...item });
      return { items: newItems };
    });
  },

  unregisterItem: (id) => {
    set((state) => {
      const newItems = new Map(state.items);
      newItems.delete(id);
      return { items: newItems };
    });
  },

  updateItem: (id, updates) => {
    set((state) => {
      const existing = state.items.get(id);
      if (!existing) return state;
      const newItems = new Map(state.items);
      newItems.set(id, { ...existing, ...updates });
      return { items: newItems };
    });
  },

  toggleExpanded: () => {
    set((state) => ({ isExpanded: !state.isExpanded }));
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Public Hook
// ═══════════════════════════════════════════════════════════════════════════

export interface UseSystemTrayReturn {
  /** All registered tray items (sorted by order) */
  items: SystemTrayItem[];
  /** Whether the overflow panel is expanded */
  isExpanded: boolean;
  /** Register a tray icon */
  registerItem: (item: SystemTrayItem) => void;
  /** Unregister a tray icon */
  unregisterItem: (id: string) => void;
  /** Update a tray icon */
  updateItem: (id: string, updates: Partial<SystemTrayItem>) => void;
  /** Toggle the overflow panel */
  toggleExpanded: () => void;
}

/**
 * Hook for system tray state management.
 *
 * Provides registration/unregistration of tray items and overflow control.
 */
export function useSystemTray(): UseSystemTrayReturn {
  const store = useSystemTrayStore(
    useShallow((state) => ({
      items: state.items,
      isExpanded: state.isExpanded,
      registerItem: state.registerItem,
      unregisterItem: state.unregisterItem,
      updateItem: state.updateItem,
      toggleExpanded: state.toggleExpanded,
    }))
  );

  // Convert map to sorted array
  const sortedItems = Array.from(store.items.values())
    .filter((item) => item.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    items: sortedItems,
    isExpanded: store.isExpanded,
    registerItem: store.registerItem,
    unregisterItem: store.unregisterItem,
    updateItem: store.updateItem,
    toggleExpanded: store.toggleExpanded,
  };
}
