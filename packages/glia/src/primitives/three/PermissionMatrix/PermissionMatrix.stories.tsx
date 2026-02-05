import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PermissionMatrix } from "./PermissionMatrix";
import type { PermissionGroup, Permission, PermissionAction } from "./types";

const meta: Meta<typeof PermissionMatrix> = {
  title: "Primitives/3D/Security/PermissionMatrix",
  component: PermissionMatrix,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    cellSize: {
      control: { type: "range", min: 0.2, max: 1.5, step: 0.1 },
    },
    spacing: {
      control: { type: "range", min: 0.05, max: 0.5, step: 0.05 },
    },
    showLabels: {
      control: "boolean",
    },
    animated: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a0f" }}>
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <OrbitControls />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PermissionMatrix>;

// Helper to create permissions
const createPermission = (
  id: string,
  resource: string,
  action: PermissionAction,
  granted: boolean,
  inherited?: boolean,
  reason?: string
): Permission => ({
  id,
  resource,
  action,
  granted,
  inherited,
  reason,
});

// Sample data - Basic two groups with mix of permissions
const sampleGroups: PermissionGroup[] = [
  {
    id: "users",
    name: "Users",
    permissions: [
      createPermission("u1", "profile", "read", true),
      createPermission("u2", "profile", "write", true),
      createPermission("u3", "settings", "read", true),
      createPermission("u4", "settings", "write", false),
      createPermission("u5", "billing", "read", false),
    ],
  },
  {
    id: "admins",
    name: "Admins",
    permissions: [
      createPermission("a1", "profile", "read", true),
      createPermission("a2", "profile", "write", true),
      createPermission("a3", "profile", "admin", true),
      createPermission("a4", "settings", "read", true),
      createPermission("a5", "settings", "write", true),
      createPermission("a6", "billing", "read", true),
      createPermission("a7", "billing", "admin", true),
    ],
  },
];

// All granted permissions
const allGrantedGroups: PermissionGroup[] = [
  {
    id: "superadmin",
    name: "Super Admin",
    permissions: [
      createPermission("sa1", "users", "read", true),
      createPermission("sa2", "users", "write", true),
      createPermission("sa3", "users", "delete", true),
      createPermission("sa4", "users", "admin", true),
      createPermission("sa5", "content", "read", true),
      createPermission("sa6", "content", "write", true),
      createPermission("sa7", "content", "delete", true),
      createPermission("sa8", "content", "admin", true),
      createPermission("sa9", "system", "read", true),
      createPermission("sa10", "system", "write", true),
      createPermission("sa11", "system", "execute", true),
      createPermission("sa12", "system", "admin", true),
    ],
  },
];

// All denied permissions
const allDeniedGroups: PermissionGroup[] = [
  {
    id: "restricted",
    name: "Restricted",
    permissions: [
      createPermission("r1", "users", "read", false, false, "Requires approval"),
      createPermission("r2", "users", "write", false, false, "Requires approval"),
      createPermission("r3", "users", "delete", false, false, "Admin only"),
      createPermission("r4", "content", "read", false, false, "Not in scope"),
      createPermission("r5", "content", "write", false, false, "Not in scope"),
      createPermission("r6", "system", "read", false, false, "Classified"),
      createPermission("r7", "system", "admin", false, false, "Security policy"),
    ],
  },
];

// Mix of direct and inherited permissions
const inheritedPermissionsGroups: PermissionGroup[] = [
  {
    id: "developers",
    name: "Developers",
    permissions: [
      createPermission("d1", "code", "read", true, true),
      createPermission("d2", "code", "write", true, true),
      createPermission("d3", "code", "execute", true, false),
      createPermission("d4", "database", "read", true, true),
      createPermission("d5", "database", "write", false, false, "Requires DBA approval"),
      createPermission("d6", "logs", "read", true, true),
      createPermission("d7", "logs", "delete", false, true),
      createPermission("d8", "deploy", "execute", true, false),
    ],
  },
  {
    id: "testers",
    name: "QA Testers",
    permissions: [
      createPermission("t1", "code", "read", true, true),
      createPermission("t2", "code", "write", false, true),
      createPermission("t3", "code", "execute", true, true),
      createPermission("t4", "database", "read", true, false),
      createPermission("t5", "database", "write", false, true),
      createPermission("t6", "logs", "read", true, false),
      createPermission("t7", "logs", "delete", false, false),
      createPermission("t8", "deploy", "execute", false, true),
    ],
  },
];

// Single permission group
const singleGroupData: PermissionGroup[] = [
  {
    id: "viewer",
    name: "Viewer",
    permissions: [
      createPermission("v1", "dashboard", "read", true),
      createPermission("v2", "reports", "read", true),
      createPermission("v3", "analytics", "read", true),
      createPermission("v4", "exports", "read", false),
    ],
  },
];

// Many resources to show grid scaling
const manyResourcesGroups: PermissionGroup[] = [
  {
    id: "analyst",
    name: "Data Analyst",
    permissions: [
      createPermission("an1", "customers", "read", true),
      createPermission("an2", "orders", "read", true),
      createPermission("an3", "products", "read", true),
      createPermission("an4", "inventory", "read", true),
      createPermission("an5", "shipments", "read", true),
      createPermission("an6", "payments", "read", false),
      createPermission("an7", "refunds", "read", false),
      createPermission("an8", "analytics", "read", true),
      createPermission("an9", "reports", "read", true),
      createPermission("an10", "dashboards", "read", true),
      createPermission("an11", "exports", "read", true),
      createPermission("an12", "alerts", "read", true),
    ],
  },
  {
    id: "manager",
    name: "Manager",
    permissions: [
      createPermission("m1", "customers", "read", true),
      createPermission("m2", "customers", "write", true),
      createPermission("m3", "orders", "read", true),
      createPermission("m4", "orders", "write", true),
      createPermission("m5", "products", "read", true),
      createPermission("m6", "products", "write", true),
      createPermission("m7", "inventory", "read", true),
      createPermission("m8", "inventory", "write", true),
      createPermission("m9", "shipments", "read", true),
      createPermission("m10", "shipments", "write", true),
      createPermission("m11", "payments", "read", true),
      createPermission("m12", "refunds", "read", true),
      createPermission("m13", "analytics", "read", true),
      createPermission("m14", "analytics", "write", true),
      createPermission("m15", "reports", "read", true),
      createPermission("m16", "reports", "write", true),
      createPermission("m17", "dashboards", "read", true),
      createPermission("m18", "dashboards", "write", true),
      createPermission("m19", "exports", "read", true),
      createPermission("m20", "exports", "execute", true),
      createPermission("m21", "alerts", "read", true),
      createPermission("m22", "alerts", "write", true),
    ],
  },
];

// Complex enterprise-style permissions for AdminView
const enterpriseGroups: PermissionGroup[] = [
  {
    id: "guest",
    name: "Guest",
    permissions: [
      createPermission("g1", "public", "read", true, true),
      createPermission("g2", "docs", "read", true, true),
      createPermission("g3", "support", "read", true),
    ],
  },
  {
    id: "member",
    name: "Member",
    permissions: [
      createPermission("mem1", "public", "read", true, true),
      createPermission("mem2", "public", "write", true),
      createPermission("mem3", "docs", "read", true, true),
      createPermission("mem4", "docs", "write", true),
      createPermission("mem5", "projects", "read", true),
      createPermission("mem6", "projects", "write", true),
      createPermission("mem7", "support", "read", true, true),
      createPermission("mem8", "support", "write", true),
    ],
  },
  {
    id: "lead",
    name: "Team Lead",
    permissions: [
      createPermission("l1", "public", "read", true, true),
      createPermission("l2", "public", "write", true, true),
      createPermission("l3", "docs", "read", true, true),
      createPermission("l4", "docs", "write", true, true),
      createPermission("l5", "docs", "delete", true),
      createPermission("l6", "projects", "read", true, true),
      createPermission("l7", "projects", "write", true, true),
      createPermission("l8", "projects", "delete", true),
      createPermission("l9", "projects", "admin", true),
      createPermission("l10", "support", "read", true, true),
      createPermission("l11", "support", "write", true, true),
      createPermission("l12", "team", "read", true),
      createPermission("l13", "team", "write", true),
      createPermission("l14", "billing", "read", true),
    ],
  },
  {
    id: "admin",
    name: "Administrator",
    permissions: [
      createPermission("ad1", "public", "read", true, true),
      createPermission("ad2", "public", "write", true, true),
      createPermission("ad3", "public", "admin", true),
      createPermission("ad4", "docs", "read", true, true),
      createPermission("ad5", "docs", "write", true, true),
      createPermission("ad6", "docs", "delete", true, true),
      createPermission("ad7", "docs", "admin", true),
      createPermission("ad8", "projects", "read", true, true),
      createPermission("ad9", "projects", "write", true, true),
      createPermission("ad10", "projects", "delete", true, true),
      createPermission("ad11", "projects", "admin", true, true),
      createPermission("ad12", "support", "read", true, true),
      createPermission("ad13", "support", "write", true, true),
      createPermission("ad14", "support", "admin", true),
      createPermission("ad15", "team", "read", true, true),
      createPermission("ad16", "team", "write", true, true),
      createPermission("ad17", "team", "delete", true),
      createPermission("ad18", "team", "admin", true),
      createPermission("ad19", "billing", "read", true, true),
      createPermission("ad20", "billing", "write", true),
      createPermission("ad21", "billing", "admin", true),
      createPermission("ad22", "system", "read", true),
      createPermission("ad23", "system", "write", true),
      createPermission("ad24", "system", "execute", true),
      createPermission("ad25", "system", "admin", true),
    ],
  },
];

// Default story
export const Default: Story = {
  args: {
    groups: sampleGroups,
    position: [0, 0, 0],
  },
};

// All permissions granted (happy path)
export const AllGranted: Story = {
  args: {
    groups: allGrantedGroups,
    position: [0, 0, 0],
  },
};

// All permissions denied (restricted)
export const AllDenied: Story = {
  args: {
    groups: allDeniedGroups,
    position: [0, 0, 0],
  },
};

// Mix of direct and inherited permissions
export const WithInherited: Story = {
  args: {
    groups: inheritedPermissionsGroups,
    position: [0, 0, 0],
  },
};

// Just one permission group
export const SingleGroup: Story = {
  args: {
    groups: singleGroupData,
    position: [0, 0, 0],
  },
};

// Many resources to show grid scaling
export const ManyResources: Story = {
  args: {
    groups: manyResourcesGroups,
    position: [0, 0, 0],
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a0f" }}>
        <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <OrbitControls />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

// Interactive with click handlers
export const Interactive: Story = {
  args: {
    groups: sampleGroups,
    position: [0, 0, 0],
    onPermissionClick: (permission: Permission, group: PermissionGroup) => {
      console.log("Permission clicked:", {
        permissionId: permission.id,
        resource: permission.resource,
        action: permission.action,
        granted: permission.granted,
        inherited: permission.inherited,
        groupId: group.id,
        groupName: group.name,
      });
    },
  },
};

// With labels always shown
export const WithLabels: Story = {
  args: {
    groups: singleGroupData,
    position: [0, 0, 0],
    showLabels: true,
  },
};

// Custom sizing with larger cells and spacing
export const CustomSizing: Story = {
  args: {
    groups: sampleGroups,
    position: [0, 0, 0],
    cellSize: 0.8,
    spacing: 0.25,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a0f" }}>
        <Canvas camera={{ position: [7, 7, 7], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <OrbitControls />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

// Complex multi-group enterprise-style permissions
export const AdminView: Story = {
  args: {
    groups: enterpriseGroups,
    position: [0, 0, 0],
    cellSize: 0.4,
    spacing: 0.08,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a0f" }}>
        <Canvas camera={{ position: [8, 10, 10], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />
          <OrbitControls />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

// With a pre-selected permission
export const WithSelection: Story = {
  args: {
    groups: sampleGroups,
    position: [0, 0, 0],
    selected: "a3",
  },
};

// Static mode (no animations)
export const StaticMode: Story = {
  args: {
    groups: sampleGroups,
    position: [0, 0, 0],
    animated: false,
  },
};

// Compact view with small cells
export const CompactView: Story = {
  args: {
    groups: enterpriseGroups,
    position: [0, 0, 0],
    cellSize: 0.3,
    spacing: 0.05,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a0f" }}>
        <Canvas camera={{ position: [6, 8, 8], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <OrbitControls />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};
