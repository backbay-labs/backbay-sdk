"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";
import { ClusterHero } from "./ClusterHero.js";
import { getClusterConfigWithResolvedUrls } from "./config.js";
import type { ClusterId, ClusterConfig } from "./types.js";

// ============================================================================
// Types
// ============================================================================

export interface ClusterHeroPageProps {
  clusterId: ClusterId;
  className?: string;
}

interface SectionProps {
  clusterId: ClusterId;
  config: ClusterConfig;
}

// ============================================================================
// Feature Cards Section
// ============================================================================

const FEATURE_DATA: Record<ClusterId, Array<{ title: string; description: string; icon: string }>> = {
  alexandria: [
    { title: "Knowledge Graph", description: "Interconnected data structures that compound understanding over time", icon: "book" },
    { title: "Semantic Search", description: "Query across documents with natural language understanding", icon: "search" },
    { title: "Version History", description: "Every edit preserved, every branch trackable", icon: "history" },
  ],
  alpha: [
    { title: "Genesis Protocol", description: "The foundational layer from which all clusters derive", icon: "origin" },
    { title: "Core APIs", description: "Stable interfaces that power the entire ecosystem", icon: "api" },
    { title: "Identity Layer", description: "Sovereign authentication across all surfaces", icon: "key" },
  ],
  opus: [
    { title: "Diagnostic Engines", description: "AI-powered analysis pipelines for medical imaging and patient data", icon: "scan" },
    { title: "Care Protocols", description: "Autonomous coordination of treatment workflows and provider networks", icon: "workflow" },
    { title: "Compliance Layer", description: "Built-in HIPAA, SOC2, and regulatory framework adherence", icon: "shield" },
  ],
  baia: [
    { title: "Neural Canvas", description: "Generative models that transform prompts into visual masterpieces", icon: "palette" },
    { title: "Sound Synthesis", description: "AI composition engines for music, ambience, and audio design", icon: "waveform" },
    { title: "Style Transfer", description: "Cross-modal translation between artistic mediums and formats", icon: "layers" },
  ],
  kdot: [
    { title: "Mesh Network", description: "Distributed connectivity that routes around failures", icon: "network" },
    { title: "Protocol Layer", description: "Universal translation between disparate systems", icon: "protocol" },
    { title: "Node Discovery", description: "Automatic peer detection and topology mapping", icon: "discovery" },
  ],
  aegis: [
    { title: "Threat Detection", description: "Real-time monitoring for anomalous patterns", icon: "shield" },
    { title: "Access Control", description: "Fine-grained permissions and authentication flows", icon: "lock" },
    { title: "Audit Trail", description: "Immutable logs of every action and decision", icon: "log" },
  ],
  providence: [
    { title: "Threat Intelligence", description: "Predictive analysis and proactive defense postures", icon: "radar" },
    { title: "Incident Response", description: "Automated containment and remediation workflows", icon: "alert" },
    { title: "Compliance Engine", description: "Continuous verification against security frameworks", icon: "certificate" },
  ],
};

function FeatureCard({
  title,
  description,
  accentColor,
  index
}: {
  title: string;
  description: string;
  accentColor: string;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="group relative p-8 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 transition-colors duration-300"
    >
      <div
        className="absolute top-0 left-0 w-1 h-0 group-hover:h-full transition-all duration-500"
        style={{ backgroundColor: accentColor }}
      />
      <h3 className="font-serif text-2xl text-white mb-3 tracking-wide">
        {title}
      </h3>
      <p className="text-neutral-400 leading-relaxed">
        {description}
      </p>
    </motion.article>
  );
}

export function FeatureCardsSection({ clusterId, config }: SectionProps) {
  const features = FEATURE_DATA[clusterId];

  return (
    <section className="relative z-10 bg-zinc-950 py-32 px-16">
      <div className="max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span
            className="font-mono text-xs uppercase tracking-[0.2em]"
            style={{ color: config.accentColor }}
          >
            Capabilities
          </span>
          <h2 className="font-serif text-5xl text-white mt-4 tracking-wide">
            What defines {config.name}
          </h2>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              accentColor={config.accentColor}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Cluster Stats Section
// ============================================================================

const STATS_DATA: Record<ClusterId, Array<{ value: string; label: string }>> = {
  alexandria: [
    { value: "2.4M", label: "Documents Indexed" },
    { value: "847K", label: "Active Queries/Day" },
    { value: "99.97%", label: "Uptime" },
    { value: "12ms", label: "Avg Response" },
  ],
  alpha: [
    { value: "1.0", label: "Protocol Version" },
    { value: "∞", label: "Scalability" },
    { value: "100%", label: "Backwards Compatible" },
    { value: "0", label: "Breaking Changes" },
  ],
  opus: [
    { value: "2.4M", label: "Diagnostics Processed" },
    { value: "847", label: "Active Protocols" },
    { value: "99.97%", label: "Compliance Rate" },
    { value: "< 2s", label: "Analysis Latency" },
  ],
  baia: [
    { value: "4.2M", label: "Works Generated" },
    { value: "156K", label: "Active Artists" },
    { value: "847K", label: "Daily Renders" },
    { value: "12TB", label: "Media Produced" },
  ],
  kdot: [
    { value: "1.2M", label: "Connected Nodes" },
    { value: "47ms", label: "Avg Latency" },
    { value: "99.99%", label: "Uptime" },
    { value: "8.4PB", label: "Daily Throughput" },
  ],
  aegis: [
    { value: "0", label: "Breaches" },
    { value: "2.1B", label: "Threats Blocked" },
    { value: "99.97%", label: "Detection Rate" },
    { value: "< 1s", label: "Response Time" },
  ],
  providence: [
    { value: "24/7", label: "Monitoring" },
    { value: "847K", label: "Threats Analyzed" },
    { value: "99.99%", label: "Uptime" },
    { value: "< 50ms", label: "Alert Latency" },
  ],
};

function StatBlock({
  value,
  label,
  accentColor,
  index
}: {
  value: string;
  label: string;
  accentColor: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="text-center p-8"
    >
      <div
        className="font-mono text-5xl md:text-6xl font-light mb-3"
        style={{ color: accentColor }}
      >
        {value}
      </div>
      <div className="text-neutral-400 uppercase tracking-[0.15em] text-sm">
        {label}
      </div>
    </motion.div>
  );
}

export function ClusterStatsSection({ clusterId, config }: SectionProps) {
  const stats = STATS_DATA[clusterId];

  return (
    <section className="relative z-10 bg-black py-32 px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-px mb-16 origin-left"
          style={{ backgroundColor: config.accentColor }}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatBlock
              key={stat.label}
              value={stat.value}
              label={stat.label}
              accentColor={config.accentColor}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-px mt-16 origin-right"
          style={{ backgroundColor: config.accentColor }}
        />
      </div>
    </section>
  );
}

// ============================================================================
// CTA Section
// ============================================================================

const CTA_DATA: Record<ClusterId, { headline: string; subtext: string; buttonLabel: string }> = {
  alexandria: {
    headline: "Begin your research",
    subtext: "Join thousands of scholars building the world's knowledge commons",
    buttonLabel: "Enter Alexandria",
  },
  alpha: {
    headline: "Start from the source",
    subtext: "Everything begins here. Every journey starts with Alpha.",
    buttonLabel: "Initialize",
  },
  opus: {
    headline: "Healthcare, autonomous",
    subtext: "Diagnostic pipelines and care protocols that run themselves.",
    buttonLabel: "Enter Opus",
  },
  baia: {
    headline: "Art from the machine",
    subtext: "Generative works that blur the line between human and artificial creativity.",
    buttonLabel: "Open Studio",
  },
  kdot: {
    headline: "Join the mesh",
    subtext: "Connect to the network that never sleeps.",
    buttonLabel: "Connect Now",
  },
  aegis: {
    headline: "Secure your realm",
    subtext: "Protection that scales with your ambition.",
    buttonLabel: "Activate Shield",
  },
  providence: {
    headline: "Foresee. Prevent. Prevail.",
    subtext: "Security through foresight. Protection before the threat arrives.",
    buttonLabel: "Enter Providence",
  },
};

export function CTASection({ clusterId, config }: SectionProps) {
  const cta = CTA_DATA[clusterId];

  return (
    <section className="relative z-10 bg-zinc-950 py-48 px-16">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="font-serif text-6xl md:text-7xl text-white tracking-wide mb-8 leading-[1.1]">
          {cta.headline}
        </h2>
        <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          {cta.subtext}
        </p>
        <a
          href={`/clusters/${clusterId}`}
          className="inline-block px-12 py-5 text-lg font-medium tracking-wider uppercase text-neutral-900 transition-all duration-300 hover:brightness-110 hover:scale-105"
          style={{ backgroundColor: config.accentColor }}
        >
          {cta.buttonLabel}
        </a>
      </motion.div>
    </section>
  );
}

// ============================================================================
// Main ClusterHeroPage Component
// ============================================================================

/**
 * ClusterHeroPage composes a full landing page experience for a cluster.
 *
 * Structure:
 * - Sticky hero (100vh) with scroll-based parallax and dimming
 * - Feature cards section scrolling over the hero
 * - Stats section with animated counters
 * - CTA section with final call to action
 *
 * The hero uses sticky positioning so it remains as a background while
 * subsequent sections with solid backgrounds scroll over it.
 */
export function ClusterHeroPage({ clusterId, className }: ClusterHeroPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getClusterConfigWithResolvedUrls(clusterId);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Hero dims from opacity 1 to 0.3 as you scroll through first 20% of page
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.3]);

  // Content has subtle parallax - moves up slower than scroll
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  return (
    <main
      ref={containerRef}
      className={cn(
        "relative scroll-smooth",
        className
      )}
    >
      {/* Sticky hero container */}
      <motion.div
        className="sticky top-0 h-screen overflow-hidden"
        style={{ opacity: heroOpacity }}
      >
        <motion.div style={{ y: heroY }} className="h-full">
          <ClusterHero cluster={clusterId} className="h-full" />
        </motion.div>
      </motion.div>

      {/* Scroll sections - these scroll over the sticky hero */}
      <div className="relative">
        <FeatureCardsSection clusterId={clusterId} config={config} />
        <ClusterStatsSection clusterId={clusterId} config={config} />
        <CTASection clusterId={clusterId} config={config} />
      </div>
    </main>
  );
}

export default ClusterHeroPage;
