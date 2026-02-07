/**
 * Sentinel State Store
 *
 * Manages the Sentinel orb summoning, dismissal, and docking state.
 */

import { create, createStore } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  SentinelPhase,
  DockedPosition,
  Cardinal,
  DocketItem,
  OrbPosition,
  SentinelState,
  ConversationState,
} from './types';

// -----------------------------------------------------------------------------
// Default Docket
// -----------------------------------------------------------------------------

const defaultDocket: DocketItem[] = [
  { id: 'console', position: 'N', icon: 'terminal', label: 'Console' },
  { id: 'lens', position: 'E', icon: 'eye', label: 'Lens' },
  { id: 'avatar', position: 'S', icon: 'user', label: 'Avatar' },
  { id: 'vault', position: 'W', icon: 'vault', label: 'Vault' },
];

const defaultVisibleCardinals: string[] = ['console', 'lens', 'vault', 'avatar'];

// -----------------------------------------------------------------------------
// Store Factory
// -----------------------------------------------------------------------------

function createSentinelStoreImpl(set: any, get: any): SentinelState {
  return {
    // Initial state
    phase: 'docked',
    dockedPosition: 'taskbar',
    orbPosition: { x: 0, y: 0 },
    targetPosition: { x: 0, y: 0 },
    expandedCardinal: null,
    expandedRadial: null,
    docket: defaultDocket,
    cameraPermission: 'prompt',
    avatarAnonMode: false,
    avatarMosaicSize: 0.55,
    taskbarOrigin: { x: 0, y: 0 },

    // Cardinal configuration state
    visibleCardinals: defaultVisibleCardinals,

    // Conversation state
    conversationState: 'idle',
    isTextInputEnabled: false,
    isMuted: false,

    // Caption state
    currentCaption: null,

    // Actions
    summon: () => {
      const state = get();
      if (state.phase !== 'docked') return;

      const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
      const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

      set({
        phase: 'summoning',
        targetPosition: { x: centerX, y: centerY },
      });
    },

    dismiss: () => {
      const state = get();
      if (state.phase !== 'open' && state.phase !== 'avatar') return;

      set({
        phase: 'dismissing',
        targetPosition: state.taskbarOrigin,
        expandedCardinal: null,
        expandedRadial: null,
      });
    },

    setPhase: (phase) => set({ phase }),

    setOrbPosition: (orbPosition) => set({ orbPosition }),

    setTargetPosition: (targetPosition) => set({ targetPosition }),

    throwTo: (velocity) => {
      set({ phase: 'throwing' });
    },

    dockAt: (dockedPosition) => {
      set({
        phase: 'docked',
        dockedPosition,
        expandedCardinal: null,
        expandedRadial: null,
      });
    },

    expandCardinal: (direction) => {
      set({
        expandedCardinal: direction,
        expandedRadial: null,
      });
    },

    expandRadial: (itemId) => {
      set({ expandedRadial: itemId });
    },

    setDocket: (docket) => set({ docket }),

    enterAvatarMode: () => {
      set({
        phase: 'avatar',
        expandedCardinal: null,
        expandedRadial: null,
      });
    },

    exitAvatarMode: () => {
      set({ phase: 'open' });
    },

    setCameraPermission: (cameraPermission) => set({ cameraPermission }),

    setTaskbarOrigin: (taskbarOrigin) => set({ taskbarOrigin }),

    setAvatarAnonMode: (enabled) => set({ avatarAnonMode: enabled }),

    setAvatarMosaicSize: (value) => {
      const clamped = Math.min(1, Math.max(0, value));
      set({ avatarMosaicSize: clamped });
    },

    setVisibleCardinals: (visibleCardinals) => set({ visibleCardinals }),

    setConversationState: (conversationState) => set({ conversationState }),

    toggleTextInput: () => set((state: SentinelState) => ({ isTextInputEnabled: !state.isTextInputEnabled })),

    toggleMute: () => set((state: SentinelState) => ({ isMuted: !state.isMuted })),

    setCurrentCaption: (currentCaption) => set({ currentCaption }),
  };
}

const SENTINEL_PERSIST_OPTIONS = {
  name: 'sentinel-storage',
  partialize: (state: SentinelState) => ({
    dockedPosition: state.dockedPosition,
    cameraPermission: state.cameraPermission,
    avatarAnonMode: state.avatarAnonMode,
    avatarMosaicSize: state.avatarMosaicSize,
    visibleCardinals: state.visibleCardinals,
  }),
};

/** Factory: creates an isolated Sentinel store instance with persist middleware. */
export function createSentinelStore(storageName = 'sentinel-storage') {
  return createStore<SentinelState>()(
    persist(
      (set, get) => createSentinelStoreImpl(set, get),
      { ...SENTINEL_PERSIST_OPTIONS, name: storageName }
    )
  );
}

export type SentinelStoreApi = ReturnType<typeof createSentinelStore>;

// Legacy singleton
export const useSentinelStore = create<SentinelState>()(
  persist(
    (set, get) => createSentinelStoreImpl(set, get),
    SENTINEL_PERSIST_OPTIONS
  )
);

// Re-export types for convenience
export type {
  SentinelPhase,
  DockedPosition,
  Cardinal,
  DocketItem,
  OrbPosition,
  SentinelState,
  ConversationState,
};
