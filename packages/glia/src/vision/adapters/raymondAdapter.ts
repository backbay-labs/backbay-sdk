import type {
  VisionAdapter,
  VisionCaptureOptions,
  VisionFrame,
  VisionTopology,
  VisionTopologyNode,
  VisionChannel,
} from "../types.js";
import { Circle, Quad, type Shape } from "../raymond/shapes.js";
import { Eye } from "../raymond/canvas/Eye.js";
import { PointLight } from "../raymond/canvas/PointLight.js";
import { PhongTracingModel } from "../raymond/canvas/models/phongTracingModel.js";
import type {
  LightingModel,
  LightingModelParams,
} from "../raymond/canvas/lightingModel.js";
import { defaultMaterial, type Material } from "../raymond/shared/material.js";
import { fromObjectTransform } from "../raymond/transform.js";
import { newVector } from "../raymond/math.js";

export interface RaymondEyeOptions {
  position?: [number, number];
  rotation?: number;
  fov?: number;
  rays?: number;
}

export interface RaymondLightOptions {
  position: [number, number];
  color?: string;
}

export interface RaymondScene {
  eye: Eye;
  shapes: Shape[];
  lights: PointLight[];
  lightingModel: LightingModel;
  lightingParams: LightingModelParams;
}

export interface RaymondVisionAdapterOptions {
  id?: string;
  label?: string;
  topologyProvider?: () => VisionTopology | null;
  sceneProvider?: () => RaymondScene | null;
  eye?: RaymondEyeOptions;
  lights?: RaymondLightOptions[];
  axis?: "xy" | "xz" | "yz";
  scale?: number;
  includeSegments?: boolean;
  includeShadowRays?: boolean;
  lightingModel?: LightingModel;
  lightingParams?: LightingModelParams;
  nodeMaterial?: (node: VisionTopologyNode, fallback: Material) => Material;
  nodeShape?: (node: VisionTopologyNode) => "circle" | "quad";
}

export class RaymondVisionAdapter implements VisionAdapter {
  id: string;
  label?: string;
  private topologyProvider?: () => VisionTopology | null;
  private sceneProvider?: () => RaymondScene | null;
  private eyeOptions: RaymondEyeOptions;
  private lights: RaymondLightOptions[];
  private axis: "xy" | "xz" | "yz";
  private scale: number;
  private includeSegments: boolean;
  private includeShadowRays: boolean;
  private lightingModel?: LightingModel;
  private lightingParams?: LightingModelParams;
  private nodeMaterial?: (node: VisionTopologyNode, fallback: Material) => Material;
  private nodeShape?: (node: VisionTopologyNode) => "circle" | "quad";

  constructor(options: RaymondVisionAdapterOptions = {}) {
    this.id = options.id ?? "raymond-vision";
    this.label = options.label;
    this.topologyProvider = options.topologyProvider;
    this.sceneProvider = options.sceneProvider;
    this.eyeOptions = options.eye ?? {};
    this.lights = options.lights ?? [{ position: [-4, 2], color: "#ffffff" }];
    this.axis = options.axis ?? "xz";
    this.scale = options.scale ?? 1;
    this.includeSegments = options.includeSegments ?? false;
    this.includeShadowRays = options.includeShadowRays ?? false;
    this.lightingModel = options.lightingModel;
    this.lightingParams = options.lightingParams;
    this.nodeMaterial = options.nodeMaterial;
    this.nodeShape = options.nodeShape;
  }

  getTopology(): VisionTopology | null {
    return this.topologyProvider?.() ?? null;
  }

  async capture(options?: VisionCaptureOptions): Promise<VisionFrame> {
    const capturedAt = Date.now();
    const topology = this.topologyProvider?.() ?? undefined;
    const scene = this.sceneProvider?.() ?? this.buildSceneFromTopology(topology, options);

    if (!scene) {
      return {
        source: this.id,
        capturedAt,
        channels: [],
        topology: options?.includeTopology ? topology : undefined,
        meta: { error: "scene_unavailable" },
      };
    }

    const result = scene.lightingModel.computeSegments(
      scene.eye,
      scene.shapes,
      scene.lights,
      scene.lightingParams
    );

    const visionChannel: VisionChannel = {
      id: "raymond:vision",
      kind: "raymond/vision",
      data: result.vision,
      width: result.vision.length,
      height: 1,
    };

    const channels: VisionChannel[] = [visionChannel];
    if (this.includeSegments) {
      channels.push({
        id: "raymond:segments",
        kind: "raymond/segments",
        data: result.segments,
      });
    }
    if (this.includeShadowRays) {
      channels.push({
        id: "raymond:shadow-rays",
        kind: "raymond/shadow-rays",
        data: result.shadowRays,
      });
    }

    return {
      source: this.id,
      capturedAt,
      size: { width: result.vision.length, height: 1 },
      channels,
      topology: options?.includeTopology ? topology : undefined,
      meta: {
        lightingModel: scene.lightingModel.id,
      },
    };
  }

  private buildSceneFromTopology(
    topology: VisionTopology | undefined,
    options?: VisionCaptureOptions
  ): RaymondScene | null {
    const model = this.lightingModel ?? new PhongTracingModel();
    const lightingParams = this.lightingParams ?? defaultLightingParams(model);
    const nodes = topology?.nodes ?? [];

    const shapes = nodes
      .map((node) => this.mapNodeToShape(node))
      .filter((shape): shape is Shape => Boolean(shape));

    const lights = this.lights.map((light) => {
      const transform = fromObjectTransform({
        translation: newVector(light.position[0], light.position[1]),
        rotation: 0,
        scale: newVector(1, 1),
      });
      return new PointLight(hexToColor(light.color ?? "#ffffff"), transform);
    });

    const eye = buildEye(nodes, this.eyeOptions, this.axis, options);

    return {
      eye,
      shapes,
      lights,
      lightingModel: model,
      lightingParams,
    };
  }

  private mapNodeToShape(node: VisionTopologyNode): Shape | null {
    if (!node.position) return null;
    const [x, y] = projectPosition(node.position, this.axis);
    const scale = this.nodeScale(node) * this.scale;
    const transform = fromObjectTransform({
      translation: newVector(x, y),
      rotation: 0,
      scale: newVector(scale, scale),
    });

    const baseMaterial = defaultMaterial();
    const material = this.nodeMaterial
      ? this.nodeMaterial(node, baseMaterial)
      : { ...baseMaterial, color: hexToColor(node.color ?? "#66cc66") };

    const shape = this.nodeShape?.(node) ?? inferShape(node);
    return shape === "quad"
      ? new Quad(transform, material)
      : new Circle(transform, material);
  }

  private nodeScale(node: VisionTopologyNode): number {
    if (node.radius) return Math.max(node.radius, 0.05);
    if (node.bounds) {
      const dx = Math.abs(node.bounds.max[0] - node.bounds.min[0]);
      const dy = Math.abs(node.bounds.max[1] - node.bounds.min[1]);
      const dz = Math.abs(node.bounds.max[2] - node.bounds.min[2]);
      return Math.max(dx, dy, dz) / 2;
    }
    return 0.5;
  }
}

function defaultLightingParams(model: LightingModel): LightingModelParams {
  const params: LightingModelParams = {};
  for (const param of model.parameters) {
    params[param.id] = param.default;
  }
  return params;
}

function buildEye(
  nodes: VisionTopologyNode[],
  options: RaymondEyeOptions,
  axis: "xy" | "xz" | "yz",
  captureOptions?: VisionCaptureOptions
): Eye {
  const bounds = computeBounds(nodes, axis);
  const position = options.position ?? [bounds.minX - 4, bounds.centerY];
  const rotation = options.rotation ?? 0;
  const transform = fromObjectTransform({
    translation: newVector(position[0], position[1]),
    rotation,
    scale: newVector(1, 1),
  });
  const eye = new Eye(transform);
  eye.fov = options.fov ?? Math.PI / 3;
  const targetRays = options.rays ?? captureOptions?.size?.width ?? 120;
  eye.numRays = Math.max(1, Math.min(240, Math.round(targetRays)));
  return eye;
}

function inferShape(node: VisionTopologyNode): "circle" | "quad" {
  const explicit = node.meta?.shape;
  if (explicit === "quad" || explicit === "circle") return explicit;
  return node.type === "node" ? "quad" : "circle";
}

function projectPosition(
  position: [number, number, number],
  axis: "xy" | "xz" | "yz"
): [number, number] {
  const [x, y, z] = position;
  switch (axis) {
    case "xz":
      return [x, z];
    case "yz":
      return [y, z];
    case "xy":
    default:
      return [x, y];
  }
}

function computeBounds(nodes: VisionTopologyNode[], axis: "xy" | "xz" | "yz") {
  const initial = {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    centerY: 0,
  };
  if (nodes.length === 0) return initial;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    if (!node.position) return;
    const [x, y] = projectPosition(node.position, axis);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  if (!Number.isFinite(minX)) {
    return initial;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerY: (minY + maxY) / 2,
  };
}

function hexToColor(input: string): { r: number; g: number; b: number } {
  const hex = input.replace("#", "");
  if (hex.length !== 6) {
    return { r: 1, g: 1, b: 1 };
  }
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  return { r, g, b };
}
