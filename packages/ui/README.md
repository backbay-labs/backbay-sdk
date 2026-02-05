# @backbay/bb-ui

> An open-source standard and component library for building agent-native web applications.

[![npm version](https://img.shields.io/npm/v/@backbay/bb-ui.svg)](https://www.npmjs.com/package/@backbay/bb-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## The Problem

The web has no standard for AI agent interaction:

| Layer | Human Web | Agent Web (Missing) |
|-------|-----------|---------------------|
| Discovery | `sitemap.xml`, `robots.txt` | What can an agent *do* here? |
| Execution | Click, type, scroll | How does an agent *reliably* act? |
| Feedback | Visual UI, loading states | How does an agent know it *worked*? |

## The Solution

**bb-ui** provides two parallel pillars:

```
┌─────────────────────────────────────────────────────────────┐
│                         bb-ui                               │
├─────────────────────────────┬───────────────────────────────┤
│       bb-protocol           │       bb-components           │
│  (Discovery + Execution)    │    (Agentic UI Primitives)    │
├─────────────────────────────┼───────────────────────────────┤
│  • bb-manifest.json         │  • <BBProvider>               │
│  • data-bb-* attributes     │  • <SyncDocument>             │
│  • Capability schemas       │  • <AgentPanel>               │
│  • Entity extraction        │  • <PlaySession>              │
│  • Safety constraints       │  • useSync, useAgentRun       │
└─────────────────────────────┴───────────────────────────────┘
```

## Installation

```bash
npm install @backbay/bb-ui
# or
bun add @backbay/bb-ui
```

## Styles (Required for UI)

`bb-ui` ships a prebuilt stylesheet that includes:
- Theme CSS variables
- Primitives/component styling

Import it once near your app entrypoint:

```ts
import "@backbay/bb-ui/styles.css";
```

## Quick Start

### Level 1: Add a Manifest (5 minutes)

Create `public/bb-manifest.json`:

```json
{
  "version": "1.0",
  "name": "My App",
  "description": "A sample agent-native application",
  "capabilities": [
    {
      "id": "search-products",
      "type": "query",
      "description": "Search for products by keyword",
      "selector": "[data-bb-action='search']",
      "inputs": [
        { "name": "query", "type": "string", "required": true }
      ]
    }
  ]
}
```

### Level 2: Add DOM Annotations (10 minutes)

```tsx
<button
  data-bb-action="search"
  data-bb-description="Search for products"
>
  Search
</button>

<div data-bb-entity="product" data-bb-entity-id="123">
  <span data-bb-field="name">Widget Pro</span>
  <span data-bb-field="price">$99</span>
</div>
```

### Level 3: Full Integration (30 minutes)

```tsx
import { BBProvider, SyncDocument, useAgentRun } from "@backbay/bb-ui";

const agents = [
  { id: "default-agent", name: "Default Agent", costPerRun: 0.01 },
];

function App() {
  return (
    <BBProvider config={{ apiBaseUrl: "/api/agent" }} agents={agents}>
      <MyAgentApp />
    </BBProvider>
  );
}

function MyAgentApp() {
  const { start, status, cost } = useAgentRun();

  return (
    <SyncDocument
      documentId="my-document"
      endpoint="/api/docs"
      initialContent={{ content: "" }}
      onConflict={(local, remote, resolve) => (
        <ConflictResolver local={local} remote={remote} onResolve={resolve} />
      )}
    >
      {({ content, setContent, status: syncStatus, pendingChanges }) => (
        <div>
          <Editor
            content={content?.content ?? ""}
            onChange={(next) => setContent({ content: next })}
          />
          <button
            onClick={() => start("default-agent", `Summarize:\n\n${content?.content ?? ""}`)}
            disabled={status === "running"}
          >
            Summarize{cost != null ? ` ($${cost.toFixed(3)})` : ""}
          </button>
          {syncStatus === "pending" && <div>Saving… ({pendingChanges})</div>}
        </div>
      )}
    </SyncDocument>
  );
}
```

## Exports

The package provides multiple entry points for tree-shaking:

```tsx
// Everything
import { BBProvider, useSync, findAction } from '@backbay/bb-ui';

// Core-only (avoids heavier optional modules)
import { BBProvider, useSync, findAction } from '@backbay/bb-ui/core';

// Protocol only (discovery + DOM utilities)
import { BBManifestSchema, findAction, extractEntity } from '@backbay/bb-ui/protocol';

// Hooks only
import { useSync, useAgentRun, useRunStream } from '@backbay/bb-ui/hooks';

// Components only
import { BBProvider, SyncDocument, AgentPanel } from '@backbay/bb-ui/components';

// Workspace (agent-composable UI)
import { WorkspaceRenderer, getRegistry } from '@backbay/bb-ui/workspace';

// UI Primitives
import { GlowButton, GlassPanel, Graph3D } from '@backbay/bb-ui/primitives';

// Theme system
import { UiThemeProvider, useColorTokens } from '@backbay/bb-ui/theme';

// Emotion system
import { useEmotion, EmotionController, computeVisualState, ANCHOR_STATES } from '@backbay/bb-ui/emotion';
```

## Core Concepts

### 1. Progressive Enhancement

Works at any adoption level:
- **Level 0**: No bb-ui → Agents use vision/DOM heuristics
- **Level 1**: Manifest only → Agents know what's possible
- **Level 2**: Manifest + DOM annotations → Agents can reliably execute
- **Level 3**: Full bb-components → Rich agentic experiences

### 2. Agents Are Metered Services

Every agent interaction has:
- **Cost**: USD estimate, token count
- **Latency**: Expected response time
- **Risk**: Low/medium/high classification

### 3. Offline-First, Conflict-Aware

Local state is canonical until sync completes. Conflicts surface explicitly with resolution options: `keep_local`, `use_remote`, `create_copy`.

### 4. Human-in-the-Loop by Default

High-risk actions require human confirmation with timeout behavior.

## API Reference

### Protocol

#### `BBManifestSchema`
Zod schema for validating manifest files.

```tsx
import { BBManifestSchema } from '@backbay/bb-ui/protocol';

const result = BBManifestSchema.safeParse(manifestData);
if (result.success) {
  console.log(result.data.capabilities);
}
```

#### `findAction(selector: string)`
Find an action element in the DOM.

```tsx
import { findAction } from '@backbay/bb-ui/protocol';

const button = findAction('search-products');
button?.click();
```

#### `extractEntity(element: Element)`
Extract structured entity data from annotated DOM.

```tsx
import { extractEntity } from '@backbay/bb-ui/protocol';

const productEl = document.querySelector('[data-bb-entity="product"]');
const product = extractEntity(productEl);
// { type: 'product', id: '123', fields: { name: 'Widget', price: '$99' } }
```

### Backend API Contract (Hooks)

Hooks read `apiBaseUrl` from `BBProvider` and expect a JSON API:

- `useAgentRun`: `POST {apiBaseUrl}/runs` → `{ output: string, cost?: number, tokenCount?: number }`
- `useRunStream`: `GET {apiBaseUrl}/runs/:runId` and/or `GET {apiBaseUrl}/runs/:runId/events` (SSE) → `{ status, output?, error? }`
- `usePlaySession`: `POST {apiBaseUrl}/play-sessions` + `DELETE {apiBaseUrl}/play-sessions/:id` + a WebSocket at `.../play-sessions/:id/ws` (JSON-RPC)

### Hooks

#### `useSync<T>(options)`
Offline-first data sync with conflict detection.

```tsx
const { data, setData, forceSave, status, conflict } = useSync<Document>({
  key: "doc-123",
  endpoint: "/api/docs/123",
  debounce: 1000,
  onConflict: (c) => console.log("Conflict", c),
});
```

#### `useAgentRun()`
Execute an agent run (API-backed) with cost tracking.

```tsx
const { start, status, latency, cost, cancel } = useAgentRun();

await start("default-agent", `Summarize:\n\n${content}`);
console.log(`Cost: $${cost ?? 0}, Latency: ${latency ?? 0}ms`);
```

#### `useRunStream(runId: string)`
Stream run status updates in real-time.

```tsx
const { status, run, latestEvent, isConnected } = useRunStream(runId);
```

### Components

#### `<BBProvider>`
Root provider for agent context.

```tsx
<BBProvider config={{ apiBaseUrl: "/api/agent" }} agents={agents}>
  {children}
</BBProvider>
```

#### `<SyncDocument>`
Render-prop component for synced documents.

```tsx
<SyncDocument
  documentId="my-doc"
  endpoint="/api/docs"
>
  {({ content, setContent }) => <Editor content={content} onChange={setContent} />}
</SyncDocument>
```

### Workspace

#### `WorkspaceRenderer`
Render agent-composed UI from a WorkspaceSpec.

```tsx
import { WorkspaceRenderer } from '@backbay/bb-ui/workspace';

const spec: WorkspaceSpec = {
  id: 'dashboard',
  name: 'Agent Dashboard',
  layout: {
    type: 'split',
    direction: 'horizontal',
    children: [
      { type: 'panel', component: 'agent-panel' },
      { type: 'panel', component: 'chat-view' }
    ]
  }
};

<WorkspaceRenderer spec={spec} />
```

## Emotion System

The emotion system provides a psychologically-grounded dimensional model for AI agent emotional expression, based on Russell's Circumplex Model of Affect.

### The AVO Model

Three continuous dimensions (0-1 range):

| Dimension | Low (0) | High (1) | Visual Effect |
|-----------|---------|----------|---------------|
| **Arousal** | Dormant | Intense | Animation speed, particles |
| **Valence** | Distressed | Elated | Color warmth, stability |
| **Openness** | Receptive | Expressive | Particle flow direction |

### Quick Start

```typescript
import { useEmotion } from '@backbay/bb-ui/emotion';

function MyAgent() {
  const { dimensions, visualState, goTo, emit } = useEmotion({
    initialAnchor: 'idle',
  });

  // Respond to events
  const onUserInput = () => emit({ type: 'input_received' });
  const onComplete = () => goTo('satisfied');

  return <GlyphObject visualState={visualState} />;
}
```

### Anchor States

Pre-defined emotional configurations:
- **Rest**: `dormant`, `idle`
- **Receptive**: `attentive`, `curious`, `listening`
- **Processing**: `thinking`, `contemplating`, `focused`
- **Expressive**: `responding`, `explaining`, `enthusiastic`
- **Completion**: `satisfied`, `proud`
- **Negative**: `uncertain`, `concerned`, `struggling`, `alarmed`, `error`
- **Recovery**: `recovering`, `relieved`

### API Reference

#### `useEmotion(options)`
React hook for emotion state management.

```tsx
const { dimensions, visualState, goTo, emit } = useEmotion({
  initialAnchor: 'idle',
  transitionDuration: 800,
});
```

#### `EmotionController`
Class-based controller for non-React usage.

```tsx
import { EmotionController } from '@backbay/bb-ui';

const controller = new EmotionController({ initialAnchor: 'idle' });
controller.goTo('thinking');
const state = controller.getVisualState();
```

#### `computeVisualState(avo)`
Convert AVO dimensions to visual properties.

```tsx
import { computeVisualState } from '@backbay/bb-ui';

const visual = computeVisualState({ arousal: 0.7, valence: 0.8, openness: 0.5 });
// { animationSpeed, colorTemperature, particleIntensity, ... }
```

#### `ANCHOR_STATES`
Predefined anchor state coordinates.

```tsx
import { ANCHOR_STATES } from '@backbay/bb-ui';

console.log(ANCHOR_STATES.thinking);
// { arousal: 0.6, valence: 0.5, openness: 0.3 }
```

See `docs/specs/glyph-emotion-system.md` for full specification.

## ClusterHero

A cinematic landing page component for cluster branding with video backgrounds, atmospheric effects, and scroll-triggered sections.

### Basic Usage

```tsx
import { ClusterHero, ClusterHeroPage } from '@backbay/bb-ui/components';

// Just the hero section (100vh)
<ClusterHero cluster="alexandria" />

// Full landing page with scroll sections
<ClusterHeroPage clusterId="baia" />
```

### Available Clusters

| Cluster | Accent Color | Tagline | Atmosphere |
|---------|-------------|---------|------------|
| `alexandria` | Gold (#C9A227) | "Where knowledge compounds" | Dust motes + godrays |
| `alpha` | Silver (#E8E8E8) | "The origin of everything" | Volumetric fog |
| `opus` | Copper (#B87333) | "Craft that endures" | Dust motes + bloom |
| `baia` | Sun gold (#D4AF37) | "Where ambition rests" | Godrays + caustics |

### Components

- `ClusterHero` - Hero section only
- `ClusterHeroPage` - Full page with sections
- `FeatureCardsSection` - Feature grid
- `ClusterStatsSection` - Animated stats
- `CTASection` - Call to action

### Customization

The component uses existing bb-ui atmosphere primitives:
- `DustMotesLayer`
- `VolumetricLight`
- `FogLayer`

Video assets should be placed at paths defined in the cluster config.

## DOM Annotations Reference

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-bb-action` | Action trigger | `data-bb-action="submit-order"` |
| `data-bb-entity` | Entity container | `data-bb-entity="product"` |
| `data-bb-entity-id` | Entity identifier | `data-bb-entity-id="sku-123"` |
| `data-bb-field` | Entity field | `data-bb-field="price"` |
| `data-bb-state` | Current state | `data-bb-state="loading"` |
| `data-bb-input` | Input binding | `data-bb-input="search-query"` |
| `data-bb-description` | Human/LLM description | `data-bb-description="Add to cart"` |

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  BBManifest,
  Capability,
  EntitySchema,
  WorkspaceSpec,
  LayoutNode,
  AgentId,
  RunId,
} from '@backbay/bb-ui';
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
