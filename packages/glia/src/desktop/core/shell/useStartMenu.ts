/**
 * @backbay/glia Desktop OS - useStartMenu Hook
 *
 * Start menu state management for app launching, search, and pinning.
 * Manages categories, apps, search filtering, and keyboard navigation.
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  StartMenuCategory,
  StartMenuApp,
  UseStartMenuReturn,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════

interface StartMenuStore {
  isOpen: boolean;
  categories: StartMenuCategory[];
  apps: StartMenuApp[];
  searchQuery: string;
  selectedCategoryId: string | null;
  highlightedIndex: number;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setHighlightedIndex: (index: number) => void;
  registerApps: (apps: StartMenuApp[]) => void;
  registerCategories: (categories: StartMenuCategory[]) => void;
  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════

export const useStartMenuStore = create<StartMenuStore>((set) => ({
  isOpen: false,
  categories: [],
  apps: [],
  searchQuery: '',
  selectedCategoryId: null,
  highlightedIndex: -1,

  open: () => {
    set({ isOpen: true, searchQuery: '', highlightedIndex: -1 });
  },

  close: () => {
    set({ isOpen: false, searchQuery: '', selectedCategoryId: null, highlightedIndex: -1 });
  },

  toggle: () => {
    set((state) =>
      state.isOpen
        ? { isOpen: false, searchQuery: '', selectedCategoryId: null, highlightedIndex: -1 }
        : { isOpen: true, searchQuery: '', highlightedIndex: -1 }
    );
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query, highlightedIndex: -1 });
  },

  setSelectedCategory: (categoryId) => {
    set({ selectedCategoryId: categoryId, highlightedIndex: -1 });
  },

  setHighlightedIndex: (index) => {
    set({ highlightedIndex: index });
  },

  registerApps: (apps) => {
    set({ apps });
  },

  registerCategories: (categories) => {
    set({ categories });
  },

  pinApp: (appId) => {
    set((state) => ({
      apps: state.apps.map((app) =>
        app.id === appId ? { ...app, pinned: true } : app
      ),
    }));
  },

  unpinApp: (appId) => {
    set((state) => ({
      apps: state.apps.map((app) =>
        app.id === appId ? { ...app, pinned: false } : app
      ),
    }));
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Public Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for start menu state management.
 *
 * Provides app search, filtering, pinning, and keyboard navigation.
 *
 * @example
 * ```tsx
 * const { isOpen, toggle, filteredApps, searchQuery, setSearchQuery } = useStartMenu();
 *
 * <Taskbar.StartButton onClick={toggle} active={isOpen} />
 * <StartMenu
 *   isOpen={isOpen}
 *   onClose={close}
 *   apps={filteredApps}
 *   onLaunchApp={(id) => processes.launch(id)}
 * />
 * ```
 */
export function useStartMenu(): UseStartMenuReturn {
  const store = useStartMenuStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      categories: state.categories,
      apps: state.apps,
      searchQuery: state.searchQuery,
      selectedCategoryId: state.selectedCategoryId,
      open: state.open,
      close: state.close,
      toggle: state.toggle,
      setSearchQuery: state.setSearchQuery,
      setSelectedCategory: state.setSelectedCategory,
      registerApps: state.registerApps,
      registerCategories: state.registerCategories,
      pinApp: state.pinApp,
      unpinApp: state.unpinApp,
    }))
  );

  const pinnedApps = useMemo(
    () => store.apps.filter((app) => app.pinned),
    [store.apps]
  );

  const recentApps = useMemo(
    () => store.apps.filter((app) => app.recent),
    [store.apps]
  );

  const filteredApps = useMemo(() => {
    let result = store.apps;

    // Filter by selected category
    if (store.selectedCategoryId) {
      result = result.filter((app) => app.categoryId === store.selectedCategoryId);
    }

    // Filter by search query
    if (store.searchQuery.trim()) {
      const query = store.searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [store.apps, store.selectedCategoryId, store.searchQuery]);

  // launchApp is a no-op at the hook level — consumers wire it to process.launch
  const launchApp = useMemo(
    () => (_appId: string) => {
      store.close();
    },
    [store.close]
  );

  return {
    isOpen: store.isOpen,
    categories: store.categories,
    apps: store.apps,
    pinnedApps,
    recentApps,
    searchQuery: store.searchQuery,
    filteredApps,
    open: store.open,
    close: store.close,
    toggle: store.toggle,
    setSearchQuery: store.setSearchQuery,
    setSelectedCategory: store.setSelectedCategory,
    registerApps: store.registerApps,
    registerCategories: store.registerCategories,
    launchApp,
    pinApp: store.pinApp,
    unpinApp: store.unpinApp,
  };
}
