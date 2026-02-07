import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowManagerStore } from '../useWindowManager';

function resetStore() {
  useWindowManagerStore.setState({
    windows: new Map(),
    groups: new Map(),
    focusedId: null,
    fullscreenId: null,
    nextZIndex: 1,
  });
}

describe('WindowManager store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('open', () => {
    it('creates a window entry', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test Window' });

      const state = useWindowManagerStore.getState();
      expect(state.windows.size).toBe(1);
      expect(state.windows.get(id)).toBeDefined();
      expect(state.windows.get(id)!.title).toBe('Test Window');
    });

    it('sets the new window as focused', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      const state = useWindowManagerStore.getState();
      expect(state.focusedId).toBe(id);
      expect(state.windows.get(id)!.isFocused).toBe(true);
    });

    it('uses default size when none provided', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      const w = useWindowManagerStore.getState().windows.get(id)!;
      expect(w.size).toEqual({ width: 640, height: 480 });
    });

    it('uses provided size', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test', size: { width: 800, height: 600 } });

      const w = useWindowManagerStore.getState().windows.get(id)!;
      expect(w.size).toEqual({ width: 800, height: 600 });
    });

    it('increments z-index for each new window', () => {
      const store = useWindowManagerStore.getState();
      const id1 = store._open({ title: 'W1' });
      const id2 = useWindowManagerStore.getState()._open({ title: 'W2' });

      const state = useWindowManagerStore.getState();
      const w1 = state.windows.get(id1)!;
      const w2 = state.windows.get(id2)!;
      expect(w2.zIndex).toBeGreaterThan(w1.zIndex);
    });
  });

  describe('close', () => {
    it('removes the window', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });
      expect(useWindowManagerStore.getState().windows.size).toBe(1);

      useWindowManagerStore.getState()._close(id);
      expect(useWindowManagerStore.getState().windows.size).toBe(0);
    });

    it('focuses next topmost window after closing focused window', () => {
      const store = useWindowManagerStore.getState();
      const id1 = store._open({ title: 'W1' });
      const id2 = useWindowManagerStore.getState()._open({ title: 'W2' });

      expect(useWindowManagerStore.getState().focusedId).toBe(id2);

      useWindowManagerStore.getState()._close(id2);
      expect(useWindowManagerStore.getState().focusedId).toBe(id1);
    });

    it('sets focusedId to null when last window is closed', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      useWindowManagerStore.getState()._close(id);
      expect(useWindowManagerStore.getState().focusedId).toBeNull();
    });

    it('does nothing for non-existent window', () => {
      const store = useWindowManagerStore.getState();
      store._open({ title: 'Test' });

      useWindowManagerStore.getState()._close('non-existent');
      expect(useWindowManagerStore.getState().windows.size).toBe(1);
    });
  });

  describe('focus', () => {
    it('updates z-index and focused state', () => {
      const store = useWindowManagerStore.getState();
      const id1 = store._open({ title: 'W1' });
      const id2 = useWindowManagerStore.getState()._open({ title: 'W2' });

      // id2 is focused, focus id1
      useWindowManagerStore.getState()._focus(id1);

      const state = useWindowManagerStore.getState();
      expect(state.focusedId).toBe(id1);
      expect(state.windows.get(id1)!.isFocused).toBe(true);
      expect(state.windows.get(id2)!.isFocused).toBe(false);
    });

    it('does nothing if window is already focused', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      const zBefore = useWindowManagerStore.getState().nextZIndex;
      useWindowManagerStore.getState()._focus(id);
      const zAfter = useWindowManagerStore.getState().nextZIndex;

      // nextZIndex should not change since it was already focused
      expect(zAfter).toBe(zBefore);
    });
  });

  describe('minimize', () => {
    it('sets isMinimized to true', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      useWindowManagerStore.getState()._minimize(id);

      const w = useWindowManagerStore.getState().windows.get(id)!;
      expect(w.isMinimized).toBe(true);
    });

    it('focuses next topmost non-minimized window', () => {
      const store = useWindowManagerStore.getState();
      const id1 = store._open({ title: 'W1' });
      const id2 = useWindowManagerStore.getState()._open({ title: 'W2' });

      useWindowManagerStore.getState()._minimize(id2);

      expect(useWindowManagerStore.getState().focusedId).toBe(id1);
    });

    it('sets focusedId to null when all windows are minimized', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      useWindowManagerStore.getState()._minimize(id);

      expect(useWindowManagerStore.getState().focusedId).toBeNull();
    });
  });

  describe('maximize', () => {
    it('sets isMaximized to true and saves pre-maximize state', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test', position: { x: 100, y: 100 }, size: { width: 400, height: 300 } });

      useWindowManagerStore.getState()._maximize(id);

      const w = useWindowManagerStore.getState().windows.get(id)!;
      expect(w.isMaximized).toBe(true);
      expect(w.preMaximize).toEqual({ x: 100, y: 100, width: 400, height: 300 });
      expect(w.position).toEqual({ x: 0, y: 0 });
    });

    it('does nothing if already maximized', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      useWindowManagerStore.getState()._maximize(id);
      const firstSize = useWindowManagerStore.getState().windows.get(id)!.size;

      useWindowManagerStore.getState()._maximize(id);
      const secondSize = useWindowManagerStore.getState().windows.get(id)!.size;

      expect(firstSize).toEqual(secondSize);
    });
  });

  describe('restore', () => {
    it('restores from minimized', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test' });

      useWindowManagerStore.getState()._minimize(id);
      expect(useWindowManagerStore.getState().windows.get(id)!.isMinimized).toBe(true);

      useWindowManagerStore.getState()._restore(id);

      const w = useWindowManagerStore.getState().windows.get(id)!;
      expect(w.isMinimized).toBe(false);
    });

    it('restores from maximized to pre-maximize position', () => {
      const store = useWindowManagerStore.getState();
      const id = store._open({ title: 'Test', position: { x: 100, y: 200 }, size: { width: 400, height: 300 } });

      useWindowManagerStore.getState()._maximize(id);
      useWindowManagerStore.getState()._restore(id);

      const w = useWindowManagerStore.getState().windows.get(id)!;
      expect(w.isMaximized).toBe(false);
      expect(w.position).toEqual({ x: 100, y: 200 });
      expect(w.size).toEqual({ width: 400, height: 300 });
    });
  });

  describe('stacking order', () => {
    it('maintains correct z-index order with multiple windows', () => {
      const store = useWindowManagerStore.getState();
      const id1 = store._open({ title: 'W1' });
      const id2 = useWindowManagerStore.getState()._open({ title: 'W2' });
      const id3 = useWindowManagerStore.getState()._open({ title: 'W3' });

      // Focus id1, bringing it to top
      useWindowManagerStore.getState()._focus(id1);

      const state = useWindowManagerStore.getState();
      const z1 = state.windows.get(id1)!.zIndex;
      const z2 = state.windows.get(id2)!.zIndex;
      const z3 = state.windows.get(id3)!.zIndex;

      // id1 should be on top (highest z-index)
      expect(z1).toBeGreaterThan(z2);
      expect(z1).toBeGreaterThan(z3);
    });
  });

  describe('minimizeAll', () => {
    it('minimizes all windows and clears focus', () => {
      const store = useWindowManagerStore.getState();
      store._open({ title: 'W1' });
      useWindowManagerStore.getState()._open({ title: 'W2' });

      useWindowManagerStore.getState()._minimizeAll();

      const state = useWindowManagerStore.getState();
      for (const [, w] of state.windows) {
        expect(w.isMinimized).toBe(true);
      }
      expect(state.focusedId).toBeNull();
    });
  });

  describe('closeAll', () => {
    it('removes all windows', () => {
      const store = useWindowManagerStore.getState();
      store._open({ title: 'W1' });
      useWindowManagerStore.getState()._open({ title: 'W2' });

      useWindowManagerStore.getState()._closeAll();

      const state = useWindowManagerStore.getState();
      expect(state.windows.size).toBe(0);
      expect(state.focusedId).toBeNull();
    });
  });
});
