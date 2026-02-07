# RFC-07: State Management Cleanup

**Status:** Proposed
**Effort:** Medium (2 sessions)
**Priority:** High
**Depends on:** RFC-04 (unified theme)

## Problem

`@backbay/glia` has **19 React contexts** and **9 module-level Zustand store
singletons** with no documented hierarchy, no SSR safety, and no guidance for
consumers on which providers to nest and in what order.

### React Contexts (19 total)

| # | Context | Location | Purpose |
|---|---------|----------|---------|
| 1 | `BBContext` | `src/components/BBProvider.tsx:56` | Root app config, agent runs, sync status |
| 2 | `UiThemeContext` | `src/theme/UiThemeProvider.tsx:11` | Glass primitive theme tokens |
| 3 | `ThemeContext` (Desktop) | `src/desktop/providers/ThemeProvider.tsx:32` | Desktop OS CSS variables |
| 4 | `DesktopOSContext` | `src/desktop/providers/DesktopOSProvider.tsx:77` | Window manager, process registry, taskbar |
| 5 | `SpeakeasyPublicContext` | `src/speakeasy/SpeakeasyProvider.tsx:68` | Public auth state (doorman phase, admitted?) |
| 6 | `SpeakeasyPrivateContext` | `src/speakeasy/SpeakeasyProvider.tsx:71` | Private auth state (tokens, gestures) |
| 7 | `SpeakeasyContext` | `src/speakeasy/SpeakeasyProvider.tsx:74` | Legacy combined context (deprecated) |
| 8 | `IntensityContext` | `src/hooks/useIntensity.tsx:181` | Ambient intensity values |
| 9 | `WorkspaceContext` | `src/workspace/WorkspaceRenderer.tsx:35` | Component registry render context |
| 10 | `GlassResizableContext` | `src/primitives/organisms/GlassResizable/GlassResizable.tsx:21` | Resizable panel direction |
| 11 | `SidebarContext` | `src/primitives/organisms/GlassSidebar/GlassSidebar.tsx:24` | Sidebar open/collapsed state |
| 12 | `RadioGroupContext` | `src/primitives/atoms/GlassRadioGroup/GlassRadioGroup.tsx:67` | Radio group value + onChange |
| 13 | `MouseEnterContext` | `src/primitives/molecules/ThreeDCard/ThreeDCard.tsx:6` | 3D card hover state |
| 14 | `FormFieldContext` | `src/primitives/molecules/FormField/FormField.tsx:16` | Form field ID + error linkage |
| 15 | `GlassAccordionItemContext` | `src/primitives/atoms/GlassAccordion/GlassAccordion.tsx:68` | Accordion item open state |
| 16 | `FieldBusContext` | `src/primitives/three/AmbientField/FieldProvider.tsx:15` | R3F ambient field event bus |
| 17 | `FieldContext` (Quantum) | `src/primitives/three/QuantumField/FieldProvider.tsx:30` | R3F quantum field state |
| 18 | `SentinelContext` | `src/primitives/three/Sentinel/SentinelProvider.tsx:91` | Sentinel orb summoning state |

Note: `SpeakeasyContext` (#7) is marked deprecated in source -- it should be
removed once consumers migrate to the split public/private contexts.

### Module-Level Zustand Singletons (9 total)

These stores are created at **module scope** via `create()` -- they exist as
global singletons the moment the module is imported:

| # | Store | Location | Lines |
|---|-------|----------|------:|
| 1 | `useWindowManagerStore` | `src/desktop/core/window/useWindowManager.ts:144` | ~900 |
| 2 | `useTaskbarStore` | `src/desktop/core/shell/useTaskbar.ts:58` | ~170 |
| 3 | `useNotificationStore` | `src/desktop/core/shell/useNotifications.ts:34` | ~130 |
| 4 | `useStartMenuStore` | `src/desktop/core/shell/useStartMenu.ts:45` | ~90 |
| 5 | `useFileBrowserStore` | `src/desktop/core/desktop/useFileBrowser.ts:64` | ~200 |
| 6 | `useSnapZoneStore` | `src/desktop/core/desktop/useSnapZones.ts` | ~80 |
| 7 | `useSystemTrayStore` | `src/desktop/core/shell/useSystemTray.ts` | ~80 |
| 8 | `useDoormanStore` | `src/speakeasy/doorman/DoormanStateMachine.ts:10` | ~200 |
| 9 | `useSentinelStore` | `src/primitives/three/Sentinel/sentinelStore.ts:7` | ~100 |

Store #9 (`useSentinelStore`) also uses `persist` middleware, writing to
localStorage at module scope.

### Why This Is a Problem

1. **SSR breaks.** Module-level `create()` runs during server-side import.
   Zustand stores reference `window`, `document`, `localStorage`, and
   `crypto.randomUUID()` in their initial state or actions. This causes
   hydration mismatches at best and crashes at worst.

2. **Testing isolation fails.** Two tests importing `useWindowManagerStore`
   share the same store instance. State from test A leaks into test B unless
   you manually call `useWindowManagerStore.setState(initialState)` between
   tests. Currently there are no tests that do this.

3. **Multiple instances impossible.** Two `<DesktopOSProvider>` trees on the
   same page (e.g., a preview + a live desktop) fight over the same singleton
   stores. The second desktop shows windows from the first.

4. **Import side effects.** Importing `@backbay/glia/desktop` to use a single
   type definition instantiates 7 Zustand stores, runs their initializers, and
   may trigger `localStorage.getItem()` calls.

5. **No documented provider tree.** Consumers must guess the nesting order.
   Getting it wrong causes runtime errors:
   ```
   Error: useDesktopOS must be used within a DesktopOSProvider
   Error: useUiTheme must be used within a UiThemeProvider
   Error: useBBContext must be used within a BBProvider
   ```

## Context Audit: Which Truly Need Context?

| Context | Verdict | Reason |
|---------|---------|--------|
| BBContext | **Keep** | App-wide config, needed by many descendants |
| UiThemeContext | **Keep** (merge per RFC-04) | Theme tokens used everywhere |
| ThemeContext (Desktop) | **Merge** into unified theme | Redundant with UiThemeContext |
| DesktopOSContext | **Keep** | Orchestrates windows, processes, taskbar |
| SpeakeasyPublicContext | **Keep** | Auth state needed across component tree |
| SpeakeasyPrivateContext | **Keep** | Sensitive auth separated from public |
| SpeakeasyContext | **Remove** | Deprecated, replaced by public/private split |
| IntensityContext | **Keep** | Ambient intensity for nested components |
| WorkspaceContext | **Keep** | Render registry for workspace |
| GlassResizableContext | **Evaluate** | Could use compound component props instead |
| SidebarContext | **Keep** | Sidebar state for nested items |
| RadioGroupContext | **Keep** | Radix pattern, needed for radio items |
| MouseEnterContext | **Evaluate** | Single boolean, could be a prop or ref |
| FormFieldContext | **Keep** | ID linkage for label/input/error |
| GlassAccordionItemContext | **Keep** | Radix pattern, needed for accordion items |
| FieldBusContext | **Keep** | R3F event bus for ambient field |
| FieldContext (Quantum) | **Keep** | R3F state for quantum field |
| SentinelContext | **Keep** | Sentinel orb state for nested components |

**Result:** Remove 1 (deprecated SpeakeasyContext), merge 1 (Desktop
ThemeContext into unified), evaluate 2 (GlassResizable, MouseEnter) for possible
simplification to props/refs. The other 14 are justified.

## Proposed Solution

### 1. Document the Provider Tree Hierarchy

```
<GliaProviders theme="nebula" config={bbConfig} agents={agents}>
  |
  +-- <GliaThemeProvider>           // RFC-04 unified theme
  |     Sets --glia-* CSS variables + provides token hooks
  |
  +---- <BBProvider>                // App config, agent runs
  |       config, agents, activeRuns, syncStatus
  |
  +------ <SpeakeasyProvider>       // Auth (optional)
  |         doorman state, capability tokens
  |         Internally: SpeakeasyPublicContext + SpeakeasyPrivateContext
  |
  +-------- <DesktopOSProvider>     // Desktop shell (optional)
  |           window manager, taskbar, process registry
  |           Internally: scoped Zustand stores
  |
  +---------- <App />
</GliaProviders>
```

### 2. Convert Module-Level Stores to Context-Scoped

Replace the singleton pattern:

```typescript
// BEFORE: module-level singleton (src/desktop/core/window/useWindowManager.ts:144)
export const useWindowManagerStore = create<WindowManagerStore>((set, get) => ({
  windows: new Map(),
  // ...
}));
```

With a context-scoped store factory:

```typescript
// AFTER: store created inside provider, shared via context
import { createStore, useStore } from 'zustand';

function createWindowManagerStore() {
  return createStore<WindowManagerStore>((set, get) => ({
    windows: new Map(),
    // ...
  }));
}

const WindowManagerStoreContext = createContext<ReturnType<typeof createWindowManagerStore> | null>(null);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createWindowManagerStore());
  return (
    <WindowManagerStoreContext.Provider value={store}>
      {children}
    </WindowManagerStoreContext.Provider>
  );
}

export function useWindowManagerStore<T>(selector: (state: WindowManagerStore) => T): T {
  const store = useContext(WindowManagerStoreContext);
  if (!store) throw new Error('useWindowManagerStore requires WindowManagerProvider');
  return useStore(store, selector);
}
```

This pattern:
- Creates a **new store per provider instance** (multiple desktops work)
- **No module-level side effects** (SSR-safe)
- **Test isolation** is automatic (each `renderHook` wraps its own provider)
- The hook API remains **identical** for consumers

Apply to all 9 stores:

| Store | Wrapping Provider |
|-------|------------------|
| `useWindowManagerStore` | `DesktopOSProvider` (internal) |
| `useTaskbarStore` | `DesktopOSProvider` (internal) |
| `useNotificationStore` | `DesktopOSProvider` (internal) |
| `useStartMenuStore` | `DesktopOSProvider` (internal) |
| `useFileBrowserStore` | `DesktopOSProvider` (internal) |
| `useSnapZoneStore` | `DesktopOSProvider` (internal) |
| `useSystemTrayStore` | `DesktopOSProvider` (internal) |
| `useDoormanStore` | `SpeakeasyProvider` (internal) |
| `useSentinelStore` | `SentinelProvider` (already has one at `src/primitives/three/Sentinel/SentinelProvider.tsx:91`) |

### 3. Create `<GliaProviders>` Convenience Wrapper

A single component that sets up the full provider tree for the common case:

```typescript
export interface GliaProvidersProps {
  children: ReactNode;
  /** Theme ID ('nebula' | 'solarpunk') */
  theme?: UiThemeId;
  /** BB config */
  config: BBConfig;
  /** Available agents */
  agents?: Agent[];
  /** Enable desktop shell? (adds DesktopOSProvider) */
  desktop?: boolean | DesktopOSProviderProps;
  /** Enable speakeasy auth? (adds SpeakeasyProvider) */
  speakeasy?: boolean | SpeakeasyProviderProps;
}

export function GliaProviders({
  children,
  theme = 'nebula',
  config,
  agents,
  desktop = false,
  speakeasy = false,
}: GliaProvidersProps) {
  let tree = children;

  if (desktop) {
    const desktopProps = typeof desktop === 'object' ? desktop : {};
    tree = <DesktopOSProvider {...desktopProps}>{tree}</DesktopOSProvider>;
  }

  if (speakeasy) {
    const speakeasyProps = typeof speakeasy === 'object' ? speakeasy : {};
    tree = <SpeakeasyProvider {...speakeasyProps}>{tree}</SpeakeasyProvider>;
  }

  return (
    <GliaThemeProvider themeId={theme}>
      <BBProvider config={config} agents={agents}>
        {tree}
      </BBProvider>
    </GliaThemeProvider>
  );
}
```

### 4. SSR Safety Checklist

Each converted store must be audited for browser-only APIs:

| API | Found In | Fix |
|-----|----------|-----|
| `window.innerWidth/Height` | `useWindowManager` (cascade positioning) | Guard with `typeof window !== 'undefined'`, use 0 as SSR default |
| `document.documentElement` | `UiThemeProvider` (CSS variable injection) | Already guarded via `useIsomorphicLayoutEffect` |
| `localStorage.getItem` | `UiThemeProvider` (theme persistence), `sentinelStore` (persist middleware) | Wrap in try/catch, already done in UiThemeProvider |
| `crypto.randomUUID()` | `useNotificationStore` (notification IDs) | Polyfill or use a counter-based ID generator |
| `Date.now()` | Multiple stores (timestamps) | Safe in SSR |
| `Map()` | `useWindowManager`, `DesktopOSProvider` (process registry) | Safe in SSR |

### 5. Remove Deprecated `SpeakeasyContext`

The legacy combined context at `src/speakeasy/SpeakeasyProvider.tsx:74` is
already marked deprecated. Remove it and update any remaining consumers to use
`SpeakeasyPublicContext` / `SpeakeasyPrivateContext`.

## Migration Guide

### For consumers using `useWindowManagerStore.getState()` directly

```typescript
// BEFORE: direct singleton access
import { useWindowManagerStore } from '@backbay/glia/desktop';
const windows = useWindowManagerStore.getState().windows;

// AFTER: must be inside DesktopOSProvider, use hook
import { useWindowManagerStore } from '@backbay/glia/desktop';
function MyComponent() {
  const windows = useWindowManagerStore((s) => s.windows);
  // ...
}
```

The `.getState()` escape hatch (used in
`src/desktop/providers/DesktopOSProvider.tsx:339` and
`src/desktop/components/shell/NotificationCenter.stories.tsx:185`) must be
replaced with either:
- The hook version inside a React component
- A store ref passed via callback

### For test files

```typescript
// BEFORE: manual state reset
beforeEach(() => {
  useWindowManagerStore.setState({ windows: new Map() });
});

// AFTER: each test gets its own provider (automatic isolation)
const wrapper = ({ children }) => (
  <DesktopOSProvider processes={[]}>{children}</DesktopOSProvider>
);
const { result } = renderHook(() => useDesktopOS(), { wrapper });
```

## Acceptance Criteria

- [ ] Zero module-level `create()` calls from Zustand -- all stores created
      inside providers
- [ ] Provider tree hierarchy documented in package README
- [ ] `<GliaProviders>` convenience wrapper available
- [ ] SSR: importing `@backbay/glia/desktop` in a Node.js environment does not
      throw or access browser APIs
- [ ] Tests: two `<DesktopOSProvider>` instances on the same page maintain
      independent state
- [ ] Deprecated `SpeakeasyContext` removed
- [ ] All existing `.getState()` direct access patterns replaced with
      hook-based or ref-based alternatives
