# Backbay SDK Roadmap

The Backbay SDK is a monorepo containing 7 TypeScript packages (`@backbay/glia`, `@backbay/contract`, `@backbay/api-client`, `@backbay/speakeasy`, `@backbay/notary`, `@backbay/witness`, `@backbay/witness-react`) plus a Cairo/Dojo gameworld package. The `glia` package is the largest (~441 source files) and serves as the primary UI and interaction layer, containing a glass-themed component library, a desktop OS shell, 3D components (Three.js / React Three Fiber), peer-to-peer messaging (Speakeasy), emotion and cognition AI agent systems, and more. This roadmap identifies the most impactful improvements to the SDK's reliability, architecture, and developer experience, organized into 10 proposals.

---

## Current State Summary

| Area | Status |
|------|--------|
| **Build** | tsc-only compilation. Some packages use `\|\| true` to silence TypeScript errors, masking real failures. |
| **Testing** | ~20 test files covering speakeasy, emotion, cognition, and audio modules only. Zero tests on components, desktop shell, themes, or hooks. Root test script reads "No tests configured yet." |
| **Architecture** | `glia` is a mega-package doing the job of 5+ packages. Speakeasy code is duplicated between the standalone `@backbay/speakeasy` package and `glia/src/speakeasy/`. |
| **Theming** | Two separate theme systems (`UiThemeProvider` vs `DesktopOSProvider`) with inconsistent CSS variable naming (`--theme-*` vs `--bb-*`). |
| **State** | 16 React contexts. Module-level singleton Zustand stores (breaks SSR and complicates testing). |
| **Safety** | Zero error boundaries anywhere in the component tree. Build silences type errors. |
| **Accessibility** | Minimal -- reduced transparency support only. No systematic ARIA audit or keyboard navigation coverage. |
| **Documentation** | Sparse READMEs, no changelogs, no generated API docs. |

---

## Priority Matrix

| # | Proposal | Effort | Impact | Category |
|---|---------|--------|--------|----------|
| 1 | [Fix Silent Build Failures](./01-fix-silent-builds.md) | Small | Critical | Build Safety |
| 2 | [Add Real Test Suite](./02-test-suite.md) | Large | Critical | Testing |
| 3 | [Split glia Mega-Package](./03-split-glia.md) | Large | High | Architecture |
| 4 | [Unify Theme Systems](./04-unify-themes.md) | Medium | High | Design System |
| 5 | [Add Error Boundaries](./05-error-boundaries.md) | Small | High | Resilience |
| 6 | [Modernize Build Pipeline](./06-build-pipeline.md) | Medium | Medium | DX |
| 7 | [State Management Cleanup](./07-state-management.md) | Medium | Medium | Architecture |
| 8 | [Speakeasy Security Hardening](./08-speakeasy-security.md) | Medium | High | Security |
| 9 | [Accessibility Audit](./09-accessibility.md) | Medium | High | A11y |
| 10 | [Documentation & Onboarding](./10-documentation.md) | Medium | Medium | DX |

---

## Recommended Execution Order

### Phase 1 -- Stop the Bleeding

> Goal: Ensure the build tells the truth and failures are caught early.

1. **#1 Fix Silent Build Failures** -- Remove `|| true` from build scripts so TypeScript errors surface immediately. Small change, massive safety improvement.
2. **#5 Add Error Boundaries** -- Wrap key component subtrees with error boundaries so runtime failures are contained rather than crashing the entire application.
3. **#2 Start Test Suite** -- Establish the testing framework, add tests for the most critical paths first (Speakeasy auth, theme tokens, desktop window management), then expand coverage incrementally.

### Phase 2 -- Architecture

> Goal: Untangle the mega-package and reconcile the two theme systems.

4. **#3 Split glia Mega-Package** + **#4 Unify Theme Systems** -- These two proposals should be executed together. Splitting glia into focused packages is the right time to consolidate the dual theme systems into a single coherent design token architecture.

### Phase 3 -- Hardening

> Goal: Secure P2P communication, clean up state management, and improve accessibility.

5. **#8 Speakeasy Security Hardening** -- The P2P messaging layer handles authentication and encrypted channels with zero test coverage today. Harden the protocol, add integration tests, and audit key exchange flows.
6. **#7 State Management Cleanup** -- Replace module-level singleton Zustand stores with provider-scoped instances. Eliminate redundant React contexts. Restore SSR compatibility.
7. **#9 Accessibility Audit** -- Systematic ARIA audit across all components, keyboard navigation for the desktop shell, screen reader testing, and focus management for dialogs and modals.

### Phase 4 -- Polish

> Goal: Improve developer experience and long-term maintainability.

8. **#6 Modernize Build Pipeline** -- Move from bare tsc to a proper bundler (tsup or Vite library mode), add declaration maps, tree-shaking validation, and bundle size tracking.
9. **#10 Documentation & Onboarding** -- Generate API docs from TSDoc comments, write a contributor guide, add changelogs, and create a getting-started tutorial.

---

## Completed Work

Significant component and infrastructure work has already been completed across four tiers of development:

### Tier 1 -- Core Primitives
~2,610 lines of source code, 13 components, 9 Storybook stories.

- **Form Controls:** GlassCheckbox, GlassRadioGroup, GlassSlider, FormField
- **Layout:** GlassAccordion, GlassSidebar, GlassResizable, GlassTable
- **Feedback:** GlassProgressBar

### Tier 2 -- Desktop OS Shell
~5,600 lines of source code, 7 components, 5 Zustand stores, 5 Storybook story files.

- **Shell Components:** StartMenu, GlassMenubar, SystemTray
- **Notifications:** NotificationCenter + Toast system
- **File System:** FileBrowser with virtual file system store

### Tier 3 -- Theming & Visual Polish
~2,100 lines of source code, 6 source files, 4 Storybook story files.

- **Accessibility:** Reduced Transparency preference support
- **Visual Effects:** NoiseOverlay texture system
- **Theme Infrastructure:** Theme Bridge (UiTheme <-> DesktopOSTheme), Glass Materials system, GlassPanel integration

### Tier 4 -- AI / Agent Components
~1,829 lines of source code, 7 components, 4 Storybook story files.

- **Streaming:** StreamingText with token-by-token rendering
- **Code:** CodeBlock with syntax highlighting
- **Tool Use:** ToolCallCard, ToolCallList
- **Chat:** ChatBubble, MessageThread, ChatInput

### Storybook Coverage
~87 story files across the component library, with coverage for primitives, desktop shell, theme variations, and AI/agent components. Notable gap: zero stories for the Speakeasy P2P messaging system.

---

## Individual Proposals

| # | Document | Summary |
|---|----------|---------|
| 1 | [01-fix-silent-builds.md](./01-fix-silent-builds.md) | Remove `\|\| true` from build scripts, fix underlying type errors, gate CI on clean builds. |
| 2 | [02-test-suite.md](./02-test-suite.md) | Stand up Vitest, add component tests (Testing Library), integration tests for stores/hooks, and visual regression tests. |
| 3 | [03-split-glia.md](./03-split-glia.md) | Break the 441-file glia package into focused packages (primitives, desktop, three, speakeasy, agents). |
| 4 | [04-unify-themes.md](./04-unify-themes.md) | Merge UiThemeProvider and DesktopOSProvider into a single token-based theme system with consistent CSS variable naming. |
| 5 | [05-error-boundaries.md](./05-error-boundaries.md) | Add error boundaries at shell, window, panel, and widget levels with graceful fallback UIs. |
| 6 | [06-build-pipeline.md](./06-build-pipeline.md) | Replace bare tsc with tsup/Vite library mode, add declaration maps, tree-shaking, and bundle analysis. |
| 7 | [07-state-management.md](./07-state-management.md) | Scope Zustand stores to providers, reduce the 16 React contexts, and restore SSR compatibility. |
| 8 | [08-speakeasy-security.md](./08-speakeasy-security.md) | Audit key exchange, add integration tests for auth flows, deduplicate code between glia and standalone package. |
| 9 | [09-accessibility.md](./09-accessibility.md) | ARIA audit, keyboard navigation for desktop shell, focus management, screen reader testing, WCAG 2.1 AA compliance. |
| 10 | [10-documentation.md](./10-documentation.md) | TSDoc-based API docs, contributor guide, changelogs, getting-started tutorial, architecture diagrams. |
