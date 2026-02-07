import type { Meta, StoryObj } from "@storybook/react";
import { GlassTable } from "./GlassTable";
import type { ColumnDef, SortState, PaginationState } from "./types";
import { useState } from "react";

// ============================================================================
// SAMPLE DATA
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  progress: number;
}

const sampleUsers: User[] = [
  { id: "1", name: "Alice Chen", email: "alice@example.com", role: "Engineer", status: "active", progress: 87 },
  { id: "2", name: "Bob Martinez", email: "bob@example.com", role: "Designer", status: "active", progress: 64 },
  { id: "3", name: "Carol Kim", email: "carol@example.com", role: "PM", status: "pending", progress: 42 },
  { id: "4", name: "Dave Patel", email: "dave@example.com", role: "Engineer", status: "active", progress: 95 },
  { id: "5", name: "Eve Johnson", email: "eve@example.com", role: "QA", status: "inactive", progress: 31 },
  { id: "6", name: "Frank Liu", email: "frank@example.com", role: "Designer", status: "active", progress: 78 },
  { id: "7", name: "Grace Obi", email: "grace@example.com", role: "Engineer", status: "active", progress: 91 },
  { id: "8", name: "Hank Wilson", email: "hank@example.com", role: "PM", status: "pending", progress: 55 },
  { id: "9", name: "Ivy Brown", email: "ivy@example.com", role: "QA", status: "active", progress: 72 },
  { id: "10", name: "Jack Davis", email: "jack@example.com", role: "Engineer", status: "inactive", progress: 18 },
];

function generateManyUsers(count: number): User[] {
  const roles = ["Engineer", "Designer", "PM", "QA", "DevOps"];
  const statuses: User["status"][] = ["active", "inactive", "pending"];
  const firstNames = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia"];
  const lastNames = ["Chen", "Martinez", "Kim", "Patel", "Johnson", "Liu", "Obi", "Wilson", "Brown", "Davis", "Taylor", "Lee", "Garcia", "Clark", "Hall"];
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    progress: Math.floor(Math.random() * 100),
  }));
}

const manyUsers = generateManyUsers(50);

const defaultColumns: ColumnDef<User>[] = [
  { id: "name", header: "Name", accessorKey: "name", sortable: true },
  { id: "email", header: "Email", accessorKey: "email", sortable: true },
  { id: "role", header: "Role", accessorKey: "role", sortable: true, width: "120px" },
  { id: "status", header: "Status", accessorKey: "status", sortable: true, width: "100px" },
  { id: "progress", header: "Progress", accessorKey: "progress", sortable: true, width: "100px", align: "right" },
];

// ============================================================================
// META
// ============================================================================

const meta: Meta<typeof GlassTable> = {
  title: "Primitives/Organisms/GlassTable",
  component: GlassTable,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 min-h-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassTable<User>>;

// ============================================================================
// STORIES
// ============================================================================

export const Default: Story = {
  render: () => (
    <GlassTable<User>
      columns={defaultColumns}
      data={sampleUsers}
    />
  ),
};

export const Sortable: Story = {
  render: function SortableStory() {
    const [sortState, setSortState] = useState<SortState>({
      columnId: "name",
      direction: "asc",
    });
    return (
      <GlassTable<User>
        columns={defaultColumns}
        data={sampleUsers}
        sortState={sortState}
        onSortChange={setSortState}
      />
    );
  },
};

export const Paginated: Story = {
  render: function PaginatedStory() {
    const [paginationState, setPaginationState] = useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
    return (
      <GlassTable<User>
        columns={defaultColumns}
        data={manyUsers}
        pagination
        paginationState={paginationState}
        onPaginationChange={setPaginationState}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    );
  },
};

export const Filterable: Story = {
  render: function FilterableStory() {
    const [filter, setFilter] = useState("");
    return (
      <GlassTable<User>
        columns={defaultColumns}
        data={sampleUsers}
        globalFilter={filter}
        onGlobalFilterChange={setFilter}
      />
    );
  },
};

export const Selectable: Story = {
  render: function SelectableStory() {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Selected: {selected.size === 0 ? "none" : [...selected].join(", ")}
        </p>
        <GlassTable<User>
          columns={defaultColumns}
          data={sampleUsers}
          selectable
          selectedRowIds={selected}
          onSelectionChange={setSelected}
        />
      </div>
    );
  },
};

export const FullFeature: Story = {
  render: function FullFeatureStory() {
    const [sortState, setSortState] = useState<SortState>({
      columnId: "name",
      direction: "asc",
    });
    const [paginationState, setPaginationState] = useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
    const [filter, setFilter] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    return (
      <GlassTable<User>
        columns={defaultColumns}
        data={manyUsers}
        sortState={sortState}
        onSortChange={setSortState}
        pagination
        paginationState={paginationState}
        onPaginationChange={setPaginationState}
        pageSizeOptions={[5, 10, 20, 50]}
        globalFilter={filter}
        onGlobalFilterChange={setFilter}
        selectable
        selectedRowIds={selected}
        onSelectionChange={setSelected}
        onRowClick={(row) => console.log("Row clicked:", row)}
      />
    );
  },
};

export const Compact: Story = {
  render: () => (
    <GlassTable<User>
      columns={defaultColumns}
      data={sampleUsers}
      variant="compact"
    />
  ),
};

export const Comfortable: Story = {
  render: () => (
    <GlassTable<User>
      columns={defaultColumns}
      data={sampleUsers}
      variant="comfortable"
    />
  ),
};

export const Striped: Story = {
  render: () => (
    <GlassTable<User>
      columns={defaultColumns}
      data={sampleUsers}
      striped
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <GlassTable<User>
      columns={defaultColumns}
      data={[]}
      loading
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <GlassTable<User>
      columns={defaultColumns}
      data={[]}
      emptyState={
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-1">No users found</p>
          <p className="text-xs text-muted-foreground/60">
            Try adjusting your search or filters
          </p>
        </div>
      }
    />
  ),
};

export const CustomCells: Story = {
  render: () => {
    const customColumns: ColumnDef<User>[] = [
      {
        id: "avatar",
        header: "User",
        accessorKey: "name",
        width: "220px",
        cell: (value, row) => (
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(var(--cyan-neon) / 0.3), hsl(var(--magenta-neon) / 0.3))",
                color: "hsl(var(--cyan-neon))",
              }}
            >
              {String(value).split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div className="text-sm font-medium">{String(value)}</div>
              <div className="text-[10px] text-muted-foreground">{row.email}</div>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        accessorKey: "role",
        width: "120px",
        cell: (value) => (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "hsl(var(--cyan-neon) / 0.15)",
              color: "hsl(var(--cyan-neon))",
              border: "1px solid hsl(var(--cyan-neon) / 0.3)",
            }}
          >
            {String(value)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        width: "110px",
        cell: (value) => {
          const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
            active: { bg: "hsl(var(--emerald-neon) / 0.15)", text: "hsl(var(--emerald-neon))", dot: "hsl(var(--emerald-neon))" },
            inactive: { bg: "hsl(0 0% 50% / 0.15)", text: "hsl(0 0% 60%)", dot: "hsl(0 0% 50%)" },
            pending: { bg: "hsl(var(--gold-neon, 45 100% 60%) / 0.15)", text: "hsl(var(--gold-neon, 45 100% 60%))", dot: "hsl(var(--gold-neon, 45 100% 60%))" },
          };
          const colors = statusColors[String(value)] ?? statusColors.inactive;
          return (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: colors.bg, color: colors.text }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: colors.dot }}
              />
              {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
            </span>
          );
        },
      },
      {
        id: "progress",
        header: "Progress",
        accessorKey: "progress",
        width: "160px",
        cell: (value) => {
          const num = Number(value);
          return (
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 flex-1 rounded-full overflow-hidden"
                style={{ background: "hsl(0 0% 100% / 0.08)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${num}%`,
                    background:
                      num > 75
                        ? "hsl(var(--emerald-neon))"
                        : num > 40
                          ? "hsl(var(--cyan-neon))"
                          : "hsl(var(--magenta-neon))",
                  }}
                />
              </div>
              <span className="text-[10px] tabular-nums w-8 text-right text-muted-foreground">
                {num}%
              </span>
            </div>
          );
        },
      },
    ];

    return (
      <GlassTable<User>
        columns={customColumns}
        data={sampleUsers}
        hoverable
      />
    );
  },
};
