# ADR-001: Two-Tier Styling System

## Status

Accepted

## Context

The `@backbay/glia` component library needed to serve two audiences:

1. **Standard UI controls** -- forms, dialogs, dropdowns, tabs -- where accessibility, keyboard navigation, and composability are paramount.
2. **Branded "glass" components** -- frosted-glass panels, glowing buttons, atmospheric effects -- that define the Backbay visual identity and require fine-grained animation control.

Using a single styling approach for both was impractical. A utility-first approach (Tailwind) excels at composing standard UI quickly but struggles with complex stateful animations and theme-token-driven visual effects. Conversely, a variant-driven approach (cva + framer-motion) is ideal for coordinating animation states and theme tokens but adds unnecessary complexity for simple form controls.

## Decision

We adopted a two-tier styling architecture within glia:

**Tier 1: `src/primitives/ui/`** -- Radix UI primitives wrapped with `cn()` (clsx + tailwind-merge) and Tailwind utility classes. These components (Button, Input, Dialog, Select, Tabs, etc.) follow shadcn/ui conventions: minimal, accessible, composable. They use Tailwind's design tokens and can be restyled via className props.

**Tier 2: `src/primitives/atoms/`, `molecules/`, `organisms/`** -- Glass-themed components built with `cva` (class-variance-authority) for variant definitions, `framer-motion` for animations, and inline CSS variables from theme token hooks (`useGlassTokens()`, `useColorTokens()`, `useMotionTokens()`, etc.). These components (GlassPanel, GlowButton, CommandPalette, ChatBubble, etc.) consume `--theme-*` CSS variables and produce the distinctive Backbay glass aesthetic.

The tiers share a common Tailwind config but diverge in how styling is applied:

| Aspect | Tier 1 (UI) | Tier 2 (Glass) |
|--------|-------------|----------------|
| Base | Radix primitives | Custom React components |
| Styling | `cn()` + Tailwind | `cva` + CSS variables |
| Animation | CSS transitions | framer-motion |
| Theming | Tailwind tokens | Theme hook tokens |
| Customization | className prop | Variant props + theme context |

## Consequences

**Easier:**
- Standard UI development follows well-known shadcn patterns.
- Glass components have full control over animation choreography.
- Teams can contribute to Tier 1 without understanding the glass theme system.
- Tree-shaking: consumers can import `@backbay/glia/primitives` without pulling in framer-motion if they only need Tier 1.

**Harder:**
- Two mental models for "how do I style this component?"
- Some token overlap between Tailwind config and CSS variable theme tokens (e.g., color values defined in both places).
- Bridging the tiers requires a theme bridge to synchronize Tailwind's CSS variables with the glass theme's CSS variables (addressed in ADR-002).
- New contributors must understand which tier a component belongs to before modifying it.
