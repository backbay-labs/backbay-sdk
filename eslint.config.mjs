// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

const r3fIgnoredProps = [
  "args",
  "attach",
  "geometry",
  "material",
  "object",
  "position",
  "rotation",
  "scale",
  "intensity",
  "color",
  "groundColor",
  "castShadow",
  "receiveShadow",
  "opacity",
  "transparent",
  "toneMapped",
  "wireframe",
  "side",
  "metalness",
  "roughness",
  "emissive",
  "emissiveIntensity",
  "vertexColors",
  "depthWrite",
  "depthTest",
  "blending",
  "map",
  "normalMap",
  "envMapIntensity",
  "linewidth",
  "lineWidth",
  "dashed",
  "dashScale",
  "dashSize",
  "gapSize",
  "dispose",
  "frustumCulled",
  "renderOrder",
  "visible",
  "userData",
  "layers",
  "fog",
  "near",
  "far",
  "fov",
  "aspect",
  "zoom",
  "count",
  "itemSize",
  "stride",
  "array",
  "size",
  "sizeAttenuation",
  "shadow-mapSize",
  "shadow-camera-far",
  "shadow-camera-left",
  "shadow-camera-right",
  "shadow-camera-top",
  "shadow-camera-bottom",
  "shadow-bias",
  "distance",
  "decay",
  "angle",
  "penumbra",
  "clearcoat",
  "clearcoatRoughness",
  "transmission",
  "thickness",
  "ior",
  "quaternion",
  "uniforms",
  "vertexShader",
  "fragmentShader",
  "material-opacity",
  "material-transparent",
];

export default [js.configs.recommended, {
  files: ["**/*.{js,jsx}"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  plugins: {
    react,
    "react-hooks": reactHooks,
  },
  rules: {
    ...react.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unknown-property": [
      "error",
      {
        ignore: r3fIgnoredProps,
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}, {
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parser: tsparser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      ...globals.node,
      Bun: "readonly",
      React: "readonly",
      NodeJS: "readonly",
      ParentNode: "readonly",
      PermissionName: "readonly",
      PermissionState: "readonly",
      BufferSource: "readonly",
    },
  },
  plugins: {
    "@typescript-eslint": tseslint,
    react,
    "react-hooks": reactHooks,
  },
  rules: {
    ...tseslint.configs.recommended.rules,
    ...react.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-unreachable": "warn",
    "react/no-unescaped-entities": "warn",
    "no-case-declarations": "warn",
    "no-redeclare": "warn",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
    "react/no-children-prop": "warn",
    "react-hooks/rules-of-hooks": "warn",
    "react/no-unknown-property": [
      "error",
      {
        ignore: r3fIgnoredProps,
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}, {
  files: ["**/*.d.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
  },
}, {
  files: ["**/*.test.{ts,tsx}", "**/test/**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
}, {
  files: ["**/*.stories.@(js|jsx|ts|tsx)"],
  rules: {
    "react-hooks/rules-of-hooks": "off",
  },
}, {
  files: ["**/*.stories.@(ts|tsx|js|jsx)"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "storybook/no-renderer-packages": "off",
  },
}, {
  files: ["**/utils/ansi.ts"],
  rules: {
    "no-control-regex": "off",
  },
}, {
  ignores: [
    "dist/",
    "node_modules/",
    "src-tauri/",
    "storybook-static/",
    "fab/assets/viewer/assets/**",
  ],
}, ...storybook.configs["flat/recommended"].map(config => ({
  ...config,
  rules: {
    ...config.rules,
    "storybook/no-renderer-packages": "off",
  },
}))];
