"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "../../../lib/utils";
import type { ClusterId } from "../types";
import { getClusterConfigWithResolvedUrls } from "../config";

export interface CTASectionProps {
  /** Which cluster this CTA belongs to */
  clusterId: ClusterId;
  /** Additional CSS classes */
  className?: string;
}

interface CTAContent {
  headline: string;
  subtext: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

const CTA_CONTENT: Record<ClusterId, CTAContent> = {
  alexandria: {
    headline: "Begin your research journey",
    subtext: "Unlock the archives. Let curiosity guide your path through infinite knowledge.",
    primaryLabel: "Enter Alexandria",
    primaryHref: "/clusters/alexandria",
    secondaryLabel: "Read the documentation",
    secondaryHref: "/docs/alexandria",
  },
  alpha: {
    headline: "Start building today",
    subtext: "From nothing, everything. Your next creation begins with a single step.",
    primaryLabel: "Launch Alpha",
    primaryHref: "/clusters/alpha",
    secondaryLabel: "Explore the guides",
    secondaryHref: "/docs/alpha",
  },
  opus: {
    headline: "Healthcare runs itself",
    subtext: "Autonomous diagnostics and care coordination. Production-grade medical systems.",
    primaryLabel: "Enter Opus",
    primaryHref: "/clusters/opus",
    secondaryLabel: "View protocols",
    secondaryHref: "/docs/opus",
  },
  baia: {
    headline: "Create beyond limits",
    subtext: "Generative AI for art and music. Production at the speed of imagination.",
    primaryLabel: "Open Studio",
    primaryHref: "/clusters/baia",
    secondaryLabel: "Explore the gallery",
    secondaryHref: "/docs/baia",
  },
  kdot: {
    headline: "Connect to the mesh",
    subtext: "The network that routes around failure. Join the resilient web.",
    primaryLabel: "Enter KDoT",
    primaryHref: "/clusters/kdot",
    secondaryLabel: "View topology",
    secondaryHref: "/docs/kdot",
  },
  aegis: {
    headline: "Shield your operations",
    subtext: "Protection that grows with you. Security without compromise.",
    primaryLabel: "Activate Aegis",
    primaryHref: "/clusters/aegis",
    secondaryLabel: "See the audit logs",
    secondaryHref: "/docs/aegis",
  },
  providence: {
    headline: "See threats before they strike",
    subtext: "Predictive security that anticipates attacks. Defense through foresight.",
    primaryLabel: "Enter Providence",
    primaryHref: "/clusters/providence",
    secondaryLabel: "View threat intelligence",
    secondaryHref: "/docs/providence",
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const fadeUpTransition = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

/**
 * CTASection - Final call-to-action section for ClusterHero pages.
 * Features cluster-specific messaging, animated entrance on scroll,
 * and a subtle gradient background matching the cluster theme.
 */
export function CTASection({ clusterId, className }: CTASectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const config = getClusterConfigWithResolvedUrls(clusterId);
  const content = CTA_CONTENT[clusterId];

  return (
    <section
      ref={ref}
      className={cn("relative py-24 md:py-32 overflow-hidden", className)}
      style={
        {
          "--cluster-accent": config.accentColor,
          "--cluster-accent-rgb": config.accentColorRGB,
        } as React.CSSProperties
      }
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(var(--cluster-accent-rgb), 0.12) 0%, transparent 70%),
            linear-gradient(to bottom, transparent 0%, rgba(var(--cluster-accent-rgb), 0.04) 50%, transparent 100%)
          `,
        }}
      />

      {/* Decorative line */}
      <motion.div
        variants={scaleVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ ...fadeUpTransition, delay: 0 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24"
        style={{
          background: `linear-gradient(to bottom, transparent, var(--cluster-accent), transparent)`,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...fadeUpTransition, delay: 0.1 }}
          className="mb-8"
        >
          <span
            className="inline-block font-mono text-[10px] uppercase tracking-[0.3em] px-4 py-2 rounded-full border"
            style={{
              borderColor: "rgba(var(--cluster-accent-rgb), 0.3)",
              color: "var(--cluster-accent)",
            }}
          >
            Ready to launch?
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          variants={fadeUpVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...fadeUpTransition, delay: 0.2 }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-[1.1] tracking-tight"
        >
          {content.headline}
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={fadeUpVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...fadeUpTransition, delay: 0.35 }}
          className="text-lg md:text-xl text-white/60 mb-12 max-w-xl mx-auto leading-relaxed font-light"
        >
          {content.subtext}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...fadeUpTransition, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          {/* Primary CTA */}
          <motion.a
            href={content.primaryHref}
            className="group relative px-10 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-neutral-900 overflow-hidden"
            style={{ backgroundColor: "var(--cluster-accent)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* Shine effect on hover */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
                transform: "translateX(-100%)",
                animation: "none",
              }}
            />
            <span className="relative z-10">{content.primaryLabel}</span>
          </motion.a>

          {/* Secondary link */}
          <motion.a
            href={content.secondaryHref}
            className="group flex items-center gap-2 text-sm font-medium tracking-wide text-white/70 hover:text-white transition-colors duration-300"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <span>{content.secondaryLabel}</span>
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </motion.a>
        </motion.div>
      </div>

      {/* Bottom decorative element */}
      <motion.div
        variants={scaleVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ ...fadeUpTransition, delay: 0.7 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3"
      >
        <div
          className="w-8 h-px"
          style={{ backgroundColor: "rgba(var(--cluster-accent-rgb), 0.3)" }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "var(--cluster-accent)" }}
        />
        <div
          className="w-8 h-px"
          style={{ backgroundColor: "rgba(var(--cluster-accent-rgb), 0.3)" }}
        />
      </motion.div>
    </section>
  );
}
