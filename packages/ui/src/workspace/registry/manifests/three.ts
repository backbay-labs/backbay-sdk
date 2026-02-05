/**
 * Three.js/WebGL Component Manifests
 * 3D visualization components
 */

import type { ComponentManifest } from "../types";

export const graph3DManifest: ComponentManifest = {
  id: "graph-3d",
  name: "Graph3D",
  version: "1.0.0",
  category: "three",

  purpose: ["visualization", "data-display"],
  description:
    "3D node-link graph visualization using Three.js. Force-directed layout with interactive navigation.",
  bestFor: [
    "Knowledge graphs",
    "Network visualizations",
    "Relationship mapping",
    "Concept maps",
  ],
  avoid: [
    "Simple hierarchies (use tree instead)",
    "Mobile devices (performance)",
    "Very large graphs (>1000 nodes)",
  ],

  props: {
    nodes: {
      type: "array",
      description: "Graph nodes",
      required: true,
      items: {
        type: "object",
        description: "Node definition",
        properties: {
          id: { type: "string", description: "Unique node ID", required: true },
          label: { type: "string", description: "Display label" },
          color: { type: "string", description: "Node color" },
          size: { type: "number", description: "Node size" },
          group: { type: "string", description: "Grouping category" },
        },
      },
    },
    edges: {
      type: "array",
      description: "Graph edges",
      required: true,
      items: {
        type: "object",
        description: "Edge definition",
        properties: {
          source: { type: "string", description: "Source node ID", required: true },
          target: { type: "string", description: "Target node ID", required: true },
          label: { type: "string", description: "Edge label" },
          weight: { type: "number", description: "Edge weight" },
        },
      },
    },
    width: {
      type: "number",
      description: "Container width",
    },
    height: {
      type: "number",
      description: "Container height",
    },
    onNodeClick: {
      type: "function",
      description: "Node click handler",
    },
    onNodeHover: {
      type: "function",
      description: "Node hover handler",
    },
    cameraPosition: {
      type: "object",
      description: "Initial camera position",
      properties: {
        x: { type: "number", description: "X position" },
        y: { type: "number", description: "Y position" },
        z: { type: "number", description: "Z position" },
      },
    },
    enableZoom: {
      type: "boolean",
      description: "Enable zoom controls",
      default: true,
    },
    enableRotate: {
      type: "boolean",
      description: "Enable rotation controls",
      default: true,
    },
  },

  slots: [],
  validParents: ["glass-panel"],
  validChildren: [],

  styles: ["3d", "animated"],
  supportsTheme: true,
  cssVariables: ["--graph-node-color", "--graph-edge-color"],

  interactions: ["click", "hover", "drag", "scroll"],
  a11y: ["keyboard-nav"],

  examples: [
    {
      name: "Knowledge Graph",
      description: "Concept relationship graph",
      props: {
        nodes: [
          { id: "1", label: "React", group: "frontend" },
          { id: "2", label: "TypeScript", group: "language" },
          { id: "3", label: "Node.js", group: "backend" },
        ],
        edges: [
          { source: "1", target: "2" },
          { source: "2", target: "3" },
        ],
      },
      context: "Knowledge bases, learning paths",
    },
  ],

  source: "components/three/Graph3D/Graph3D.tsx",
  storybook: "three-graph3d",
  tags: ["graph", "3d", "network", "visualization", "nodes", "edges"],
};

export const particleFieldManifest: ComponentManifest = {
  id: "particle-field",
  name: "ParticleField",
  version: "1.0.0",
  category: "three",

  purpose: ["background", "decoration", "visualization"],
  description:
    "Animated particle system background. Creates atmospheric, dynamic visual effects.",
  bestFor: [
    "Hero backgrounds",
    "Loading screens",
    "Ambient effects",
    "Interactive visualizations",
  ],
  avoid: [
    "Content-heavy areas (distracting)",
    "Low-end devices (performance)",
    "Print/static contexts",
  ],

  props: {
    count: {
      type: "number",
      description: "Number of particles",
      default: 1000,
    },
    size: {
      type: "number",
      description: "Particle size",
      default: 0.02,
    },
    color: {
      type: "string",
      description: "Particle color",
      default: "#ffffff",
    },
    speed: {
      type: "number",
      description: "Animation speed",
      default: 1,
    },
    spread: {
      type: "number",
      description: "Particle spread radius",
      default: 10,
    },
    interactive: {
      type: "boolean",
      description: "React to mouse movement",
      default: false,
    },
    opacity: {
      type: "number",
      description: "Particle opacity (0-1)",
      default: 0.8,
    },
    depth: {
      type: "boolean",
      description: "Enable depth variation",
      default: true,
    },
  },

  slots: [],
  validParents: [],
  validChildren: [],

  styles: ["3d", "animated"],
  supportsTheme: true,
  cssVariables: ["--particle-color"],

  interactions: ["hover"],
  a11y: ["reduced-motion"],

  examples: [
    {
      name: "Starfield",
      description: "Star-like particle background",
      props: { count: 2000, size: 0.01, color: "#ffffff", spread: 20 },
      context: "Space themes, hero backgrounds",
    },
    {
      name: "Interactive Dust",
      description: "Mouse-reactive particles",
      props: { count: 500, interactive: true, color: "#00ff88" },
      context: "Landing pages, interactive experiences",
    },
  ],

  source: "components/three/ParticleField/ParticleField.tsx",
  storybook: "three-particlefield",
  tags: ["particles", "3d", "background", "animation", "webgl"],
};

export const threeManifests: ComponentManifest[] = [
  graph3DManifest,
  particleFieldManifest,
];
