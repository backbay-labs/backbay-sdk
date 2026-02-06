/**
 * @backbay/glia Desktop OS - useNotifications Hook
 *
 * Zustand store and hook for the notification system.
 * Handles creating, dismissing, reading, and grouping notifications.
 *
 * @example
 * ```tsx
 * const { notify, unreadCount, groups, openPanel } = useNotifications();
 *
 * // Send a notification
 * notify({ type: 'success', priority: 'normal', title: 'File saved' });
 *
 * // Open the panel
 * openPanel();
 * ```
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  Notification,
  NotificationGroup,
  NotificationInput,
  NotificationStore,
  UseNotificationsReturn,
} from './notificationTypes';

// ═══════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isPanelOpen: false,

  notify: (input) => {
    const id = crypto.randomUUID();
    const notification: Notification = {
      ...input,
      id,
      timestamp: Date.now(),
      read: false,
      dismissed: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));

    return id;
  },

  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, dismissed: true } : n
      ),
    }));
  },

  dismissAll: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, dismissed: true })),
    }));
  },

  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  openPanel: () => {
    set({ isPanelOpen: true });
  },

  closePanel: () => {
    set({ isPanelOpen: false });
  },

  togglePanel: () => {
    set((state) => ({ isPanelOpen: !state.isPanelOpen }));
  },
}));

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format a date label for grouping notifications.
 */
function getDateLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Group notifications by groupKey or by date.
 */
function groupNotifications(notifications: Notification[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();

  for (const n of notifications) {
    const key = n.groupKey ?? getDateLabel(n.timestamp);
    const existing = groups.get(key);
    if (existing) {
      existing.notifications.push(n);
    } else {
      groups.set(key, {
        key,
        label: key,
        notifications: [n],
      });
    }
  }

  return Array.from(groups.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// Public Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for the notification system.
 *
 * Provides notifications, unread count, grouped notifications, and actions.
 */
export function useNotifications(): UseNotificationsReturn {
  const store = useNotificationStore(
    useShallow((state) => ({
      notifications: state.notifications,
      isPanelOpen: state.isPanelOpen,
      notify: state.notify,
      dismiss: state.dismiss,
      dismissAll: state.dismissAll,
      markRead: state.markRead,
      markAllRead: state.markAllRead,
      clearAll: state.clearAll,
      openPanel: state.openPanel,
      closePanel: state.closePanel,
      togglePanel: state.togglePanel,
    }))
  );

  // Filter to only non-dismissed notifications
  const active = useMemo(
    () => store.notifications.filter((n) => !n.dismissed),
    [store.notifications]
  );

  const unreadCount = useMemo(
    () => active.filter((n) => !n.read).length,
    [active]
  );

  const groups = useMemo(
    () => groupNotifications(active),
    [active]
  );

  return {
    notifications: active,
    isPanelOpen: store.isPanelOpen,
    unreadCount,
    groups,
    notify: store.notify,
    dismiss: store.dismiss,
    dismissAll: store.dismissAll,
    markRead: store.markRead,
    markAllRead: store.markAllRead,
    clearAll: store.clearAll,
    openPanel: store.openPanel,
    closePanel: store.closePanel,
    togglePanel: store.togglePanel,
  };
}
