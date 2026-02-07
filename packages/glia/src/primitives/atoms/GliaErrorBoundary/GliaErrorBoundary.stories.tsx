import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { GliaErrorBoundary } from "./GliaErrorBoundary";
import { useErrorBoundary } from "./useErrorBoundary";

const meta: Meta<typeof GliaErrorBoundary> = {
  title: "Primitives/Atoms/GliaErrorBoundary",
  component: GliaErrorBoundary,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["inline", "card", "fullscreen"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof GliaErrorBoundary>;

// Helper that throws on render
function ThrowOnRender({ message }: { message: string }) {
  throw new Error(message);
}

// Helper that throws via the hook
function ThrowViaHook() {
  const { throwError } = useErrorBoundary();
  return (
    <button
      onClick={() => throwError(new Error("Programmatic error via useErrorBoundary()"))}
      style={{
        background: "rgba(255, 60, 60, 0.15)",
        border: "1px solid rgba(255, 60, 60, 0.3)",
        borderRadius: 8,
        padding: "8px 16px",
        color: "rgba(255, 100, 100, 0.9)",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      Trigger error via hook
    </button>
  );
}

export const CardVariant: Story = {
  args: {
    variant: "card",
  },
  render: (args) => (
    <GliaErrorBoundary {...args}>
      <ThrowOnRender message="Something broke in the card component" />
    </GliaErrorBoundary>
  ),
};

export const InlineVariant: Story = {
  args: {
    variant: "inline",
  },
  render: (args) => (
    <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
      Here is some text with an{" "}
      <GliaErrorBoundary {...args}>
        <ThrowOnRender message="inline render failure" />
      </GliaErrorBoundary>{" "}
      error.
    </div>
  ),
};

export const FullscreenVariant: Story = {
  args: {
    variant: "fullscreen",
  },
  render: (args) => (
    <GliaErrorBoundary {...args}>
      <ThrowOnRender message="Critical application error -- fullscreen recovery" />
    </GliaErrorBoundary>
  ),
};

export const HookTriggered: Story = {
  render: () => (
    <GliaErrorBoundary variant="card">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
        <p>This component is healthy until you click the button.</p>
        <ThrowViaHook />
      </div>
    </GliaErrorBoundary>
  ),
};

export const CustomFallback: Story = {
  render: () => (
    <GliaErrorBoundary
      variant="card"
      fallback={({ error, reset }) => (
        <div style={{ padding: 24, color: "rgba(255,255,255,0.9)", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>Custom Fallback</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>
            {error.message}
          </p>
          <button
            onClick={reset}
            style={{
              background: "rgba(100, 200, 255, 0.15)",
              border: "1px solid rgba(100, 200, 255, 0.3)",
              borderRadius: 8,
              padding: "8px 16px",
              color: "rgba(100, 200, 255, 0.9)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Reset
          </button>
        </div>
      )}
    >
      <ThrowOnRender message="Custom fallback error" />
    </GliaErrorBoundary>
  ),
};

export const WithAutoRetry: Story = {
  render: function AutoRetryStory() {
    const [count, setCount] = useState(0);
    return (
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
        <p style={{ marginBottom: 12 }}>
          Render attempts: {count + 1} (auto-retries every 3s)
        </p>
        <GliaErrorBoundary variant="card" autoRetryMs={3000}>
          <FailNTimes
            n={2}
            count={count}
            onRender={() => setCount((c) => c + 1)}
          />
        </GliaErrorBoundary>
      </div>
    );
  },
};

function FailNTimes({
  n,
  count,
  onRender,
}: {
  n: number;
  count: number;
  onRender: () => void;
}) {
  // Trigger count on first render
  useState(() => { onRender(); });

  if (count < n) {
    throw new Error(`Simulated failure (attempt ${count + 1} of ${n})`);
  }

  return (
    <div style={{ padding: 16, color: "rgba(100, 255, 150, 0.9)" }}>
      Recovered after {n} failures
    </div>
  );
}

export const OnErrorCallback: Story = {
  render: function OnErrorStory() {
    const [errors, setErrors] = useState<string[]>([]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <GliaErrorBoundary
          variant="card"
          onError={(error) => {
            setErrors((prev) => [...prev, error.message]);
          }}
        >
          <ThrowOnRender message="Error captured by onError callback" />
        </GliaErrorBoundary>
        {errors.length > 0 && (
          <div style={{ padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            <strong>onError log:</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
              {errors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};
