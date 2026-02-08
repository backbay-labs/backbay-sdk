import type { Meta, StoryObj } from "@storybook/react";
import { GlassFileUpload } from "./GlassFileUpload";

const meta: Meta<typeof GlassFileUpload> = {
  title: "Primitives/Molecules/GlassFileUpload",
  component: GlassFileUpload,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassFileUpload>;

// ---- Mock files ----

function createMockFile(name: string, sizeBytes: number, type: string): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

const mockFiles = [
  createMockFile("cluster-manifest.json", 4_250, "application/json"),
  createMockFile("deployment-log.txt", 128_900, "text/plain"),
  createMockFile("node-screenshot.png", 2_450_000, "image/png"),
];

// ---- Stories ----

export const Default: Story = {
  args: {
    label: "Attachments",
    description: "Drag and drop files or click to browse.",
    multiple: true,
  },
};

export const WithFiles: Story = {
  args: {
    label: "Uploaded files",
    multiple: true,
    files: mockFiles,
    description: "3 files selected.",
  },
};

export const DragActive: Story = {
  args: {
    label: "Drop zone (active state)",
    multiple: true,
    variant: "active",
    description: "This story simulates the drag-over visual state.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Attachments",
    description: "Upload is currently disabled.",
    disabled: true,
    multiple: true,
  },
};
