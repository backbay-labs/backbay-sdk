# RFC-01: Fix Silent Build Failures

**Priority:** Critical
**Effort:** Small (1 session)
**Packages affected:** `@backbay/glia`, `@backbay/witness-react`, root workspace

## Problem

Three packages suppress TypeScript errors at build time using `|| true`, which means broken types ship to npm consumers silently. Any type error introduced is invisible until a downstream consumer hits it at their own compile time.

### Offending scripts

**`packages/glia/package.json:95`**
```json
"build": "bunx tsc || true; bunx tailwindcss -c tailwind.config.js -i src/styles/globals.css -o dist/styles.css --minify"
```

**`packages/witness-react/package.json:22`**
```json
"build": "tsc || true"
```

**`package.json:25`** (root, less critical)
```json
"prepare": "husky || true"
```

### Why this is dangerous

The root `build:ts` script (`package.json:15`) runs all packages sequentially:

```json
"build:ts": "for pkg in packages/contract packages/api-client packages/speakeasy packages/glia packages/notary packages/witness packages/witness-react; do echo \"Building $pkg\" && cd $pkg && bun run build && cd ../..; done"
```

Because glia and witness-react swallow errors, this loop always succeeds even when types are broken. CI runs `bun run build` as a pipeline step (`.github/workflows/ci.yml:38`) and it will pass regardless.

### Compounding factor: `noEmitOnError: false`

Both glia and witness-react set `"noEmitOnError": false` in their tsconfig, so TypeScript emits `.d.ts` files even with errors. This means:

- **glia** (`packages/glia/tsconfig.json:22`): `"noEmitOnError": false`
- **witness-react** (`packages/witness-react/tsconfig.json:19`): `"noEmitOnError": false`
- **witness** (`packages/witness/tsconfig.json:17`): also `"noEmitOnError": false`

Broken declaration files get published to npm.

### Additional tsconfig laxity in witness-react

```json
"strict": false,
"noImplicitAny": false
```

This package has the weakest type checking of any TS package in the workspace.

## Known Type Errors to Fix

### 1. framer-motion `Transition` / `ease` typing (glia)

The `MotionConfig` type defined in `packages/glia/src/theme/types.ts:101-104` uses:

```ts
export interface MotionConfig {
  duration: number;
  ease: string | number[];
}
```

This `MotionConfig` is used as a framer-motion `transition` prop in several places, but framer-motion's `Transition` type expects `ease` to be one of its specific `Easing` union members (e.g. `"easeOut"`, `"easeInOut"`, or a `[number, number, number, number]` cubic bezier tuple), not a generic `string | number[]`.

**Affected files:**

- **`packages/glia/src/primitives/organisms/Glass/GlassPanel.tsx:106,214`** -- `motionTokens.normal` and `motionTokens.fast` passed directly to `<motion.div transition={...}>` and `whileHover={{ transition: motionTokens.fast }}`
- **`packages/glia/src/components/ClusterHero/HeroContent.tsx:19-22`** -- `fadeUpTransition` uses `ease: [0.22, 1, 0.36, 1]` (correctly typed as a raw array, but spread into `transition` alongside `delay` via `{ ...fadeUpTransition, delay }`)
- **`packages/glia/src/components/ClusterHero/ClusterRail.tsx:18-19`** -- identical `fadeUpTransition` pattern with `ease: [0.22, 1, 0.36, 1]`
- **`packages/glia/src/components/ClusterHero/BriefingPanel.tsx:25`** -- correctly narrows with `as [number, number, number, number]` cast
- **`packages/glia/src/components/ClusterHero/ScrollIndicator.tsx:33`** -- `ease: "easeInOut"` (string literal, compatible with framer-motion)
- **`packages/glia/src/primitives/atoms/VoiceCaptions/VoiceCaptions.tsx:279,337-344`** -- multiple `transition` objects with `ease: "easeOut"` (string literals, likely compatible)

**Root cause:** The `MotionConfig.ease` type is `string | number[]` which is wider than framer-motion's `Easing` type. When `motionTokens.fast` or `motionTokens.normal` (typed as `MotionConfig`) is passed as a `Transition`, TypeScript will reject the `ease` field because `string` is not assignable to framer-motion's constrained `Easing` union.

### 2. `motion[Component]` dynamic tag (glia)

**`packages/glia/src/primitives/organisms/Glass/GlassPanel.tsx:192`**
```ts
const MotionComponent = motion[Component];
```

Where `Component` is typed as `"div" | "section" | "article" | "aside" | "nav"`. This dynamic index into `motion` may produce type errors depending on the framer-motion version, since `motion` as an indexable type has changed across versions.

### 3. witness-react strict mode violations

With `strict: false` and `noImplicitAny: false`, witness-react likely has implicit `any` types throughout. Enabling strict mode will surface these.

## Proposed Solution

### Step 1: Remove `|| true` from build scripts

```diff
# packages/glia/package.json
- "build": "bunx tsc || true; bunx tailwindcss ..."
+ "build": "bunx tsc && bunx tailwindcss ..."

# packages/witness-react/package.json
- "build": "tsc || true"
+ "build": "tsc"
```

Note: glia's build also changes `;` to `&&` so CSS extraction only runs if TypeScript succeeds.

### Step 2: Fix framer-motion type errors

**Option A (preferred): Narrow `MotionConfig.ease` type**

In `packages/glia/src/theme/types.ts`:
```ts
// Replace generic string with framer-motion's Easing type
type CubicBezier = [number, number, number, number];
type EaseName = "linear" | "easeIn" | "easeOut" | "easeInOut"
  | "circIn" | "circOut" | "circInOut"
  | "backIn" | "backOut" | "backInOut"
  | "anticipate";

export interface MotionConfig {
  duration: number;
  ease: EaseName | CubicBezier;
}
```

This makes `MotionConfig` directly assignable to framer-motion's `Transition` without casts.

**Option B (quick fix): Cast at usage sites**

```ts
transition={motionTokens.fast as import("framer-motion").Transition}
```

This is less safe but unblocks the build immediately.

### Step 3: Fix `motion[Component]` dynamic access

```ts
// Instead of:
const MotionComponent = motion[Component];

// Use motion.create():
const MotionComponent = motion.create(Component);
// Or use a lookup object:
const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  aside: motion.aside,
  nav: motion.nav,
} as const;
const MotionComponent = motionTags[Component];
```

### Step 4: Enable strict mode in witness-react

In `packages/witness-react/tsconfig.json`:
```diff
- "strict": false,
+ "strict": true,
- "noImplicitAny": false
```

Fix any resulting type errors (likely small -- the package has a single entry point).

### Step 5: Set `noEmitOnError: true`

In all three tsconfigs (glia, witness, witness-react):
```diff
- "noEmitOnError": false
+ "noEmitOnError": true
```

### Step 6: Add `typecheck` script to packages missing it

Currently, these packages lack a `typecheck` script:

| Package | Has `typecheck`? | Has `build`? |
|---------|-----------------|-------------|
| `contract` | Yes | `tsc -p tsconfig.json` |
| `api-client` | Yes | `tsc -p tsconfig.json` |
| `speakeasy` | Yes | `tsc` |
| `glia` | Yes | `bunx tsc \|\| true; ...` |
| `notary` | Yes | `bun build ... && bunx tsc --emitDeclarationOnly` |
| `witness` | No | `tsc` |
| `witness-react` | No | `tsc \|\| true` |

Add to witness and witness-react:
```json
"typecheck": "tsc --noEmit"
```

### Step 7: Make CI typecheck cover all packages

The current CI typecheck (`package.json:16`) excludes glia and notary:

```json
"typecheck": "tsc --build packages/contract/tsconfig.json packages/api-client/tsconfig.json packages/speakeasy/tsconfig.json packages/witness/tsconfig.json packages/witness-react/tsconfig.json"
```

After fixing the type errors, add glia:
```json
"typecheck": "tsc --build packages/contract/tsconfig.json packages/api-client/tsconfig.json packages/speakeasy/tsconfig.json packages/glia/tsconfig.json packages/witness/tsconfig.json packages/witness-react/tsconfig.json"
```

Or switch to the existing `typecheck:all`:
```json
"typecheck:all": "tsc --build packages/*/tsconfig.json"
```

## Acceptance Criteria

- [ ] `|| true` removed from all build scripts
- [ ] `noEmitOnError: true` in all package tsconfigs
- [ ] `bun run build` fails on type errors
- [ ] All current type errors are resolved (no `as any` escapes)
- [ ] `typecheck` script exists in every TS package
- [ ] CI `typecheck` step covers all packages including glia
- [ ] CI blocks PRs on type errors

## Risk

Low. The `skipLibCheck: true` already present in glia and witness-react tsconfigs means third-party `.d.ts` issues (e.g., framer-motion's own transitive types) won't block the build. Only errors in first-party source code will surface.
