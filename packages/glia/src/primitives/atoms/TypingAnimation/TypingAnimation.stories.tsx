import type { Meta, StoryObj } from "@storybook/react";
import { TypingAnimation } from "./TypingAnimation";

const meta: Meta<typeof TypingAnimation> = {
  title: "Primitives/Atoms/TypingAnimation",
  component: TypingAnimation,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    typeSpeed: {
      control: { type: "range", min: 10, max: 200, step: 10 },
    },
    deleteSpeed: {
      control: { type: "range", min: 10, max: 100, step: 10 },
    },
    pauseDelay: {
      control: { type: "range", min: 500, max: 5000, step: 100 },
    },
    cursorStyle: {
      control: "select",
      options: ["line", "block", "underscore"],
    },
    loop: {
      control: "boolean",
    },
    showCursor: {
      control: "boolean",
    },
    blinkCursor: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TypingAnimation>;

export const Default: Story = {
  args: {
    words: ["Hello, World!", "Welcome to bb-ui", "Start building"],
    typeSpeed: 50,
    deleteSpeed: 30,
    pauseDelay: 1500,
    className: "text-2xl font-mono",
  },
};

export const CursorStyles: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-sm text-muted-foreground block mb-1">Line cursor</span>
        <TypingAnimation
          words={["Line cursor style"]}
          cursorStyle="line"
          loop={false}
          className="text-xl font-mono"
        />
      </div>
      <div>
        <span className="text-sm text-muted-foreground block mb-1">Block cursor</span>
        <TypingAnimation
          words={["Block cursor style"]}
          cursorStyle="block"
          loop={false}
          className="text-xl font-mono"
        />
      </div>
      <div>
        <span className="text-sm text-muted-foreground block mb-1">Underscore cursor</span>
        <TypingAnimation
          words={["Underscore cursor"]}
          cursorStyle="underscore"
          loop={false}
          className="text-xl font-mono"
        />
      </div>
    </div>
  ),
};

export const SlowTyping: Story = {
  args: {
    words: ["Typing slowly..."],
    typeSpeed: 150,
    loop: false,
    className: "text-2xl font-mono text-cyan-neon",
  },
};

export const FastTyping: Story = {
  args: {
    words: ["Super fast typing!", "Lightning speed!"],
    typeSpeed: 20,
    deleteSpeed: 10,
    pauseDelay: 800,
    className: "text-2xl font-mono text-emerald-neon",
  },
};

export const NoCursor: Story = {
  args: {
    words: ["No cursor visible"],
    showCursor: false,
    loop: false,
    className: "text-xl",
  },
};

export const StaticCursor: Story = {
  args: {
    words: ["Non-blinking cursor"],
    blinkCursor: false,
    loop: false,
    className: "text-xl font-mono",
  },
};

export const SingleWordNoLoop: Story = {
  args: {
    words: ["Task completed successfully!"],
    loop: false,
    typeSpeed: 40,
    className: "text-lg text-emerald-neon",
  },
};

export const DelayedStart: Story = {
  args: {
    words: ["Starting after 2 seconds..."],
    delay: 2000,
    loop: false,
    className: "text-xl font-mono",
  },
};

export const CodeTyping: Story = {
  args: {
    words: [
      "const greeting = 'Hello';",
      "console.log(greeting);",
      "// Output: Hello",
    ],
    typeSpeed: 40,
    deleteSpeed: 20,
    pauseDelay: 2000,
    className: "text-lg font-mono text-emerald-neon",
    cursorStyle: "block",
  },
};

export const TerminalPrompt: Story = {
  render: () => (
    <div className="bg-black/80 p-4 rounded-lg border border-border/50 font-mono">
      <div className="flex items-center gap-2">
        <span className="text-emerald-neon">$</span>
        <TypingAnimation
          words={[
            "npm install @backbay/glia",
            "bun add @backbay/glia",
            "pnpm add @backbay/glia",
          ]}
          typeSpeed={30}
          deleteSpeed={15}
          pauseDelay={2500}
          className="text-white"
          cursorStyle="block"
        />
      </div>
    </div>
  ),
};

export const HeroTagline: Story = {
  render: () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Build</h1>
      <TypingAnimation
        words={[
          "beautiful interfaces",
          "agent-native UIs",
          "immersive experiences",
          "the future",
        ]}
        typeSpeed={60}
        deleteSpeed={40}
        pauseDelay={2000}
        className="text-3xl font-bold text-cyan-neon"
      />
    </div>
  ),
};
