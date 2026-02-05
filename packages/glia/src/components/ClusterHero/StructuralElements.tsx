"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { StructuralElementsProps } from "./types.js";
export type { StructuralElementsProps } from "./types.js";

/**
 * Atmospheric structural elements for ClusterHero.
 * Renders corner brackets, radial vignette, and subtle dot grid overlay.
 */
export function StructuralElements({
  accentColor,
  className,
}: StructuralElementsProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* Corner brackets */}
      <CornerBrackets accentColor={accentColor} />

      {/* Radial vignette behind sigil area (right side) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 85% 50%, ${accentColor}1A 0%, transparent 70%)`,
        }}
      />

      {/* Dot grid overlay */}
      <DotGrid />
    </div>
  );
}

/**
 * Corner bracket decorations at top-left and bottom-right.
 */
function CornerBrackets({ accentColor }: { accentColor: string }) {
  const bracketLength = 40;
  const thickness = 2;

  return (
    <>
      {/* Top-left bracket */}
      <motion.div
        className="absolute top-6 left-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Horizontal line */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: bracketLength,
            height: thickness,
            backgroundColor: accentColor,
          }}
        />
        {/* Vertical line */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: thickness,
            height: bracketLength,
            backgroundColor: accentColor,
          }}
        />
      </motion.div>

      {/* Bottom-right bracket */}
      <motion.div
        className="absolute bottom-6 right-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Horizontal line */}
        <div
          className="absolute bottom-0 right-0"
          style={{
            width: bracketLength,
            height: thickness,
            backgroundColor: accentColor,
          }}
        />
        {/* Vertical line */}
        <div
          className="absolute bottom-0 right-0"
          style={{
            width: thickness,
            height: bracketLength,
            backgroundColor: accentColor,
          }}
        />
      </motion.div>
    </>
  );
}

/**
 * Subtle dot grid pattern overlay.
 */
function DotGrid() {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: 0.04,
        backgroundImage: `radial-gradient(circle at center, currentColor 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
}
