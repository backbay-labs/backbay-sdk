# RFC-05: Add Error Boundaries

**Priority:** High
**Effort:** Small (1 session)
**Packages affected:** `@backbay/glia`

## Problem

Zero error boundaries exist in the entire codebase. A `grep -r "ErrorBoundary"` across all packages returns no results. A single uncaught error in any React component takes down the entire app tree.

This is especially dangerous for four areas of the codebase:

### 1. Three.js / R3F components

WebGL crashes are common (context lost, shader compilation failure, unsupported extensions). The R3F components in `packages/glia/src/primitives/three/` include `AgentConsole`, `SpatialWorkspace`, voice captions, and cluster visualizations. A WebGL crash currently takes down the entire desktop shell.

### 2. Desktop window system

The window system renders arbitrary app content inside `Window` components (`packages/glia/src/desktop/components/window/Window.tsx`). The provider tree is:

```
DesktopOSProvider (src/desktop/providers/DesktopOSProvider.tsx)
  -> ThemeProvider
    -> DesktopOSContext.Provider
      -> Window (per-window, renders children)
        -> [arbitrary app content]
```

If any app crashes inside a Window, the entire `DesktopOSProvider` unmounts -- killing all windows, the taskbar, and the start menu. This defeats the purpose of having a "desktop OS" metaphor where apps should be isolated.

### 3. Speakeasy auth

The Speakeasy system handles cryptographic key material (`SpeakeasyAuth` at `src/speakeasy/auth/SpeakeasyAuth.ts`), WebCrypto operations (`crypto.ts`), and encrypted storage (`storage.ts`). An unhandled error during verification could leave the DoormanStateMachine (`src/speakeasy/doorman/DoormanStateMachine.ts`) in the `VERIFYING` state permanently, or worse, leak partial state from a failed crypto operation. The provider tree:

```
SpeakeasyProvider (src/speakeasy/SpeakeasyProvider.tsx)
  -> DoormanStateMachine (Zustand singleton)
  -> SpeakeasyAuth instance
  -> [gesture recognition, orb UI, ritual pad]
```

### 4. Streaming / async components

`StreamingText`, `ChatThread`, `ChatInput`, and `ToolCallCard` (all in `src/primitives/organisms/`) involve async data fetching, SSE streams, and dynamic content rendering. Network failures or malformed server responses currently crash the entire component tree.

## Current Provider Tree (no boundaries)

Reading the actual source, the app tree looks like:

```
BBProvider (src/components/BBProvider.tsx:79-149)
  -> BBContext.Provider
    -> DesktopOSProvider (src/desktop/providers/DesktopOSProvider.tsx:158-391)
      -> ThemeProvider
        -> DesktopOSContext.Provider
          -> SpeakeasyProvider (src/speakeasy/SpeakeasyProvider.tsx)
            -> Window[] (each renders arbitrary children)
              -> [Three.js canvas, chat threads, etc.]
```

No level of this tree has error isolation.

## Proposed Solution

### 1. `<GliaErrorBoundary>` -- generic, configurable

A base error boundary that other specialized boundaries extend. Located at `src/primitives/atoms/GliaErrorBoundary/`.

```tsx
interface GliaErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI. Receives error + reset function. */
  fallback?: React.ReactNode | ((props: { error: Error; reset: () => void }) => React.ReactNode);
  /** Called when an error is caught. Use for telemetry/logging. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Auto-retry after this many ms (0 = no auto-retry) */
  autoRetryMs?: number;
  /** Glass-themed fallback styling */
  variant?: 'inline' | 'card' | 'fullscreen';
}
```

Must use React's class-based `componentDidCatch` / `getDerivedStateFromError` (no hook equivalent exists).

Default fallback UI should use glass theme tokens (`useGlassTokens()`) so it matches the design system rather than appearing as an unstyled error message.

### 2. `<ThreeErrorBoundary>` -- R3F / WebGL specific

Located at `src/primitives/three/ThreeErrorBoundary/`. Extends `GliaErrorBoundary` with:

- Detection of WebGL context loss events
- Graceful fallback to a 2D placeholder (static image or CSS)
- Optional "reload 3D view" button that re-creates the Canvas
- Automatic cleanup of Three.js resources (geometries, materials, textures) on error

Insert point: wraps each `<Canvas>` usage in the R3F components.

### 3. Window-level boundary -- crash isolation for desktop apps

Each `Window` component should wrap its `children` in an error boundary so that one app crash does not kill the desktop shell.

**Insert point:** Inside `WindowInner` at `src/desktop/components/window/Window.tsx:600`:

```tsx
// Current (no isolation):
<div style={windowContentStyle} data-bb-window-content>
  {children}
</div>

// Proposed (crash isolation):
<div style={windowContentStyle} data-bb-window-content>
  <WindowErrorBoundary windowId={id} title={title}>
    {children}
  </WindowErrorBoundary>
</div>
```

The `WindowErrorBoundary` fallback should:
- Show a themed error card with the window title
- Provide a "Close Window" button that calls `windowManager.close(id)`
- Provide a "Retry" button that resets the boundary
- Not propagate the error upward (the rest of the desktop continues working)

### 4. Speakeasy boundary -- secure cleanup on error

Wraps the Speakeasy provider's children. On error:

- Resets the DoormanStateMachine to `IDLE` state via `useDoormanStore.getState().reset()`
- Clears any in-flight challenge data (`challenge: null`)
- Does NOT clear stored verifier keys (those are persistent and should survive errors)
- Logs the error without including key material in the log message

**Insert point:** Inside `SpeakeasyProvider` at `src/speakeasy/SpeakeasyProvider.tsx`, wrapping the children.

### 5. `useErrorBoundary()` hook for programmatic triggering

A companion hook that lets function components trigger the nearest error boundary:

```tsx
function ChatThread() {
  const { throwError } = useErrorBoundary();

  useEffect(() => {
    stream.on('error', (err) => {
      throwError(new Error(`Stream failed: ${err.message}`));
    });
  }, [stream]);
}
```

Implementation: uses React context to pass a `throwError` function from the nearest `GliaErrorBoundary`.

### 6. Optional error reporting hook

```tsx
<GliaErrorBoundary
  onError={(error, info) => {
    telemetry.captureException(error, {
      componentStack: info.componentStack,
      boundary: 'window',
    });
  }}
>
```

Host applications can wire this into their own error reporting (Sentry, DataDog, etc.) without Glia shipping any telemetry dependency.

## Where to Insert Boundaries

Based on the actual provider tree, boundaries should be inserted at these levels:

```
BBProvider
  -> BBContext.Provider
    -> [1] GliaErrorBoundary (app-level, fullscreen fallback)
      -> DesktopOSProvider
        -> ThemeProvider
          -> DesktopOSContext.Provider
            -> [2] SpeakeasyErrorBoundary (secure cleanup)
              -> SpeakeasyProvider content
            -> Window[]
              -> [3] WindowErrorBoundary (per-window isolation)
                -> [4] ThreeErrorBoundary (if window contains Canvas)
                  -> [app content]
```

Level 1 is the last-resort catch-all. Levels 2-4 handle domain-specific recovery.

## Acceptance Criteria

- [ ] No single component crash can take down the entire app
- [ ] Desktop windows crash in isolation -- other windows and the taskbar continue working
- [ ] Three.js / WebGL failures show a graceful 2D fallback instead of a blank screen
- [ ] Speakeasy errors reset the DoormanStateMachine to IDLE without leaking key material
- [ ] Error fallback UIs are styled with glass theme tokens to match the design system
- [ ] `useErrorBoundary()` hook allows function components to trigger the nearest boundary
- [ ] `onError` callback enables host applications to wire in telemetry
- [ ] All boundaries include a "Retry" mechanism for recoverable errors
