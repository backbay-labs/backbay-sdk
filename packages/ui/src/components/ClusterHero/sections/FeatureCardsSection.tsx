"use client";

import { motion } from "framer-motion";
import {
  Network,
  FlaskConical,
  Users,
  Archive,
  Server,
  Cpu,
  Globe,
  Shield,
  Paintbrush,
  GitBranch,
  FolderGit2,
  Send,
  BarChart3,
  Activity,
  Zap,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { ClusterId } from "../types";
import { CLUSTER_CONFIGS } from "../config";

export interface FeatureCardsSectionProps {
  /** Cluster identifier to determine feature set and accent color */
  clusterId: ClusterId;
  /** Additional CSS classes */
  className?: string;
}

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CLUSTER_FEATURES: Record<ClusterId, FeatureCard[]> = {
  alexandria: [
    {
      icon: Network,
      title: "Knowledge Graph",
      description:
        "Traverse interconnected concepts and discover emergent patterns across your entire knowledge base.",
    },
    {
      icon: FlaskConical,
      title: "Research Tools",
      description:
        "Advanced query interfaces and analytical instruments for deep exploration and synthesis.",
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "Real-time co-authoring, annotation threads, and shared workspaces for collective intelligence.",
    },
    {
      icon: Archive,
      title: "Archives",
      description:
        "Immutable versioning and temporal navigation through the complete history of your work.",
    },
  ],

  alpha: [
    {
      icon: Server,
      title: "Infrastructure",
      description:
        "Elastic compute fabric that scales seamlessly from prototype to planet-scale deployments.",
    },
    {
      icon: Cpu,
      title: "Compute",
      description:
        "GPU clusters, inference endpoints, and batch processing with automatic resource optimization.",
    },
    {
      icon: Globe,
      title: "Networking",
      description:
        "Global edge presence with intelligent routing and sub-millisecond latency guarantees.",
    },
    {
      icon: Shield,
      title: "Security",
      description:
        "Zero-trust architecture, end-to-end encryption, and comprehensive audit trails.",
    },
  ],

  opus: [
    {
      icon: Activity,
      title: "Diagnostic Engines",
      description:
        "AI-powered analysis pipelines for medical imaging, pathology, and patient data synthesis.",
    },
    {
      icon: Network,
      title: "Care Coordination",
      description:
        "Autonomous orchestration of treatment workflows across provider networks and facilities.",
    },
    {
      icon: Shield,
      title: "Compliance Layer",
      description:
        "Built-in HIPAA, SOC2, and regulatory framework adherence with continuous auditing.",
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description:
        "Sub-second diagnostic latency with edge deployment for critical care applications.",
    },
  ],

  baia: [
    {
      icon: Paintbrush,
      title: "Neural Canvas",
      description:
        "Generative models that transform prompts into visual masterpieces across any style or medium.",
    },
    {
      icon: Activity,
      title: "Sound Synthesis",
      description:
        "AI composition engines for music, ambient soundscapes, and professional audio design.",
    },
    {
      icon: GitBranch,
      title: "Style Transfer",
      description:
        "Cross-modal translation between artistic mediums, formats, and aesthetic vocabularies.",
    },
    {
      icon: Send,
      title: "Instant Publishing",
      description:
        "One-click minting and distribution to galleries, marketplaces, and streaming platforms.",
    },
  ],

  kdot: [
    {
      icon: Network,
      title: "Mesh Networking",
      description:
        "Self-healing topology that routes around failures and optimizes paths in real-time.",
    },
    {
      icon: Globe,
      title: "Protocol Bridge",
      description:
        "Universal translation layer connecting disparate systems and legacy infrastructure.",
    },
    {
      icon: Activity,
      title: "Traffic Analysis",
      description:
        "Deep packet inspection and flow analytics for network optimization and debugging.",
    },
    {
      icon: Zap,
      title: "Edge Compute",
      description:
        "Distributed processing at the network edge for ultra-low latency applications.",
    },
  ],

  aegis: [
    {
      icon: Shield,
      title: "Threat Protection",
      description:
        "Multi-layered defense with AI-powered detection of zero-day exploits and advanced threats.",
    },
    {
      icon: Server,
      title: "Access Management",
      description:
        "Fine-grained permissions, MFA enforcement, and just-in-time privilege escalation.",
    },
    {
      icon: Activity,
      title: "Security Monitoring",
      description:
        "24/7 SOC integration with automated incident response and forensic analysis.",
    },
    {
      icon: Archive,
      title: "Compliance",
      description:
        "Automated policy enforcement with continuous auditing for SOC2, HIPAA, and GDPR.",
    },
  ],

  providence: [
    {
      icon: Activity,
      title: "Threat Intelligence",
      description:
        "Predictive threat analysis powered by global telemetry and machine learning models.",
    },
    {
      icon: Network,
      title: "Attack Surface Mapping",
      description:
        "Continuous discovery and assessment of exposed assets and potential entry points.",
    },
    {
      icon: Zap,
      title: "Incident Response",
      description:
        "Automated containment, forensic collection, and guided remediation playbooks.",
    },
    {
      icon: Shield,
      title: "Security Posture",
      description:
        "Real-time scoring and recommendations to strengthen your defensive stance.",
    },
  ],
};

function FeatureCard({
  feature,
  index,
  accentColor,
}: {
  feature: FeatureCard;
  index: number;
  accentColor: string;
}) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
    >
      {/* Glass card */}
      <div
        className={cn(
          "relative h-full p-6 rounded-lg",
          "bg-white/[0.03] backdrop-blur-md",
          "border border-white/[0.08]",
          "transition-all duration-500 ease-out",
          "hover:bg-white/[0.06] hover:border-white/[0.15]",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        )}
        style={
          {
            "--card-accent": accentColor,
          } as React.CSSProperties
        }
      >
        {/* Accent glow on hover */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500",
            "group-hover:opacity-100"
          )}
          style={{
            background: `radial-gradient(ellipse at top left, ${accentColor}15 0%, transparent 50%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon container */}
          <div
            className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center mb-4",
              "bg-white/[0.05] border border-white/[0.08]",
              "transition-all duration-300",
              "group-hover:border-[var(--card-accent)]/30"
            )}
          >
            <Icon
              className="w-5 h-5 text-white/70 transition-colors duration-300 group-hover:text-[var(--card-accent)]"
              strokeWidth={1.5}
            />
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-medium text-white/90 mb-2 tracking-wide",
              "transition-colors duration-300",
              "group-hover:text-white"
            )}
          >
            {feature.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/50 leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Corner accent line */}
        <div
          className={cn(
            "absolute top-0 left-6 w-8 h-px",
            "bg-gradient-to-r from-transparent via-[var(--card-accent)]/50 to-transparent",
            "opacity-0 transition-opacity duration-500",
            "group-hover:opacity-100"
          )}
        />
      </div>
    </motion.div>
  );
}

/**
 * FeatureCardsSection displays a grid of feature cards specific to each cluster.
 * Each card animates in with a staggered fade-up effect when scrolled into view.
 * Cards feature glass-morphism styling with the cluster's accent color for highlights.
 */
export function FeatureCardsSection({
  clusterId,
  className,
}: FeatureCardsSectionProps) {
  const features = CLUSTER_FEATURES[clusterId];
  const config = CLUSTER_CONFIGS[clusterId];

  return (
    <section
      className={cn("w-full px-8 md:px-16 py-24", className)}
      style={
        {
          "--cluster-accent": config.accentColor,
        } as React.CSSProperties
      }
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
          Capabilities
        </span>
        <div
          className="mt-2 h-px w-8"
          style={{ backgroundColor: config.accentColor }}
        />
      </motion.div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            accentColor={config.accentColor}
          />
        ))}
      </div>
    </section>
  );
}

export default FeatureCardsSection;
