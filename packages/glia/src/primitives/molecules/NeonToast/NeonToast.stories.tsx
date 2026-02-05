import type { Meta, StoryObj } from "@storybook/react";
import { NeonToaster, showNeonToast, neonToasts } from "./NeonToast";
import { GlowButton } from "../../atoms/GlowButton/GlowButton";

const meta: Meta<typeof NeonToaster> = {
  title: "Primitives/Molecules/NeonToast",
  component: NeonToaster,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-[400px] w-full flex flex-col items-center justify-center gap-4">
        <NeonToaster position="top-right" />
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NeonToaster>;

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 justify-center">
      <GlowButton
        variant="outline"
        onClick={() => neonToasts.correct("Great job!", "You completed the task successfully")}
      >
        Correct
      </GlowButton>
      <GlowButton
        variant="destructive"
        onClick={() => neonToasts.incorrect("Oops!", "Something went wrong")}
      >
        Incorrect
      </GlowButton>
      <GlowButton
        variant="outline"
        onClick={() => neonToasts.streak(7)}
      >
        Streak
      </GlowButton>
      <GlowButton
        variant="secondary"
        onClick={() => neonToasts.achievement("First Win!", "You earned your first victory")}
      >
        Achievement
      </GlowButton>
      <GlowButton
        variant="outline"
        onClick={() => neonToasts.goalMet("Daily XP", "You reached your daily goal")}
      >
        Goal Met
      </GlowButton>
      <GlowButton
        variant="outline"
        onClick={() => neonToasts.xpGain(250, "Bonus for perfect score!")}
      >
        XP Gain
      </GlowButton>
      <GlowButton
        variant="ghost"
        onClick={() => neonToasts.warning("Heads up!", "Your session will expire soon")}
      >
        Warning
      </GlowButton>
      <GlowButton
        variant="ghost"
        onClick={() => neonToasts.info("Did you know?", "You can customize your dashboard")}
      >
        Info
      </GlowButton>
    </div>
  ),
};

export const CorrectToast: Story = {
  render: () => (
    <GlowButton
      onClick={() => neonToasts.correct("Correct!", "You answered the question right")}
    >
      Show Correct Toast
    </GlowButton>
  ),
};

export const IncorrectToast: Story = {
  render: () => (
    <GlowButton
      variant="destructive"
      onClick={() => neonToasts.incorrect("Incorrect", "Try again")}
    >
      Show Incorrect Toast
    </GlowButton>
  ),
};

export const StreakToast: Story = {
  render: () => (
    <GlowButton
      variant="outline"
      onClick={() => neonToasts.streak(14, "Two weeks strong!")}
    >
      Show Streak Toast
    </GlowButton>
  ),
};

export const AchievementToast: Story = {
  render: () => (
    <GlowButton
      variant="secondary"
      onClick={() => neonToasts.achievement("Master Coder", "Complete 100 coding challenges")}
    >
      Show Achievement Toast
    </GlowButton>
  ),
};

export const XPGainToast: Story = {
  render: () => (
    <GlowButton
      variant="outline"
      onClick={() => neonToasts.xpGain(500, "Level up bonus!")}
    >
      Show XP Toast
    </GlowButton>
  ),
};

export const WithAction: Story = {
  render: () => (
    <GlowButton
      onClick={() =>
        showNeonToast({
          type: "info",
          message: "New update available",
          description: "Version 2.0 is ready to install",
          action: {
            label: "Update Now",
            onClick: () => alert("Updating..."),
          },
        })
      }
    >
      Toast with Action
    </GlowButton>
  ),
};

export const LongDuration: Story = {
  render: () => (
    <GlowButton
      onClick={() =>
        showNeonToast({
          type: "warning",
          message: "Important Notice",
          description: "This toast will stay for 10 seconds",
          duration: 10000,
        })
      }
    >
      Long Duration Toast
    </GlowButton>
  ),
};

export const PermanentToast: Story = {
  render: () => (
    <GlowButton
      variant="destructive"
      onClick={() =>
        showNeonToast({
          type: "warning",
          message: "Action Required",
          description: "Click the X to dismiss this toast",
          duration: 0,
        })
      }
    >
      Permanent Toast
    </GlowButton>
  ),
};

export const MultipleToasts: Story = {
  render: () => (
    <GlowButton
      onClick={() => {
        neonToasts.correct("Step 1 Complete");
        setTimeout(() => neonToasts.xpGain(100), 500);
        setTimeout(() => neonToasts.streak(5), 1000);
        setTimeout(() => neonToasts.achievement("Quick Learner!"), 1500);
      }}
    >
      Show Multiple Toasts
    </GlowButton>
  ),
};

export const GameScenario: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-center">
      <p className="text-muted-foreground text-sm mb-2">Simulate a game session:</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <GlowButton
          size="sm"
          onClick={() => neonToasts.correct("Correct!", "+10 points")}
        >
          Answer Correct
        </GlowButton>
        <GlowButton
          size="sm"
          variant="destructive"
          onClick={() => neonToasts.incorrect("Wrong!", "The answer was B")}
        >
          Answer Wrong
        </GlowButton>
        <GlowButton
          size="sm"
          variant="outline"
          onClick={() => neonToasts.xpGain(50)}
        >
          Earn XP
        </GlowButton>
        <GlowButton
          size="sm"
          variant="secondary"
          onClick={() => neonToasts.achievement("Speed Demon", "Answer in under 5 seconds")}
        >
          Unlock Achievement
        </GlowButton>
        <GlowButton
          size="sm"
          variant="outline"
          onClick={() => neonToasts.goalMet("10 Questions", "Daily challenge complete!")}
        >
          Complete Goal
        </GlowButton>
      </div>
    </div>
  ),
};
