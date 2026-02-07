# ADR-002: Dual Theme Systems (UiTheme + DesktopOSTheme)

## Status

Accepted

## Context

The Backbay platform has two distinct theming needs:

1. **UI primitives theming** -- Standard design tokens (colors, radii, spacing, typography) consumed by Tier 1 components (see ADR-001). This is `UiTheme`, provided by `UiThemeProvider`. It sets CSS variables like `--radius`, `--primary`, `--background` that Tailwind components reference.

2. **Desktop OS shell theming** -- A separate set of tokens controlling the glass material system, window chrome appearance, taskbar styling, and ambient atmosphere effects. This is `DesktopOSTheme`, consumed by desktop-shell organisms (WindowManager, Taskbar, StartMenu, etc.). It controls variables like `--glass-blur`, `--glass-opacity`, `--accent-glow`, and the glass material presets (frosted, clear, tinted).

These two systems evolved independently:
- `UiTheme` was built first for the standard component library.
- `DesktopOSTheme` was added later when the desktop-OS shell was developed.

The overlap is significant -- both define accent colors, background colors, and border radii -- but they use different CSS variable naming conventions and different React context shapes.

## Decision

We maintain both theme systems and bridge them via a `ThemeBridge` component:

- **`UiThemeProvider`** remains the source of truth for Tier 1 design tokens. It outputs `--bb-*` CSS variables consumed by Tailwind components.
- **`DesktopOSTheme`** remains the source of truth for glass material and desktop shell tokens. It outputs `--theme-*` and `--glass-*` CSS variables consumed by Tier 2 components.
- **`ThemeBridge`** reads from both providers and synchronizes overlapping values, ensuring that when the UiTheme accent color changes, the DesktopOSTheme accent values update accordingly (and vice versa).

Theme token hooks (`useGlassTokens()`, `useColorTokens()`, `useElevationTokens()`, `useMotionTokens()`, `useControlTokens()`, `useAmbientTokens()`) provide typed access to the computed theme values, abstracting away which system is the underlying source.

## Consequences

**Easier:**
- Each system can evolve independently without breaking the other.
- Desktop shell developers work with semantically meaningful tokens (`--glass-blur`) rather than generic design tokens.
- The bridge pattern allows progressive migration toward a unified system.
- Accessibility features (reduced transparency, reduced motion) can be applied at the bridge level, affecting both systems.

**Harder:**
- CSS variable namespace collision risk: `--theme-*`, `--bb-*`, and some unscoped names coexist.
- Debugging requires understanding which provider is the source for a given variable.
- The bridge adds a rendering layer and potential for stale synchronization.
- New contributors may be confused about which theme system to use for a given component.

**Future:** RFC-04 proposes unifying both systems under a single `GliaThemeProvider` with `--glia-*` CSS variables, eliminating the need for the bridge.
