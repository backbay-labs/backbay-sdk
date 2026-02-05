import type { Meta, StoryObj } from "@storybook/react";
import { CardContainer, CardBody, CardItem } from "./ThreeDCard";
import { Sparkles, Zap, Shield } from "lucide-react";

const meta: Meta<typeof CardContainer> = {
  title: "Primitives/Molecules/ThreeDCard",
  component: CardContainer,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CardContainer>;

export const Default: Story = {
  render: () => (
    <CardContainer className="inter-var">
      <CardBody className="bg-card/50 relative group/card border-border/50 w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-foreground"
        >
          Make things float in 3D
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-muted-foreground text-sm max-w-sm mt-2"
        >
          Hover over this card to unleash the power of 3D transforms
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <div className="h-60 w-full rounded-xl bg-gradient-to-br from-cyan-neon/20 to-magenta-neon/20 border border-border/50 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-cyan-neon" />
          </div>
        </CardItem>
        <div className="flex justify-between items-center mt-8">
          <CardItem
            translateZ={20}
            as="button"
            className="px-4 py-2 rounded-xl text-xs font-normal text-foreground"
          >
            Try now →
          </CardItem>
          <CardItem
            translateZ={20}
            as="button"
            className="px-4 py-2 rounded-xl bg-cyan-neon text-black text-xs font-bold"
          >
            Sign up
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  ),
};

export const ProductCard: Story = {
  render: () => (
    <CardContainer>
      <CardBody className="bg-card/80 border-border/50 w-[320px] h-auto rounded-2xl p-6 border backdrop-blur-sm">
        <CardItem translateZ="50" className="w-full">
          <div className="h-48 w-full rounded-xl bg-gradient-to-br from-magenta-neon/30 to-cyan-neon/30 flex items-center justify-center">
            <Shield className="w-20 h-20 text-magenta-neon" />
          </div>
        </CardItem>
        <CardItem
          translateZ="60"
          className="text-2xl font-bold text-foreground mt-4"
        >
          Security Suite
        </CardItem>
        <CardItem
          as="p"
          translateZ="40"
          className="text-muted-foreground text-sm mt-2"
        >
          Enterprise-grade protection for your digital assets
        </CardItem>
        <CardItem translateZ="30" className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyan-neon">$99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardItem>
        <CardItem
          translateZ="50"
          as="button"
          className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-cyan-neon to-magenta-neon text-black font-semibold text-sm"
        >
          Get Started
        </CardItem>
      </CardBody>
    </CardContainer>
  ),
};

export const StatCard: Story = {
  render: () => (
    <CardContainer containerClassName="py-10">
      <CardBody className="bg-card/50 border-border/30 w-64 h-auto rounded-xl p-5 border">
        <div className="flex items-center justify-between">
          <CardItem translateZ="30" className="text-muted-foreground text-sm">
            Total Revenue
          </CardItem>
          <CardItem translateZ="40">
            <Zap className="w-5 h-5 text-emerald-neon" />
          </CardItem>
        </div>
        <CardItem
          translateZ="60"
          className="text-4xl font-bold text-foreground mt-2"
        >
          $45,231.89
        </CardItem>
        <CardItem
          translateZ="30"
          className="text-emerald-neon text-sm mt-1 flex items-center gap-1"
        >
          <span>+20.1%</span>
          <span className="text-muted-foreground">from last month</span>
        </CardItem>
      </CardBody>
    </CardContainer>
  ),
};

export const FeatureCard: Story = {
  render: () => (
    <div className="flex gap-8">
      <CardContainer containerClassName="py-10">
        <CardBody className="bg-gradient-to-br from-cyan-neon/10 to-transparent border-cyan-neon/30 w-72 h-auto rounded-xl p-6 border">
          <CardItem translateZ="50">
            <div className="w-12 h-12 rounded-lg bg-cyan-neon/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-neon" />
            </div>
          </CardItem>
          <CardItem translateZ="40" className="mt-4 text-lg font-semibold">
            Lightning Fast
          </CardItem>
          <CardItem translateZ="30" as="p" className="mt-2 text-sm text-muted-foreground">
            Optimized performance with sub-millisecond response times
          </CardItem>
        </CardBody>
      </CardContainer>

      <CardContainer containerClassName="py-10">
        <CardBody className="bg-gradient-to-br from-magenta-neon/10 to-transparent border-magenta-neon/30 w-72 h-auto rounded-xl p-6 border">
          <CardItem translateZ="50">
            <div className="w-12 h-12 rounded-lg bg-magenta-neon/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-magenta-neon" />
            </div>
          </CardItem>
          <CardItem translateZ="40" className="mt-4 text-lg font-semibold">
            Secure by Default
          </CardItem>
          <CardItem translateZ="30" as="p" className="mt-2 text-sm text-muted-foreground">
            Built-in security features to protect your data
          </CardItem>
        </CardBody>
      </CardContainer>
    </div>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <CardContainer>
      <CardBody className="bg-card/60 border-border/40 w-80 h-auto rounded-2xl p-6 border text-center">
        <CardItem translateZ="100" className="mx-auto">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-neon to-magenta-neon p-1">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-3xl font-bold">
              JD
            </div>
          </div>
        </CardItem>
        <CardItem translateZ="60" className="mt-4 text-xl font-bold">
          Jane Developer
        </CardItem>
        <CardItem translateZ="40" className="text-muted-foreground text-sm">
          Senior Engineer @ TechCorp
        </CardItem>
        <CardItem translateZ="30" className="mt-4 flex justify-center gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-neon">142</div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-magenta-neon">2.4k</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-neon">98%</div>
            <div className="text-xs text-muted-foreground">Success</div>
          </div>
        </CardItem>
      </CardBody>
    </CardContainer>
  ),
};
