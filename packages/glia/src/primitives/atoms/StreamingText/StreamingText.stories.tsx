import type { Meta, StoryObj } from "@storybook/react";
import { StreamingText } from "./StreamingText";
import { useState, useEffect, useCallback } from "react";
import { UiThemeProvider } from "../../../theme/UiThemeProvider";

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <UiThemeProvider>
    <div
      style={{
        background: "#02040a",
        color: "#E5E7EB",
        padding: 40,
        fontFamily: "monospace",
        minHeight: 120,
      }}
    >
      {children}
    </div>
  </UiThemeProvider>
);

const meta: Meta<typeof StreamingText> = {
  title: "Primitives/Atoms/StreamingText",
  component: StreamingText,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    mode: {
      control: "select",
      options: ["character", "word", "instant"],
    },
    speed: {
      control: { type: "range", min: 5, max: 200, step: 5 },
    },
    showCursor: {
      control: "boolean",
    },
    isComplete: {
      control: "boolean",
    },
    disableAnimations: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StreamingText>;

const SAMPLE_TEXT =
  "Hello! I can help you with that. Let me analyze the data and provide a comprehensive response.";

export const Default: Story = {
  args: {
    text: SAMPLE_TEXT,
    speed: 30,
  },
};

export const WordMode: Story = {
  args: {
    text: SAMPLE_TEXT,
    mode: "word",
    speed: 60,
  },
};

export const FastSpeed: Story = {
  args: {
    text: SAMPLE_TEXT,
    speed: 10,
  },
};

export const SlowSpeed: Story = {
  args: {
    text: "Each character appears with a dramatic pause...",
    speed: 80,
  },
};

export const WithCustomCursor: Story = {
  args: {
    text: SAMPLE_TEXT,
    speed: 30,
    cursorChar: "|",
  },
};

export const Completed: Story = {
  args: {
    text: SAMPLE_TEXT,
    isComplete: true,
  },
};

export const RealTimeStreaming: Story = {
  render: function RealTimeStreamingStory() {
    const words = SAMPLE_TEXT.split(" ");
    const [wordCount, setWordCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
      if (!isRunning || wordCount >= words.length) return;

      const timer = setTimeout(() => {
        setWordCount((prev) => prev + 1);
      }, 150 + Math.random() * 200);

      return () => clearTimeout(timer);
    }, [isRunning, wordCount, words.length]);

    const partialText = words.slice(0, wordCount).join(" ");
    const isDone = wordCount >= words.length;

    const handleStart = useCallback(() => {
      setWordCount(0);
      setIsRunning(true);
    }, []);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={handleStart}
          style={{
            padding: "6px 16px",
            background: "#1a1a2e",
            border: "1px solid #374151",
            borderRadius: 6,
            color: "#60A5FA",
            cursor: "pointer",
            fontSize: 13,
            width: "fit-content",
          }}
        >
          {isDone ? "Restart" : isRunning ? "Streaming..." : "Start"}
        </button>
        <StreamingText
          text={partialText}
          mode="instant"
          showCursor={isRunning && !isDone}
          isComplete={isDone}
        />
      </div>
    );
  },
};

export const CustomRenderer: Story = {
  render: function CustomRendererStory() {
    const markdownText =
      "Here is some **bold text** and some `inline code` in the streaming output.";

    const simpleMarkdown = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <span>
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} style={{ color: "#60A5FA" }}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontSize: "0.9em",
                  }}
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </span>
      );
    };

    return <StreamingText text={markdownText} speed={25} renderText={simpleMarkdown} />;
  },
};
