"use client";

import { useEffect, useMemo, useRef, useId, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { cn } from "../../lib/utils";
import type { SigilMonumentProps } from "./types.js";

/**
 * SigilMonument renders a large cluster sigil/emblem with parallax effect.
 *
 * Features:
 * - Large sigil image (35-45% viewport height)
 * - 2-6px parallax drift on mouse movement
 * - Subtle CSS shimmer animation (10s cycle)
 * - Plaque below with cluster name, tagline, and optional Latin motto
 */
export function SigilMonument({
  name,
  tagline,
  latinMotto,
  sigilSrc,
  accentColor,
  className,
}: SigilMonumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleId = useId();
  const [sigilFailed, setSigilFailed] = useState(false);

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const letters = parts.map((p) => p[0] ?? "").join("");
    return letters.slice(0, 2).toUpperCase() || name.slice(0, 2).toUpperCase();
  }, [name]);

  useEffect(() => {
    setSigilFailed(false);
  }, [sigilSrc]);

  // Mouse position tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring-smoothed parallax offsets (2-6px range)
  const springConfig = { damping: 25, stiffness: 150 };
  const parallaxX = useSpring(
    useTransform(mouseX, [-1, 1], [-4, 4]),
    springConfig
  );
  const parallaxY = useSpring(
    useTransform(mouseY, [-1, 1], [-4, 4]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize to -1 to 1 range
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(Math.max(-1, Math.min(1, normalizedX)));
    mouseY.set(Math.max(-1, Math.min(1, normalizedY)));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Unique class name for scoped keyframes
  const shimmerClass = `sigil-shimmer-${styleId.replace(/:/g, "")}`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex flex-col items-center justify-center",
        className
      )}
      style={{ "--sigil-accent": accentColor } as React.CSSProperties}
    >
      {/* Scoped shimmer animation styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes ${shimmerClass}-anim {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            .${shimmerClass} {
              animation: ${shimmerClass}-anim 10s ease-in-out infinite;
            }
          `,
        }}
      />

      {/* Sigil Container with Parallax */}
      <motion.div
        className="relative"
        style={{
          x: parallaxX,
          y: parallaxY,
        }}
      >
        {/* Shimmer Overlay */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className={`absolute inset-0 ${shimmerClass}`}
            style={{
              background: `linear-gradient(
                105deg,
                transparent 40%,
                ${accentColor}15 45%,
                ${accentColor}25 50%,
                ${accentColor}15 55%,
                transparent 60%
              )`,
              backgroundSize: "200% 100%",
            }}
          />
        </div>

        {/* Sigil Image */}
        {!sigilFailed && sigilSrc ? (
          <img
            src={sigilSrc}
            alt={`${name} sigil`}
            className="h-[35vh] min-h-[280px] max-h-[45vh] w-auto object-contain drop-shadow-2xl"
            style={{
              filter: `drop-shadow(0 0 60px ${accentColor}40)`,
            }}
            onError={() => setSigilFailed(true)}
          />
        ) : (
          <div
            className="h-[35vh] min-h-[280px] max-h-[45vh] aspect-square rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${accentColor}35, transparent 65%), radial-gradient(circle at 70% 80%, ${accentColor}18, transparent 60%), rgba(255,255,255,0.02)`,
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 0 60px ${accentColor}30, inset 0 0 40px rgba(255,255,255,0.08)`,
              filter: `drop-shadow(0 0 60px ${accentColor}40)`,
            }}
            aria-hidden="true"
          >
            <div
              className="font-serif text-6xl text-white/70 tracking-[0.18em]"
              style={{ textShadow: `0 0 30px ${accentColor}30` }}
            >
              {initials}
            </div>
          </div>
        )}
      </motion.div>

      {/* Plaque */}
      <div className="mt-10 text-center">
        {/* Cluster Name - Small Caps */}
        <h2
          className="font-serif text-3xl md:text-4xl text-white/95 mb-3"
          style={{
            fontVariant: "small-caps",
            letterSpacing: "0.12em",
          }}
        >
          {name}
        </h2>

        {/* Tagline - Italic */}
        <p className="font-serif text-lg md:text-xl text-white/60 italic max-w-md leading-relaxed">
          {tagline}
        </p>

        {/* Latin Motto - Tiny */}
        {latinMotto && (
          <p
            className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30"
            aria-label="Latin motto"
          >
            {latinMotto}
          </p>
        )}
      </div>
    </div>
  );
}

export default SigilMonument;
