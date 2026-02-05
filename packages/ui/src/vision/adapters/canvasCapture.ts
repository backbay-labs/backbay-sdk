import type {
  VisionAdapter,
  VisionCaptureOptions,
  VisionFrame,
  VisionTopology,
  VisionChannel,
} from "../types.js";

export interface CanvasCaptureAdapterOptions {
  id?: string;
  label?: string;
  getCanvas: () => HTMLCanvasElement | null;
  getTopology?: () => VisionTopology | null;
  channelId?: string;
  format?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
}

export class CanvasCaptureAdapter implements VisionAdapter {
  id: string;
  label?: string;
  private getCanvas: () => HTMLCanvasElement | null;
  private topologyProvider?: () => VisionTopology | null;
  private channelId: string;
  private format: "image/png" | "image/jpeg" | "image/webp";
  private quality?: number;

  constructor(options: CanvasCaptureAdapterOptions) {
    this.id = options.id ?? "canvas-capture";
    this.label = options.label;
    this.getCanvas = options.getCanvas;
    this.topologyProvider = options.getTopology;
    this.channelId = options.channelId ?? "color";
    this.format = options.format ?? "image/png";
    this.quality = options.quality;
  }

  getTopology(): VisionTopology | null {
    return this.topologyProvider?.() ?? null;
  }

  async capture(options?: VisionCaptureOptions): Promise<VisionFrame> {
    const canvas = this.getCanvas();
    const capturedAt = Date.now();

    if (!canvas) {
      return {
        source: this.id,
        capturedAt,
        channels: [],
        topology: options?.includeTopology ? this.topologyProvider?.() ?? undefined : undefined,
        meta: { error: "canvas_unavailable" },
      };
    }

    const targetSize = options?.size ?? { width: canvas.width, height: canvas.height };
    const outputCanvas =
      targetSize.width === canvas.width && targetSize.height === canvas.height
        ? canvas
        : this.scaleCanvas(canvas, targetSize.width, targetSize.height);

    const dataUrl = outputCanvas.toDataURL(this.format, this.quality);
    const channel: VisionChannel<string> = {
      id: this.channelId,
      kind: "color",
      data: dataUrl,
      width: targetSize.width,
      height: targetSize.height,
      meta: { format: this.format },
    };

    return {
      source: this.id,
      capturedAt,
      size: targetSize,
      channels: [channel],
      topology: options?.includeTopology ? this.topologyProvider?.() ?? undefined : undefined,
    };
  }

  private scaleCanvas(
    source: HTMLCanvasElement,
    width: number,
    height: number
  ): HTMLCanvasElement {
    const scaled = document.createElement("canvas");
    scaled.width = width;
    scaled.height = height;
    const ctx = scaled.getContext("2d");
    if (ctx) {
      ctx.drawImage(source, 0, 0, width, height);
    }
    return scaled;
  }
}
