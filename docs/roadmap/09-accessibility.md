# RFC-09: Accessibility Audit and Fixes

**Priority:** High
**Effort:** Medium (2 sessions)
**Packages affected:** `@backbay/glia`

## Problem

Accessibility support in the glia component library is minimal. The only dedicated a11y work is the `prefers-reduced-transparency` and `prefers-reduced-motion` media query hooks in `packages/glia/src/lib/accessibility.ts` (95 lines) with a demo story at `packages/glia/src/lib/accessibility.stories.tsx`. The broader component surface -- 441 source files, ~87 story files, 13+ glass primitives, a full desktop OS shell, and AI/agent chat components -- has received no systematic accessibility audit.

### Current A11y State by Component Category

#### Glass Form Controls -- Partial

The Tier 1 glass primitives inherit some a11y from their Radix UI foundations, but coverage is inconsistent:

- **GlassCheckbox** (`src/primitives/atoms/GlassCheckbox/GlassCheckbox.tsx:130-136`): Has `aria-describedby` (conditionally linking description and error IDs), `aria-invalid` on error state, proper `htmlFor`/`id` linkage between label and control. This is the best-instrumented component.
- **GlassRadioGroup** (`src/primitives/atoms/GlassRadioGroup/GlassRadioGroup.tsx:137-138`): Has `aria-describedby` and `aria-invalid` on the group root. Individual `GlassRadioGroupItem` components have proper `htmlFor`/`id` linkage. Reasonable baseline.
- **GlassSlider** (`src/primitives/atoms/GlassSlider/GlassSlider.tsx:126-244`): No `aria-label`, no `aria-valuetext`, no `aria-describedby`. The `label` prop renders a visual `<span>` but is not programmatically linked to the slider via `aria-labelledby`. Radix's `Slider.Root` provides some built-in ARIA, but the custom label is disconnected.
- **GlassAccordion**: Not found at the expected molecule path. Likely exists elsewhere or needs verification.
- **GlassProgressBar**: No source inspected, but progress bars commonly lack `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `role="progressbar"`.
- **FormField**: Wrapper component -- a11y depends on what it wraps.

#### Desktop Shell -- Minimal

- **Window** (`src/desktop/components/window/Window.tsx`): Zero `aria-*` attributes or `role` attributes anywhere in the 661-line component. No `role="dialog"` or `role="application"`. No focus trapping -- clicking outside a window does not trap focus back. Keyboard shortcut handling exists only for fullscreen toggle (`Cmd+Shift+F`, `Escape`). No `aria-label` on the window frame.
- **Taskbar** (`src/desktop/components/shell/Taskbar.tsx`): Zero `aria-*` or `role` attributes found. No `role="toolbar"` or `role="navigation"`.
- **StartMenu** (`src/desktop/components/shell/StartMenu.tsx`): Has `aria-label="Start menu"` on the menu container, `aria-label="Search apps"` on the search input, and `aria-selected` on highlighted items (lines 403, 420, 524). Best a11y in the desktop shell, but still lacks `role="menu"` / `role="menuitem"` semantics and keyboard arrow navigation is unverified.
- **SystemTray** (`src/desktop/components/shell/SystemTray.tsx`): Not inspected in detail but based on the pattern, likely zero ARIA attributes.
- **No Alt+Tab / Cmd+Tab window switching** exists. No focus management between windows.

#### Chat / AI Components -- Minimal

- **ChatInput** (`src/primitives/organisms/ChatThread/ChatInput.tsx:175`): Has `aria-label="Send message"` on the submit button. The `<textarea>` has no `aria-label` (relies on `placeholder` which is not a reliable accessible label).
- **MessageThread** (`src/primitives/organisms/ChatThread/MessageThread.tsx`): No `role="log"`, no `aria-live="polite"` for new message announcements. No `aria-label` on the scroll container. Screen readers will not know this is a chat message list.
- **ChatBubble**: Not inspected but likely lacks `role="listitem"` or equivalent.
- **StreamingText**, **CodeBlock**, **ToolCallCard**: Not inspected for ARIA.

#### CommandPalette -- Keyboard-Driven but Incomplete

- **CommandPalette** (`src/primitives/organisms/CommandPalette/CommandPalette.tsx`): Built on `cmdk` which provides built-in keyboard navigation (arrow keys, enter to select). Has `Cmd+K` to open and `Escape` to close. However: no `aria-modal="true"` on the dialog, no focus trapping (clicking the backdrop closes, but tab key can escape to background), and no `role="dialog"` on the palette wrapper.

### Systematic Gaps

1. **No `eslint-plugin-jsx-a11y`** configured -- there is no linting for accessibility violations. Grep for `jsx-a11y` across all config files returns zero results.
2. **No `@storybook/addon-a11y`** -- Storybook has no accessibility panel for interactive auditing during development.
3. **No `@axe-core/react`** -- no runtime dev-mode accessibility warnings.
4. **No keyboard navigation** in the desktop window system -- no Alt+Tab/Cmd+Tab window switching, no arrow key navigation in taskbar, no focus trapping in modal windows or dialogs.
5. **`prefers-reduced-motion`** is respected in individual components (GlassCheckbox, GlassSlider, GlassRadioGroup, CommandPalette all check `prefersReducedMotion()`) but **not** in framer-motion's `MotionConfig` at the provider level. Each component independently checks -- there is no global motion reduction.
6. **No `prefers-color-scheme`** support -- no automatic dark/light mode switching.
7. **No `prefers-contrast`** support -- no high contrast mode.
8. **No screen reader testing** has been performed.
9. **No focus-visible styling** is applied consistently -- some components use Tailwind's `focus-visible:ring-2` (GlassCheckbox, GlassSlider) but desktop shell components have no focus indicators at all.

## Proposed Solution

### 1. Add Lint-Time A11y Checking

Install and configure `eslint-plugin-jsx-a11y`:

```bash
bun add -D eslint-plugin-jsx-a11y
```

Add to glia's ESLint config (recommended ruleset at minimum):
```js
{
  extends: ["plugin:jsx-a11y/recommended"],
  plugins: ["jsx-a11y"],
}
```

Run the lint and fix all violations. Common expected violations:
- Missing `aria-label` on icon-only buttons
- `<div onClick>` without keyboard handler or role
- Missing `alt` text on images
- Form elements without labels

### 2. Add Dev-Time Runtime Auditing

Install `@axe-core/react` for development builds:

```bash
bun add -D @axe-core/react
```

Initialize in Storybook's preview or dev mode:
```ts
if (process.env.NODE_ENV === "development") {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

### 3. Add Storybook A11y Addon

```bash
bun add -D @storybook/addon-a11y
```

Add to Storybook config. This gives every story an "Accessibility" panel showing axe-core violations inline.

### 4. Audit and Fix Top 20 Components

#### Component Audit Checklist

| # | Component | File | aria-* | Keyboard | Focus | Role | Priority |
|---|-----------|------|--------|----------|-------|------|----------|
| 1 | Window | `src/desktop/components/window/Window.tsx` | None | Partial (Esc/Cmd+Shift+F only) | None | None | Critical |
| 2 | Taskbar | `src/desktop/components/shell/Taskbar.tsx` | None | None | None | None | Critical |
| 3 | StartMenu | `src/desktop/components/shell/StartMenu.tsx` | Partial (aria-label, aria-selected) | Unknown | Unknown | Partial | High |
| 4 | SystemTray | `src/desktop/components/shell/SystemTray.tsx` | None | None | None | None | High |
| 5 | GlassSlider | `src/primitives/atoms/GlassSlider/GlassSlider.tsx` | None (Radix built-in only) | Radix built-in | Partial | Radix built-in | High |
| 6 | GlassCheckbox | `src/primitives/atoms/GlassCheckbox/GlassCheckbox.tsx` | Good | Radix built-in | Partial | Radix built-in | Low |
| 7 | GlassRadioGroup | `src/primitives/atoms/GlassRadioGroup/GlassRadioGroup.tsx` | Good | Radix built-in | Partial | Radix built-in | Low |
| 8 | GlassAccordion | (verify location) | Unknown | Radix built-in | Unknown | Radix built-in | Medium |
| 9 | GlassProgressBar | (verify location) | Unknown | N/A | N/A | Needs role | Medium |
| 10 | CommandPalette | `src/primitives/organisms/CommandPalette/CommandPalette.tsx` | None (cmdk built-in) | Good (cmdk) | No trap | None | High |
| 11 | MessageThread | `src/primitives/organisms/ChatThread/MessageThread.tsx` | None | None | None | None | High |
| 12 | ChatInput | `src/primitives/organisms/ChatThread/ChatInput.tsx` | Partial (button only) | Enter to submit | None | None | Medium |
| 13 | ChatBubble | `src/primitives/organisms/ChatThread/ChatBubble.tsx` | Unknown | N/A | N/A | None | Medium |
| 14 | StreamingText | (verify location) | Unknown | N/A | N/A | Unknown | Medium |
| 15 | CodeBlock | (verify location) | Unknown | N/A | N/A | Unknown | Low |
| 16 | ToolCallCard | (verify location) | Unknown | N/A | N/A | Unknown | Low |
| 17 | GlassMenubar | (verify location) | Unknown | Unknown | Unknown | Unknown | Medium |
| 18 | NotificationCenter | (verify location) | Unknown | Unknown | Unknown | Unknown | Medium |
| 19 | FileBrowser | (verify location) | Unknown | Unknown | Unknown | Unknown | Medium |
| 20 | GlassSidebar | (verify location) | Unknown | Unknown | Unknown | Unknown | Low |

#### Specific Fixes Required

**Window** (Critical):
- Add `role="dialog"` or a custom `role="application"` to the window frame
- Add `aria-label` with the window title
- Add focus trapping for modal windows
- Add `aria-hidden="true"` to minimized/hidden windows
- Announce window state changes (minimize/maximize/restore) via `aria-live`

**Taskbar** (Critical):
- Add `role="toolbar"` to the taskbar container
- Add `aria-label="Taskbar"` or `aria-label="Running applications"`
- Each taskbar button needs `aria-pressed` for active window state
- Keyboard navigation: arrow keys to move between taskbar buttons, Enter/Space to activate

**MessageThread** (High):
- Add `role="log"` and `aria-live="polite"` to the scroll container so screen readers announce new messages
- Add `aria-label="Message history"` to the container

**ChatInput** (Medium):
- Add `aria-label="Message input"` to the textarea (placeholder is not a reliable label)

**CommandPalette** (High):
- Add `role="dialog"` and `aria-modal="true"` to the palette wrapper
- Implement focus trapping so tab does not escape to background content

### 5. Add Keyboard Navigation

#### Desktop Window Management
```
Alt+Tab / Cmd+Tab    → Cycle focus between open windows
Escape               → Close current overlay / exit fullscreen (partially exists)
Alt+F4 / Cmd+W       → Close focused window
Arrow keys           → Navigate within menus (StartMenu, context menus)
Tab                  → Move focus between interactive elements within a window
```

Implementation approach:
- Add a `useKeyboardNavigation` hook in `src/desktop/core/` that listens for global keyboard shortcuts
- Register window focus cycling in the WindowManager store
- Wire up the Taskbar to receive focus via keyboard and support arrow key traversal

#### Menu Navigation
- StartMenu: arrow keys up/down to navigate items, Enter to select, Escape to close
- SystemTray: arrow keys left/right to navigate indicators
- GlassMenubar: standard menubar keyboard pattern (left/right between menus, up/down within)

#### Focus Trapping
- Modal dialogs (Radix Dialog wrappers in `src/primitives/ui/dialog.tsx`)
- CommandPalette when open
- Windows in "modal" mode if supported

### 6. Respect OS Media Queries

#### `prefers-reduced-motion` (Global)

Currently each component checks individually via `prefersReducedMotion()` from `src/lib/utils.ts`. Add a global approach:

```tsx
// In UiThemeProvider or a new A11yProvider:
import { MotionConfig } from "framer-motion";

function A11yMotionProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
```

This makes framer-motion globally respect the preference without per-component checks. Existing per-component checks (`shouldAnimate` pattern in GlassCheckbox, GlassSlider, GlassRadioGroup, CommandPalette) can remain as defense-in-depth but become secondary.

#### `prefers-color-scheme`

Add a hook and integrate with the existing theme system:

```ts
const colorSchemeStore = createMediaQueryStore("(prefers-color-scheme: dark)");

export function usePrefersColorScheme(): "dark" | "light" {
  const isDark = useSyncExternalStore(
    colorSchemeStore.subscribe,
    colorSchemeStore.getSnapshot,
    colorSchemeStore.getServerSnapshot
  );
  return isDark ? "dark" : "light";
}
```

Wire into `UiThemeProvider` to auto-select theme variant.

#### `prefers-contrast`

Add high contrast mode support:

```ts
const highContrastStore = createMediaQueryStore("(prefers-contrast: more)");

export function usePrefersHighContrast(): boolean {
  return useSyncExternalStore(
    highContrastStore.subscribe,
    highContrastStore.getSnapshot,
    highContrastStore.getServerSnapshot
  );
}
```

When active: increase border contrast, disable glass blur effects (similar to reduced-transparency), ensure minimum 4.5:1 contrast ratio on all text.

### 7. WCAG 2.1 AA Compliance Target

Target Level AA compliance for all interactive components:

| Criterion | Current | Target |
|-----------|---------|--------|
| 1.1.1 Non-text Content | Partial (some aria-labels) | All images/icons have text alternatives |
| 1.3.1 Info and Relationships | Poor (few semantic roles) | All components use correct ARIA roles |
| 1.4.3 Contrast | Unknown | 4.5:1 minimum for normal text, 3:1 for large |
| 1.4.11 Non-text Contrast | Unknown | 3:1 for UI component boundaries |
| 2.1.1 Keyboard | Poor | All functionality keyboard-accessible |
| 2.1.2 No Keyboard Trap | Unknown (CommandPalette may trap) | Focus always escapable |
| 2.4.3 Focus Order | Poor | Logical tab order in desktop shell |
| 2.4.7 Focus Visible | Partial | All interactive elements show focus indicator |
| 4.1.2 Name, Role, Value | Poor | All components expose correct ARIA |

## File Inventory

Files to create or modify:

| Action | File | Description |
|--------|------|-------------|
| Modify | `packages/glia/src/lib/accessibility.ts` | Add `usePrefersColorScheme`, `usePrefersHighContrast` hooks |
| Create | `packages/glia/src/desktop/core/useKeyboardNavigation.ts` | Global keyboard shortcut handler for desktop shell |
| Modify | `packages/glia/src/desktop/components/window/Window.tsx` | Add ARIA attributes, focus management |
| Modify | `packages/glia/src/desktop/components/shell/Taskbar.tsx` | Add role, aria-label, keyboard navigation |
| Modify | `packages/glia/src/desktop/components/shell/StartMenu.tsx` | Add menu roles, verify keyboard navigation |
| Modify | `packages/glia/src/desktop/components/shell/SystemTray.tsx` | Add ARIA attributes |
| Modify | `packages/glia/src/primitives/atoms/GlassSlider/GlassSlider.tsx` | Link label to slider via aria-labelledby |
| Modify | `packages/glia/src/primitives/organisms/CommandPalette/CommandPalette.tsx` | Add role="dialog", aria-modal, focus trap |
| Modify | `packages/glia/src/primitives/organisms/ChatThread/MessageThread.tsx` | Add role="log", aria-live |
| Modify | `packages/glia/src/primitives/organisms/ChatThread/ChatInput.tsx` | Add aria-label to textarea |
| Install | `eslint-plugin-jsx-a11y` | Lint-time a11y checking |
| Install | `@axe-core/react` | Dev-time runtime auditing |
| Install | `@storybook/addon-a11y` | Storybook accessibility panel |

## Acceptance Criteria

- [ ] `eslint-plugin-jsx-a11y` configured and passing in CI
- [ ] `@storybook/addon-a11y` active in Storybook
- [ ] All form controls have proper `aria-*` attributes (labels, descriptions, error states)
- [ ] Desktop shell components have semantic roles (`role="toolbar"`, `role="dialog"`, etc.)
- [ ] Keyboard navigation works throughout desktop shell (Tab, arrow keys, Escape)
- [ ] Window focus cycling via Alt+Tab or equivalent
- [ ] Focus trapping in modal dialogs and CommandPalette
- [ ] `prefers-reduced-motion` respected globally via framer-motion `MotionConfig`
- [ ] `prefers-color-scheme` hook available and wired to theme system
- [ ] `prefers-contrast` hook available
- [ ] MessageThread announces new messages to screen readers
- [ ] No axe-core critical or serious violations in top 20 components

## Risk

Low-medium. ARIA attribute additions and keyboard handlers are purely additive -- they do not change visual behavior or break existing functionality. The main risk is regression in keyboard shortcuts conflicting with browser defaults (e.g., Alt+Tab is OS-level on most platforms, so the desktop shell may need Ctrl+Tab or a custom modifier instead).
