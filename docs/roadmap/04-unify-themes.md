# RFC-04: Unify the Two Theme Systems

**Status:** Proposed
**Effort:** Medium (2 sessions)
**Priority:** High
**Depends on:** Informational overlap with RFC-03 (package split)

## Problem

There are **two separate theme providers** that partially overlap, each injecting
CSS variables into the same document root with different naming conventions.

### Theme System 1: UiThemeProvider

**Location:** `packages/glia/src/theme/UiThemeProvider.tsx:33`

Provides token hooks consumed by glass primitives (atoms, molecules, organisms):

| Hook | Returns | Source |
|------|---------|--------|
| `useGlassTokens()` | `UiGlassTokens` | `theme.glass` |
| `useColorTokens()` | `UiColorTokens` | `theme.color` |
| `useElevationTokens()` | `UiElevationTokens` | `theme.elevation` |
| `useMotionTokens()` | `UiMotionTokens` | `theme.motion` |
| `useControlTokens()` | `UiControlTokens` | `theme.controls` |
| `useAmbientTokens()` | `UiAmbientTokens` | `theme.ambient` |

CSS variable prefix: **`--theme-*`** (defined in `src/theme/types.ts:228-276`)

Example variables:
```
--theme-bg-body, --theme-bg-panel, --theme-accent-primary
--theme-glass-panel-bg, --theme-glass-panel-blur
--theme-shadow-soft, --theme-shadow-modal
--theme-switch-track-on, --theme-button-glow-hover-bg
```

Additionally injects **Tailwind semantic variables** with no prefix:
```
--background, --foreground, --primary, --secondary, --accent
--muted, --border, --ring, --destructive
--cyan-neon, --magenta-neon, --emerald-neon, --violet-neon
```

Two built-in themes: `nebula` (clinical cyberpunk) and `solarpunk`
(botanical observatory), registered in `src/theme/registry.ts:16-19`.

### Theme System 2: DesktopOS ThemeProvider

**Location:** `packages/glia/src/desktop/providers/ThemeProvider.tsx:90`

Wraps the desktop shell (windows, taskbar, menus) with a separate type:

```typescript
// src/desktop/themes/types.ts:14
interface DesktopOSTheme {
  colors: { windowBg, windowBorder, accent, taskbarBg, ... }  // 23 color tokens
  fonts:  { display, body, mono }
  radii:  { window, button, menu, input }
  shadows: { window, windowFocused, menu, tooltip }
  spacing: { windowPadding, taskbarHeight, iconSize, ... }
  animation: { duration: { fast, normal, slow }, easing: { default, spring, bounce } }
  blur:   { backdrop }
}
```

CSS variable prefix: **`--bb-*`** (generated in `src/desktop/themes/types.ts:158-200`)

Example variables:
```
--bb-color-window-bg, --bb-color-accent, --bb-color-taskbar-bg
--bb-font-display, --bb-font-mono
--bb-radius-window, --bb-radius-button
--bb-shadow-window, --bb-shadow-window-focused
--bb-spacing-taskbar-height, --bb-spacing-icon-size
--bb-duration-fast, --bb-easing-default
--bb-blur-backdrop
```

### The Bridge Attempt

A `desktopThemeFromUiTheme()` function exists at `src/theme/bridge.ts:97` that
maps UiTheme tokens to DesktopOSTheme tokens. This is a **one-way** bridge:

```typescript
// src/theme/bridge.ts:104-131
const colors: DesktopOSTheme['colors'] = {
  windowBg: uiTheme.color.bg.panel,
  accent: uiTheme.color.accent.primary,
  taskbarBg: uiTheme.glass.panelBg,
  // ... 23 more mappings
};
```

The bridge works but is manual, fragile, and creates a third conceptual layer
that developers must understand.

### The Symptoms

- **596 CSS variable references** across 29 files use `--bb-*` and `--theme-*`
  interchangeably
- **Unscopd Tailwind variables** (`--background`, `--foreground`, etc.) collide
  with any other Tailwind-based library on the page
- Components in `src/desktop/components/` reference `--bb-color-accent` while
  components in `src/primitives/` reference `--theme-accent-primary` -- these
  are the same value from different systems
- Consumer must nest two providers:
  ```tsx
  <UiThemeProvider>
    <DesktopOSProvider theme={desktopThemeFromUiTheme(nebulaTheme)}>
      <App />
    </DesktopOSProvider>
  </UiThemeProvider>
  ```

## Token Overlap Analysis

| Concept | UiTheme Token | DesktopOSTheme Token | Same Value? |
|---------|--------------|---------------------|-------------|
| Primary accent | `color.accent.primary` | `colors.accent` | Yes (via bridge) |
| Panel background | `color.bg.panel` | `colors.windowBg` | Yes (via bridge) |
| Body background | `color.bg.body` | `colors.desktopBg` | Yes (via bridge) |
| Primary text | `color.text.primary` | `colors.textPrimary` | Yes (via bridge) |
| Muted text | `color.text.muted` | `colors.textSecondary` | Yes (via bridge) |
| Destructive | `color.accent.destructive` | `colors.destructive` | Yes (via bridge) |
| Blur | `glass.panelBlur` | `blur.backdrop` | Wrapped in `blur()` |
| Panel shadow | `elevation.hudPanel` | `shadows.window` | Yes (via bridge) |
| Modal shadow | `elevation.modal` | `shadows.windowFocused` | Yes (via bridge) |
| Fonts | *not defined* | `fonts.display/body/mono` | N/A -- UiTheme has no font tokens |
| Radii | *not defined* | `radii.window/button/menu/input` | N/A |
| Spacing | *not defined* | `spacing.taskbarHeight/iconSize/...` | N/A |

**DesktopOSTheme adds** font families, border radii, spacing, and animation
durations/easings that UiTheme does not have. These are desktop-specific tokens.

## Proposed Solution

### Step 1: Extend UiTheme with Missing Token Groups

Add `fonts`, `radii`, and `spacing` to the `UiTheme` interface so it becomes
the single source of truth:

```typescript
// Proposed additions to src/theme/types.ts
export interface UiTheme {
  // ... existing: color, glass, elevation, motion, ambient, controls

  /** Font families */
  fonts: {
    display: string;
    body: string;
    mono: string;
  };

  /** Border radii */
  radii: {
    sm: string;   // inputs, buttons
    md: string;   // menus, cards
    lg: string;   // windows, modals
  };

  /** Spacing scale */
  spacing: {
    taskbarHeight: string;
    titlebarHeight: string;
    windowPadding: string;
    iconSize: string;
    iconGap: string;
    windowBorderWidth: string;
  };
}
```

### Step 2: Standardize CSS Variable Naming

Replace all three naming conventions with a single `--glia-*` prefix:

| Category | Old Variable(s) | New Variable |
|----------|----------------|--------------|
| Color | `--theme-accent-primary`, `--bb-color-accent` | `--glia-color-accent` |
| Glass | `--theme-glass-panel-bg` | `--glia-glass-panel-bg` |
| Shadow | `--theme-shadow-modal`, `--bb-shadow-window-focused` | `--glia-shadow-modal` |
| Font | `--bb-font-display` | `--glia-font-display` |
| Radius | `--bb-radius-window` | `--glia-radius-lg` |
| Spacing | `--bb-spacing-taskbar-height` | `--glia-spacing-taskbar` |
| Duration | `--bb-duration-fast` | `--glia-duration-fast` |
| Easing | `--bb-easing-default` | `--glia-easing-default` |
| Blur | `--bb-blur-backdrop` | `--glia-blur-backdrop` |
| Tailwind | `--background`, `--foreground` | `--glia-tw-background`, `--glia-tw-foreground` |

### Step 3: Single Provider

```tsx
// Proposed: replaces both UiThemeProvider and desktop ThemeProvider
export function GliaThemeProvider({
  children,
  themeId = 'nebula',
  overrides,
}: GliaThemeProviderProps) {
  const theme = getTheme(themeId, overrides);

  // Injects ALL CSS variables (--glia-*)
  useIsomorphicLayoutEffect(() => {
    applyGliaCssVariables(theme);
  }, [theme]);

  // Provides token hooks (useGlassTokens, useColorTokens, etc.)
  return (
    <GliaThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </GliaThemeContext.Provider>
  );
}
```

Consumer experience simplifies to:

```tsx
// Before (two providers + bridge)
<UiThemeProvider>
  <DesktopOSProvider theme={desktopThemeFromUiTheme(nebulaTheme)}>
    <App />
  </DesktopOSProvider>
</UiThemeProvider>

// After (one provider)
<GliaThemeProvider themeId="nebula">
  <DesktopOSProvider>
    <App />
  </DesktopOSProvider>
</GliaThemeProvider>
```

### Step 4: Migration Path

1. `bridge.ts` continues to work during the transition -- components using old
   variable names keep working via a compatibility layer
2. Add a `--glia-*` alias layer that maps old names to new:
   ```css
   :root {
     --theme-accent-primary: var(--glia-color-accent);
     --bb-color-accent: var(--glia-color-accent);
   }
   ```
3. Codemod to update component files from old variables to new
4. Remove compatibility layer once all components are migrated

### Tailwind Integration

Update `tailwind.config.js` to reference `--glia-*` variables:

```js
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--glia-tw-background))',
      foreground: 'hsl(var(--glia-tw-foreground))',
      primary: { DEFAULT: 'hsl(var(--glia-tw-primary))' },
      // ...
    }
  }
}
```

## Acceptance Criteria

- [ ] Single `GliaThemeProvider` replaces both `UiThemeProvider` and desktop
      `ThemeProvider`
- [ ] All CSS variables use `--glia-*` prefix consistently
- [ ] All 6 token hooks (`useGlassTokens`, `useColorTokens`,
      `useElevationTokens`, `useMotionTokens`, `useControlTokens`,
      `useAmbientTokens`) still work unchanged
- [ ] Desktop shell components render identically with the unified provider
- [ ] No Tailwind variables leak without a `--glia-` prefix
- [ ] `desktopThemeFromUiTheme` bridge is deprecated with a clear removal
      timeline
- [ ] Storybook stories for both primitives and desktop work with the unified
      provider
