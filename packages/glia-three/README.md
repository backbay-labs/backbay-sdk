# @backbay/glia-three

3D visualizations and environment layers for React Three Fiber.

Part of the [Backbay SDK](https://github.com/backbay/backbay-sdk).

## Installation

```bash
npm install @backbay/glia-three three @react-three/fiber @react-three/drei
```

## Usage

```typescript
import { Graph3D, ParticleField } from "@backbay/glia-three";
import * as QuantumField from "@backbay/glia-three";

// Sub-path imports
import { Graph3D } from "@backbay/glia-three/three";
import { WeatherLayer, FogLayer } from "@backbay/glia-three/environment";
```

## Exports

| Entry Point | Description |
|---|---|
| `@backbay/glia-three` | All 3D components and environment layers |
| `@backbay/glia-three/three` | Graph3D, ParticleField, QuantumField, CrystallineOrganism, RiverView, Glyph |
| `@backbay/glia-three/environment` | WeatherLayer, FogLayer, VolumetricLight, AuroraLayer, EnvironmentLayer |

## Peer Dependencies

- `react` ^18 or ^19
- `three` >=0.150
- `@react-three/fiber` ^9
- `@react-three/drei` ^10

## License

MIT
