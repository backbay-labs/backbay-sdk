/**
 * @backbay/bb-ui Desktop OS - DesktopOSProvider
 *
 * Main provider that wires together all desktop OS functionality.
 * Manages windows, processes, taskbar, and context menus.
 */

'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { PartialDesktopOSTheme } from '../themes/types';
import { ThemeProvider } from './ThemeProvider';
import {
  useWindowManager,
  useWindowManagerStore,
} from '../core/window/useWindowManager';
import type { WindowId, WindowState, UseWindowManagerReturn } from '../core/window/types';
import { useSnapZones } from '../core/desktop/useSnapZones';
import type { UseSnapZonesReturn } from '../core/desktop/types';
import { useTaskbar, useTaskbarStore } from '../core/shell/useTaskbar';
import type { UseTaskbarReturn } from '../core/shell/types';
import type { ProcessDefinition, ProcessInstance, DesktopOSConfig } from '../core/desktop/types';

// ═══════════════════════════════════════════════════════════════════════════
// Process Registry Store
// ═══════════════════════════════════════════════════════════════════════════

interface ProcessRegistryState {
  definitions: Map<string, ProcessDefinition>;
  instances: Map<string, ProcessInstance>;
}

let processIdCounter = 0;
function generateProcessInstanceId(): string {
  return `process-${Date.now()}-${++processIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════════════

interface DesktopOSContextValue {
  // Window management
  windows: UseWindowManagerReturn;

  // Snap zones
  snapZones: UseSnapZonesReturn;

  // Taskbar
  taskbar: UseTaskbarReturn;

  // Process management
  processes: {
    definitions: ProcessDefinition[];
    instances: ProcessInstance[];
    launch: (processId: string, args?: Record<string, unknown>) => string | null;
    terminate: (instanceId: string) => void;
    getDefinition: (id: string) => ProcessDefinition | undefined;
    getInstanceByWindow: (windowId: WindowId) => ProcessInstance | undefined;
  };

  // Configuration
  config: {
    enableSnapZones: boolean;
    enableWindowGroups: boolean;
    enableAnimations: boolean;
  };
}

const DesktopOSContext = createContext<DesktopOSContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Access the desktop OS context.
 *
 * @throws Error if used outside DesktopOSProvider
 *
 * @example
 * ```tsx
 * const { windows, processes, taskbar } = useDesktopOS();
 *
 * const handleLaunch = () => {
 *   processes.launch('my-app');
 * };
 * ```
 */
export function useDesktopOS(): DesktopOSContextValue {
  const context = useContext(DesktopOSContext);
  if (!context) {
    throw new Error('useDesktopOS must be used within a DesktopOSProvider');
  }
  return context;
}

/**
 * Check if we're inside a DesktopOSProvider.
 * Useful for components that work in both standalone and managed modes.
 */
export function useIsInDesktopOS(): boolean {
  return useContext(DesktopOSContext) !== null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Provider
// ═══════════════════════════════════════════════════════════════════════════

export interface DesktopOSProviderProps extends DesktopOSConfig {
  children: React.ReactNode;
  /** Theme customization */
  theme?: PartialDesktopOSTheme;
}

/**
 * Main provider for desktop OS functionality.
 *
 * Wires together window management, process registry, taskbar, and theming.
 *
 * @example
 * ```tsx
 * const myApps: ProcessDefinition[] = [
 *   {
 *     id: 'notepad',
 *     name: 'Notepad',
 *     icon: <NotepadIcon />,
 *     component: NotepadApp,
 *     defaultSize: { width: 600, height: 400 },
 *   },
 * ];
 *
 * function App() {
 *   return (
 *     <DesktopOSProvider
 *       processes={myApps}
 *       theme={{ colors: { accent: '#00ff88' } }}
 *       enableSnapZones
 *       enableWindowGroups
 *     >
 *       <Desktop>
 *         <WindowManager />
 *       </Desktop>
 *       <Taskbar />
 *       <ContextMenu />
 *     </DesktopOSProvider>
 *   );
 * }
 * ```
 */
export function DesktopOSProvider({
  children,
  processes: processDefinitions,
  initialWindows,
  initialPinnedApps,
  theme,
  onWindowsChange,
  onPinnedAppsChange,
  enableSnapZones = true,
  enableWindowGroups = true,
  enableAnimations = true,
}: DesktopOSProviderProps) {
  // ─────────────────────────────────────────────────────────────────────────
  // Process Registry State
  // ─────────────────────────────────────────────────────────────────────────

  const [processState, setProcessState] = React.useState<ProcessRegistryState>(
    () => ({
      definitions: new Map(processDefinitions.map((d) => [d.id, d])),
      instances: new Map(),
    })
  );

  // Update definitions when prop changes
  useEffect(() => {
    setProcessState((prev) => ({
      ...prev,
      definitions: new Map(processDefinitions.map((d) => [d.id, d])),
    }));
  }, [processDefinitions]);

  // ─────────────────────────────────────────────────────────────────────────
  // Core Hooks
  // ─────────────────────────────────────────────────────────────────────────

  const windowManager = useWindowManager();
  const snapZones = useSnapZones();

  // Build window info for taskbar
  const windowsForTaskbar = useMemo(
    () =>
      windowManager.windows.map((w) => {
        // Find the process instance for this window
        const instance = Array.from(processState.instances.values()).find(
          (i) => i.windowId === w.id
        );
        return {
          id: w.id,
          appId: instance?.processId ?? 'unknown',
          title: w.title,
          icon: w.icon,
        };
      }),
    [windowManager.windows, processState.instances]
  );

  const taskbar = useTaskbar(windowsForTaskbar, windowManager.focusedId);

  // ─────────────────────────────────────────────────────────────────────────
  // Process Management
  // ─────────────────────────────────────────────────────────────────────────

  const launch = useCallback(
    (processId: string, args?: Record<string, unknown>): string | null => {
      const definition = processState.definitions.get(processId);
      if (!definition) {
        console.warn(`Process not found: ${processId}`);
        return null;
      }

      // Check singleton constraint
      if (definition.singleton) {
        const existing = Array.from(processState.instances.values()).find(
          (i) => i.processId === processId
        );
        if (existing) {
          // Focus existing window instead
          windowManager.focus(existing.windowId);
          return existing.id;
        }
      }

      // Open window
      const windowId = windowManager.open({
        title: definition.name,
        icon: typeof definition.icon === 'string' ? definition.icon : undefined,
        size: definition.defaultSize,
        minSize: definition.minSize,
        maxSize: definition.maxSize,
      });

      // Create process instance
      const instanceId = generateProcessInstanceId();
      const instance: ProcessInstance = {
        id: instanceId,
        processId,
        windowId,
        args,
        startedAt: Date.now(),
      };

      setProcessState((prev) => {
        const newInstances = new Map(prev.instances);
        newInstances.set(instanceId, instance);
        return { ...prev, instances: newInstances };
      });

      return instanceId;
    },
    [processState.definitions, processState.instances, windowManager]
  );

  const terminate = useCallback(
    (instanceId: string) => {
      const instance = processState.instances.get(instanceId);
      if (!instance) return;

      // Close the window
      windowManager.close(instance.windowId);

      // Remove process instance
      setProcessState((prev) => {
        const newInstances = new Map(prev.instances);
        newInstances.delete(instanceId);
        return { ...prev, instances: newInstances };
      });
    },
    [processState.instances, windowManager]
  );

  const getDefinition = useCallback(
    (id: string) => processState.definitions.get(id),
    [processState.definitions]
  );

  const getInstanceByWindow = useCallback(
    (windowId: WindowId) =>
      Array.from(processState.instances.values()).find(
        (i) => i.windowId === windowId
      ),
    [processState.instances]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  // Notify on windows change
  useEffect(() => {
    onWindowsChange?.(windowManager.windows);
  }, [windowManager.windows, onWindowsChange]);

  // Clean up process instances when windows close
  useEffect(() => {
    const windowIds = new Set(windowManager.windows.map((w) => w.id));

    setProcessState((prev) => {
      let changed = false;
      const newInstances = new Map(prev.instances);

      for (const [instanceId, instance] of prev.instances) {
        if (!windowIds.has(instance.windowId)) {
          newInstances.delete(instanceId);
          changed = true;
        }
      }

      return changed ? { ...prev, instances: newInstances } : prev;
    });
  }, [windowManager.windows]);

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize pinned apps
  // ─────────────────────────────────────────────────────────────────────────

  const pinnedAppsInitialized = useRef(false);
  useEffect(() => {
    // Only initialize once, even if initialPinnedApps changes
    if (pinnedAppsInitialized.current) return;
    if (initialPinnedApps && initialPinnedApps.length > 0) {
      pinnedAppsInitialized.current = true;
      const taskbarStore = useTaskbarStore.getState();
      for (const appId of initialPinnedApps) {
        taskbarStore.pinApp(appId);
      }
    }
  }, [initialPinnedApps]);

  // ─────────────────────────────────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────────────────────────────────

  const contextValue = useMemo<DesktopOSContextValue>(
    () => ({
      windows: windowManager,
      snapZones,
      taskbar,
      processes: {
        definitions: Array.from(processState.definitions.values()),
        instances: Array.from(processState.instances.values()),
        launch,
        terminate,
        getDefinition,
        getInstanceByWindow,
      },
      config: {
        enableSnapZones,
        enableWindowGroups,
        enableAnimations,
      },
    }),
    [
      windowManager,
      snapZones,
      taskbar,
      processState,
      launch,
      terminate,
      getDefinition,
      getInstanceByWindow,
      enableSnapZones,
      enableWindowGroups,
      enableAnimations,
    ]
  );

  return (
    <ThemeProvider theme={theme}>
      <DesktopOSContext.Provider value={contextValue}>
        {children}
      </DesktopOSContext.Provider>
    </ThemeProvider>
  );
}
