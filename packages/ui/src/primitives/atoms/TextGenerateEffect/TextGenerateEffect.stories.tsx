import type { Meta, StoryObj } from "@storybook/react";
import { TextGenerateEffect } from "./TextGenerateEffect";

const meta: Meta<typeof TextGenerateEffect> = {
  title: "Primitives/Atoms/TextGenerateEffect",
  component: TextGenerateEffect,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    filter: {
      control: "boolean",
    },
    duration: {
      control: { type: "range", min: 0.1, max: 2, step: 0.1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextGenerateEffect>;

export const Default: Story = {
  args: {
    words: "Welcome to the future of user interfaces",
    duration: 0.5,
  },
};

export const SlowReveal: Story = {
  args: {
    words: "Each word appears slowly with a dramatic effect",
    duration: 1.0,
  },
};

export const FastReveal: Story = {
  args: {
    words: "Quick text reveal for dynamic content",
    duration: 0.2,
  },
};

export const NoBlur: Story = {
  args: {
    words: "Text without blur effect just fades in",
    filter: false,
    duration: 0.5,
  },
};

export const LongText: Story = {
  args: {
    words: "This is a longer piece of text that demonstrates how the effect works with multiple words appearing one by one creating a dynamic reading experience",
    duration: 0.3,
  },
};

export const HeroIntro: Story = {
  render: () => (
    <div className="max-w-2xl text-center">
      <TextGenerateEffect
        words="Build agent-native experiences with bb-ui"
        className="text-4xl"
        duration={0.6}
      />
    </div>
  ),
};

export const ProductDescription: Story = {
  render: () => (
    <div className="max-w-lg p-6 bg-card/50 rounded-xl border border-border/50">
      <TextGenerateEffect
        words="A comprehensive component library designed for building immersive AI-powered interfaces"
        className="text-lg"
        duration={0.4}
      />
    </div>
  ),
};

export const QuoteReveal: Story = {
  render: () => (
    <div className="max-w-xl text-center italic">
      <TextGenerateEffect
        words="The best interface is the one that disappears into the experience"
        className="text-2xl text-muted-foreground"
        duration={0.7}
      />
    </div>
  ),
};

export const WithCustomStyling: Story = {
  render: () => (
    <div className="space-y-8">
      <TextGenerateEffect
        words="Cyan themed text"
        className="text-3xl text-cyan-neon"
        duration={0.5}
      />
      <TextGenerateEffect
        words="Magenta themed text"
        className="text-3xl text-magenta-neon"
        duration={0.5}
      />
      <TextGenerateEffect
        words="Emerald themed text"
        className="text-3xl text-emerald-neon"
        duration={0.5}
      />
    </div>
  ),
};

export const FeatureList: Story = {
  render: () => (
    <div className="space-y-4">
      <TextGenerateEffect
        words="Modern React Components"
        className="text-xl"
        duration={0.4}
      />
      <TextGenerateEffect
        words="TypeScript First Design"
        className="text-xl"
        duration={0.4}
      />
      <TextGenerateEffect
        words="Accessible by Default"
        className="text-xl"
        duration={0.4}
      />
    </div>
  ),
};
