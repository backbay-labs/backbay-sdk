import type { Meta, StoryObj } from "@storybook/react";
import { GlassEmptyState } from "./GlassEmptyState";
import { Database, Search, Rocket, FileText } from "lucide-react";

const meta: Meta<typeof GlassEmptyState> = {
  title: "Primitives/Molecules/GlassEmptyState",
  component: GlassEmptyState,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GlassEmptyState>;

export const Default: Story = {
  args: {
    icon: <Database />,
    title: "No Data",
    description: "There is no data to display right now. Data will appear here once available.",
  },
};

export const NoResults: Story = {
  args: {
    icon: <Search />,
    title: "No Results Found",
    description: "Try adjusting your search query or filters to find what you are looking for.",
  },
};

export const FirstTimeUser: Story = {
  args: {
    icon: <Rocket />,
    title: "Welcome",
    description: "Get started by creating your first project. It only takes a minute.",
    action: () => {},
    actionLabel: "Create Project",
  },
};

export const WithAction: Story = {
  args: {
    icon: <FileText />,
    title: "No Documents",
    description: "Upload your first document to start organizing your workspace.",
    action: () => {},
    actionLabel: "Upload Document",
  },
};
