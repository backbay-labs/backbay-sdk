import type { Meta, StoryObj } from "@storybook/react";
import { VoiceCaptions } from "./VoiceCaptions";
import { useState } from "react";

const meta: Meta<typeof VoiceCaptions> = {
  title: "Primitives/Atoms/VoiceCaptions",
  component: VoiceCaptions,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    wordsPerSecond: {
      control: { type: "range", min: 1, max: 5, step: 0.5 },
    },
    maxLines: {
      control: { type: "range", min: 1, max: 5, step: 1 },
    },
    isPlaying: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] p-8 bg-black/90 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof VoiceCaptions>;

export const Default: Story = {
  args: {
    text: "The ancient citadel rises from the mist, its towers reaching toward the heavens. Within its walls, secrets of ages past await discovery.",
    isPlaying: true,
    wordsPerSecond: 2.5,
    maxLines: 3,
  },
};

export const ShortPhrase: Story = {
  args: {
    text: "Welcome, traveler. Your journey begins here.",
    isPlaying: true,
    wordsPerSecond: 2.5,
  },
};

export const LongNarration: Story = {
  args: {
    text: "In the beginning, there was only darkness. Then came the first spark of light, igniting the cosmos into being. From that primordial flame, worlds were born, each a unique tapestry of wonder and mystery. And so begins our tale, woven through the fabric of time itself, where heroes rise and empires fall.",
    isPlaying: true,
    wordsPerSecond: 2.5,
    maxLines: 3,
  },
};

export const SlowPace: Story = {
  args: {
    text: "The words emerge slowly, each one carrying weight and meaning.",
    isPlaying: true,
    wordsPerSecond: 1.5,
  },
};

export const FastPace: Story = {
  args: {
    text: "Racing through the night, faster and faster, the wind carries whispers of what lies ahead.",
    isPlaying: true,
    wordsPerSecond: 4,
  },
};

export const Paused: Story = {
  args: {
    text: "This caption sequence is paused, waiting for playback to resume.",
    isPlaying: false,
    wordsPerSecond: 2.5,
  },
};

export const SingleLine: Story = {
  args: {
    text: "A single line of golden text illuminates the darkness.",
    isPlaying: true,
    wordsPerSecond: 2.5,
    maxLines: 1,
  },
};

export const WithCallback: Story = {
  render: function Render() {
    const [completedCount, setCompletedCount] = useState(0);
    const [key, setKey] = useState(0);

    return (
      <div className="flex flex-col items-center gap-4">
        <VoiceCaptions
          key={key}
          text="Watch this message appear and then dissolve away."
          isPlaying={true}
          onComplete={() => setCompletedCount((c) => c + 1)}
        />
        <div className="text-sm text-zinc-400 mt-4">
          Completed: {completedCount} times
        </div>
        <button
          onClick={() => setKey((k) => k + 1)}
          className="px-4 py-2 bg-amber-900/50 text-amber-200 rounded hover:bg-amber-900/70 transition-colors"
        >
          Replay
        </button>
      </div>
    );
  },
};

export const PlayPauseControl: Story = {
  render: function Render() {
    const [isPlaying, setIsPlaying] = useState(true);
    const [key, setKey] = useState(0);

    return (
      <div className="flex flex-col items-center gap-4">
        <VoiceCaptions
          key={key}
          text="Press the button below to pause and resume the captions. The words will stop revealing when paused."
          isPlaying={isPlaying}
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="px-4 py-2 bg-amber-900/50 text-amber-200 rounded hover:bg-amber-900/70 transition-colors"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setKey((k) => k + 1);
              setIsPlaying(true);
            }}
            className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 transition-colors"
          >
            Restart
          </button>
        </div>
      </div>
    );
  },
};

export const CinematicIntro: Story = {
  render: function Render() {
    const [key, setKey] = useState(0);

    return (
      <div
        className="w-[800px] h-[400px] flex flex-col items-center justify-center relative"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30, 20, 10, 0.9) 0%, rgba(0, 0, 0, 0.98) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        <VoiceCaptions
          key={key}
          text="Long ago, in a realm forgotten by time, there existed a kingdom of unparalleled beauty. Its spires touched the clouds, its gardens bloomed eternal. But all empires must fall, and so too did this paradise of light."
          isPlaying={true}
          wordsPerSecond={2}
          maxLines={2}
          className="px-12"
        />
        <button
          onClick={() => setKey((k) => k + 1)}
          className="absolute bottom-6 px-4 py-2 bg-amber-900/30 text-amber-200/80 rounded border border-amber-700/30 hover:bg-amber-900/50 transition-colors text-sm"
        >
          Replay Intro
        </button>
      </div>
    );
  },
};
