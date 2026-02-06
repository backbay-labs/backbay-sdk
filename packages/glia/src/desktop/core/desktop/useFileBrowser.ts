/**
 * @backbay/glia Desktop OS - useFileBrowser Hook
 *
 * Zustand store and hook for file browser state management.
 * Handles navigation history, selection, sorting, search, and view mode.
 */

import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  FileItem,
  FileBrowserViewMode,
  FileBrowserSort,
  FileBrowserSortField,
} from './fileBrowserTypes';

// ═══════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════

interface FileBrowserStore {
  /** Current folder ID (null = root) */
  currentFolderId: string | null;
  /** Navigation history (folder IDs, null = root) */
  history: (string | null)[];
  /** Current position in history */
  historyIndex: number;
  /** Selected file IDs */
  selectedIds: Set<string>;
  /** View mode */
  viewMode: FileBrowserViewMode;
  /** Sort configuration */
  sort: FileBrowserSort;
  /** Search query */
  searchQuery: string;

  // Navigation
  navigateTo: (folderId: string | null) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateUp: (files: FileItem[]) => void;

  // Selection
  select: (id: string, additive: boolean) => void;
  selectRange: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // View
  setViewMode: (mode: FileBrowserViewMode) => void;
  setSort: (sort: FileBrowserSort) => void;
  toggleSortField: (field: FileBrowserSortField) => void;
  setSearchQuery: (query: string) => void;

  // Reset
  reset: (initialFolderId?: string | null) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════

export const useFileBrowserStore = create<FileBrowserStore>((set, get) => ({
  currentFolderId: null,
  history: [null],
  historyIndex: 0,
  selectedIds: new Set(),
  viewMode: 'grid',
  sort: { field: 'name', order: 'asc' },
  searchQuery: '',

  navigateTo: (folderId) => {
    const state = get();
    // Trim forward history when navigating to a new folder
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(folderId);
    set({
      currentFolderId: folderId,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedIds: new Set(),
      searchQuery: '',
    });
  },

  navigateBack: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIndex = state.historyIndex - 1;
    set({
      currentFolderId: state.history[newIndex] ?? null,
      historyIndex: newIndex,
      selectedIds: new Set(),
      searchQuery: '',
    });
  },

  navigateForward: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    set({
      currentFolderId: state.history[newIndex] ?? null,
      historyIndex: newIndex,
      selectedIds: new Set(),
      searchQuery: '',
    });
  },

  navigateUp: (files) => {
    const state = get();
    if (state.currentFolderId === null) return;
    const currentFolder = files.find((f) => f.id === state.currentFolderId);
    if (!currentFolder) return;
    get().navigateTo(currentFolder.parentId);
  },

  select: (id, additive) => {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (additive) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        next.clear();
        next.add(id);
      }
      return { selectedIds: next };
    });
  },

  selectRange: (ids) => {
    set({ selectedIds: new Set(ids) });
  },

  selectAll: (ids) => {
    set({ selectedIds: new Set(ids) });
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setSort: (sort) => {
    set({ sort });
  },

  toggleSortField: (field) => {
    const state = get();
    if (state.sort.field === field) {
      set({ sort: { field, order: state.sort.order === 'asc' ? 'desc' : 'asc' } });
    } else {
      set({ sort: { field, order: 'asc' } });
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  reset: (initialFolderId = null) => {
    set({
      currentFolderId: initialFolderId,
      history: [initialFolderId],
      historyIndex: 0,
      selectedIds: new Set(),
      viewMode: 'grid',
      sort: { field: 'name', order: 'asc' },
      searchQuery: '',
    });
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function sortFiles(files: FileItem[], sort: FileBrowserSort): FileItem[] {
  const sorted = [...files];
  const dir = sort.order === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    // Folders always first
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    switch (sort.field) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'size':
        return dir * ((a.size ?? 0) - (b.size ?? 0));
      case 'modifiedAt':
        return dir * ((a.modifiedAt ?? 0) - (b.modifiedAt ?? 0));
      case 'type':
        return dir * a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  return sorted;
}

// ═══════════════════════════════════════════════════════════════════════════
// Public Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Return type for the useFileBrowser hook.
 */
export interface UseFileBrowserReturn {
  /** Files visible in the current folder (sorted & filtered) */
  visibleFiles: FileItem[];
  /** Current folder ID */
  currentFolderId: string | null;
  /** Breadcrumb trail of folder IDs from root */
  breadcrumb: (FileItem | null)[];
  /** Whether back navigation is possible */
  canGoBack: boolean;
  /** Whether forward navigation is possible */
  canGoForward: boolean;
  /** Whether up navigation is possible */
  canGoUp: boolean;
  /** Selected file IDs */
  selectedIds: Set<string>;
  /** View mode */
  viewMode: FileBrowserViewMode;
  /** Sort configuration */
  sort: FileBrowserSort;
  /** Search query */
  searchQuery: string;
  /** Total items in current folder */
  totalItems: number;
  /** Number of selected items */
  selectedCount: number;

  // Actions
  navigateTo: (folderId: string | null) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateUp: () => void;
  select: (id: string, additive: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setViewMode: (mode: FileBrowserViewMode) => void;
  setSort: (sort: FileBrowserSort) => void;
  toggleSortField: (field: FileBrowserSortField) => void;
  setSearchQuery: (query: string) => void;
}

/**
 * Hook for file browser state management.
 *
 * @param files - All file items (flat list with parentId relationships)
 * @param initialFolderId - Initial folder to display
 */
export function useFileBrowser(
  files: FileItem[],
  initialFolderId: string | null = null
): UseFileBrowserReturn {
  const store = useFileBrowserStore(
    useShallow((state) => ({
      currentFolderId: state.currentFolderId,
      historyIndex: state.historyIndex,
      historyLength: state.history.length,
      selectedIds: state.selectedIds,
      viewMode: state.viewMode,
      sort: state.sort,
      searchQuery: state.searchQuery,
      navigateTo: state.navigateTo,
      navigateBack: state.navigateBack,
      navigateForward: state.navigateForward,
      navigateUp: state.navigateUp,
      select: state.select,
      selectAll: state.selectAll,
      clearSelection: state.clearSelection,
      setViewMode: state.setViewMode,
      setSort: state.setSort,
      toggleSortField: state.toggleSortField,
      setSearchQuery: state.setSearchQuery,
    }))
  );

  // Filter files to current folder
  const currentFiles = useMemo(() => {
    return files.filter((f) => f.parentId === store.currentFolderId);
  }, [files, store.currentFolderId]);

  // Apply search filter
  const filteredFiles = useMemo(() => {
    if (!store.searchQuery) return currentFiles;
    const query = store.searchQuery.toLowerCase();
    return currentFiles.filter((f) => f.name.toLowerCase().includes(query));
  }, [currentFiles, store.searchQuery]);

  // Apply sorting
  const visibleFiles = useMemo(() => {
    return sortFiles(filteredFiles, store.sort);
  }, [filteredFiles, store.sort]);

  // Build breadcrumb trail
  const breadcrumb = useMemo(() => {
    const trail: (FileItem | null)[] = [null]; // root
    let currentId = store.currentFolderId;
    const visited = new Set<string>();
    while (currentId !== null) {
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const folder = files.find((f) => f.id === currentId);
      if (!folder) break;
      trail.push(folder);
      currentId = folder.parentId;
    }
    // Trail is built root-to-current but we pushed in reverse
    // Actually root is first, then we append ancestors walking up, so reverse the ancestors
    if (trail.length > 1) {
      const root = trail[0];
      const ancestors = trail.slice(1).reverse();
      return [root, ...ancestors];
    }
    return trail;
  }, [files, store.currentFolderId]);

  const canGoBack = store.historyIndex > 0;
  const canGoForward = store.historyIndex < store.historyLength - 1;
  const canGoUp = store.currentFolderId !== null;

  const handleNavigateUp = useCallback(() => {
    store.navigateUp(files);
  }, [store.navigateUp, files]);

  const handleSelectAll = useCallback(() => {
    store.selectAll(visibleFiles.map((f) => f.id));
  }, [store.selectAll, visibleFiles]);

  return {
    visibleFiles,
    currentFolderId: store.currentFolderId,
    breadcrumb,
    canGoBack,
    canGoForward,
    canGoUp,
    selectedIds: store.selectedIds,
    viewMode: store.viewMode,
    sort: store.sort,
    searchQuery: store.searchQuery,
    totalItems: visibleFiles.length,
    selectedCount: store.selectedIds.size,

    navigateTo: store.navigateTo,
    navigateBack: store.navigateBack,
    navigateForward: store.navigateForward,
    navigateUp: handleNavigateUp,
    select: store.select,
    selectAll: handleSelectAll,
    clearSelection: store.clearSelection,
    setViewMode: store.setViewMode,
    setSort: store.setSort,
    toggleSortField: store.toggleSortField,
    setSearchQuery: store.setSearchQuery,
  };
}
