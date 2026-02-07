# ADR-003: Module-Level Singleton Zustand Stores

## Status

Accepted (with known tradeoffs)

## Context

Several glia subsystems require global state that persists across component mounts/unmounts and is accessible from both React and non-React code:

- **WindowManager** -- tracks open windows, z-order, focus state for the desktop shell.
- **Taskbar** -- tracks pinned apps, running apps, notification badges.
- **DoormanStateMachine** -- manages the authentication/onboarding flow state machine.

The standard React approach (Context + useReducer, or Zustand inside a provider) scopes state to the provider's subtree and requires a React component tree to exist. However, these systems need to:

1. Be accessible from imperative code (e.g., an IPC handler opening a window).
2. Survive React subtree remounts (e.g., route changes that unmount the desktop shell).
3. Be importable as singletons for cross-module coordination.

## Decision

We use **module-level singleton Zustand stores** -- stores created at module scope (top-level `create()` calls) and exported as named constants:

```typescript
// stores/windowManager.ts
export const useWindowStore = create<WindowState>((set, get) => ({
  windows: [],
  open: (win) => set((s) => ({ windows: [...s.windows, win] })),
  close: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
  // ...
}));
```

These stores are:
- Created once when the module is first imported.
- Accessible from any module via import (React or non-React).
- Usable as React hooks (`useWindowStore(selector)`) inside components.
- Subscribable outside React (`useWindowStore.subscribe(listener)`).

## Consequences

**Easier:**
- Simple import-and-use pattern: `import { useWindowStore } from '@backbay/glia'`.
- No provider nesting required.
- Works seamlessly in event handlers, callbacks, and imperative code.
- Zustand's built-in `subscribe` and `getState` work without React.

**Harder:**
- **Testing isolation**: Module-level singletons share state across tests unless explicitly reset. Each store needs a `reset()` action or tests must call `useWindowStore.setState(initialState)` in `beforeEach`.
- **SSR safety**: Module-level stores are shared across requests in server environments. This is acceptable for glia (client-only library) but would be dangerous in SSR frameworks.
- **Multiple instances**: Cannot run two independent desktop shells in the same JS context (e.g., for micro-frontend embedding). Each would share the same window/taskbar state.
- **Bundle impact**: Importing any component that references a singleton store causes the store (and its dependencies) to be included in the bundle, even if unused.

**Mitigations:**
- Stores expose a `reset()` action for test cleanup.
- Glia documents itself as a client-only library (no SSR).
- The singleton pattern is limited to truly global subsystems (window management, taskbar, auth state) -- component-local state uses React Context or component state.

**Future:** If multi-instance support becomes necessary (e.g., embedding multiple shells), the stores can be migrated to a context-based pattern using Zustand's `createStore` (non-hook) API wrapped in a provider.
