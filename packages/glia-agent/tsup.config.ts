import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    emotion: "src/emotion/index.ts",
    cognition: "src/cognition/index.ts",
    audio: "src/audio/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  external: ["react"],
});
