import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CommandPalette, defaultCommands, type CommandPaletteItem } from "./CommandPalette";
import { GlowButton } from "../../atoms/GlowButton/GlowButton";
import {
  Home,
  Settings,
  User,
  Search,
  FileText,
  Folder,
  Mail,
  Bell,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
} from "lucide-react";

const meta: Meta<typeof CommandPalette> = {
  title: "Primitives/Organisms/CommandPalette",
  component: CommandPalette,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "dark", "light"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

const CommandPaletteDemo = ({
  items = defaultCommands,
  ...props
}: Partial<React.ComponentProps<typeof CommandPalette>> & { items?: CommandPaletteItem[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground text-sm">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> +{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">K</kbd> or click the button
      </p>
      <GlowButton onClick={() => setOpen(true)}>Open Command Palette</GlowButton>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={items}
        {...props}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <CommandPaletteDemo />,
};

export const DarkVariant: Story = {
  render: () => <CommandPaletteDemo variant="dark" />,
};

export const LightVariant: Story = {
  render: () => <CommandPaletteDemo variant="light" />,
};

export const WithRecentCommands: Story = {
  render: () => (
    <CommandPaletteDemo
      recentCommands={["dashboard", "practice", "settings"]}
    />
  ),
};

export const Loading: Story = {
  render: () => <CommandPaletteDemo loading />,
};

export const CustomPlaceholder: Story = {
  render: () => (
    <CommandPaletteDemo
      placeholder="What would you like to do?"
      emptyText="No matching commands found. Try a different search."
    />
  ),
};

const fileCommands: CommandPaletteItem[] = [
  {
    id: "new-file",
    title: "New File",
    description: "Create a new document",
    icon: <Plus className="h-4 w-4" />,
    shortcut: ["⌘", "N"],
    group: "File",
    action: () => console.log("New file"),
  },
  {
    id: "open-file",
    title: "Open File",
    description: "Open an existing document",
    icon: <Folder className="h-4 w-4" />,
    shortcut: ["⌘", "O"],
    group: "File",
    action: () => console.log("Open file"),
  },
  {
    id: "save-file",
    title: "Save",
    description: "Save current document",
    icon: <Download className="h-4 w-4" />,
    shortcut: ["⌘", "S"],
    group: "File",
    action: () => console.log("Save file"),
  },
  {
    id: "edit-undo",
    title: "Undo",
    description: "Undo last action",
    icon: <Edit className="h-4 w-4" />,
    shortcut: ["⌘", "Z"],
    group: "Edit",
    action: () => console.log("Undo"),
  },
  {
    id: "edit-copy",
    title: "Copy",
    description: "Copy selection to clipboard",
    icon: <Copy className="h-4 w-4" />,
    shortcut: ["⌘", "C"],
    group: "Edit",
    action: () => console.log("Copy"),
  },
  {
    id: "edit-delete",
    title: "Delete",
    description: "Delete selected items",
    icon: <Trash2 className="h-4 w-4" />,
    shortcut: ["⌫"],
    group: "Edit",
    action: () => console.log("Delete"),
  },
];

export const FileEditor: Story = {
  render: () => (
    <CommandPaletteDemo
      items={fileCommands}
      placeholder="Search file commands..."
    />
  ),
};

const appCommands: CommandPaletteItem[] = [
  {
    id: "home",
    title: "Home",
    description: "Go to home page",
    icon: <Home className="h-4 w-4" />,
    shortcut: ["⌘", "H"],
    group: "Navigation",
    action: () => console.log("Home"),
  },
  {
    id: "search",
    title: "Search",
    description: "Search everything",
    icon: <Search className="h-4 w-4" />,
    shortcut: ["⌘", "F"],
    group: "Navigation",
    action: () => console.log("Search"),
  },
  {
    id: "profile",
    title: "Profile",
    description: "View your profile",
    icon: <User className="h-4 w-4" />,
    group: "Account",
    action: () => console.log("Profile"),
  },
  {
    id: "settings",
    title: "Settings",
    description: "Manage preferences",
    icon: <Settings className="h-4 w-4" />,
    shortcut: ["⌘", ","],
    group: "Account",
    action: () => console.log("Settings"),
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "View notifications",
    icon: <Bell className="h-4 w-4" />,
    group: "Account",
    action: () => console.log("Notifications"),
  },
  {
    id: "messages",
    title: "Messages",
    description: "View your inbox",
    icon: <Mail className="h-4 w-4" />,
    group: "Communication",
    action: () => console.log("Messages"),
  },
  {
    id: "docs",
    title: "Documentation",
    description: "Read the docs",
    icon: <FileText className="h-4 w-4" />,
    group: "Help",
    action: () => console.log("Docs"),
  },
  {
    id: "logout",
    title: "Log Out",
    description: "Sign out of your account",
    icon: <LogOut className="h-4 w-4" />,
    group: "Account",
    action: () => console.log("Logout"),
  },
];

export const ApplicationMenu: Story = {
  render: () => (
    <CommandPaletteDemo
      items={appCommands}
      placeholder="Jump to..."
    />
  ),
};

export const WithFooter: Story = {
  render: () => (
    <CommandPaletteDemo
      footer={
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded">↵</kbd> Select
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close
            </span>
          </div>
          <span>12 commands available</span>
        </div>
      }
    />
  ),
};

export const Open: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 p-8">
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          items={defaultCommands}
          placeholder="Search commands..."
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-muted rounded">↵</kbd> Select
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close
                </span>
              </div>
              <span>{defaultCommands.length} commands</span>
            </div>
          }
        />
        {!open && (
          <GlowButton onClick={() => setOpen(true)}>Reopen Command Palette</GlowButton>
        )}
      </div>
    );
  },
};

export const NoAnimations: Story = {
  render: () => <CommandPaletteDemo disableAnimations />,
};

const minimalCommands: CommandPaletteItem[] = [
  {
    id: "action-1",
    title: "Do Something",
    action: () => console.log("Action 1"),
  },
  {
    id: "action-2",
    title: "Do Something Else",
    action: () => console.log("Action 2"),
  },
  {
    id: "action-3",
    title: "Third Option",
    action: () => console.log("Action 3"),
  },
];

export const MinimalCommands: Story = {
  render: () => (
    <CommandPaletteDemo
      items={minimalCommands}
      placeholder="Quick actions..."
    />
  ),
};

export const StudyApp: Story = {
  render: () => (
    <CommandPaletteDemo
      items={defaultCommands}
      placeholder="Search commands..."
      recentCommands={["practice", "tutor", "analytics"]}
      footer={
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tip: Use keyboard shortcuts for faster navigation</span>
          <span className="text-cyan-neon">Pro Plan</span>
        </div>
      }
    />
  ),
};
