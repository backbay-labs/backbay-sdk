"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { BriefingPanelProps } from "./types.js";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

function Description({ text }: { text: string }) {
  return (
    <motion.p
      variants={itemVariants}
      className="text-sm text-white/70 leading-relaxed max-w-xs whitespace-pre-line"
    >
      {text}
    </motion.p>
  );
}

function CapabilityChips({
  capabilities,
  accentColor,
}: {
  capabilities: [string, string, string];
  accentColor: string;
}) {
  return (
    <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
      {capabilities.map((capability) => (
        <span
          key={capability}
          className="px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/80 rounded-sm"
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
        >
          {capability}
        </span>
      ))}
    </motion.div>
  );
}

function FastPath({
  fastPath,
  accentColor,
}: {
  fastPath: { label: string; href: string };
  accentColor: string;
}) {
  return (
    <motion.a
      variants={itemVariants}
      href={fastPath.href}
      className="group inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:brightness-125"
      style={{ color: accentColor }}
    >
      <span>{fastPath.label}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="transition-transform duration-200 group-hover:translate-x-1"
      >
        <path
          d="M6 4L10 8L6 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.a>
  );
}

function StatusLine({
  status,
}: {
  status: { network: string; verification: string; fees: string };
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="font-mono text-[10px] text-white/50 tracking-wide"
    >
      Network: {status.network}
      <span className="mx-2">•</span>
      Verification: {status.verification}
      <span className="mx-2">•</span>
      Fees: {status.fees}
    </motion.div>
  );
}

/**
 * BriefingPanel renders the top-left briefing information for a cluster hero.
 *
 * Includes:
 * - Description text (max 110 chars)
 * - Capability chips with accent-tinted backgrounds
 * - Fast path link with animated arrow
 * - Status line with network/verification/fees info
 *
 * All elements animate in with staggered fade-up on mount.
 */
export function BriefingPanel({
  description,
  capabilities,
  fastPath,
  status,
  accentColor,
  className,
}: BriefingPanelProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col gap-4 rounded-xl p-4 backdrop-blur-xl", className)}
      style={{
        background: "rgba(2,4,10,0.6)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Description text={description} />
      <CapabilityChips capabilities={capabilities} accentColor={accentColor} />
      <FastPath fastPath={fastPath} accentColor={accentColor} />
      <StatusLine status={status} />
    </motion.div>
  );
}

export default BriefingPanel;
