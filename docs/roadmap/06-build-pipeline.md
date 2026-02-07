# RFC-06: Modernize Build Pipeline

**Priority:** High
**Effort:** Medium (1-2 sessions)
**Packages affected:** All 7 TypeScript packages

## Problem

The current build system is sequential, unbundled, and uncached. It has no tree-shaking, no source maps, no ESM/CJS dual output, and references tooling that isn't actually configured.

### Sequential bash loop

The root `build:ts` script (`package.json:15`) runs every package one at a time in a bash for loop:

```json
"build:ts": "for pkg in packages/contract packages/api-client packages/speakeasy packages/glia packages/notary packages/witness packages/witness-react; do echo \"Building $pkg\" && cd $pkg && bun run build && cd ../..; done"
```

This means:
- No parallelism -- each package waits for the previous to finish
- No caching -- every `bun run build` rebuilds everything, even unchanged packages
- No dependency awareness -- the order is hardcoded, not derived from `references` or workspace deps
- Shell-dependent -- relies on `cd` navigation and bash `for` syntax

### No bundler for glia (largest package)

glia is by far the largest package (441 source files, 15+ export paths) and uses raw `tsc` for compilation:

```json
"build": "bunx tsc || true; bunx tailwindcss -c tailwind.config.js -i src/styles/globals.css -o dist/styles.css --minify"
```

**Consequences:**
- **No tree-shaking** -- consumers import the entire package even if they use one component
- **No code splitting** -- all 15 entry points compile into a flat `dist/` with no optimization
- **No minification** of JS output
- **No source maps** -- `tsconfig.json` has no `"sourceMap": true`

glia's 15+ export paths (from `packages/glia/package.json:19-86`):

| Export Path | Entry Point |
|-------------|-------------|
| `.` | `dist/index.js` |
| `./core` | `dist/core.js` |
| `./protocol` | `dist/protocol/index.js` |
| `./hooks` | `dist/hooks/index.js` |
| `./speakeasy` | `dist/speakeasy/index.js` |
| `./components` | `dist/components/index.js` |
| `./workspace` | `dist/workspace/index.js` |
| `./primitives` | `dist/primitives/index.js` |
| `./theme` | `dist/theme/index.js` |
| `./emotion` | `dist/emotion/index.js` |
| `./vision` | `dist/vision/index.js` |
| `./audio` | `dist/audio/index.js` |
| `./cognition` | `dist/cognition/index.js` |
| `./desktop` | `dist/desktop/index.js` |
| `./desktop/core` | `dist/desktop/core/index.js` |
| `./desktop/themes` | `dist/desktop/themes/index.js` |
| `./styles` | `dist/styles.css` |

Each entry point should be independently tree-shakeable, but `tsc` just emits every file.

### Ghost Turborepo references

The `clean` script (`package.json:24`) references `.turbo` cache directories that don't exist:

```json
"clean": "rm -rf packages/*/dist packages/*/.turbo node_modules/.cache"
```

There is no `turbo.json`, no Turborepo dependency, and no Turbo config anywhere in the repo. This is a vestigial reference that suggests Turborepo was planned but never set up.

### Inconsistent build strategies across packages

| Package | Build Command | Strategy | Source Maps | Declaration Maps |
|---------|-------------|----------|-------------|-----------------|
| `contract` | `tsc -p tsconfig.json` | Raw tsc | No | No |
| `api-client` | `tsc -p tsconfig.json` | Raw tsc | No | No |
| `speakeasy` | `tsc` | Raw tsc | No | Yes |
| `glia` | `bunx tsc \|\| true; tailwindcss...` | Raw tsc + CSS | No | Yes |
| `notary` | `bun build src/... --outdir dist && bunx tsc --emitDeclarationOnly` | Bun bundler + tsc decls | No | Yes |
| `witness` | `tsc` | Raw tsc | Yes | Yes |
| `witness-react` | `tsc \|\| true` | Raw tsc | Yes | Yes |

Only witness and witness-react emit source maps. Only notary uses any kind of bundler (`bun build`). No package produces minified output.

### No ESM/CJS dual output

All packages are `"type": "module"` and only emit ESM. Consumers using CommonJS (Node.js scripts, older toolchains, Jest default config) cannot import these packages without additional configuration.

## Current Build Flow (step by step)

When `bun run build` is invoked:

1. Root `package.json` resolves `build` to `build:ts`
2. `build:ts` starts a bash for loop iterating over 7 hardcoded package paths
3. For each package:
   a. `cd packages/<name>`
   b. `bun run build` (runs that package's build script)
   c. `cd ../..` (return to root)
4. If any package build fails (except glia and witness-react which swallow errors), the loop exits

Total build time: sum of all individual builds, with zero parallelism.

In CI (`.github/workflows/ci.yml`):
1. `bun install --frozen-lockfile`
2. `bun run typecheck` -- checks 5 of 7 packages (excludes glia and notary)
3. `bun run lint`
4. `bun run format:check` (non-blocking)
5. `bun run build` -- runs the sequential loop above

## Proposed Solution

### Phase 1: Add Turborepo for orchestration

Turborepo is already referenced in the clean script, and it's the simplest way to get parallel, cached, dependency-aware builds.

**Install:**
```bash
bun add -D turbo
```

**Create `turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "tsconfig.json", "package.json"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

**Update root scripts:**
```json
{
  "scripts": {
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules/.cache"
  }
}
```

This gives us:
- Parallel builds (contract + speakeasy + witness can build simultaneously)
- Content-hash caching (unchanged packages skip entirely)
- Dependency-aware ordering (`api-client` waits for `contract`, `glia` waits for `contract`, etc.)

### Phase 2: Add tsup for bundled packages

tsup is already a devDependency in notary (`packages/notary/package.json:50`). Adopt it for other packages that benefit from bundling.

**Priority order for migration:**

**Tier A -- Small, simple packages (start here):**
- `contract` -- pure types, no deps. Migrate to tsup for source maps + dts.
- `api-client` -- depends on contract + eden. Small surface area.
- `witness` -- small, one entry point.
- `witness-react` -- small, one entry point, React hooks.

**Tier B -- Medium packages:**
- `speakeasy` -- 3 entry points (`.`, `./core`, `./transport`, `./react`). Moderate complexity.
- `notary` -- already uses `bun build`, migrate to tsup for consistency.

**Tier C -- Large package (glia):**
- `glia` -- 15+ entry points, CSS extraction, optional deps. Most complex migration.

**Example tsup config for contract:**

`packages/contract/tsup.config.ts`:
```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
});
```

**Example tsup config for glia (multiple entry points):**

`packages/glia/tsup.config.ts`:
```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    core: "src/core.ts",
    "protocol/index": "src/protocol/index.ts",
    "hooks/index": "src/hooks/index.ts",
    "speakeasy/index": "src/speakeasy/index.ts",
    "components/index": "src/components/index.ts",
    "workspace/index": "src/workspace/index.ts",
    "primitives/index": "src/primitives/index.ts",
    "theme/index": "src/theme/index.ts",
    "emotion/index": "src/emotion/index.ts",
    "vision/index": "src/vision/index.ts",
    "audio/index": "src/audio/index.ts",
    "cognition/index": "src/cognition/index.ts",
    "desktop/index": "src/desktop/index.ts",
    "desktop/core/index": "src/desktop/core/index.ts",
    "desktop/themes/index": "src/desktop/themes/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  external: [
    "react",
    "react-dom",
    "framer-motion",
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    // All @radix-ui/* are optional peer deps
    /^@radix-ui\//,
    "lucide-react",
    "cmdk",
    "sonner",
    "shiki",
    "react-rnd",
    "react-resizable-panels",
  ],
  treeshake: true,
});
```

**CSS handling:** glia's Tailwind CSS build step remains separate. tsup handles JS; Tailwind CLI handles CSS. The build script becomes:

```json
"build": "tsup && tailwindcss -c tailwind.config.js -i src/styles/globals.css -o dist/styles.css --minify"
```

### Phase 3: ESM/CJS dual output (optional)

If CJS consumers are needed, change tsup format:
```ts
format: ["esm", "cjs"],
```

tsup handles the dual output automatically, generating both `.js` (ESM) and `.cjs` (CommonJS) files. Update `package.json` exports:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

This is optional -- if all consumers use ESM (Vite, Next.js, modern Node), skip this.

### Phase 4: Source maps everywhere

After tsup migration, all packages will have `sourcemap: true` by default. For packages staying on raw tsc, add to tsconfig:

```json
"sourceMap": true
```

Currently only witness and witness-react have source maps enabled.

## Migration Path

### Week 1: Turborepo + Tier A packages
1. Install turbo, create `turbo.json`
2. Replace `build:ts` bash loop with `turbo run build`
3. Migrate `contract` to tsup (simplest package, no deps)
4. Migrate `api-client` to tsup
5. Migrate `witness` and `witness-react` to tsup
6. Verify CI passes with new build

### Week 2: Tier B + C packages
7. Migrate `speakeasy` to tsup (3 entry points)
8. Migrate `notary` from `bun build` to tsup (already has tsup as devDep)
9. Migrate `glia` to tsup (15+ entry points, most complex)
10. Verify all export paths work for downstream consumers

### Validation at each step
- `bun run build` succeeds
- `bun run typecheck` passes
- Import each export path from a test script to verify resolution
- Check `dist/` output size before and after (should shrink with tree-shaking)
- Verify source maps load in browser devtools

## Acceptance Criteria

- [ ] Parallel builds via Turborepo (or equivalent)
- [ ] Content-hash build caching (unchanged packages skip)
- [ ] Tree-shakeable output for glia's 15+ entry points
- [ ] Source maps generated for all packages
- [ ] Build caching works in CI (turbo remote cache optional)
- [ ] No `.turbo` ghost references in clean script without actual Turbo setup
- [ ] All existing export paths resolve correctly after migration
- [ ] Build time measurably faster than sequential baseline

## Alternatives Considered

**Vite library mode** -- Good for glia specifically (already uses Vite for Storybook), but tsup is simpler for pure-TS packages. Could use Vite for glia and tsup for the rest, but inconsistency isn't worth it.

**Bun bundler** -- Already used by notary (`bun build`), but lacks dts generation, tree-shaking configuration, and multi-entry-point support. tsup wraps esbuild with these features built in.

**Nx** -- More powerful than Turborepo but heavier setup. Overkill for 7 packages.

**Moon** -- The parent workspace already uses Moon. Could configure Moon tasks for the SDK packages too, but Turborepo is lighter and self-contained within the npm workspace.
