"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { ClusterConfig, ButtonConfig } from "./types.js";

export interface HeroContentProps {
  /** Cluster configuration containing name, tagline, buttons, and accent color */
  config: ClusterConfig;
  /** Additional CSS classes */
  className?: string;
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const fadeUpTransition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

function ClusterBadge({ delay }: { delay: number }) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={{ ...fadeUpTransition, delay }}
      className="mb-6"
    >
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/80">
        CLUSTERS
      </span>
      <div
        className="mt-2 h-px w-12"
        style={{ backgroundColor: "var(--cluster-accent)" }}
      />
    </motion.div>
  );
}

function ClusterTitle({ name, delay }: { name: string; delay: number }) {
  return (
    <motion.h1
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={{ ...fadeUpTransition, delay }}
      className="font-serif text-7xl md:text-8xl uppercase tracking-[0.15em] text-white mb-6 leading-[0.9]"
    >
      {name}
    </motion.h1>
  );
}

function Tagline({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.p
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={{ ...fadeUpTransition, delay }}
      className="font-serif text-xl md:text-2xl text-white/70 max-w-md italic mb-10 leading-relaxed"
    >
      {text}
    </motion.p>
  );
}

function HeroButton({ button }: { button: ButtonConfig }) {
  const baseClasses =
    "px-6 py-3 text-sm font-medium tracking-wider uppercase transition-all duration-300";

  const variantClasses: Record<ButtonConfig["variant"], string> = {
    primary: "text-neutral-900 hover:brightness-110",
    secondary: "border hover:bg-[var(--cluster-accent)]/10",
    ghost: "border border-white/20 text-white/70 hover:border-white/40 hover:text-white",
  };

  const variantStyles: Record<ButtonConfig["variant"], React.CSSProperties> = {
    primary: { backgroundColor: "var(--cluster-accent)" },
    secondary: {
      borderColor: "var(--cluster-accent)",
      color: "var(--cluster-accent)",
    },
    ghost: {},
  };

  return (
    <a
      href={button.href}
      className={cn(baseClasses, variantClasses[button.variant])}
      style={variantStyles[button.variant]}
    >
      {button.label}
    </a>
  );
}

function ButtonGroup({
  buttons,
  delay,
}: {
  buttons: ButtonConfig[];
  delay: number;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={{ ...fadeUpTransition, delay }}
      className="flex flex-wrap gap-4"
    >
      {buttons.map((button) => (
        <HeroButton key={button.label} button={button} />
      ))}
    </motion.div>
  );
}

/**
 * HeroContent renders the text overlay for the ClusterHero component.
 * Includes the badge, title, tagline, and action buttons with staggered
 * fade-up animations on load.
 */
export function HeroContent({ config, className }: HeroContentProps) {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 pb-20 pl-16 z-10",
        className
      )}
      style={{ "--cluster-accent": config.accentColor } as React.CSSProperties}
    >
      <ClusterBadge delay={0.2} />
      <ClusterTitle name={config.name} delay={0.4} />
      <Tagline text={config.tagline} delay={0.6} />
      <ButtonGroup buttons={config.buttons} delay={0.8} />
    </div>
  );
}
