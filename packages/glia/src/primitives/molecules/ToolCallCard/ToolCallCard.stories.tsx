import type { Meta, StoryObj } from "@storybook/react";
import { UiThemeProvider } from "../../../theme";
import { ToolCallCard, type ToolCallProps } from "./ToolCallCard";
import { ToolCallList } from "./ToolCallList";

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <UiThemeProvider>
    <div style={{ background: "#02040a", padding: 40, maxWidth: 600 }}>
      {children}
    </div>
  </UiThemeProvider>
);

const meta: Meta<typeof ToolCallCard> = {
  title: "Primitives/Molecules/ToolCallCard",
  component: ToolCallCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["pending", "running", "complete", "error"],
    },
    defaultExpanded: { control: "boolean" },
    disableAnimations: { control: "boolean" },
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
type Story = StoryObj<typeof ToolCallCard>;

export const Pending: Story = {
  args: {
    name: "searchDatabase",
    args: { query: "user preferences", limit: 10 },
    status: "pending",
  },
};

export const Running: Story = {
  args: {
    name: "generateImage",
    args: { prompt: "A sunset over mountains", style: "photorealistic" },
    status: "running",
  },
};

export const Complete: Story = {
  args: {
    name: "searchDatabase",
    args: { query: "user preferences", limit: 10 },
    status: "complete",
    result: {
      results: [
        { id: 1, name: "Dark mode", value: true },
        { id: 2, name: "Language", value: "en-US" },
        { id: 3, name: "Timezone", value: "America/New_York" },
      ],
      total: 3,
    },
    duration: 2340,
    defaultExpanded: true,
  },
};

export const Error: Story = {
  args: {
    name: "fetchUserProfile",
    args: { userId: "abc-123" },
    status: "error",
    error: "ConnectionError: Failed to connect to database after 3 retries",
    duration: 5012,
  },
};

export const WithLongArgs: Story = {
  args: {
    name: "analyzeDataset",
    args: {
      dataset: "user_activity_logs_2024",
      filters: {
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-12-31T23:59:59Z",
        eventTypes: [
          "page_view",
          "click",
          "scroll",
          "form_submit",
          "purchase",
          "signup",
          "logout",
          "session_start",
          "session_end",
        ],
        userSegments: ["premium", "trial", "enterprise"],
        excludeInternal: true,
        minSessionDuration: 30,
        maxSessionDuration: 3600,
        platforms: ["web", "ios", "android"],
        geoFilter: {
          countries: ["US", "CA", "GB", "DE", "FR", "JP", "AU"],
          excludeRegions: ["CN", "RU"],
        },
      },
      aggregations: ["daily", "weekly", "monthly"],
      outputFormat: "parquet",
      compressionLevel: 9,
      includeMetadata: true,
      samplingRate: 0.1,
    },
    status: "running",
    defaultExpanded: true,
  },
};

export const Expanded: Story = {
  args: {
    name: "translateText",
    args: { text: "Hello, world!", targetLang: "es", sourceLang: "en" },
    status: "complete",
    result: { translated: "Hola, mundo!", confidence: 0.98 },
    duration: 450,
    defaultExpanded: true,
  },
};

export const WithId: Story = {
  args: {
    name: "readFile",
    args: { path: "/src/index.ts" },
    status: "complete",
    result: { size: 1024, lines: 42 },
    duration: 12,
    id: "call_abc123def456",
    defaultExpanded: true,
  },
};

const sampleCalls: ToolCallProps[] = [
  {
    name: "searchWeb",
    args: { query: "latest AI research papers 2024" },
    status: "complete",
    result: { count: 15, topResult: "Attention Is Still All You Need" },
    duration: 1230,
  },
  {
    name: "readFile",
    args: { path: "/data/results.json" },
    status: "complete",
    result: { size: 4096, format: "json" },
    duration: 45,
  },
  {
    name: "generateSummary",
    args: { text: "...", maxLength: 200 },
    status: "running",
  },
  {
    name: "sendEmail",
    args: { to: "user@example.com", subject: "Results ready" },
    status: "pending",
  },
  {
    name: "deployService",
    args: { service: "api-gateway", env: "staging" },
    status: "error",
    error: "PermissionDenied: Insufficient IAM role for staging deployment",
    duration: 890,
  },
];

export const ToolCallListStory: Story = {
  render: () => <ToolCallList calls={sampleCalls} />,
};

export const Interactive: Story = {
  args: {
    name: "customTool",
    args: { key: "value", count: 42 },
    status: "pending",
    defaultExpanded: false,
  },
};
