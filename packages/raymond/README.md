# @backbay/raymond

Zero-dependency 2D ray tracer engine — geometry, optics, camera, and lighting models.

Part of the [Backbay SDK](https://github.com/backbay/backbay-sdk).

## Installation

```bash
npm install @backbay/raymond
```

## Usage

```typescript
import {
  Eye,
  PointLight,
  createCircle,
  createRectangle,
  Camera,
  phongTracingModel,
} from "@backbay/raymond";

// Create a scene
const eye = new Eye(canvas);
const light = new PointLight({ x: 100, y: 100 }, 1.0);
const circle = createCircle({ x: 200, y: 200 }, 50);

// Render with Phong lighting
eye.render([circle], [light], phongTracingModel);
```

## Features

- Geometric primitives (circles, rectangles, lines, polygons)
- Camera and transform system
- Point lighting with configurable intensity
- Phong lighting model with specular highlights
- Color and material system
- Extensible lighting model registry

## License

MIT
