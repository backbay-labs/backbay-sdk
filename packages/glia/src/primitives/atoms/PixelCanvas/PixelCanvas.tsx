"use client";

import * as React from "react";

// Status-driven color presets
const STATUS_COLORS: Record<string, string[]> = {
  active: ['#00ff88', '#00cc6a', '#00994d'],
  warning: ['#f2c96b', '#e5b84d', '#d4a42e'],
  error: ['#dc143c', '#b01030', '#8a0c26'],
};

// Status-driven speed presets
const STATUS_SPEEDS: Record<string, number> = {
  selected: 35,
  active: 50,
  warning: 25,
  error: 60,
};

/**
 * Derive color tints from a hex color.
 * Returns array of 3 colors: [base, darker, darkest]
 */
function deriveColorTints(hex: string): string[] {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Create base + 2 darker variants (80% and 60% brightness)
  const toHex = (val: number) => Math.round(val).toString(16).padStart(2, '0');

  const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  const darker = `#${toHex(r * 0.8)}${toHex(g * 0.8)}${toHex(b * 0.8)}`;
  const darkest = `#${toHex(r * 0.6)}${toHex(g * 0.6)}${toHex(b * 0.6)}`;

  return [base, darker, darkest];
}

// Pixel class for the canvas animation
class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInteger: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;

    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }

    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }

    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }

    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;

    if (this.size <= 0) {
      this.isIdle = true;
      return;
    } else {
      this.size -= 0.1;
    }

    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }

    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
  }
}

export interface PixelCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number;
  speed?: number;
  colors?: string[];
  variant?: "default" | "icon";
  noFocus?: boolean;
  /** Manual activation control (bypasses hover) */
  active?: boolean;
  /** Status-driven presets for colors and speed */
  status?: 'selected' | 'active' | 'warning' | 'error';
  /** Theme color (used when status='selected') */
  themeColor?: string;
}

const PixelCanvas = React.forwardRef<HTMLDivElement, PixelCanvasProps>(
  (
    {
      gap = 5,
      speed = 35,
      colors = ["#f8fafc", "#f1f5f9", "#cbd5e1"],
      variant = "default",
      noFocus = false,
      active,
      status,
      themeColor,
      className,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const pixelsRef = React.useRef<Pixel[]>([]);
    const animationRef = React.useRef<number | null>(null);
    const timePreviousRef = React.useRef<number>(performance.now());
    const timeInterval = 1000 / 60;

    const reducedMotion =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;

    // Resolve colors based on status
    const resolvedColors = React.useMemo(() => {
      if (status === 'selected' && themeColor) {
        return deriveColorTints(themeColor);
      }
      if (status && STATUS_COLORS[status]) {
        return STATUS_COLORS[status];
      }
      return colors;
    }, [status, themeColor, colors]);

    // Resolve speed based on status
    const resolvedSpeed = React.useMemo(() => {
      if (status && STATUS_SPEEDS[status] !== undefined) {
        return STATUS_SPEEDS[status];
      }
      return speed;
    }, [status, speed]);

    const actualSpeed = reducedMotion ? 0 : Math.max(0, Math.min(100, resolvedSpeed)) * 0.001;
    const actualGap = Math.max(4, Math.min(50, gap));

    const getDistanceToCenter = React.useCallback(
      (x: number, y: number, width: number, height: number) => {
        const dx = x - width / 2;
        const dy = y - height / 2;
        return Math.sqrt(dx * dx + dy * dy);
      },
      []
    );

    const getDistanceToBottomLeft = React.useCallback((x: number, y: number, height: number) => {
      const dx = x;
      const dy = height - y;
      return Math.sqrt(dx * dx + dy * dy);
    }, []);

    const createPixels = React.useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      pixelsRef.current = [];

      for (let x = 0; x < canvas.width; x += actualGap) {
        for (let y = 0; y < canvas.height; y += actualGap) {
          const color = resolvedColors[Math.floor(Math.random() * resolvedColors.length)];
          let delay = 0;

          if (variant === "icon") {
            delay = reducedMotion ? 0 : getDistanceToCenter(x, y, canvas.width, canvas.height);
          } else {
            delay = reducedMotion ? 0 : getDistanceToBottomLeft(x, y, canvas.height);
          }

          pixelsRef.current.push(new Pixel(canvas, ctx, x, y, color, actualSpeed, delay));
        }
      }
    }, [
      actualGap,
      actualSpeed,
      resolvedColors,
      variant,
      reducedMotion,
      getDistanceToCenter,
      getDistanceToBottomLeft,
    ]);

    const drawStatic = React.useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const pixel of pixelsRef.current) {
        pixel.isIdle = true;
        pixel.isReverse = false;
        pixel.isShimmer = false;
        pixel.size = pixel.maxSize;
        pixel.draw();
      }
    }, []);

    const handleResize = React.useCallback(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!container || !canvas || !ctx) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      createPixels();
      if (reducedMotion) {
        drawStatic();
      }
    }, [createPixels, reducedMotion, drawStatic]);

    const handleAnimation = React.useCallback(
      (name: "appear" | "disappear") => {
        if (reducedMotion) {
          return;
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const animate = () => {
          animationRef.current = requestAnimationFrame(animate);

          const timeNow = performance.now();
          const timePassed = timeNow - timePreviousRef.current;

          if (timePassed < timeInterval) return;

          timePreviousRef.current = timeNow - (timePassed % timeInterval);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let allIdle = true;
          for (const pixel of pixelsRef.current) {
            pixel[name]();
            if (!pixel.isIdle) allIdle = false;
          }

          if (allIdle) {
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
              animationRef.current = null;
            }
          }
        };

        animate();
      },
      [reducedMotion, timeInterval]
    );

    React.useEffect(() => {
      handleResize();

      const ro = new ResizeObserver(() => {
        requestAnimationFrame(handleResize);
      });

      if (containerRef.current) {
        ro.observe(containerRef.current);
      }

      return () => {
        ro.disconnect();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [handleResize]);

    // Handle hover/focus listeners (skip if active prop is provided)
    React.useEffect(() => {
      // If active prop is provided, skip hover control
      if (active !== undefined) return;

      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      if (reducedMotion) return;

      const handleEnter = () => handleAnimation("appear");
      const handleLeave = () => handleAnimation("disappear");

      parent.addEventListener("mouseenter", handleEnter);
      parent.addEventListener("mouseleave", handleLeave);

      if (!noFocus) {
        parent.addEventListener("focus", handleEnter, { capture: true });
        parent.addEventListener("blur", handleLeave, { capture: true });
      }

      return () => {
        parent.removeEventListener("mouseenter", handleEnter);
        parent.removeEventListener("mouseleave", handleLeave);
        if (!noFocus) {
          parent.removeEventListener("focus", handleEnter, { capture: true });
          parent.removeEventListener("blur", handleLeave, { capture: true });
        }
      };
    }, [active, handleAnimation, noFocus, reducedMotion]);

    // Handle active prop changes for manual activation
    React.useEffect(() => {
      if (active === undefined) return; // Let hover control it
      if (active) {
        handleAnimation("appear");
      } else {
        handleAnimation("disappear");
      }
    }, [active, handleAnimation]);

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
        {...props}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  }
);

PixelCanvas.displayName = "PixelCanvas";

export { PixelCanvas };
