# @backbay/glia-agent

Emotion, cognition, and audio systems for AI agents.

Part of the [Backbay SDK](https://github.com/backbay/backbay-sdk).

## Installation

```bash
npm install @backbay/glia-agent
```

## Usage

Import the full package or use sub-path imports for granular tree-shaking:

```typescript
// Full package
import { useEmotion, useCognition, planSpeech } from "@backbay/glia-agent";

// Sub-path imports
import { useEmotion, EmotionController } from "@backbay/glia-agent/emotion";
import { useCognition, CognitionController } from "@backbay/glia-agent/cognition";
import { planSpeech, HttpSpeechSynthesisProvider } from "@backbay/glia-agent/audio";
```

## Exports

| Entry Point | Description |
|---|---|
| `@backbay/glia-agent` | All exports (namespaced to avoid collisions) |
| `@backbay/glia-agent/emotion` | Emotion state, transitions, micro-expressions, and hooks |
| `@backbay/glia-agent/cognition` | Cognitive modes, state reducers, and hooks |
| `@backbay/glia-agent/audio` | Speech planning, synthesis providers, and hooks |

## Peer Dependencies

- `react` ^18 or ^19 (optional — only needed for hooks)

## License

MIT
