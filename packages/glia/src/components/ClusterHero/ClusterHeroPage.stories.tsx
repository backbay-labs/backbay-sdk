import type { Meta, StoryObj } from "@storybook/react";
import { ClusterHeroPage } from "./ClusterHeroPage.js";
import { CLUSTER_CONFIGS } from "./config.js";
import type { ClusterId } from "./types.js";

/**
 * ClusterHeroPage is the full landing page experience for a cluster.
 *
 * It composes multiple sections into a cohesive scroll-driven narrative:
 *
 * ## Page Structure
 *
 * 1. **Hero Section** (100vh, sticky)
 *    - Full-viewport video background with atmospheric effects
 *    - Cluster branding, tagline, and action buttons
 *    - Remains fixed as content scrolls over it
 *
 * 2. **Feature Cards Section**
 *    - 3-column grid showcasing cluster capabilities
 *    - Cards animate in with staggered reveals
 *    - Accent-colored hover effects
 *
 * 3. **Stats Section**
 *    - 4 key metrics displayed prominently
 *    - Animated entry with scale transitions
 *    - Bordered by accent-colored divider lines
 *
 * 4. **CTA Section**
 *    - Final call-to-action with cluster-specific messaging
 *    - Large typography and prominent button
 *
 * ## Scroll Behavior
 *
 * The page uses Framer Motion's scroll-linked animations:
 *
 * - **Hero Dimming**: As you scroll through the first 15% of the page,
 *   the hero opacity transitions from 1.0 to 0.3, creating a fade effect
 *
 * - **Parallax Effect**: Hero content moves upward at a slower rate than
 *   scroll speed, creating depth (0 to -100px over 30% scroll)
 *
 * - **Section Reveals**: Each section uses `whileInView` animations that
 *   trigger when elements enter the viewport
 *
 * ## Customization Per Cluster
 *
 * Each cluster automatically receives its unique:
 * - Video background and atmospheric effects
 * - Accent color for highlights and interactions
 * - Feature descriptions and statistics
 * - CTA messaging and button labels
 *
 * To add a new cluster, extend the data in:
 * - `./config.ts` - Visual identity and atmosphere
 * - `./ClusterHeroPage.tsx` - FEATURE_DATA, STATS_DATA, CTA_DATA
 *
 * ## Usage
 *
 * ```tsx
 * import { ClusterHeroPage } from '@backbay/glia/components';
 *
 * function AlexandriaLanding() {
 *   return <ClusterHeroPage clusterId="alexandria" />;
 * }
 * ```
 */
const meta: Meta<typeof ClusterHeroPage> = {
  title: "Components/ClusterHero/ClusterHeroPage",
  component: ClusterHeroPage,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    docs: {
      description: {
        component: `
Full cluster landing page with scroll-triggered sections.

## Sections
1. **Hero** (100vh) - Sticky video background with atmosphere effects
2. **Features** - 3-column grid of cluster capabilities with staggered reveals
3. **Stats** - Animated metric counters with accent-colored borders
4. **CTA** - Final call to action with cluster-specific messaging

## Scroll Behavior
- Hero video dims from 100% to 30% opacity as you scroll
- Hero content has subtle parallax (moves slower than scroll)
- Sections reveal with staggered animations as they enter viewport
- Feature cards animate in with 150ms delays between each
- Stats scale up from 90% with 100ms staggers

## Testing Scroll
To test the scroll behavior in Storybook:
1. Click on a story in the canvas
2. Use mouse wheel or trackpad to scroll
3. Observe the hero dimming and section reveals
4. For best experience, use fullscreen mode (press F)
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    clusterId: {
      control: "select",
      options: Object.keys(CLUSTER_CONFIGS) as ClusterId[],
      description: "The cluster to display",
      table: {
        type: { summary: "ClusterId" },
        defaultValue: { summary: "alexandria" },
      },
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the page container",
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "#000",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClusterHeroPage>;

/**
 * Default story showing the Alexandria cluster landing page.
 * Scroll down to see the feature cards, stats, and CTA sections reveal.
 */
export const Default: Story = {
  args: {
    clusterId: "alexandria",
  },
};

/**
 * Alexandria - "Where knowledge compounds"
 *
 * A landing page for scholars and researchers. Features:
 * - **Visual**: Golden dust motes, godrays from upper right
 * - **Features**: Knowledge Graph, Semantic Search, Version History
 * - **Stats**: 2.4M documents, 847K queries/day, 99.97% uptime
 * - **CTA**: "Begin your research" / "Enter Alexandria"
 *
 * The golden accent color (#C9A227) evokes ancient libraries
 * and accumulated wisdom.
 */
export const Alexandria: Story = {
  args: {
    clusterId: "alexandria",
  },
};

/**
 * Alpha - "The origin of everything"
 *
 * The foundational cluster landing page. Features:
 * - **Visual**: Clean white fog, primordial atmosphere
 * - **Features**: Genesis Protocol, Core APIs, Identity Layer
 * - **Stats**: Version 1.0, infinite scalability, 100% compatibility
 * - **CTA**: "Start from the source" / "Initialize"
 *
 * The white accent color (#E8E8E8) represents purity
 * and infinite potential.
 */
export const Alpha: Story = {
  args: {
    clusterId: "alpha",
  },
};

/**
 * Opus - "Craft that endures"
 *
 * A landing page for creators and artisans. Features:
 * - **Visual**: Copper tones, dense dust with bloom lighting
 * - **Features**: Artifact Forge, Quality Gates, Collaboration
 * - **Stats**: 156K artifacts, 23K creators, 4.9 quality score
 * - **CTA**: "Create your masterpiece" / "Open Workshop"
 *
 * The copper accent color (#B87333) evokes forged metal
 * and timeless craftsmanship.
 */
export const Opus: Story = {
  args: {
    clusterId: "opus",
  },
};

/**
 * Baia - "Where ambition rests"
 *
 * A landing page for restoration and reflection. Features:
 * - **Visual**: Metallic gold, godrays from directly above
 * - **Features**: Rest Protocols, Progress Archive, Reflection Space
 * - **Stats**: 89% recovery rate, 340 avg rest hours, 94% return rate
 * - **CTA**: "Rest is earned" / "Begin Rest"
 *
 * The gold accent color (#D4AF37) evokes Mediterranean
 * golden hour and earned tranquility.
 */
export const Baia: Story = {
  args: {
    clusterId: "baia",
  },
};

/**
 * Scroll Behavior Demo
 *
 * This story demonstrates the scroll-linked animations in action.
 *
 * ## How to Test
 *
 * 1. **Enter fullscreen mode** by pressing `F` or clicking the expand icon
 * 2. **Scroll slowly** through the page to observe:
 *    - Hero dimming (100% -> 30% opacity over first 15% of scroll)
 *    - Hero parallax (content moves up slower than scroll)
 *    - Feature cards entering with staggered delays
 *    - Stats scaling up with staggered timing
 *    - CTA section fading in from below
 *
 * 3. **Scroll back up** to see the hero return to full brightness
 *
 * ## Implementation Notes
 *
 * The scroll behavior uses Framer Motion's `useScroll` and `useTransform`:
 *
 * ```tsx
 * const { scrollYProgress } = useScroll({
 *   target: containerRef,
 *   offset: ["start start", "end start"],
 * });
 *
 * // Hero dims from 1 to 0.3 over first 15% of scroll
 * const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.3]);
 *
 * // Parallax: content moves up 100px over first 30% of scroll
 * const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
 * ```
 *
 * Sections use `whileInView` for reveal animations with viewport margins.
 */
export const ScrollBehavior: Story = {
  args: {
    clusterId: "alexandria",
  },
  parameters: {
    docs: {
      description: {
        story: `
### Scroll Interaction Guide

This story is designed to demonstrate the scroll-linked animations.

**Setup:**
1. Click the "Docs" tab above, then click "Canvas" to switch to canvas view
2. Or use the Canvas view directly and press F for fullscreen

**Observe:**
- **0-15% scroll**: Hero fades from 100% to 30% opacity
- **0-30% scroll**: Hero content parallaxes upward by 100px
- **Feature section**: Cards animate in with 150ms staggers
- **Stats section**: Numbers scale up from 90% with 100ms staggers
- **CTA section**: Fades in and slides up from 60px below

**Technical Details:**
The sticky hero (position: sticky; top: 0) remains in place while
subsequent sections with solid backgrounds scroll over it, creating
the layered reveal effect.
        `,
      },
    },
  },
};

/**
 * All Clusters Overview
 *
 * A quick reference showing the hero portion of each cluster.
 * For full scroll behavior, view individual cluster stories.
 *
 * Note: This view shows the heroes at 50vh each, which compresses
 * the atmospheric effects. View individual stories for the full experience.
 */
export const AllClustersPreview: Story = {
  tags: ["!test"], // renders all cluster pages, times out in headless
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        width: "100%",
        minHeight: "200vh",
        gap: 0,
      }}
    >
      {(Object.keys(CLUSTER_CONFIGS) as ClusterId[]).map((clusterId) => (
        <div
          key={clusterId}
          style={{
            position: "relative",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <ClusterHeroPage clusterId={clusterId} />
          <div
            style={{
              position: "fixed",
              top: clusterId === "alexandria" || clusterId === "alpha" ? 16 : "auto",
              bottom: clusterId === "opus" || clusterId === "baia" ? 16 : "auto",
              left: clusterId === "alexandria" || clusterId === "opus" ? 16 : "auto",
              right: clusterId === "alpha" || clusterId === "baia" ? 16 : "auto",
              color: "#fff",
              fontSize: 11,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              opacity: 0.5,
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              zIndex: 100,
              padding: "4px 8px",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(4px)",
            }}
          >
            {clusterId}
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Overview of all four cluster landing pages. Each quadrant shows a
different cluster. Scroll within each to see the full page experience.

For the best scroll behavior demonstration, view individual cluster
stories in fullscreen mode.
        `,
      },
    },
  },
};
