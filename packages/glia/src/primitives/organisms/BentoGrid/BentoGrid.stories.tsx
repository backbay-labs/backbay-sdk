import type { Meta, StoryObj } from "@storybook/react";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { Sparkles, Zap, Shield, Target, BarChart3, BookOpen } from "lucide-react";

const meta: Meta<typeof BentoGrid> = {
  title: "Primitives/Organisms/BentoGrid",
  component: BentoGrid,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BentoGrid>;

const PlaceholderHeader = ({ gradient }: { gradient: string }) => (
  <div
    className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl ${gradient}`}
  />
);

export const Default: Story = {
  render: () => (
    <BentoGrid className="max-w-4xl">
      <BentoGridItem
        title="Feature One"
        description="A powerful feature that helps you accomplish more with less effort."
        header={<PlaceholderHeader gradient="bg-gradient-to-br from-cyan-neon/20 to-transparent" />}
        icon={<Sparkles className="h-4 w-4 text-cyan-neon" />}
      />
      <BentoGridItem
        title="Feature Two"
        description="Streamline your workflow with intelligent automation."
        header={<PlaceholderHeader gradient="bg-gradient-to-br from-magenta-neon/20 to-transparent" />}
        icon={<Zap className="h-4 w-4 text-magenta-neon" />}
      />
      <BentoGridItem
        title="Feature Three"
        description="Keep your data safe with enterprise-grade security."
        header={<PlaceholderHeader gradient="bg-gradient-to-br from-emerald-neon/20 to-transparent" />}
        icon={<Shield className="h-4 w-4 text-emerald-neon" />}
      />
    </BentoGrid>
  ),
};

export const FeatureShowcase: Story = {
  render: () => (
    <BentoGrid className="max-w-5xl">
      <BentoGridItem
        className="md:col-span-2"
        title="AI-Powered Learning"
        description="Our intelligent system adapts to your learning style, providing personalized recommendations and real-time feedback."
        header={
          <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-cyan-neon/20 via-transparent to-magenta-neon/10 items-center justify-center">
            <Sparkles className="h-16 w-16 text-cyan-neon" />
          </div>
        }
        icon={<Sparkles className="h-4 w-4 text-cyan-neon" />}
      />
      <BentoGridItem
        title="Progress Tracking"
        description="Visualize your journey with detailed analytics and insights."
        header={<PlaceholderHeader gradient="bg-gradient-to-br from-emerald-neon/20 to-transparent" />}
        icon={<BarChart3 className="h-4 w-4 text-emerald-neon" />}
      />
      <BentoGridItem
        title="Goal Setting"
        description="Set and achieve your targets with smart milestones."
        header={<PlaceholderHeader gradient="bg-gradient-to-br from-orange-500/20 to-transparent" />}
        icon={<Target className="h-4 w-4 text-orange-500" />}
      />
      <BentoGridItem
        className="md:col-span-2"
        title="Comprehensive Library"
        description="Access thousands of curated resources, practice questions, and study materials all in one place."
        header={
          <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-magenta-neon/20 via-transparent to-cyan-neon/10 items-center justify-center">
            <BookOpen className="h-16 w-16 text-magenta-neon" />
          </div>
        }
        icon={<BookOpen className="h-4 w-4 text-magenta-neon" />}
      />
    </BentoGrid>
  ),
};

export const ProductFeatures: Story = {
  render: () => (
    <BentoGrid className="max-w-4xl">
      <BentoGridItem
        title="Lightning Fast"
        description="Optimized for speed with sub-millisecond response times."
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 items-center justify-center">
            <Zap className="h-10 w-10 text-yellow-500" />
          </div>
        }
        icon={<Zap className="h-4 w-4 text-yellow-500" />}
      />
      <BentoGridItem
        title="Secure by Default"
        description="Enterprise-grade security built into every layer."
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-neon/20 to-cyan-neon/10 items-center justify-center">
            <Shield className="h-10 w-10 text-emerald-neon" />
          </div>
        }
        icon={<Shield className="h-4 w-4 text-emerald-neon" />}
      />
      <BentoGridItem
        title="AI-Powered"
        description="Smart features that learn and adapt to your needs."
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-magenta-neon/20 to-cyan-neon/10 items-center justify-center">
            <Sparkles className="h-10 w-10 text-magenta-neon" />
          </div>
        }
        icon={<Sparkles className="h-4 w-4 text-magenta-neon" />}
      />
    </BentoGrid>
  ),
};

export const SingleColumnMobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <BentoGrid className="grid-cols-1">
      <BentoGridItem
        title="Mobile First"
        description="Designed for touch interfaces and small screens."
        header={<PlaceholderHeader gradient="bg-gradient-to-br from-cyan-neon/20 to-transparent" />}
        icon={<Sparkles className="h-4 w-4 text-cyan-neon" />}
      />
      <BentoGridItem
        title="Responsive"
        description="Adapts seamlessly to any screen size."
        header={<PlaceholderHeader gradient="bg-gradient-to-br from-magenta-neon/20 to-transparent" />}
        icon={<Zap className="h-4 w-4 text-magenta-neon" />}
      />
    </BentoGrid>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <BentoGrid className="max-w-4xl gap-6">
      <BentoGridItem
        className="bg-gradient-to-br from-cyan-neon/10 to-transparent border-cyan-neon/30"
        title="Cyan Theme"
        description="Custom styled with cyan accents and gradient background."
        header={<PlaceholderHeader gradient="bg-cyan-neon/10" />}
        icon={<Sparkles className="h-4 w-4 text-cyan-neon" />}
      />
      <BentoGridItem
        className="bg-gradient-to-br from-magenta-neon/10 to-transparent border-magenta-neon/30"
        title="Magenta Theme"
        description="Custom styled with magenta accents and gradient background."
        header={<PlaceholderHeader gradient="bg-magenta-neon/10" />}
        icon={<Zap className="h-4 w-4 text-magenta-neon" />}
      />
      <BentoGridItem
        className="bg-gradient-to-br from-emerald-neon/10 to-transparent border-emerald-neon/30"
        title="Emerald Theme"
        description="Custom styled with emerald accents and gradient background."
        header={<PlaceholderHeader gradient="bg-emerald-neon/10" />}
        icon={<Shield className="h-4 w-4 text-emerald-neon" />}
      />
    </BentoGrid>
  ),
};

export const WithImages: Story = {
  render: () => (
    <BentoGrid className="max-w-4xl">
      <BentoGridItem
        className="md:col-span-2"
        title="Dashboard Overview"
        description="Get a bird's eye view of all your metrics and KPIs in one place."
        header={
          <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center border border-border/30">
            <div className="grid grid-cols-3 gap-2 p-4">
              <div className="h-8 w-full rounded bg-cyan-neon/20" />
              <div className="h-8 w-full rounded bg-magenta-neon/20" />
              <div className="h-8 w-full rounded bg-emerald-neon/20" />
              <div className="h-12 col-span-2 rounded bg-cyan-neon/10" />
              <div className="h-12 rounded bg-magenta-neon/10" />
            </div>
          </div>
        }
        icon={<BarChart3 className="h-4 w-4 text-cyan-neon" />}
      />
      <BentoGridItem
        title="Quick Actions"
        description="Access frequently used features with one click."
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center gap-2 border border-border/30">
            <div className="h-8 w-8 rounded-full bg-cyan-neon/30" />
            <div className="h-8 w-8 rounded-full bg-magenta-neon/30" />
            <div className="h-8 w-8 rounded-full bg-emerald-neon/30" />
          </div>
        }
        icon={<Zap className="h-4 w-4 text-magenta-neon" />}
      />
    </BentoGrid>
  ),
};
