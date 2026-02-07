import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskbarStore } from '../useTaskbar';

function resetStore() {
  useTaskbarStore.setState({
    buttonPositions: new Map(),
    previewState: null,
    pinnedApps: [],
    _showPreviewTimeout: null,
    _hidePreviewTimeout: null,
  });
}

describe('Taskbar store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('pinApp', () => {
    it('adds app to pinned list', () => {
      useTaskbarStore.getState().pinApp('app-1');
      expect(useTaskbarStore.getState().pinnedApps).toEqual(['app-1']);
    });

    it('does not duplicate already-pinned apps', () => {
      useTaskbarStore.getState().pinApp('app-1');
      useTaskbarStore.getState().pinApp('app-1');
      expect(useTaskbarStore.getState().pinnedApps).toEqual(['app-1']);
    });

    it('can pin multiple apps', () => {
      useTaskbarStore.getState().pinApp('app-1');
      useTaskbarStore.getState().pinApp('app-2');
      expect(useTaskbarStore.getState().pinnedApps).toEqual(['app-1', 'app-2']);
    });
  });

  describe('unpinApp', () => {
    it('removes app from pinned list', () => {
      useTaskbarStore.getState().pinApp('app-1');
      useTaskbarStore.getState().pinApp('app-2');

      useTaskbarStore.getState().unpinApp('app-1');
      expect(useTaskbarStore.getState().pinnedApps).toEqual(['app-2']);
    });

    it('does nothing for non-pinned app', () => {
      useTaskbarStore.getState().pinApp('app-1');
      useTaskbarStore.getState().unpinApp('app-999');
      expect(useTaskbarStore.getState().pinnedApps).toEqual(['app-1']);
    });
  });

  describe('button position registration', () => {
    it('registers a button position', () => {
      const pos = { x: 10, y: 20, width: 40, height: 40 };
      useTaskbarStore.getState().registerButtonPosition('btn-1', pos);

      expect(useTaskbarStore.getState().buttonPositions.get('btn-1')).toEqual(pos);
    });

    it('unregisters a button position', () => {
      const pos = { x: 10, y: 20, width: 40, height: 40 };
      useTaskbarStore.getState().registerButtonPosition('btn-1', pos);
      useTaskbarStore.getState().unregisterButtonPosition('btn-1');

      expect(useTaskbarStore.getState().buttonPositions.get('btn-1')).toBeUndefined();
    });

    it('getButtonCenter returns correct center', () => {
      const pos = { x: 10, y: 20, width: 40, height: 60 };
      useTaskbarStore.getState().registerButtonPosition('btn-1', pos);

      const center = useTaskbarStore.getState().getButtonCenter('btn-1');
      expect(center).toEqual({ x: 30, y: 50 });
    });

    it('getButtonCenter returns undefined for unregistered button', () => {
      const center = useTaskbarStore.getState().getButtonCenter('missing');
      expect(center).toBeUndefined();
    });
  });

  describe('preview', () => {
    it('hidePreview clears preview state', () => {
      // Directly set a preview state to test hidePreview
      useTaskbarStore.setState({
        previewState: {
          windowId: 'win-1',
          anchorRect: { x: 0, y: 0, width: 40, height: 40 },
        },
      });

      useTaskbarStore.getState().hidePreview();

      expect(useTaskbarStore.getState().previewState).toBeNull();
    });
  });
});
