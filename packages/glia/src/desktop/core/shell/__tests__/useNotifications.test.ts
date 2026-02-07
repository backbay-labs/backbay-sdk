import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '../useNotifications';

function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    isPanelOpen: false,
  });
}

describe('Notification store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('notify', () => {
    it('adds a notification', () => {
      const store = useNotificationStore.getState();
      const id = store.notify({
        type: 'info',
        priority: 'normal',
        title: 'Test notification',
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe(id);
      expect(state.notifications[0].title).toBe('Test notification');
      expect(state.notifications[0].type).toBe('info');
      expect(state.notifications[0].read).toBe(false);
      expect(state.notifications[0].dismissed).toBe(false);
    });

    it('prepends new notifications (newest first)', () => {
      const store = useNotificationStore.getState();
      store.notify({ type: 'info', priority: 'normal', title: 'First' });
      useNotificationStore.getState().notify({ type: 'info', priority: 'normal', title: 'Second' });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].title).toBe('Second');
      expect(state.notifications[1].title).toBe('First');
    });

    it('assigns a timestamp', () => {
      const before = Date.now();
      const store = useNotificationStore.getState();
      store.notify({ type: 'info', priority: 'normal', title: 'Test' });
      const after = Date.now();

      const n = useNotificationStore.getState().notifications[0];
      expect(n.timestamp).toBeGreaterThanOrEqual(before);
      expect(n.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('dismiss', () => {
    it('marks a notification as dismissed', () => {
      const store = useNotificationStore.getState();
      const id = store.notify({ type: 'info', priority: 'normal', title: 'Test' });

      useNotificationStore.getState().dismiss(id);

      const n = useNotificationStore.getState().notifications.find((n) => n.id === id)!;
      expect(n.dismissed).toBe(true);
    });

    it('does not affect other notifications', () => {
      const store = useNotificationStore.getState();
      const id1 = store.notify({ type: 'info', priority: 'normal', title: 'First' });
      const id2 = useNotificationStore.getState().notify({ type: 'info', priority: 'normal', title: 'Second' });

      useNotificationStore.getState().dismiss(id1);

      const n2 = useNotificationStore.getState().notifications.find((n) => n.id === id2)!;
      expect(n2.dismissed).toBe(false);
    });
  });

  describe('dismissAll', () => {
    it('marks all notifications as dismissed', () => {
      const store = useNotificationStore.getState();
      store.notify({ type: 'info', priority: 'normal', title: 'First' });
      useNotificationStore.getState().notify({ type: 'info', priority: 'normal', title: 'Second' });

      useNotificationStore.getState().dismissAll();

      const state = useNotificationStore.getState();
      for (const n of state.notifications) {
        expect(n.dismissed).toBe(true);
      }
    });
  });

  describe('markRead', () => {
    it('marks a notification as read', () => {
      const store = useNotificationStore.getState();
      const id = store.notify({ type: 'info', priority: 'normal', title: 'Test' });

      useNotificationStore.getState().markRead(id);

      const n = useNotificationStore.getState().notifications.find((n) => n.id === id)!;
      expect(n.read).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read', () => {
      const store = useNotificationStore.getState();
      store.notify({ type: 'info', priority: 'normal', title: 'First' });
      useNotificationStore.getState().notify({ type: 'info', priority: 'normal', title: 'Second' });

      useNotificationStore.getState().markAllRead();

      const state = useNotificationStore.getState();
      for (const n of state.notifications) {
        expect(n.read).toBe(true);
      }
    });
  });

  describe('clearAll', () => {
    it('removes all notifications', () => {
      const store = useNotificationStore.getState();
      store.notify({ type: 'info', priority: 'normal', title: 'First' });
      useNotificationStore.getState().notify({ type: 'info', priority: 'normal', title: 'Second' });

      useNotificationStore.getState().clearAll();

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('panel', () => {
    it('openPanel sets isPanelOpen to true', () => {
      useNotificationStore.getState().openPanel();
      expect(useNotificationStore.getState().isPanelOpen).toBe(true);
    });

    it('closePanel sets isPanelOpen to false', () => {
      useNotificationStore.getState().openPanel();
      useNotificationStore.getState().closePanel();
      expect(useNotificationStore.getState().isPanelOpen).toBe(false);
    });

    it('togglePanel flips the state', () => {
      expect(useNotificationStore.getState().isPanelOpen).toBe(false);

      useNotificationStore.getState().togglePanel();
      expect(useNotificationStore.getState().isPanelOpen).toBe(true);

      useNotificationStore.getState().togglePanel();
      expect(useNotificationStore.getState().isPanelOpen).toBe(false);
    });
  });
});
